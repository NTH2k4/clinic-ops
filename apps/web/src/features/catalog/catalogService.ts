import { createCatalogApi } from "../../lib/api/catalog";
import type { CatalogApi, CatalogListFilters, DoctorMutationInput, ServiceMutationInput, SpecialtyMutationInput } from "../../lib/api/catalog";
import { mapDoctor, mapService, mapSpecialty } from "../../lib/api/mappers";
import { createSessionApiHttpClient } from "../../lib/api/session";
import type { ApiListMeta, ApiListResponse } from "../../lib/api/types";
import { dataSource } from "../../lib/dataSource";
import { mockStore } from "../../mocks/mockStore";
import type { Doctor, Service, Specialty } from "../../types/models";

export type CatalogFullListFilters = Omit<CatalogListFilters, "page" | "pageSize">;

export interface CatalogService {
  listServices(filters?: CatalogListFilters): Promise<ApiListResponse<Service>>;
  listSpecialties(filters?: CatalogListFilters): Promise<ApiListResponse<Specialty>>;
  listDoctors(filters?: CatalogListFilters): Promise<ApiListResponse<Doctor>>;
  listAllServices(filters?: CatalogFullListFilters): Promise<ApiListResponse<Service>>;
  listAllSpecialties(filters?: CatalogFullListFilters): Promise<ApiListResponse<Specialty>>;
  listAllDoctors(filters?: CatalogFullListFilters): Promise<ApiListResponse<Doctor>>;
  createService(input: Required<Pick<ServiceMutationInput, "name" | "specialtyId" | "durationMinutes" | "price">> & ServiceMutationInput): Promise<Service>;
  updateService(id: string, input: ServiceMutationInput): Promise<Service>;
  deactivateService(id: string): Promise<Service>;
  createSpecialty(input: Required<Pick<SpecialtyMutationInput, "name">> & SpecialtyMutationInput): Promise<Specialty>;
  updateSpecialty(id: string, input: SpecialtyMutationInput): Promise<Specialty>;
  deactivateSpecialty(id: string): Promise<Specialty>;
  createDoctor(input: Required<Pick<DoctorMutationInput, "fullName" | "specialtyId" | "phone" | "email">> & DoctorMutationInput): Promise<Doctor>;
  updateDoctor(id: string, input: DoctorMutationInput): Promise<Doctor>;
  deactivateDoctor(id: string): Promise<Doctor>;
}

interface CatalogServiceOptions {
  source: "mock" | "api";
  api?: CatalogApi;
  fetcher?: typeof fetch;
}

function paginate<T>(items: T[], filters: CatalogListFilters): ApiListResponse<T> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const start = (page - 1) * pageSize;
  const meta: ApiListMeta = { requestId: "mock", page, pageSize, total: items.length };
  return { data: items.slice(start, start + pageSize), meta };
}

function includesQuery(value: string, q?: string): boolean {
  return !q || value.toLocaleLowerCase().includes(q.toLocaleLowerCase());
}

function defaultApi(fetcher?: typeof fetch): CatalogApi {
  const client = createSessionApiHttpClient(fetcher);
  return createCatalogApi(client.requestEnvelope);
}

function mockServices(filters: CatalogListFilters = {}): ApiListResponse<Service> {
  const items = mockStore.services.filter((service) =>
    (!filters.status || service.status === filters.status)
    && (!filters.specialtyId || service.specialtyId === filters.specialtyId)
    && includesQuery(service.name, filters.q));
  return paginate(items, filters);
}

function mockSpecialties(filters: CatalogListFilters = {}): ApiListResponse<Specialty> {
  const items = mockStore.specialties.filter((specialty) =>
    (!filters.status || specialty.status === filters.status)
    && includesQuery(specialty.name, filters.q));
  return paginate(items, filters);
}

function mockDoctors(filters: CatalogListFilters = {}): ApiListResponse<Doctor> {
  const items = mockStore.doctors.filter((doctor) =>
    (!filters.status || doctor.status === filters.status)
    && (!filters.specialtyId || doctor.specialtyId === filters.specialtyId)
    && (!filters.serviceId || doctor.serviceIds.includes(filters.serviceId))
    && includesQuery(doctor.fullName, filters.q));
  return paginate(items, filters);
}

