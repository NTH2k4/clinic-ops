import type { NotificationType, ReferenceType } from "../../types/models";
import type { ApiEnvelopeRequest, ApiRequest } from "./http";
import type { ApiListResponse } from "./types";

export interface NotificationListFilters {
  page?: number;
  pageSize?: number;
}

export interface ApiNotificationRecord {
  id: string;
  recipientUserId: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceType: ReferenceType | null;
  referenceId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsApi {
  listNotifications(filters?: NotificationListFilters): Promise<ApiListResponse<ApiNotificationRecord>>;
  markRead(id: string): Promise<ApiNotificationRecord>;
  markAllRead(): Promise<{ count: number }>;
}

function query(filters: NotificationListFilters = {}): string {
  const params = new URLSearchParams();
  if (filters.page !== undefined) params.set("page", String(filters.page));
  if (filters.pageSize !== undefined) params.set("pageSize", String(filters.pageSize));
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export function createNotificationsApi(request: ApiRequest, requestEnvelope: ApiEnvelopeRequest): NotificationsApi {
  return {
    listNotifications(filters) {
      return requestEnvelope<ApiNotificationRecord[]>(`/notifications${query(filters)}`) as Promise<ApiListResponse<ApiNotificationRecord>>;
    },
    markRead(id) {
      return request<ApiNotificationRecord>(`/notifications/${id}/read`, { method: "POST" });
    },
    markAllRead() {
      return request<{ count: number }>("/notifications/read-all", { method: "POST" });
    },
  };
}
