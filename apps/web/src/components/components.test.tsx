import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { cleanup, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { ClinicDateField } from "./ClinicDateField";
import { LoadingState, ShimmerGrid, ShimmerList } from "./LoadingState";
import { MetricCard } from "./MetricCard";
import { SegmentedControl } from "./SegmentedControl";
import { StatusBadge } from "./StatusBadge";
import { renderWithProviders } from "../test/render";
import { mockStore } from "../mocks/mockStore";
import type { Appointment, AppointmentStatus } from "../types/models";

afterEach(() => {
  cleanup();
  mockStore.reset();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

function apiSuccess(data: unknown) {
  return new Response(JSON.stringify({ data, meta: { requestId: "req-api" } }), { status: 200 });
}

function apiListResponse(data: unknown[]) {
  return new Response(JSON.stringify({ data, meta: { requestId: "req-list", page: 1, pageSize: 100, total: data.length } }), { status: 200 });
}

const apiNotification = {
  id: "notification-api-1",
  recipientUserId: "user-admin-1",
  type: "appointment_confirmed",
  title: "API notification",
  message: "Loaded from the notifications API.",
  referenceType: "audit_event",
  referenceId: "audit-api-1",
  readAt: null,
  createdAt: "2026-08-24T02:00:00.000Z",
};

const apiAppointment: Appointment = {
  id: "appointment-api-1",
  patientId: "patient-api-1",
  doctorId: "doctor-api-1",
  serviceId: "service-api-1",
  startAt: "2026-08-25T08:00:00+07:00",
  endAt: "2026-08-25T08:30:00+07:00",
  status: "confirmed" as const,
  reason: "API appointment",
  createdByUserId: "user-admin-1",
  createdAt: "2026-08-24T00:00:00.000Z",
  updatedAt: "2026-08-24T00:00:00.000Z",
  patient: {
    id: "patient-api-1",
    fullName: "API Patient",
    phone: "0900000000",
    dateOfBirth: "1990-01-01",
    gender: "female",
    status: "active",
    createdAt: "2026-08-24T00:00:00.000Z",
    updatedAt: "2026-08-24T00:00:00.000Z",
  },
  statusHistory: [],
};

async function prepareApiMode(fetcher: typeof fetch) {
  vi.resetModules();
  vi.stubEnv("VITE_DATA_SOURCE", "api");
  vi.stubGlobal("fetch", fetcher);
  return Promise.all([import("../test/render"), import("../app/App")]);
}

describe("shared UI components", () => {
  it("loads notifications for the signed-in API user and marks one read", async () => {
    let notificationRead = false;
    const fetcher = vi.fn<typeof fetch>(async (input, init) => {
      const url = String(input);
      if (url.endsWith("/auth/login")) {
        return apiSuccess({
          sessionToken: "api-session-token",
          currentUser: { id: "user-admin-1", displayName: "API Admin", email: "admin@example.test", role: "admin", status: "active" },
        });
      }
      if (url.includes("/notifications/notification-api-1/read")) {
        notificationRead = true;
        expect(init?.method).toBe("POST");
        return apiSuccess({ ...apiNotification, readAt: "2026-08-24T03:00:00.000Z" });
      }
      if (url.includes("/notifications")) return apiListResponse([{ ...apiNotification, readAt: notificationRead ? "2026-08-24T03:00:00.000Z" : null }]);
      if (url.includes("/audit-events")) return apiListResponse([]);
      return apiListResponse([]);
    });
    const [{ renderWithProviders: renderApiWithProviders }, { App: ApiApp }] = await prepareApiMode(fetcher);
    const user = userEvent.setup();

    renderApiWithProviders(<ApiApp />, { initialEntries: ["/login"] });
    await user.type(screen.getByLabelText("Email"), "admin@example.test");
    await user.type(screen.getByLabelText("Mật khẩu"), "secret");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));
    await user.click(await screen.findByRole("button", { name: "Thông báo" }));

    const dialog = await screen.findByRole("dialog", { name: "Thông báo" });
    expect(within(dialog).getByText("API notification")).toBeInTheDocument();
    expect(within(dialog).getByText("1 thông báo, 1 chưa đọc")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Đánh dấu API notification là đã đọc" }));

    expect(await within(dialog).findByText("1 thông báo, 0 chưa đọc")).toBeInTheDocument();
    expect(fetcher.mock.calls.map(([url]) => String(url))).toContain("/api/v1/notifications/notification-api-1/read");
  });

  it("closes the notifications dialog when pressing outside of it", async () => {
    const fetcher = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url.endsWith("/auth/login")) {
        return apiSuccess({
          sessionToken: "api-session-token",
          currentUser: { id: "user-admin-1", displayName: "API Admin", email: "admin@example.test", role: "admin", status: "active" },
        });
      }
      if (url.includes("/notifications")) return apiListResponse([{ ...apiNotification }]);
      if (url.includes("/audit-events")) return apiListResponse([]);
      return apiListResponse([]);
    });
    const [{ renderWithProviders: renderApiWithProviders }, { App: ApiApp }] = await prepareApiMode(fetcher);
    const user = userEvent.setup();

    renderApiWithProviders(<ApiApp />, { initialEntries: ["/login"] });
    await user.type(screen.getByLabelText("Email"), "admin@example.test");
    await user.type(screen.getByLabelText("Mật khẩu"), "secret");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));
    await user.click(await screen.findByRole("button", { name: "Thông báo" }));

    expect(await screen.findByRole("dialog", { name: "Thông báo" })).toBeInTheDocument();

    await user.click(document.body);

    expect(screen.queryByRole("dialog", { name: "Thông báo" })).not.toBeInTheDocument();
  });

  it("loads appointment audit events in the detail drawer in API mode", async () => {
    const fetcher = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url.includes("/audit-events")) {
        return apiListResponse([{
          id: "audit-api-1",
          actorUserId: "user-admin-1",
          entityType: "appointment",
          entityId: "appointment-api-1",
          action: "appointment_updated",
          timestamp: "2026-08-24T02:00:00.000Z",
          metadata: null,
        }]);
      }
      if (url.includes("/doctors")) return apiListResponse([]);
      if (url.includes("/services")) return apiListResponse([]);
      return apiListResponse([]);
    });
    const [{ renderWithProviders: renderApiWithProviders }] = await prepareApiMode(fetcher);
    const { DetailDrawer } = await import("./DetailDrawer");

    renderApiWithProviders(
      <DetailDrawer
        actorRole="admin"
        actorUserId="user-admin-1"
        appointment={apiAppointment}
        onClose={() => undefined}
        onUpdated={() => undefined}
      />,
    );

    expect(await screen.findByText("Cập nhật lịch hẹn")).toBeInTheDocument();
    expect(fetcher.mock.calls.map(([url]) => String(url))).toContain(
      "/api/v1/audit-events?entityId=appointment-api-1&page=1&pageSize=100",
    );
  });

  it("lists mock appointment audit events newest first in the detail drawer", async () => {
    const { DetailDrawer } = await import("./DetailDrawer");
    const { mockStore: drawerMockStore } = await import("../mocks/mockStore");
    const appointment = drawerMockStore.appointments[0];
    drawerMockStore.auditEvents = [
      {
        id: "audit-old",
        actorUserId: "user-receptionist-1",
        entityType: "appointment",
        entityId: appointment.id,
        action: "older event",
        timestamp: "2026-08-20T09:00:00+07:00",
      },
      {
        id: "audit-new",
        actorUserId: "user-receptionist-1",
        entityType: "appointment",
        entityId: appointment.id,
        action: "newer event",
        timestamp: "2026-08-21T09:00:00+07:00",
      },
    ];

    renderWithProviders(
      <DetailDrawer
        actorRole="receptionist"
        actorUserId="user-receptionist-1"
        appointment={appointment}
        onClose={() => undefined}
        onUpdated={() => undefined}
      />,
    );

    const auditSection = screen.getByRole("heading", { name: "Nhật ký kiểm toán" }).closest("section");
    expect(within(auditSection!).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      expect.stringContaining("newer event"),
      expect.stringContaining("older event"),
    ]);
  });

  it("renders appointment status with text and accessible label", () => {
    renderWithProviders(<StatusBadge status={"requested" satisfies AppointmentStatus} />);

    expect(screen.getByText("Chờ xác nhận")).toBeInTheDocument();
    expect(screen.getByLabelText("Trạng thái: Chờ xác nhận")).toBeInTheDocument();
  });

  it("renders locked account status with text and an accessible label", () => {
    renderWithProviders(<StatusBadge status={"locked" as never} />);

    expect(screen.getByText("Đã khóa")).toBeInTheDocument();
    expect(screen.getByLabelText("Trạng thái: Đã khóa")).toBeInTheDocument();
  });

  it("renders metric, empty, loading and error states", () => {
    renderWithProviders(
      <>
        <MetricCard label="Lịch hẹn hôm nay" value={12} helper="Tăng 3 lịch so với hôm qua" tone="primary" trend="+3 hôm nay" />
        <EmptyState title="Không có dữ liệu" description="Chưa có lịch hẹn trong bộ lọc này." />
        <LoadingState label="Đang tải lịch hẹn" />
        <ShimmerList label="Đang tải danh sách" rows={2} />
        <ShimmerGrid label="Đang tải lưới dữ liệu" items={2} />
        <ErrorState title="Không tải được dữ liệu" description="Vui lòng thử lại sau." />
      </>,
    );

    expect(screen.getByText("Lịch hẹn hôm nay")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("+3 hôm nay")).toBeInTheDocument();
    expect(screen.getByText("Không có dữ liệu")).toBeInTheDocument();
    expect(screen.getByText("Đang tải lịch hẹn")).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Đang tải danh sách" })).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Đang tải lưới dữ liệu" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Không tải được dữ liệu");
  });

  it("renders segmented control as pressed buttons and handles selection", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(
      <SegmentedControl
        value="day"
        options={[
          { label: "Ngày", value: "day" },
          { label: "Tuần", value: "week" },
        ]}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole("button", { name: "Ngày" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Tuần" }));

    expect(onChange).toHaveBeenCalledWith("week");
  });

  it("renders clinic dates as editable segments without a native browser date input", () => {
    const onChange = vi.fn();
    const { container } = renderWithProviders(<ClinicDateField id="clinic-date" label="Ngày khám" labelClassName="text-sm font-medium text-text" onChange={onChange} value="2026-08-25" />);

    const nativeDateInput = container.querySelector('input[type="date"]');
    expect(nativeDateInput).toHaveAttribute("tabindex", "-1");
    expect(container.firstElementChild).toHaveClass("[&_input[type=date]]:hidden");
    expect(container.firstElementChild?.firstElementChild).toHaveClass("block");
    expect(screen.getByText("Ngày khám")).toHaveClass("block");
    const dateGroup = screen.getAllByRole("group").find((group) => group.getAttribute("aria-label") === "Ngày khám");
    expect(dateGroup).toHaveClass("h-10");
    expect(dateGroup).not.toHaveClass("h-11");
    expect(container.querySelector('[data-type="literal"]')).toHaveClass("px-0");
    expect(container.querySelector('[data-type="literal"]')).not.toHaveClass("px-0.5");
    expect(screen.getAllByRole("spinbutton").length).toBeGreaterThanOrEqual(3);
    expect(screen.getByRole("spinbutton", { name: /^Ngày,/ })).toHaveTextContent("25");
    expect(screen.getByRole("spinbutton", { name: /^Tháng,/ })).toHaveTextContent("08");
    expect(screen.getByRole("spinbutton", { name: /^Năm,/ })).toHaveTextContent("2026");
    expect(screen.getByRole("button", { name: /^Mở lịch Ngày khám/ })).toBeInTheDocument();
  });

  it("lets users edit one date segment without clearing the full date", async () => {
    const user = userEvent.setup();

    function DateHarness() {
      const [value, setValue] = useState("2026-08-25");
      return (
        <>
          <ClinicDateField id="clinic-date" label="Ngày khám" onChange={setValue} value={value} />
          <output aria-label="Ngày đã chọn">{value}</output>
        </>
      );
    }

    renderWithProviders(<DateHarness />);

    const daySegment = screen.getByRole("spinbutton", { name: /^Ngày,/ });
    await user.click(daySegment);
    await user.keyboard("{ArrowUp}");

    expect(screen.getByLabelText("Ngày đã chọn")).toHaveTextContent("2026-08-26");
  });

  it("lets users type over date segments when the field has a minimum date", async () => {
    const user = userEvent.setup();

    function DateHarness() {
      const [value, setValue] = useState("2026-08-26");
      return (
        <>
          <ClinicDateField id="clinic-date" label="Ngày khám" min="2026-08-26" onChange={setValue} value={value} />
          <output aria-label="Ngày đã chọn">{value}</output>
        </>
      );
    }

    renderWithProviders(<DateHarness />);

    const daySegment = screen.getByRole("spinbutton", { name: /^Ngày,/ });
    await user.click(daySegment);
    await user.keyboard("27");

    expect(screen.getByLabelText("Ngày đã chọn")).toHaveTextContent("2026-08-27");

    const monthSegment = screen.getByRole("spinbutton", { name: /^Tháng,/ });
    await user.click(monthSegment);
    await user.keyboard("09");

    expect(screen.getByLabelText("Ngày đã chọn")).toHaveTextContent("2026-09-27");

    const yearSegment = screen.getByRole("spinbutton", { name: /^Năm,/ });
    await user.click(yearSegment);
    await user.keyboard("2027");

    expect(screen.getByLabelText("Ngày đã chọn")).toHaveTextContent("2027-09-27");
  });
});
