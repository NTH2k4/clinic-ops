import { createApiHttpClient } from "../../lib/api/http";
import { mapPatient } from "../../lib/api/mappers";
import { createPatientsApi } from "../../lib/api/patients";
import type { PatientCreateInput, PatientListFilters, PatientsApi, PatientUpdateInput } from "../../lib/api/patients";
import { getApiSessionToken } from "../../lib/api/session";
import type { ApiListMeta, ApiListResponse } from "../../lib/api/types";
import { apiBaseUrl, dataSource } from "../../lib/dataSource";
import { createId } from "../../lib/ids";
import { mockStore } from "../../mocks/mockStore";
import type { Patient } from "../../types/models";

export interface PatientService {
  listPatients(filters?: PatientListFilters): Promise<ApiListResponse<Patient>>;
  getPatient(id: string): Promise<Patient>;
  getPatientForUser(userId: string, linkedPatientId?: string): Promise<Patient | undefined>;
  createPatient(input: PatientCreateInput): Promise<Patient>;
  updatePatient(id: string, input: PatientUpdateInput): Promise<Patient>;
}

export interface PatientServiceOptions {
  source: "mock" | "api";
  api?: PatientsApi;
  fetcher?: typeof fetch;
}

function defaultApi(fetcher?: typeof fetch): PatientsApi {
  const client = createApiHttpClient({ baseUrl: apiBaseUrl, getToken: getApiSessionToken, fetcher });
  return createPatientsApi(client.request, client.requestEnvelope);
}

function snapshot(patient: Patient): Patient {
  return structuredClone(patient);
}

function normalized(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").toLocaleLowerCase();
}

function mockPatients(filters: PatientListFilters = {}): ApiListResponse<Patient> {
  const q = filters.q ? normalized(filters.q) : undefined;
  const items = mockStore.patients.filter((patient) =>
    (!filters.status || patient.status === filters.status)
    && (!q || normalized(`${patient.fullName} ${patient.phone}`).includes(q)));
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const start = (page - 1) * pageSize;
  const meta: ApiListMeta = { requestId: "mock", page, pageSize, total: items.length };
  return { data: items.slice(start, start + pageSize).map(snapshot), meta };
}

function requireMockPatient(id: string): Patient {
  const patient = mockStore.patients.find((candidate) => candidate.id === id);
  if (!patient) throw new Error("Không tìm thấy bệnh nhân.");
  return patient;
}

export function createPatientService(options: PatientServiceOptions): PatientService {
  const api = options.source === "api" ? (options.api ?? defaultApi(options.fetcher)) : undefined;

  return {
    async listPatients(filters = {}) {
      if (!api) return mockPatients(filters);
      const response = await api.listPatients(filters);
      return { data: response.data.map(mapPatient), meta: response.meta };
    },
    async getPatient(id) {
      if (!api) return snapshot(requireMockPatient(id));
      return mapPatient(await api.getPatient(id));
    },
    async getPatientForUser(userId, linkedPatientId) {
      if (!api) {
        const patient = mockStore.patients.find((candidate) => candidate.userId === userId);
        return patient ? snapshot(patient) : undefined;
      }
      if (!linkedPatientId) return undefined;
      return mapPatient(await api.getPatient(linkedPatientId));
    },
    async createPatient(input) {
      if (api) return mapPatient(await api.createPatient(input));
      const timestamp = new Date().toISOString();
      const patient: Patient = {
        id: createId("patient"),
        fullName: input.fullName,
        phone: input.phone,
        ...(input.email ? { email: input.email } : {}),
        dateOfBirth: input.dateOfBirth ?? "",
        gender: input.gender ?? "prefer_not_to_say",
        ...(input.address ? { address: input.address } : {}),
        ...(input.notes ? { notes: input.notes } : {}),
        status: "active",
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      mockStore.patients.push(patient);
      return snapshot(patient);
    },
    async updatePatient(id, input) {
      if (api) return mapPatient(await api.updatePatient(id, input));
      const patient = requireMockPatient(id);
      Object.assign(patient, input, { updatedAt: new Date().toISOString() });
      return snapshot(patient);
    },
  };
}

export const patientService = createPatientService({ source: dataSource });

export const patientQueryOptions = {
  list: (filters: PatientListFilters = {}) => ({
    queryKey: ["patients", "list", filters] as const,
    queryFn: () => patientService.listPatients(filters),
    initialData: dataSource === "mock" ? mockPatients(filters) : undefined,
  }),
  detail: (id: string) => ({
    queryKey: ["patients", "detail", id] as const,
    queryFn: () => patientService.getPatient(id),
    initialData: dataSource === "mock" && id ? snapshot(requireMockPatient(id)) : undefined,
  }),
  current: (userId: string, linkedPatientId?: string) => ({
    queryKey: ["patients", "current", userId, linkedPatientId] as const,
    queryFn: () => patientService.getPatientForUser(userId, linkedPatientId),
    initialData: dataSource === "mock"
      ? (() => {
        const patient = mockStore.patients.find((candidate) => candidate.userId === userId);
        return patient ? snapshot(patient) : undefined;
      })()
      : undefined,
  }),
};
