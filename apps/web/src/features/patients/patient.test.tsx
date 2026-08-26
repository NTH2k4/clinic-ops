import userEvent from "@testing-library/user-event";
import { cleanup, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "../../app/App";
import { appointmentService } from "../appointments/appointmentService";
import { mockStore } from "../../mocks/mockStore";
import { expectClinicDateField, getClinicDateSegment, setClinicDateDay } from "../../test/dateField";
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
    expect(screen.getByText("8 dịch vụ đang mở từ 4 chuyên khoa")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Lọc theo chuyên khoa" })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Khám tổng quát" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Đặt lịch Khám tổng quát" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Tim mạch/i }));

    expect(screen.getByText("2 dịch vụ phù hợp")).toBeInTheDocument();
    expect(screen.getByText(/Khám tim mạch/i)).toBeInTheDocument();
    expect(screen.queryByRole("article", { name: "Khám tổng quát" })).not.toBeInTheDocument();
  });

  it("creates a requested appointment using a deterministic available doctor", async () => {
    const user = await signInAsPatient();

    await user.click(screen.getByRole("button", { name: "Đặt lịch" }));
    expect(screen.getByText("Tiến trình đặt lịch")).toBeInTheDocument();
    expect(screen.getByText("1. Dịch vụ")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Khám tim mạch/i }));
    await user.click(screen.getByLabelText("Any available doctor"));
    expect(screen.getByRole("button", { name: /08:00/i })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: /09:00/i }));
    expect(screen.getByText("26/08/2026 09:00")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Lý do khám"), "Đau ngực nhẹ khi vận động");
    expect(screen.getByRole("button", { name: "Gửi yêu cầu" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Gửi yêu cầu" }));
    expect(mockStore.appointments.at(-1)?.createdByUserId).toBe("user-patient-1");

    expect(await screen.findByText("Chờ xác nhận")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem lịch của tôi" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Đặt lịch khác" })).toBeInTheDocument();
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

    expect(await screen.findByText("Khung giờ vừa được đặt bởi lịch hẹn khác. Vui lòng chọn khung giờ khác.")).toBeInTheDocument();
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

    expect(screen.getByText("Khung giờ màu xám là không khả dụng do lịch làm việc hoặc lịch hẹn đã trùng.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /08:30/i })).toBeDisabled();
  });

  it("disables slots outside the doctor's active working schedule", async () => {
    const user = await signInAsPatient();

    await user.click(screen.getByRole("button", { name: "Đặt lịch" }));
    await user.click(screen.getByRole("button", { name: /Khám tim mạch/i }));
    await setClinicDateDay(user, "Ngày khám", 30);
    await user.type(screen.getByLabelText("Lý do khám"), "Khám vào ngày nghỉ");

    expectClinicDateField("Ngày khám", { day: 30, month: 8, year: 2026 });
    expect(screen.getByRole("button", { name: /09:00/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Gửi yêu cầu" })).toBeDisabled();
  });

  it("prevents the booking date field from moving before its minimum date", async () => {
    const user = await signInAsPatient();

    await user.click(screen.getByRole("button", { name: "Đặt lịch" }));
    await user.click(screen.getByRole("button", { name: /Khám tim mạch/i }));
    const daySegment = getClinicDateSegment("Ngày khám", "day");

    await user.click(daySegment);
    await user.keyboard("{ArrowDown}");

    expectClinicDateField("Ngày khám", { day: 26, month: 8, year: 2026 });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps Monday schedule availability stable across browser timezones", async () => {
    vi.stubEnv("TZ", "America/Los_Angeles");

    try {
      const user = await signInAsPatient();

      await user.click(screen.getByRole("button", { name: "Đặt lịch" }));
      await user.click(screen.getByRole("button", { name: /Khám tim mạch/i }));
      await user.click(screen.getByLabelText("Any available doctor"));
      await setClinicDateDay(user, "Ngày khám", 31);

      expect(screen.getByRole("button", { name: /09:00/i })).toBeEnabled();
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("groups appointments by tab and only offers cancellation for non-terminal statuses", async () => {
    const user = await signInAsPatient();

    await user.click(within(screen.getByRole("navigation", { name: "Điều hướng chính" })).getByRole("link", { name: "Lịch của tôi" }));
    expect(screen.getByRole("tab", { name: "Sắp tới (4)" })).toBeInTheDocument();
    expect(screen.getByText("Bạn có 4 lịch hẹn sắp tới.")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Hủy lịch .+/ }).length).toBeGreaterThan(0);
    await user.click(screen.getAllByRole("button", { name: /Hủy lịch .+/ })[0]);
    expect(await screen.findByText("Lịch hẹn đã được hủy.")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Sắp tới (3)" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Đã qua (1)" }));
    expect(screen.queryByRole("button", { name: /Hủy lịch .+/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Đã hủy (1)" }));
    const cancelledList = screen.getByRole("tabpanel", { name: "Đã hủy (1)" });
    expect(within(cancelledList).queryByRole("button", { name: /Hủy lịch .+/ })).not.toBeInTheDocument();
  });

  it("shows an error when appointment cancellation fails", async () => {
    const user = await signInAsPatient();
    vi.spyOn(appointmentService, "cancelAppointment").mockRejectedValueOnce(new Error("Request failed"));

    await user.click(within(screen.getByRole("navigation", { name: "Điều hướng chính" })).getByRole("link", { name: "Lịch của tôi" }));
    await user.click((await screen.findAllByRole("button", { name: /Hủy lịch .+/ }))[0]);

    expect(await screen.findByRole("alert")).toHaveTextContent("Không thể hủy lịch hẹn. Vui lòng thử lại.");
  });
});
