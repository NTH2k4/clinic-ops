import type { Gender, PatientStatus } from "../../types/models";
import type { ApiEnvelopeRequest, ApiRequest } from "./http";
import type { ApiListResponse } from "./types";

export interface PatientListFilters {
  q?: string;
  status?: PatientStatus;
  page?: number;
  pageSize?: number;
}

export interface ApiPatientRecord {
  id: string;
  userId: string | null;
  fullName: string;
  phone: string;
  email: string | null;
  citizenIdNumber?: string | null;
  healthInsuranceNumber?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  identityDocumentType?: string | null;
  maskedCitizenIdNumber?: string | null;
  maskedHealthInsuranceNumber?: string | null;
  dateOfBirth: string | null;
  gender: Gender | string | null;
  address: string | null;
  notes: string | null;
  status: PatientStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PatientCreateInput {
  fullName: string;
  phone: string;
  email?: string | null;
  citizenIdNumber?: string | null;
  healthInsuranceNumber?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  identityDocumentType?: string | null;
  dateOfBirth?: string | null;
  gender?: Gender | null;
  address?: string | null;
  notes?: string | null;
}

export type PatientUpdateInput = Partial<PatientCreateInput>;

export interface PatientsApi {
  listPatients(filters?: PatientListFilters): Promise<ApiListResponse<ApiPatientRecord>>;
  getPatient(id: string): Promise<ApiPatientRecord>;
  createPatient(input: PatientCreateInput): Promise<ApiPatientRecord>;
  updatePatient(id: string, input: PatientUpdateInput): Promise<ApiPatientRecord>;
}

function query(filters: PatientListFilters = {}): string {
  const params = new URLSearchParams();
  const keys: Array<keyof PatientListFilters> = ["q", "status", "page", "pageSize"];

  for (const key of keys) {
    const value = filters[key];
    if (value !== undefined && value !== "") params.set(key, String(value));
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export function createPatientsApi(request: ApiRequest, requestEnvelope: ApiEnvelopeRequest): PatientsApi {
  return {
    listPatients(filters) {
      return requestEnvelope<ApiPatientRecord[]>(`/patients${query(filters)}`) as Promise<ApiListResponse<ApiPatientRecord>>;
    },
    getPatient(id) {
      return request<ApiPatientRecord>(`/patients/${id}`);
    },
    createPatient(input) {
      return request<ApiPatientRecord>("/patients", { method: "POST", body: JSON.stringify(input) });
    },
    updatePatient(id, input) {
      return request<ApiPatientRecord>(`/patients/${id}`, { method: "PATCH", body: JSON.stringify(input) });
    },
  };
}