function isoNow() {
  return new Date().toISOString();
}

function requireMockRecord<T extends { id: string }>(items: T[], id: string, label: string): T {
  const item = items.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`Không tìm thấy ${label}.`);
  return item;
}

async function listAllPages<T>(
  listPage: (filters: CatalogListFilters) => Promise<ApiListResponse<T>>,
  filters: CatalogFullListFilters,
): Promise<ApiListResponse<T>> {
  const data: T[] = [];
  let page = 1;
  let response: ApiListResponse<T>;

  do {
    response = await listPage({ ...filters, page, pageSize: 100 });
    data.push(...response.data);

    if (response.data.length === 0 && data.length < response.meta.total) {
      throw new Error("Catalog pagination ended before the reported total was loaded.");
    }

    page += 1;
  } while (data.length < response.meta.total);

  return {
    data,
    meta: { ...response.meta, page: 1, pageSize: Math.max(data.length, 1) },
  };
}

export function createCatalogService(options: CatalogServiceOptions): CatalogService {
  const service: CatalogService = {
    async listServices(filters = {}) {
      if (options.source === "mock") {
        return mockServices(filters);
      }

      const response = await (options.api ?? defaultApi(options.fetcher)).listServices(filters);
      return { data: response.data.map(mapService), meta: response.meta };
    },
    async listSpecialties(filters = {}) {
      if (options.source === "mock") {
        return mockSpecialties(filters);
      }

      const response = await (options.api ?? defaultApi(options.fetcher)).listSpecialties(filters);
      return { data: response.data.map(mapSpecialty), meta: response.meta };
    },
    async listDoctors(filters = {}) {
      if (options.source === "mock") {
        return mockDoctors(filters);
      }

      const response = await (options.api ?? defaultApi(options.fetcher)).listDoctors(filters);
      return { data: response.data.map(mapDoctor), meta: response.meta };
    },
    listAllServices(filters = {}) {
      return listAllPages((pageFilters) => service.listServices(pageFilters), filters);
    },
    listAllSpecialties(filters = {}) {
      return listAllPages((pageFilters) => service.listSpecialties(pageFilters), filters);
    },
    listAllDoctors(filters = {}) {
      return listAllPages((pageFilters) => service.listDoctors(pageFilters), filters);
    },
    async createService(input) {
      if (options.source === "api") return mapService(await (options.api ?? defaultApi(options.fetcher)).createService(input));
      const now = isoNow();
      const created: Service = {
        id: `service-${crypto.randomUUID()}`,
        name: input.name,
        specialtyId: input.specialtyId,
        durationMinutes: input.durationMinutes,
        price: input.price,
        currency: input.currency ?? "VND",
        description: input.description ?? "",
        status: "active",
        createdAt: now,
        updatedAt: now,
      };
      mockStore.services.push(created);
      return structuredClone(created);
    },
    async updateService(id, input) {
      if (options.source === "api") return mapService(await (options.api ?? defaultApi(options.fetcher)).updateService(id, input));
      const serviceRecord = requireMockRecord(mockStore.services, id, "dịch vụ");
      Object.assign(serviceRecord, input, { updatedAt: isoNow() });
      return structuredClone(serviceRecord);
    },
    async deactivateService(id) {
      if (options.source === "api") return mapService(await (options.api ?? defaultApi(options.fetcher)).deactivateService(id));
      const serviceRecord = requireMockRecord(mockStore.services, id, "dịch vụ");
      serviceRecord.status = "inactive";
      serviceRecord.updatedAt = isoNow();
      return structuredClone(serviceRecord);
    },
    async createSpecialty(input) {
      if (options.source === "api") return mapSpecialty(await (options.api ?? defaultApi(options.fetcher)).createSpecialty(input));
      const now = isoNow();
      const created: Specialty = { id: `specialty-${crypto.randomUUID()}`, name: input.name, description: input.description ?? "", status: "active", createdAt: now, updatedAt: now };
      mockStore.specialties.push(created);
      return structuredClone(created);
    },
    async updateSpecialty(id, input) {
      if (options.source === "api") return mapSpecialty(await (options.api ?? defaultApi(options.fetcher)).updateSpecialty(id, input));
      const specialty = requireMockRecord(mockStore.specialties, id, "chuyên khoa");
      Object.assign(specialty, input, { updatedAt: isoNow() });
      return structuredClone(specialty);
    },
    async deactivateSpecialty(id) {
      if (options.source === "api") return mapSpecialty(await (options.api ?? defaultApi(options.fetcher)).deactivateSpecialty(id));
      const specialty = requireMockRecord(mockStore.specialties, id, "chuyên khoa");
      specialty.status = "inactive";
      specialty.updatedAt = isoNow();
      return structuredClone(specialty);
    },
    async createDoctor(input) {
      if (options.source === "api") return mapDoctor(await (options.api ?? defaultApi(options.fetcher)).createDoctor(input));
      const now = isoNow();
      const created: Doctor = {
        id: `doctor-${crypto.randomUUID()}`,
        fullName: input.fullName,
        specialtyId: input.specialtyId,
        serviceIds: input.serviceIds ?? [],
        phone: input.phone,
        email: input.email,
        title: input.title ?? "",
        room: input.room ?? "",
        status: "active",
        createdAt: now,
        updatedAt: now,
      };
      mockStore.doctors.push(created);
      return structuredClone(created);
    },
    async updateDoctor(id, input) {
      if (options.source === "api") return mapDoctor(await (options.api ?? defaultApi(options.fetcher)).updateDoctor(id, input));
      const doctor = requireMockRecord(mockStore.doctors, id, "bác sĩ");
      Object.assign(doctor, input, { updatedAt: isoNow() });
      return structuredClone(doctor);
    },
    async deactivateDoctor(id) {
      if (options.source === "api") return mapDoctor(await (options.api ?? defaultApi(options.fetcher)).deactivateDoctor(id));
      const doctor = requireMockRecord(mockStore.doctors, id, "bác sĩ");
      doctor.status = "inactive";
      doctor.updatedAt = isoNow();
      return structuredClone(doctor);
    },
  };

  return service;
}

