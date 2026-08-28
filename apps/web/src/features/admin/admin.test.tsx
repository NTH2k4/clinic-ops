import userEvent from "@testing-library/user-event";
import { cleanup, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "../../app/App";
import { navigationForRole } from "../../components/navigation";
import { mockStore } from "../../mocks/mockStore";
import { renderWithProviders } from "../../test/render";
import { AdminDashboard } from "./AdminDashboard";
import { AdminDoctors } from "./AdminDoctors";
import { AuditLog } from "./AuditLog";

afterEach(() => {
  cleanup();
  mockStore.reset();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

function apiListResponse(data: unknown[], requestId: string, total = data.length) {
  return new Response(JSON.stringify({ data, meta: { requestId, page: 1, pageSize: 100, total } }), { status: 200 });
}

const apiAuditEvent = {
  id: "audit-api-1",
  actorUserId: "user-admin-1",
  entityType: "appointment",
  entityId: "appointment-api-1",
  action: "appointment_updated",
  timestamp: "2026-08-24T02:00:00.000Z",
  metadata: { source: "api" },
};

const apiUsers = [
  {
    id: "user-active-1",
    displayName: "Nguyen Minh Anh",
    email: "minh.anh@example.test",
    phone: "0901000001",
    role: "patient",
    status: "active",
    createdAt: "2026-08-01T08:00:00.000Z",
    updatedAt: "2026-08-24T02:00:00.000Z",
    linkedProfile: { type: "patient", id: "patient-1" },
  },
  {
    id: "user-locked-1",
    displayName: "Locked Doctor",
    email: "locked.doctor@example.test",
    phone: "0901000002",
    role: "doctor",
    status: "locked",
    createdAt: "2026-08-01T08:00:00.000Z",
    updatedAt: "2026-08-24T02:00:00.000Z",
    linkedProfile: { type: "doctor", id: "doctor-1" },
  },
];

async function renderApiAuditLog(fetcher: typeof fetch) {
  vi.resetModules();
  vi.stubEnv("VITE_DATA_SOURCE", "api");
  vi.stubGlobal("fetch", fetcher);
  const [{ AuditLog: ApiAuditLog }, { renderWithProviders: renderApiWithProviders }] = await Promise.all([
    import("./AuditLog"),
    import("../../test/render"),
  ]);
  return renderApiWithProviders(<ApiAuditLog />);
}

async function renderApiAdminAccounts(fetcher: typeof fetch) {
  vi.resetModules();
  vi.stubEnv("VITE_DATA_SOURCE", "api");
  vi.stubGlobal("fetch", fetcher);
  const [{ AdminAccounts }, { renderWithProviders: renderApiWithProviders }, { setApiSessionToken }, { queryClient }] = await Promise.all([
    import("./AdminAccounts"),
    import("../../test/render"),
    import("../../lib/api/session"),
    import("../../lib/queryClient"),
  ]);
  setApiSessionToken("admin-session-token");
  return { ...renderApiWithProviders(<AdminAccounts />), queryClient };
}

describe("admin workspace", () => {
  it("includes the Accounts navigation target for administrators", () => {
    expect(navigationForRole("admin")).toContainEqual({
      icon: expect.anything(),
      label: "Accounts",
      to: "/app/admin/accounts",
    });
  });

  it("lets administrators manage doctor schedule blocks from navigation", async () => {
    const user = userEvent.setup();

    expect(navigationForRole("admin")).toContainEqual({
      icon: expect.anything(),
      label: "Schedules",
      to: "/app/admin/schedules",
    });

    renderWithProviders(<App />);

    await user.click(screen.getByRole("button", { name: /Admin Demo/i }));
    await user.click((await screen.findAllByRole("link", { name: "Schedules" }))[0]);

    expect(await screen.findByRole("heading", { name: "Schedules" })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Filter doctor"), "doctor-1");
    await user.click(screen.getByRole("button", { name: "Apply filters" }));

    await user.selectOptions(screen.getByLabelText("Doctor"), "doctor-1");
    await user.selectOptions(screen.getByLabelText("Schedule type"), "blocked");
    await user.selectOptions(screen.getByLabelText("Day of week"), "2");
    await user.clear(screen.getByLabelText("Start time"));
    await user.type(screen.getByLabelText("Start time"), "10:00");
    await user.clear(screen.getByLabelText("End time"));
    await user.type(screen.getByLabelText("End time"), "11:00");
    await user.click(screen.getByRole("button", { name: "Create schedule" }));

    const schedulesTable = await screen.findByRole("table", { name: "Doctor schedules" });
    await waitFor(() => expect(within(schedulesTable).getByText("10:00-11:00")).toBeInTheDocument());
    const createdRow = within(schedulesTable).getByText("10:00-11:00").closest("tr")!;
    expect(within(createdRow).getByText("Blocked")).toBeInTheDocument();
    expect(within(createdRow).getByText("BS. Tran Quang Huy")).toBeInTheDocument();
    expect(within(createdRow).getByText("2026-08-25 to 2026-08-25")).toBeInTheDocument();
  });

  it("renders account email, role, and status from the admin API", async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => apiListResponse(apiUsers, "req-users"));
    await renderApiAdminAccounts(fetcher);

    expect(await screen.findByText("minh.anh@example.test")).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Accounts" })).toHaveTextContent("patient");
    expect(screen.getByRole("table", { name: "Accounts" })).toHaveTextContent("locked");
  });

  it("calls the lock and unlock endpoints for explicit account status actions", async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith("/lock")) return new Response(JSON.stringify({ data: { ...apiUsers[0], status: "locked" }, meta: { requestId: "req-lock" } }), { status: 200 });
      if (url.endsWith("/unlock")) return new Response(JSON.stringify({ data: { ...apiUsers[1], status: "active" }, meta: { requestId: "req-unlock" } }), { status: 200 });
      return apiListResponse(apiUsers, "req-users");
    });
    const user = userEvent.setup();
    await renderApiAdminAccounts(fetcher);

    await user.click(await screen.findByRole("button", { name: "Lock Nguyen Minh Anh" }));
    await user.click(screen.getByRole("button", { name: "Unlock Locked Doctor" }));

    await waitFor(() => expect(fetcher.mock.calls.map(([url]) => String(url))).toEqual(expect.arrayContaining([
      "/api/v1/users/user-active-1/lock",
      "/api/v1/users/user-locked-1/unlock",
    ])));
  });

  it("renders the returned account status before a list refetch completes", async () => {
    let listRequests = 0;
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      if (String(input).endsWith("/lock")) {
        return new Response(JSON.stringify({ data: { ...apiUsers[0], status: "locked" }, meta: { requestId: "req-lock" } }), { status: 200 });
      }
      listRequests += 1;
      if (listRequests === 1) return apiListResponse(apiUsers, "req-users");
      return new Promise<Response>(() => {});
    });
    const user = userEvent.setup();
    await renderApiAdminAccounts(fetcher);

    await user.click(await screen.findByRole("button", { name: "Lock Nguyen Minh Anh" }));

    expect(await screen.findByRole("button", { name: "Unlock Nguyen Minh Anh" })).toBeInTheDocument();
    expect(within(screen.getByText("Nguyen Minh Anh").closest("tr")!).getByText("locked")).toBeInTheDocument();
  });

  it("reports account status action failures to the administrator", async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      if (String(input).endsWith("/lock")) {
        return new Response(JSON.stringify({ error: { code: "VALIDATION_ERROR", message: "Cannot lock this account." }, meta: { requestId: "req-lock-failed" } }), { status: 400 });
      }
      return apiListResponse(apiUsers, "req-users");
    });
    const user = userEvent.setup();
    await renderApiAdminAccounts(fetcher);

    await user.click(await screen.findByRole("button", { name: "Lock Nguyen Minh Anh" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Cannot lock this account.");
  });

  it("shows a reset password only in the controlled result panel without browser or mutation cache persistence", async () => {
    const temporaryPassword = "temporary-password-123";
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      if (String(input).endsWith("/reset-password")) {
        return new Response(JSON.stringify({ data: { temporaryPassword }, meta: { requestId: "req-reset" } }), { status: 200 });
      }
      return apiListResponse(apiUsers, "req-users");
    });
    const user = userEvent.setup();
    const { queryClient } = await renderApiAdminAccounts(fetcher);

    await user.click(await screen.findByRole("button", { name: "Reset password for Nguyen Minh Anh" }));

    const result = await screen.findByRole("status", { name: "Temporary password result" });
    expect(result).toHaveTextContent(temporaryPassword);
    expect(window.localStorage.getItem("temporaryPassword")).toBeNull();
    expect(window.sessionStorage.getItem("temporaryPassword")).toBeNull();
    expect(queryClient.getMutationCache().getAll()).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Dismiss" }));

    expect(screen.queryByRole("status", { name: "Temporary password result" })).not.toBeInTheDocument();
    expect(queryClient.getMutationCache().getAll()).toHaveLength(0);
  });

  it("reports reset failures without unhandled rejections and clears stale reset state on retry", async () => {
    let resetAttempts = 0;
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      if (String(input).endsWith("/reset-password")) {
        resetAttempts += 1;
        if (resetAttempts === 2) {
          return new Response(JSON.stringify({ error: { code: "VALIDATION_ERROR", message: "Password reset failed." }, meta: { requestId: "req-reset-failed" } }), { status: 400 });
        }
        return new Response(JSON.stringify({ data: { temporaryPassword: `temporary-password-${resetAttempts}` }, meta: { requestId: `req-reset-${resetAttempts}` } }), { status: 200 });
      }
      return apiListResponse(apiUsers, "req-users");
    });
    const unhandledRejection = vi.fn();
    window.addEventListener("unhandledrejection", unhandledRejection);
    const user = userEvent.setup();
    await renderApiAdminAccounts(fetcher);

    try {
      const resetButton = await screen.findByRole("button", { name: "Reset password for Nguyen Minh Anh" });
      await user.click(resetButton);
      expect(await screen.findByRole("status", { name: "Temporary password result" })).toHaveTextContent("temporary-password-1");

      await user.click(resetButton);
      expect(await screen.findByRole("alert")).toHaveTextContent("Password reset failed.");
      expect(screen.queryByRole("status", { name: "Temporary password result" })).not.toBeInTheDocument();

      await user.click(resetButton);
      expect(await screen.findByRole("status", { name: "Temporary password result" })).toHaveTextContent("temporary-password-3");
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(unhandledRejection).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener("unhandledrejection", unhandledRejection);
    }
  });

  it("derives the active doctor metric from mock data", () => {
    renderWithProviders(<AdminDashboard />);

    expect(screen.getByText("Doctors active")).toBeInTheDocument();
    expect(within(screen.getByText("Doctors active").closest("section")!).getByText("4")).toBeInTheDocument();
    expect(within(screen.getByText("Doctors active").closest("section")!).getByText("Sẵn sàng tiếp nhận lịch hẹn đang hoạt động.")).toBeInTheDocument();
    expect(within(screen.getByText("Services active").closest("section")!).getByText("8")).toBeInTheDocument();
    expect(within(screen.getByText("Lịch hẹn hôm nay").closest("section")!).getByText("32")).toBeInTheDocument();
    expect(within(screen.getByText("Cancellation rate").closest("section")!).getByText("14,3%")).toBeInTheDocument();
    expect(screen.getByText("5 dịch vụ có lịch hẹn nhiều nhất")).toBeInTheDocument();
    expect(screen.getByText("4 bác sĩ đang active")).toBeInTheDocument();
  });

  it("renders the doctors management table", () => {
    renderWithProviders(<AdminDoctors />);

    expect(screen.getByText("5 bác sĩ trong mock workspace")).toBeInTheDocument();
    expect(screen.getByText("Form chỉ cập nhật state frontend để kiểm thử workflow quản trị.")).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Doctors" })).toBeInTheDocument();
  });

  it("filters audit events by entity type", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuditLog />);

    expect(screen.getByRole("group", { name: "Bộ lọc audit log" })).toBeInTheDocument();
    expect(screen.getByText("Đang hiển thị 20 audit events.")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Entity type"), "appointment");

    expect(screen.getAllByText("appointment").length).toBeGreaterThan(0);

    await user.selectOptions(screen.getByLabelText("Action"), "appointment_updated");
    const auditTable = screen.getByRole("table", { name: "Audit events" });
    expect(within(auditTable).getAllByText("appointment_updated").length).toBeGreaterThan(0);
    expect(within(auditTable).queryByText("appointment_status_changed")).not.toBeInTheDocument();
    expect(screen.getByText("Đang hiển thị 10 audit events.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Xóa bộ lọc audit" }));

    expect(screen.getByText("Đang hiển thị 20 audit events.")).toBeInTheDocument();
  });

  it("passes entity and action filters to the API audit list", async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => apiListResponse([apiAuditEvent], "req-audit"));
    const user = userEvent.setup();
    await renderApiAuditLog(fetcher);

    expect(await screen.findByText("Đang hiển thị 1 audit events.")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Entity type"), "appointment");
    await screen.findByRole("option", { name: "appointment_updated" });
    await user.selectOptions(screen.getByLabelText("Action"), "appointment_updated");

    await waitFor(() => expect(fetcher.mock.calls.map(([url]) => String(url))).toContain(
      "/api/v1/audit-events?entityType=appointment&action=appointment_updated&page=1&pageSize=100",
    ));
  });

  it("validates required doctor fields in mock-only form state", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminDoctors />);

    await user.click(screen.getByRole("button", { name: "Thêm bác sĩ" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Vui lòng nhập đủ các trường bắt buộc.");
  });

  it("shows the signed-in admin notification and opens its audit reference", async () => {
    const user = userEvent.setup();
    mockStore.notifications[0].recipientUserId = "user-admin-1";
    mockStore.notifications[1].recipientUserId = "user-admin-1";
    mockStore.notifications[1].readAt = "2026-08-24T12:00:00+07:00";
    renderWithProviders(<App />);

    await user.click(screen.getByRole("button", { name: /Admin Demo/i }));
    await user.click(screen.getByRole("button", { name: "Thông báo" }));

    const notificationDialog = screen.getByRole("dialog", { name: "Thông báo" });
    expect(within(notificationDialog).getByText("2 thông báo, 1 chưa đọc")).toBeInTheDocument();
    expect(screen.getByText("Lịch hẹn đã được xác nhận")).toBeInTheDocument();
    expect(screen.getByText("Có lịch hẹn mới")).toBeInTheDocument();
    expect(screen.getAllByText("Vui lòng kiểm tra thông tin lịch hẹn trong CareFlow.")).toHaveLength(2);
    expect(screen.getByText("09:00 24/08/2026")).toBeInTheDocument();
    expect(screen.getByLabelText("Chưa đọc")).toBeInTheDocument();
    expect(screen.getByLabelText("Đã đọc")).toBeInTheDocument();
    await user.click(within(notificationDialog).getByRole("button", { name: "Đóng thông báo" }));
    expect(screen.queryByRole("dialog", { name: "Thông báo" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Thông báo" }));
    expect(screen.getByRole("button", { name: "Mở appointment appointment-1" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Mở appointment appointment-1" }));
    expect(screen.getByRole("heading", { name: "Audit log" })).toBeInTheDocument();
  });
});
