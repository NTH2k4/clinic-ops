import userEvent from "@testing-library/user-event";
import { cleanup, fireEvent, screen, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../../app/App";
import { DetailDrawer } from "../../components/DetailDrawer";
import { mockStore } from "../../mocks/mockStore";
import { renderWithProviders } from "../../test/render";
import type { Appointment } from "../../types/models";

afterEach(() => {
  cleanup();
  mockStore.reset();
});

async function signInAsDoctor() {
  const user = userEvent.setup();
  renderWithProviders(<App />);
  await user.click(screen.getByRole("button", { name: /Doctor Demo/i }));
  return user;
}

function DoctorFlowHarness() {
  const [appointment, setAppointment] = useState<Appointment>(() => {
    const checkedIn = mockStore.appointments.find((candidate) => candidate.status === "checked_in");
    if (!checkedIn) throw new Error("Missing checked-in fixture");
    return checkedIn;
  });

  return <DetailDrawer actorUserId="user-doctor-1" appointment={appointment} onClose={() => undefined} onUpdated={setAppointment} />;
}

function TerminalAppointmentHarness() {
  const completed = mockStore.appointments.find((candidate) => candidate.status === "completed");
  if (!completed) throw new Error("Missing completed fixture");

  return <DetailDrawer actorUserId="user-doctor-1" appointment={completed} onClose={() => undefined} onUpdated={() => undefined} />;
}

function ClinicDateTimeHarness() {
  const appointment = mockStore.appointments.find(
    (candidate) => candidate.startAt === "2026-08-25T08:00:00+07:00",
  );
  if (!appointment) throw new Error("Missing clinic date-time fixture");

  return <DetailDrawer actorUserId="user-doctor-1" appointment={appointment} onClose={() => undefined} onUpdated={() => undefined} />;
}

describe("doctor workspace", () => {
  it("shows stable default-day counts, ordered appointments, and the next future active appointment", async () => {
    const user = await signInAsDoctor();

    expect(screen.getByRole("heading", { name: "Không gian bác sĩ" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Chưa có lịch hẹn" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(8);
    expect(within(screen.getByText("Lịch hẹn hôm nay").closest("section")!).getByText("8")).toBeInTheDocument();
    expect(screen.getByText("Waiting")).toBeInTheDocument();
    expect(within(screen.getByText("Waiting").closest("section")!).getByText("1")).toBeInTheDocument();
    expect(screen.getAllByText("Đã check-in").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Đang khám").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Hoàn tất").length).toBeGreaterThan(0);

    const appointmentTimes = screen.getAllByRole("article").map((appointment) => within(appointment).getByText(/\d{2}:\d{2}/).textContent);
    expect(appointmentTimes).toEqual(["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30"]);

    await user.click(screen.getByRole("button", { name: "Xem chi tiết" }));
    expect(screen.getByRole("button", { name: /Start appointment/i })).toBeInTheDocument();
  });

  it("wires the authenticated day and week schedule routes to stable date selectors", async () => {
    const user = await signInAsDoctor();
    const mainNavigation = screen.getByRole("navigation", { name: "Điều hướng chính" });

    await user.click(within(mainNavigation).getByRole("link", { name: "Lịch ngày" }));
    expect(screen.getByRole("heading", { name: "Lịch ngày" })).toBeInTheDocument();
    expect(screen.getByLabelText("Ngày xem lịch")).toHaveValue("2026-08-25");
    expect(screen.getByText("25/08/2026")).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(8);
    await user.click(screen.getByRole("button", { name: "Ngày trước" }));
    expect(screen.getByLabelText("Ngày xem lịch")).toHaveValue("2026-08-24");
    expect(screen.getByText("24/08/2026")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Hôm nay" }));
    expect(screen.getByLabelText("Ngày xem lịch")).toHaveValue("2026-08-25");
    await user.click(screen.getByRole("button", { name: "Ngày sau" }));
    expect(screen.getByLabelText("Ngày xem lịch")).toHaveValue("2026-08-26");

    await user.click(within(mainNavigation).getByRole("link", { name: "Lịch tuần" }));
    expect(screen.getByRole("heading", { name: "Lịch tuần" })).toBeInTheDocument();
    expect(screen.getByLabelText("Bắt đầu tuần")).toHaveValue("2026-08-24");
    expect(screen.getByText("Tuần 35, 24/08/2026 - 30/08/2026")).toBeInTheDocument();
    const daySelector = screen.getByLabelText("Chọn ngày trong tuần");
    const days = within(daySelector).getAllByRole("button");
    expect(days).toHaveLength(7);
    expect(days[0]).toHaveAttribute("aria-pressed", "true");
    await user.click(days[1]);
    expect(days[1]).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Tuần trước" }));
    expect(screen.getByLabelText("Bắt đầu tuần")).toHaveValue("2026-08-17");
    expect(screen.getByText("Tuần 34, 17/08/2026 - 23/08/2026")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tuần hiện tại" }));
    expect(screen.getByLabelText("Bắt đầu tuần")).toHaveValue("2026-08-24");
    await user.click(screen.getByRole("button", { name: "Tuần sau" }));
    expect(screen.getByLabelText("Bắt đầu tuần")).toHaveValue("2026-08-31");
    expect(screen.getByText("Tuần 36, 31/08/2026 - 06/09/2026")).toBeInTheDocument();
  });

  it("keeps native day and week date inputs usable when changed or cleared", async () => {
    const user = await signInAsDoctor();
    const mainNavigation = screen.getByRole("navigation", { name: "Điều hướng chính" });

    await user.click(within(mainNavigation).getByRole("link", { name: "Lịch ngày" }));
    const dayInput = screen.getByLabelText("Ngày xem lịch");
    fireEvent.change(dayInput, { target: { value: "" } });
    expect(dayInput).toHaveValue("2026-08-25");
    fireEvent.change(dayInput, { target: { value: "2026-09-02" } });
    expect(dayInput).toHaveValue("2026-09-02");
    expect(screen.getByText("02/09/2026")).toBeInTheDocument();

    await user.click(within(mainNavigation).getByRole("link", { name: "Lịch tuần" }));
    const weekInput = screen.getByLabelText("Bắt đầu tuần");
    fireEvent.change(weekInput, { target: { value: "" } });
    expect(weekInput).toHaveValue("2026-08-24");
    fireEvent.change(weekInput, { target: { value: "2026-09-02" } });
    expect(weekInput).toHaveValue("2026-08-31");
    expect(screen.getByText("Tuần 36, 31/08/2026 - 06/09/2026")).toBeInTheDocument();
  });

  it("opens the dashboard drawer with patient, appointment, history, and audit details", async () => {
    const user = await signInAsDoctor();
    await user.click(screen.getByRole("button", { name: "Xem chi tiết" }));

    const drawer = screen.getByRole("dialog", { name: "Chi tiết lịch hẹn" });
    expect(within(drawer).getByRole("heading", { name: "Nguyen Minh Anh" })).toBeInTheDocument();
    expect(within(drawer).getByText("BS. Tran Quang Huy")).toBeInTheDocument();
    expect(within(drawer).getByText("Khám tổng quát")).toBeInTheDocument();
    expect(within(drawer).getByText("Lý do khám")).toBeInTheDocument();
    expect(within(drawer).getByText("Ghi chú nội bộ")).toBeInTheDocument();
    expect(within(drawer).getByText("Lịch sử trạng thái")).toBeInTheDocument();
    expect(within(drawer).getByText("Nhật ký kiểm toán")).toBeInTheDocument();
    expect(within(drawer).getByLabelText("Trạng thái: Đã check-in")).toBeInTheDocument();
  });

  it("does not render an invalid action for a terminal appointment", () => {
    renderWithProviders(<TerminalAppointmentHarness />);

    expect(screen.queryByRole("button", { name: /appointment/i })).not.toBeInTheDocument();
  });

  it("renders drawer date-time in Vietnam clinic time", () => {
    renderWithProviders(<ClinicDateTimeHarness />);

    expect(screen.getByText("08:00 25/08/2026")).toBeInTheDocument();
  });

  it("moves a checked-in appointment through the doctor consultation flow", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DoctorFlowHarness />);

    await user.click(screen.getByRole("button", { name: /Start appointment/i }));
    expect(screen.getByText("Đang khám")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Complete appointment/i }));
    expect(screen.getByText("Hoàn tất")).toBeInTheDocument();
  });
});
