import type { UserRole } from "../../types/models";
import type { ApiEnvelopeRequest, ApiRequest } from "./http";
import type { ApiListResponse } from "./types";

export type ApiAccountStatus = "active" | "inactive" | "locked";

export interface UserListFilters {
  q?: string;
  role?: UserRole;
  status?: ApiAccountStatus;
  page?: number;
  pageSize?: number;
}

export interface ApiUserRecord {
  id: string;
  displayName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: ApiAccountStatus;
  createdAt: string;
  updatedAt: string;
  linkedProfile: { type: "patient" | "staff" | "doctor"; id: string } | null;
}

export interface UsersApi {
  listUsers(filters?: UserListFilters): Promise<ApiListResponse<ApiUserRecord>>;
  lockUser(id: string): Promise<ApiUserRecord>;
  unlockUser(id: string): Promise<ApiUserRecord>;
  deactivateUser(id: string): Promise<ApiUserRecord>;
  resetPassword(id: string): Promise<{ temporaryPassword: string }>;
}

function query(filters: UserListFilters = {}): string {
  const params = new URLSearchParams();
  const keys: Array<keyof UserListFilters> = ["q", "role", "status", "page", "pageSize"];

  for (const key of keys) {
    const value = filters[key];
    if (value !== undefined && value !== "") params.set(key, String(value));
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export function createUsersApi(request: ApiRequest, requestEnvelope: ApiEnvelopeRequest): UsersApi {
  return {
    listUsers(filters) {
      return requestEnvelope<ApiUserRecord[]>(`/users${query(filters)}`) as Promise<ApiListResponse<ApiUserRecord>>;
    },
    lockUser(id) {
      return request<ApiUserRecord>(`/users/${id}/lock`, { method: "POST" });
    },
    unlockUser(id) {
      return request<ApiUserRecord>(`/users/${id}/unlock`, { method: "POST" });
    },
    deactivateUser(id) {
      return request<ApiUserRecord>(`/users/${id}/deactivate`, { method: "POST" });
    },
    resetPassword(id) {
      return request<{ temporaryPassword: string }>(`/users/${id}/reset-password`, { method: "POST" });
    },
  };
}
