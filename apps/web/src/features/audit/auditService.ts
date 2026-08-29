import { createAuditEventsApi } from "../../lib/api/audit-events";
import type { ApiAuditEventRecord, AuditEventListFilters, AuditEventsApi } from "../../lib/api/audit-events";
import { createSessionApiHttpClient } from "../../lib/api/session";
import type { ApiListMeta, ApiListResponse } from "../../lib/api/types";
import { dataSource } from "../../lib/dataSource";
import { mockStore } from "../../mocks/mockStore";
import type { AuditEvent } from "../../types/models";

export interface AuditService {
  listAuditEvents(filters?: AuditEventListFilters): Promise<ApiListResponse<AuditEvent>>;
  getAuditEvent(id: string): Promise<AuditEvent>;
}

export interface AuditServiceOptions {
  source: "mock" | "api";
  api?: AuditEventsApi;
  fetcher?: typeof fetch;
}

function defaultApi(fetcher?: typeof fetch): AuditEventsApi {
  const client = createSessionApiHttpClient(fetcher);
  return createAuditEventsApi(client.request, client.requestEnvelope);
}

function mapAuditEvent(record: ApiAuditEventRecord): AuditEvent {
  return {
    id: record.id,
    actorUserId: record.actorUserId,
    actorDisplayName: record.actorDisplayName,
    entityType: record.entityType,
    entityId: record.entityId,
    entityDisplayName: record.entityDisplayName,
    action: record.action,
    timestamp: record.timestamp,
    ...(record.metadata ? { metadata: record.metadata } : {}),
  };
}

function mockAuditEvents(filters: AuditEventListFilters = {}): ApiListResponse<AuditEvent> {
  const items = mockStore.auditEvents.filter((event) =>
    (!filters.entityType || event.entityType === filters.entityType)
    && (!filters.entityId || event.entityId === filters.entityId)
    && (!filters.actorUserId || event.actorUserId === filters.actorUserId)
    && (!filters.action || event.action === filters.action)
    && (!filters.from || event.timestamp >= filters.from)
    && (!filters.to || event.timestamp <= filters.to))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 100;
  const start = (page - 1) * pageSize;
  const meta: ApiListMeta = { requestId: "mock", page, pageSize, total: items.length };
  return { data: items.slice(start, start + pageSize).map((event) => structuredClone(event)), meta };
}

function requireMockAuditEvent(id: string): AuditEvent {
  const event = mockStore.auditEvents.find((candidate) => candidate.id === id);
  if (!event) throw new Error("Không tìm thấy sự kiện kiểm toán.");
  return event;
}

export function createAuditService(options: AuditServiceOptions): AuditService {
  const api = options.source === "api" ? (options.api ?? defaultApi(options.fetcher)) : undefined;

  return {
    async listAuditEvents(filters = {}) {
      if (!api) return mockAuditEvents(filters);
      const response = await api.listAuditEvents(filters);
      return { data: response.data.map(mapAuditEvent), meta: response.meta };
    },
    async getAuditEvent(id) {
      if (!api) return structuredClone(requireMockAuditEvent(id));
      return mapAuditEvent(await api.getAuditEvent(id));
    },
  };
}

export const auditService = createAuditService({ source: dataSource });

export const auditQueryOptions = {
  list: (filters: AuditEventListFilters = {}) => ({
    queryKey: ["audit-events", "list", filters] as const,
    queryFn: () => auditService.listAuditEvents(filters),
    initialData: dataSource === "mock" ? mockAuditEvents(filters) : undefined,
  }),
  detail: (id: string) => ({
    queryKey: ["audit-events", "detail", id] as const,
    queryFn: () => auditService.getAuditEvent(id),
    initialData: dataSource === "mock" && id ? structuredClone(requireMockAuditEvent(id)) : undefined,
  }),
};
