import userEvent from "@testing-library/user-event";
import { cleanup, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../../app/App";
import { mockStore } from "../../mocks/mockStore";
import { renderWithProviders } from "../../test/render";
import { AdminDashboard } from "./AdminDashboard";
import { AdminDoctors } from "./AdminDoctors";
import { AuditLog } from "./AuditLog";

afterEach(() => {
  cleanup();
  mockStore.reset();
});

describe("admin workspace", () => {
  it("derives the active doctor metric from mock data", () => {
    renderWithProviders(<AdminDashboard />);

    expect(screen.getByText("Doctors active")).toBeInTheDocument();
    expect(within(screen.getByText("Doctors active").closest("section")!).getByText("4")).toBeInTheDocument();
    expect(within(screen.getByText("Services active").closest("section")!).getByText("8")).toBeInTheDocument();
    expect(within(screen.getByText("Lịch hẹn hôm nay").closest("section")!).getByText("32")).toBeInTheDocument();
    expect(within(screen.getByText("Cancellation rate").closest("section")!).getByText("14,3%")).toBeInTheDocument();
  });

  it("renders the doctors management table", () => {
    renderWithProviders(<AdminDoctors />);

    expect(screen.getByRole("table", { name: "Doctors" })).toBeInTheDocument();
  });

  it("filters audit events by entity type", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuditLog />);

    await user.selectOptions(screen.getByLabelText("Entity type"), "appointment");

    expect(screen.getAllByText("appointment").length).toBeGreaterThan(0);

    await user.selectOptions(screen.getByLabelText("Action"), "appointment_updated");
    const auditTable = screen.getByRole("table", { name: "Audit events" });
    expect(within(auditTable).getAllByText("appointment_updated").length).toBeGreaterThan(0);
    expect(within(auditTable).queryByText("appointment_status_changed")).not.toBeInTheDocument();
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