export const catalogService = createCatalogService({ source: dataSource });

export const catalogQueryOptions = {
  services: (filters: CatalogListFilters = {}) => ({
    queryKey: ["catalog", "services", filters] as const,
    queryFn: () => catalogService.listServices(filters),
    initialData: dataSource === "mock" ? mockServices(filters) : undefined,
  }),
  specialties: (filters: CatalogListFilters = {}) => ({
    queryKey: ["catalog", "specialties", filters] as const,
    queryFn: () => catalogService.listSpecialties(filters),
    initialData: dataSource === "mock" ? mockSpecialties(filters) : undefined,
  }),
  doctors: (filters: CatalogListFilters = {}) => ({
    queryKey: ["catalog", "doctors", filters] as const,
    queryFn: () => catalogService.listDoctors(filters),
    initialData: dataSource === "mock" ? mockDoctors(filters) : undefined,
  }),
  allServices: (filters: CatalogFullListFilters = {}) => ({
    queryKey: ["catalog", "services", "all", filters] as const,
    queryFn: () => catalogService.listAllServices(filters),
    initialData: dataSource === "mock"
      ? mockServices({ ...filters, page: 1, pageSize: Math.max(mockStore.services.length, 1) })
      : undefined,
  }),
  allSpecialties: (filters: CatalogFullListFilters = {}) => ({
    queryKey: ["catalog", "specialties", "all", filters] as const,
    queryFn: () => catalogService.listAllSpecialties(filters),
    initialData: dataSource === "mock"
      ? mockSpecialties({ ...filters, page: 1, pageSize: Math.max(mockStore.specialties.length, 1) })
      : undefined,
  }),
  allDoctors: (filters: CatalogFullListFilters = {}) => ({
    queryKey: ["catalog", "doctors", "all", filters] as const,
    queryFn: () => catalogService.listAllDoctors(filters),
    initialData: dataSource === "mock"
      ? mockDoctors({ ...filters, page: 1, pageSize: Math.max(mockStore.doctors.length, 1) })
      : undefined,
  }),
};
