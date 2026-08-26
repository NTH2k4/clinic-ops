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
  userId: string | null;
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

export interface CatalogApi {
  listServices(filters?: CatalogListFilters): Promise<ApiListResponse<ApiServiceRecord>>;
  listSpecialties(filters?: CatalogListFilters): Promise<ApiListResponse<ApiSpecialtyRecord>>;
  listDoctors(filters?: CatalogListFilters): Promise<ApiListResponse<ApiDoctorRecord>>;
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
  };
}
