import userEvent from "@testing-library/user-event";
import { cleanup, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CreateAppointmentPage } from "./CreateAppointmentPage";
import { OperationsCalendar } from "./OperationsCalendar";
import { OperationsDashboard } from "./OperationsDashboard";
import { QueuePage } from "./QueuePage";
import { mockStore } from "../../mocks/mockStore";
import { renderWithProviders } from "../../test/render";

afterEach(() => {
  cleanup();
  mockStore.reset();
});

describe("operations workspace", () => {
  it("checks a confirmed appointment into the waiting queue", async () => {
    const user = userEvent.setup();
    mockStore.appointments.forEach((appointment) => {
      if (appointment.status === "checked_in") appointment.status = "completed";
    });
    renderWithProviders(<QueuePage />);

    const confirmedGroup = screen.getByRole("region", { name: "Đã xác nhận" });
    await user.click(within(confirmedGroup).getAllByRole("button", { name: "Check-in" })[0]);
    expect(screen.getByText("Đã check-in")).toBeInTheDocument();
  });

  it("finds a patient before creating an appointment", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateAppointmentPage />);

    await user.type(screen.getByLabelText("Tìm patient"), "Nguyễn");
    expect(screen.getByText(/Nguyễn/i)).toBeInTheDocument();
  });

  it("creates a confirmed appointment for staff", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateAppointmentPage />);

    await user.type(screen.getByLabelText("Tìm patient"), "Nguyễn");
    await user.click(screen.getByRole("button", { name: /Nguyen Minh Anh/i }));
    await user.selectOptions(screen.getByLabelText("Dịch vụ"), "service-cardiology-consult");
    await user.selectOptions(screen.getByLabelText("Bác sĩ"), "doctor-2");
    await user.clear(screen.getByLabelText("Ngày khám"));
    await user.type(screen.getByLabelText("Ngày khám"), "2026-08-26");
    await user.selectOptions(screen.getByLabelText("Giờ khám"), "09:00");
    await user.click(screen.getByRole("button", { name: "Tạo appointment" }));
    expect(screen.getByText("Đã xác nhận")).toBeInTheDocument();
    expect(mockStore.appointments.at(-1)?.status).toBe("confirmed");
  });

  it("does not offer staff booking slots outside the doctor's working schedule", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateAppointmentPage />);

    await user.selectOptions(screen.getByLabelText("Dịch vụ"), "service-cardiology-consult");
    await user.selectOptions(screen.getByLabelText("Bác sĩ"), "doctor-2");
    fireEvent.change(screen.getByLabelText("Ngày khám"), { target: { value: "2026-08-30" } });

    expect(within(screen.getByLabelText("Giờ khám")).getByRole("option", { name: "09:00" })).toBeDisabled();
  });

  it("does not submit a second appointment after a successful staff creation", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateAppointmentPage />);

    await user.type(screen.getByLabelText("Tìm patient"), "Nguyễn");
    await user.click(screen.getByRole("button", { name: /Nguyen Minh Anh/i }));
    await user.selectOptions(screen.getByLabelText("Dịch vụ"), "service-cardiology-consult");
    await user.selectOptions(screen.getByLabelText("Bác sĩ"), "doctor-2");
    await user.selectOptions(screen.getByLabelText("Giờ khám"), "09:00");
    await user.click(screen.getByRole("button", { name: "Tạo appointment" }));
    await user.click(screen.getByRole("button", { name: "Tạo appointment" }));

    expect(mockStore.appointments.filter((appointment) => appointment.startAt === "2026-08-26T09:00:00+07:00")).toHaveLength(1);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("does not offer staff booking slots that conflict with active appointments", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateAppointmentPage />);

    await user.type(screen.getByLabelText("Tìm patient"), "Nguyễn");
    await user.click(screen.getByRole("button", { name: /Nguyen Minh Anh/i }));
    await user.selectOptions(screen.getByLabelText("Dịch vụ"), "service-cardiology-consult");
    await user.selectOptions(screen.getByLabelText("Bác sĩ"), "doctor-2");
    fireEvent.change(screen.getByLabelText("Ngày khám"), { target: { value: "2026-08-25" } });
    expect(within(screen.getByLabelText("Giờ khám")).getByRole("option", { name: "08:00" })).toBeDisabled();
  });

  it("does not render actions for completed queue entries", () => {
    renderWithProviders(<QueuePage />);

    const completedGroup = screen.getByRole("region", { name: "Hoàn tất" });
    expect(within(completedGroup).queryByRole("button")).not.toBeInTheDocument();
  });

  it("filters the operations calendar by specialty", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OperationsCalendar />);

    await user.selectOptions(screen.getByLabelText("Chuyên khoa"), "specialty-cardiology");
    expect(screen.getAllByRole("cell", { name: "BS. Nguyen Thanh Mai" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("cell", { name: "BS. Tran Quang Huy" })).not.toBeInTheDocument();
  });

  it("shows today counts and a waiting queue on the dashboard", () => {
    renderWithProviders(<OperationsDashboard />);

    expect(screen.getByText("Lịch hẹn hôm nay")).toBeInTheDocument();
    expect(screen.getByText("Hàng đợi chờ xử lý")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tạo appointment" })).toBeInTheDocument();
  });
});
