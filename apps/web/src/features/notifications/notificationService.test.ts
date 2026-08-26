import { afterEach, describe, expect, it } from "vitest";
import { mockStore } from "../../mocks/mockStore";
import { createNotificationService } from "./notificationService";

afterEach(() => {
  mockStore.reset();
});

describe("notification service", () => {
  it("marks only the current user's unread notifications as read in mock mode", async () => {
    const service = createNotificationService({ source: "mock" });
    mockStore.notifications = [
      {
        id: "patient-unread",
        recipientUserId: "user-patient-1",
        type: "appointment_confirmed",
        title: "Patient update",
        message: "Patient notification.",
        createdAt: "2026-08-24T01:00:00.000Z",
      },
      {
        id: "reception-unread",
        recipientUserId: "user-receptionist-1",
        type: "appointment_created",
        title: "Reception update",
        message: "Reception notification.",
        createdAt: "2026-08-24T01:05:00.000Z",
      },
    ];

    await expect(service.markAllRead("user-patient-1")).resolves.toBe(1);

    expect(mockStore.notifications.find((notification) => notification.id === "patient-unread")?.readAt).toBeTruthy();
    expect(mockStore.notifications.find((notification) => notification.id === "reception-unread")?.readAt).toBeUndefined();
  });
});
