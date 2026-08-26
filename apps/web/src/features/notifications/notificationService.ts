import { createNotificationsApi } from "../../lib/api/notifications";
import type { ApiNotificationRecord, NotificationListFilters, NotificationsApi } from "../../lib/api/notifications";
import { createSessionApiHttpClient } from "../../lib/api/session";
import type { ApiListMeta, ApiListResponse } from "../../lib/api/types";
import { dataSource } from "../../lib/dataSource";
import { mockStore } from "../../mocks/mockStore";
import type { Notification } from "../../types/models";

export interface NotificationService {
  listNotifications(userId: string, filters?: NotificationListFilters): Promise<ApiListResponse<Notification>>;
  markRead(id: string): Promise<Notification>;
  markAllRead(userId: string): Promise<number>;
}

export interface NotificationServiceOptions {
  source: "mock" | "api";
  api?: NotificationsApi;
  fetcher?: typeof fetch;
}

function defaultApi(fetcher?: typeof fetch): NotificationsApi {
  const client = createSessionApiHttpClient(fetcher);
  return createNotificationsApi(client.request, client.requestEnvelope);
}

function mapNotification(record: ApiNotificationRecord): Notification {
  return {
    id: record.id,
    recipientUserId: record.recipientUserId,
    type: record.type,
    title: record.title,
    message: record.message,
    ...(record.referenceType ? { referenceType: record.referenceType } : {}),
    ...(record.referenceId ? { referenceId: record.referenceId } : {}),
    ...(record.readAt ? { readAt: record.readAt } : {}),
    createdAt: record.createdAt,
  };
}

function mockNotifications(userId: string, filters: NotificationListFilters = {}): ApiListResponse<Notification> {
  const items = mockStore.notifications.filter((notification) => notification.recipientUserId === userId);
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 100;
  const start = (page - 1) * pageSize;
  const meta: ApiListMeta = { requestId: "mock", page, pageSize, total: items.length };
  return { data: items.slice(start, start + pageSize).map((notification) => structuredClone(notification)), meta };
}

function requireMockNotification(id: string): Notification {
  const notification = mockStore.notifications.find((candidate) => candidate.id === id);
  if (!notification) throw new Error("Không tìm thấy thông báo.");
  return notification;
}

export function createNotificationService(options: NotificationServiceOptions): NotificationService {
  const api = options.source === "api" ? (options.api ?? defaultApi(options.fetcher)) : undefined;

  return {
    async listNotifications(userId, filters = {}) {
      if (!api) return mockNotifications(userId, filters);
      const response = await api.listNotifications(filters);
      return { data: response.data.map(mapNotification), meta: response.meta };
    },
    async markRead(id) {
      if (api) return mapNotification(await api.markRead(id));
      const notification = requireMockNotification(id);
      if (!notification.readAt) notification.readAt = new Date().toISOString();
      return structuredClone(notification);
    },
    async markAllRead(userId) {
      if (api) return (await api.markAllRead()).count;
      const unread = mockStore.notifications.filter((notification) => notification.recipientUserId === userId && !notification.readAt);
      const readAt = new Date().toISOString();
      unread.forEach((notification) => { notification.readAt = readAt; });
      return unread.length;
    },
  };
}

export const notificationService = createNotificationService({ source: dataSource });

export const notificationQueryOptions = {
  list: (userId: string) => ({
    queryKey: ["notifications", "list", userId] as const,
    queryFn: () => notificationService.listNotifications(userId, { page: 1, pageSize: 100 }),
    initialData: dataSource === "mock" && userId ? mockNotifications(userId, { page: 1, pageSize: 100 }) : undefined,
  }),
};
