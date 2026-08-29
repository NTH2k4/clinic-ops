import type { AuditEntityType } from "../../types/models";
import type { ApiEnvelopeRequest, ApiRequest } from "./http";
import type { ApiListResponse } from "./types";

export interface AuditEventListFilters {
  entityType?: AuditEntityType;
  entityId?: string;
  actorUserId?: string;
  action?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface ApiAuditEventRecord {
  id: string;
  actorUserId: string;
  actorDisplayName?: string;
  entityType: AuditEntityType;
  entityId: string;
  entityDisplayName?: string;
  action: string;
  timestamp: string;
  metadata: Record<string, unknown> | null;
}

export interface AuditEventsApi {
  listAuditEvents(filters?: AuditEventListFilters): Promise<ApiListResponse<ApiAuditEventRecord>>;
  getAuditEvent(id: string): Promise<ApiAuditEventRecord>;
}

function query(filters: AuditEventListFilters = {}): string {
  const params = new URLSearchParams();
  const keys: Array<keyof AuditEventListFilters> = ["entityType", "entityId", "actorUserId", "action", "from", "to", "page", "pageSize"];
  for (const key of keys) {
    const value = filters[key];
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export function createAuditEventsApi(request: ApiRequest, requestEnvelope: ApiEnvelopeRequest): AuditEventsApi {
  return {
    listAuditEvents(filters) {
      return requestEnvelope<ApiAuditEventRecord[]>(`/audit-events${query(filters)}`) as Promise<ApiListResponse<ApiAuditEventRecord>>;
    },
    getAuditEvent(id) {
      return request<ApiAuditEventRecord>(`/audit-events/${id}`);
    },
  };
}
