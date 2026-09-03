import type { DoctorStatus, ServiceStatus } from "../../types/models";
import type { ApiEnvelopeRequest } from "./http";
import type { ApiListResponse } from "./types";

export interface CatalogListFilters {
  status?: ServiceStatus | DoctorStatus;
  q?: string;
  specialtyId?: string;
  serviceId?: string;
  page?: number;
  pageSize?: number;
}

export interface ApiServiceRecord {
  id: string;
  name: string;
  specialtyId: string;
  durationMinutes: number;
  price: number | string;
  currency: string;
  description: string | null;
  status: ServiceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ApiSpecialtyRecord {
  id: string;
  name: string;
  description: string | null;
  status: ServiceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ApiDoctorRecord {
  id: string;
  userId: string;
  fullName: string;
  specialtyId: string;
  phone: string;
  email: string;
  title: string | null;
  room: string | null;
  status: DoctorStatus;
  services: Array<{ id: string }>;
  specialty?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface ServiceMutationInput {
  name?: string;
  specialtyId?: string;
  durationMinutes?: number;
  price?: number;
  currency?: string;
  description?: string;
}

export interface SpecialtyMutationInput {
  name?: string;
  description?: string;
}

export interface DoctorMutationInput {
  fullName?: string;
  specialtyId?: string;
  phone?: string;
  email?: string;
  title?: string;
  room?: string;
  serviceIds?: string[];
}

export interface CatalogApi {
  listServices(filters?: CatalogListFilters): Promise<ApiListResponse<ApiServiceRecord>>;
  listSpecialties(filters?: CatalogListFilters): Promise<ApiListResponse<ApiSpecialtyRecord>>;
  listDoctors(filters?: CatalogListFilters): Promise<ApiListResponse<ApiDoctorRecord>>;
  createService(input: ServiceMutationInput): Promise<ApiServiceRecord>;
  updateService(id: string, input: ServiceMutationInput): Promise<ApiServiceRecord>;
  deactivateService(id: string): Promise<ApiServiceRecord>;
  createSpecialty(input: SpecialtyMutationInput): Promise<ApiSpecialtyRecord>;
  updateSpecialty(id: string, input: SpecialtyMutationInput): Promise<ApiSpecialtyRecord>;
  deactivateSpecialty(id: string): Promise<ApiSpecialtyRecord>;
  createDoctor(input: DoctorMutationInput): Promise<ApiDoctorRecord>;
  updateDoctor(id: string, input: DoctorMutationInput): Promise<ApiDoctorRecord>;
  deactivateDoctor(id: string): Promise<ApiDoctorRecord>;
}

function query(filters: CatalogListFilters = {}): string {
  const params = new URLSearchParams();
  const keys: Array<keyof CatalogListFilters> = ["status", "q", "specialtyId", "serviceId", "page", "pageSize"];

  for (const key of keys) {
    const value = filters[key];
    if (value !== undefined && value !== "") params.set(key, String(value));
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export function createCatalogApi(request: ApiEnvelopeRequest): CatalogApi {
  return {
    listServices(filters) {
      return request<ApiServiceRecord[]>(`/services${query(filters)}`) as Promise<ApiListResponse<ApiServiceRecord>>;
    },
    listSpecialties(filters) {
      const supportedFilters: CatalogListFilters = {
        status: filters?.status,
        q: filters?.q,
        page: filters?.page,
        pageSize: filters?.pageSize,
      };
      return request<ApiSpecialtyRecord[]>(`/specialties${query(supportedFilters)}`) as Promise<ApiListResponse<ApiSpecialtyRecord>>;
    },
    listDoctors(filters) {
      return request<ApiDoctorRecord[]>(`/doctors${query(filters)}`) as Promise<ApiListResponse<ApiDoctorRecord>>;
    },
    createService(input) {
      return request<ApiServiceRecord>("/services", { method: "POST", body: JSON.stringify(input) }).then((response) => response.data);
    },
    updateService(id, input) {
      return request<ApiServiceRecord>(`/services/${id}`, { method: "PATCH", body: JSON.stringify(input) }).then((response) => response.data);
    },
    deactivateService(id) {
      return request<ApiServiceRecord>(`/services/${id}/deactivate`, { method: "POST" }).then((response) => response.data);
    },
    createSpecialty(input) {
      return request<ApiSpecialtyRecord>("/specialties", { method: "POST", body: JSON.stringify(input) }).then((response) => response.data);
    },
    updateSpecialty(id, input) {
      return request<ApiSpecialtyRecord>(`/specialties/${id}`, { method: "PATCH", body: JSON.stringify(input) }).then((response) => response.data);
    },
    deactivateSpecialty(id) {
      return request<ApiSpecialtyRecord>(`/specialties/${id}/deactivate`, { method: "POST" }).then((response) => response.data);
    },
    createDoctor(input) {
      return request<ApiDoctorRecord>("/doctors", { method: "POST", body: JSON.stringify(input) }).then((response) => response.data);
    },
    updateDoctor(id, input) {
      return request<ApiDoctorRecord>(`/doctors/${id}`, { method: "PATCH", body: JSON.stringify(input) }).then((response) => response.data);
    },
    deactivateDoctor(id) {
      return request<ApiDoctorRecord>(`/doctors/${id}/deactivate`, { method: "POST" }).then((response) => response.data);
    },
  };
}
