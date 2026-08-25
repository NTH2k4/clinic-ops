import userEvent from "@testing-library/user-event";
import { cleanup, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../../app/App";
import { appointmentService } from "../appointments/appointmentService";
import { mockStore } from "../../mocks/mockStore";
import { renderWithProviders } from "../../test/render";

afterEach(() => {
  cleanup();
  mockStore.reset();
});

async function signInAsPatient() {
  const user = userEvent.setup();
  renderWithProviders(<App />);
  await user.click(screen.getByRole("button", { name: /Patient Demo/i }));
  return user;
}

describe("patient portal", () => {
  it("shows the patient home with a booking quick action", async () => {
    const user = await signInAsPatient();

    expect(screen.getByRole("heading", { name: "Trang chính patient" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Đặt lịch" }));
    expect(screen.getByRole("heading", { name: "Đặt lịch" })).toBeInTheDocument();
  });

  it("filters services by specialty", async () => {
    const user = await signInAsPatient();

    await user.click(within(screen.getByRole("navigation", { name: "Điều hướng chính" })).getByRole("link", { name: "Dịch vụ" }));
    await user.click(screen.getByRole("button", { name: /Tim mạch/i }));

    expect(screen.getByText(/Khám tim mạch/i)).toBeInTheDocument();
  });

  it("creates a requested appointment using a deterministic available doctor", async () => {
    const user = await signInAsPatient();

    await user.click(screen.getByRole("button", { name: "Đặt lịch" }));
    await user.click(screen.getByRole("button", { name: /Khám tim mạch/i }));
    await user.click(screen.getByLabelText("Any available doctor"));
    expect(screen.getByRole("button", { name: /08:00/i })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: /09:00/i }));
    await user.type(screen.getByLabelText("Lý do khám"), "Đau ngực nhẹ khi vận động");
    expect(screen.getByRole("button", { name: "Gửi yêu cầu" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Gửi yêu cầu" }));
    expect(mockStore.appointments.at(-1)?.createdByUserId).toBe("user-patient-1");

    expect(await screen.findByText("Chờ xác nhận")).toBeInTheDocument();
    expect(mockStore.appointments.at(-1)).toMatchObject({
      doctorId: "doctor-2",
      serviceId: "service-cardiology-consult",
      status: "requested",
    });
  });

  it("shows the patient conflict message when the selected slot becomes unavailable", async () => {
    const user = await signInAsPatient();

    await user.click(screen.getByRole("button", { name: "Đặt lịch" }));
    await user.click(screen.getByRole("button", { name: /Khám tim mạch/i }));
    await user.click(screen.getByLabelText("Any available doctor"));
    await user.click(screen.getByRole("button", { name: /09:00/i }));
    await appointmentService.createStaffAppointment({
      patientId: "patient-2",
      doctorId: "doctor-2",
      serviceId: "service-cardiology-consult",
      startAt: "2026-08-26T09:00:00+07:00",
      actorUserId: "user-receptionist-1",
    });
    await user.type(screen.getByLabelText("Lý do khám"), "Cần khám lại");
    await user.click(screen.getByRole("button", { name: "Gửi yêu cầu" }));

    expect(await screen.findByText("Slot này đã có appointment active")).toBeInTheDocument();
  });

  it("disables a slot that overlaps an active appointment with a different start time", async () => {
    await appointmentService.createStaffAppointment({
      patientId: "patient-2",
      doctorId: "doctor-2",
      serviceId: "service-cardiology-consult",
      startAt: "2026-08-26T08:15:00+07:00",
      actorUserId: "user-receptionist-1",
    });
    const user = await signInAsPatient();

    await user.click(screen.getByRole("button", { name: "Đặt lịch" }));
    await user.click(screen.getByRole("button", { name: /Khám tim mạch/i }));

    expect(screen.getByRole("button", { name: /08:30/i })).toBeDisabled();
  });

  it("disables slots outside the doctor's active working schedule", async () => {
    const user = await signInAsPatient();

    await user.click(screen.getByRole("button", { name: "Đặt lịch" }));
    await user.click(screen.getByRole("button", { name: /Khám tim mạch/i }));
    fireEvent.change(screen.getByLabelText("Ngày khám"), { target: { value: "2026-08-30" } });
    await user.type(screen.getByLabelText("Lý do khám"), "Khám vào ngày nghỉ");

    expect(screen.getByRole("button", { name: /09:00/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Gửi yêu cầu" })).toBeDisabled();
  });

  it("groups appointments by tab and only offers cancellation for non-terminal statuses", async () => {
    const user = await signInAsPatient();

    await user.click(within(screen.getByRole("navigation", { name: "Điều hướng chính" })).getByRole("link", { name: "Lịch của tôi" }));
    expect(screen.getByRole("tab", { name: "Sắp tới" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Hủy lịch" }).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("tab", { name: "Đã qua" }));
    expect(screen.queryByRole("button", { name: "Hủy lịch" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Đã hủy" }));
    const cancelledList = screen.getByRole("tabpanel", { name: "Đã hủy" });
    expect(within(cancelledList).queryByRole("button", { name: "Hủy lịch" })).not.toBeInTheDocument();
  });
});
