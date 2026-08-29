import userEvent from "@testing-library/user-event";
import { cleanup, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "../../app/App";
import { navigationForRole } from "../../components/navigation";
import { mockStore } from "../../mocks/mockStore";
import { renderWithProviders } from "../../test/render";
import { AdminDashboard } from "./AdminDashboard";
import { AdminDoctors } from "./AdminDoctors";
import { AdminSchedules } from "./AdminSchedules";
import { AdminServices } from "./AdminServices";
import { AdminSpecialties } from "./AdminSpecialties";
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
  actorDisplayName: "Quản trị viên",
  entityType: "appointment",
  entityId: "appointment-api-1",
  entityDisplayName: "Nguyen Minh Anh - Khám tổng quát",
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
      label: "Tài khoản",
      to: "/app/admin/accounts",
    });
  });

  it("lets administrators manage doctor schedule blocks from navigation", async () => {
    const user = userEvent.setup();

    expect(navigationForRole("admin")).toContainEqual({
      icon: expect.anything(),
      label: "Lịch làm việc",
      to: "/app/admin/schedules",
    });

    renderWithProviders(<App />);

    await user.click(screen.getByRole("button", { name: /Quản trị/i }));
    await user.click((await screen.findAllByRole("link", { name: "Lịch làm việc" }))[0]);

    expect(await screen.findByRole("heading", { name: "Lịch làm việc" })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Lọc bác sĩ"), "doctor-1");
    await user.click(screen.getByRole("button", { name: "Áp dụng bộ lọc" }));

    await user.click(screen.getByRole("button", { name: "Tạo lịch" }));
    await user.selectOptions(screen.getByLabelText("Bác sĩ"), "doctor-1");
    await user.selectOptions(screen.getByLabelText("Loại lịch"), "blocked");
    await user.selectOptions(screen.getByLabelText("Thứ trong tuần"), "2");
    await user.clear(screen.getByLabelText("Giờ bắt đầu"));
    await user.type(screen.getByLabelText("Giờ bắt đầu"), "10:00");
    await user.clear(screen.getByLabelText("Giờ kết thúc"));
    await user.type(screen.getByLabelText("Giờ kết thúc"), "11:00");
    await user.click(screen.getByRole("button", { name: "Lưu lịch" }));

    const schedulesTable = await screen.findByRole("table", { name: "Lịch làm việc bác sĩ" });
    await waitFor(() => expect(within(schedulesTable).getByText("10:00-11:00")).toBeInTheDocument());
    const createdRow = within(schedulesTable).getByText("10:00-11:00").closest("tr")!;
    expect(within(createdRow).getByText("Chặn lịch")).toBeInTheDocument();
    expect(within(createdRow).getByText("BS. Tran Quang Huy")).toBeInTheDocument();
    expect(within(createdRow).getByText("2026-08-25 đến 2026-08-25")).toBeInTheDocument();

    await user.click(within(createdRow).getByRole("button", { name: "Vô hiệu hóa BS. Tran Quang Huy 10:00-11:00" }));
    expect(screen.getByRole("dialog", { name: "Xác nhận vô hiệu hóa lịch làm việc" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Vô hiệu hóa" }));

    expect(await within(createdRow).findByLabelText("Trạng thái: Không hoạt động")).toBeInTheDocument();
  });

  it("renders account email, role, and status from the admin API", async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => apiListResponse(apiUsers, "req-users"));
    await renderApiAdminAccounts(fetcher);

    expect(await screen.findByText("minh.anh@example.test")).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Tài khoản" })).toHaveTextContent("Bệnh nhân");
    expect(screen.getByRole("table", { name: "Tài khoản" })).toHaveTextContent("Đã khóa");
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

    await user.click(await screen.findByRole("button", { name: "Khóa Nguyen Minh Anh" }));
    await user.click(screen.getByRole("button", { name: "Mở khóa Locked Doctor" }));

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

    await user.click(await screen.findByRole("button", { name: "Khóa Nguyen Minh Anh" }));

    expect(await screen.findByRole("button", { name: "Mở khóa Nguyen Minh Anh" })).toBeInTheDocument();
    expect(within(screen.getByText("Nguyen Minh Anh").closest("tr")!).getByText("Đã khóa")).toBeInTheDocument();
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

    await user.click(await screen.findByRole("button", { name: "Khóa Nguyen Minh Anh" }));

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

    await user.click(await screen.findByRole("button", { name: "Đặt lại mật khẩu cho Nguyen Minh Anh" }));

    const result = await screen.findByRole("status", { name: "Kết quả mật khẩu tạm thời" });
    expect(result).toHaveTextContent(temporaryPassword);
    expect(window.localStorage.getItem("temporaryPassword")).toBeNull();
    expect(window.sessionStorage.getItem("temporaryPassword")).toBeNull();
    expect(queryClient.getMutationCache().getAll()).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Đóng" }));

    expect(screen.queryByRole("status", { name: "Kết quả mật khẩu tạm thời" })).not.toBeInTheDocument();
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
      const resetButton = await screen.findByRole("button", { name: "Đặt lại mật khẩu cho Nguyen Minh Anh" });
      await user.click(resetButton);
      expect(await screen.findByRole("status", { name: "Kết quả mật khẩu tạm thời" })).toHaveTextContent("temporary-password-1");

      await user.click(resetButton);
      expect(await screen.findByRole("alert")).toHaveTextContent("Password reset failed.");
      expect(screen.queryByRole("status", { name: "Kết quả mật khẩu tạm thời" })).not.toBeInTheDocument();

      await user.click(resetButton);
      expect(await screen.findByRole("status", { name: "Kết quả mật khẩu tạm thời" })).toHaveTextContent("temporary-password-3");
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(unhandledRejection).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener("unhandledrejection", unhandledRejection);
    }
  });

  it("derives the active doctor metric from mock data", () => {
    renderWithProviders(<AdminDashboard />);

    expect(screen.getByText("Bác sĩ đang hoạt động")).toBeInTheDocument();
    expect(within(screen.getByText("Bác sĩ đang hoạt động").closest("section")!).getByText("4")).toBeInTheDocument();
    expect(within(screen.getByText("Bác sĩ đang hoạt động").closest("section")!).getByText("Sẵn sàng tiếp nhận lịch hẹn đang hoạt động.")).toBeInTheDocument();
    expect(within(screen.getByText("Dịch vụ đang hoạt động").closest("section")!).getByText("8")).toBeInTheDocument();
    expect(within(screen.getByText("Lịch hẹn hôm nay").closest("section")!).getByText("32")).toBeInTheDocument();
    expect(within(screen.getByText("Tỷ lệ hủy lịch").closest("section")!).getByText("14,3%")).toBeInTheDocument();
    expect(screen.getByText("Tỷ lệ lịch đã hủy trên toàn bộ dữ liệu.")).toBeInTheDocument();
    expect(screen.getByText("5 dịch vụ có lịch hẹn nhiều nhất")).toBeInTheDocument();
    expect(screen.getByText("4 bác sĩ đang hoạt động")).toBeInTheDocument();
    expect(screen.queryByText(/demo/i)).not.toBeInTheDocument();
  });

  it("renders the doctors management table", () => {
    renderWithProviders(<AdminDoctors />);

    expect(screen.getByText("5 bác sĩ trong danh mục")).toBeInTheDocument();
    expect(screen.queryByText(/demo/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/chỉ cập nhật state frontend/i)).not.toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Bác sĩ" })).toBeInTheDocument();
  });

  it.each([
    ["dịch vụ", <AdminServices />, "Tên dịch vụ", "Thêm dịch vụ", "Sửa Khám tổng quát", "Cập nhật dịch vụ"],
    ["chuyên khoa", <AdminSpecialties />, "Tên chuyên khoa", "Thêm chuyên khoa", "Sửa Nội tổng quát", "Cập nhật chuyên khoa"],
    ["bác sĩ", <AdminDoctors />, "Tên bác sĩ", "Thêm bác sĩ", "Sửa BS. Tran Quang Huy", "Cập nhật bác sĩ"],
    ["lịch làm việc", <AdminSchedules />, "Bác sĩ", "Tạo lịch", "Sửa BS. Tran Quang Huy 08:00-17:00", "Cập nhật lịch"],
  ])("keeps the %s form hidden until an explicit add or edit action", async (_label, ui, fieldLabel, addButtonName, editButtonName, formHeading) => {
    const user = userEvent.setup();
    renderWithProviders(ui);

    expect(screen.queryByLabelText(fieldLabel)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: addButtonName }));
    expect(screen.getByLabelText(fieldLabel)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Hủy/ }));
    expect(screen.queryByLabelText(fieldLabel)).not.toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: editButtonName })[0]);
    expect(screen.getByRole("heading", { name: formHeading })).toBeInTheDocument();
    expect(screen.getByLabelText(fieldLabel)).toBeInTheDocument();
  });

  it("asks for confirmation before deactivating catalog and schedule records", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminDoctors />);

    const doctorRow = within(screen.getByRole("table", { name: "Bác sĩ" })).getByText("BS. Tran Quang Huy").closest("tr")!;
    await user.click(within(doctorRow).getByRole("button", { name: "Vô hiệu hóa BS. Tran Quang Huy" }));

    expect(screen.getByRole("dialog", { name: "Xác nhận vô hiệu hóa bác sĩ" })).toBeInTheDocument();
    expect(screen.getByText(/sẽ không còn xuất hiện cho lịch đặt mới/i)).toBeInTheDocument();
    expect(within(doctorRow).getByLabelText("Trạng thái: Đang hoạt động")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Quay lại" }));
    expect(screen.queryByRole("dialog", { name: "Xác nhận vô hiệu hóa bác sĩ" })).not.toBeInTheDocument();
    expect(within(doctorRow).getByLabelText("Trạng thái: Đang hoạt động")).toBeInTheDocument();

    await user.click(within(doctorRow).getByRole("button", { name: "Vô hiệu hóa BS. Tran Quang Huy" }));
    await user.click(screen.getByRole("button", { name: "Vô hiệu hóa" }));

    expect(await within(doctorRow).findByLabelText("Trạng thái: Không hoạt động")).toBeInTheDocument();
  });

  it("filters audit events by entity type", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuditLog />);

    expect(screen.getByRole("group", { name: "Bộ lọc nhật ký kiểm toán" })).toBeInTheDocument();
    expect(screen.getByText("Đang hiển thị 20 sự kiện kiểm toán.")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Loại đối tượng"), "appointment");

    expect(screen.getAllByText("Lịch hẹn").length).toBeGreaterThan(0);

    await user.selectOptions(screen.getByLabelText("Hành động"), "appointment_updated");
    const auditTable = screen.getByRole("table", { name: "Sự kiện kiểm toán" });
    expect(within(auditTable).getAllByText("Cập nhật lịch hẹn").length).toBeGreaterThan(0);
    expect(within(auditTable).queryByText("Đổi trạng thái lịch hẹn")).not.toBeInTheDocument();
    expect(screen.getByText("Đang hiển thị 10 sự kiện kiểm toán.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Xóa bộ lọc" }));

    expect(screen.getByText("Đang hiển thị 20 sự kiện kiểm toán.")).toBeInTheDocument();
  });

  it("passes entity and action filters to the API audit list", async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => apiListResponse([apiAuditEvent], "req-audit"));
    const user = userEvent.setup();
    await renderApiAuditLog(fetcher);

    expect(await screen.findByText("Đang hiển thị 1 sự kiện kiểm toán.")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Loại đối tượng"), "appointment");
    await screen.findByRole("option", { name: "Cập nhật lịch hẹn" });
    await user.selectOptions(screen.getByLabelText("Hành động"), "appointment_updated");

    expect(screen.getByText("Nguyen Minh Anh - Khám tổng quát")).toBeInTheDocument();
    expect(screen.getByText("Quản trị viên")).toBeInTheDocument();
    await waitFor(() => expect(fetcher.mock.calls.map(([url]) => String(url))).toContain(
      "/api/v1/audit-events?entityType=appointment&action=appointment_updated&page=1&pageSize=100",
    ));
  });

  it("validates required doctor fields in mock-only form state", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminDoctors />);

    await user.click(screen.getByRole("button", { name: "Thêm bác sĩ" }));
    await user.click(screen.getByRole("button", { name: "Lưu bác sĩ" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Vui lòng nhập đủ các trường bắt buộc.");
  });

  it("shows the signed-in admin notification and opens its audit reference", async () => {
    const user = userEvent.setup();
    mockStore.notifications[0].recipientUserId = "user-admin-1";
    mockStore.notifications[1].recipientUserId = "user-admin-1";
    mockStore.notifications[1].readAt = "2026-08-24T12:00:00+07:00";
    renderWithProviders(<App />);

    await user.click(screen.getByRole("button", { name: /Quản trị/i }));
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
    expect(screen.getByRole("button", { name: "Mở lịch hẹn appointment-1" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Mở lịch hẹn appointment-1" }));
    expect(screen.getByRole("heading", { name: "Nhật ký kiểm toán" })).toBeInTheDocument();
  });
});
