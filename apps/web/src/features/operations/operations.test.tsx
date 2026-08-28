import userEvent from "@testing-library/user-event";
import { cleanup, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CreateAppointmentPage } from "./CreateAppointmentPage";
import { OperationsCalendar } from "./OperationsCalendar";
import { OperationsDashboard } from "./OperationsDashboard";
import { QueuePage } from "./QueuePage";
import { appointmentService } from "../appointments/appointmentService";
import { createSchedulingService } from "../scheduling/schedulingService";
import type { SchedulingApi } from "../../lib/api/scheduling";
import { mockStore } from "../../mocks/mockStore";
import { expectClinicDateField, setClinicDateDay } from "../../test/dateField";
import { renderWithProviders } from "../../test/render";
import { queryClient } from "../../lib/queryClient";

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

  it("only offers receptionist and nurse transitions accepted by the backend", () => {
    renderWithProviders(<QueuePage />);

    const waitingGroup = screen.getByRole("region", { name: "Đang chờ khám" });
    expect(within(waitingGroup).getAllByRole("button").every((button) => button.textContent === "Hủy lịch")).toBe(true);
    expect(within(waitingGroup).getAllByRole("button", { name: /Hủy lịch .+/ }).length).toBeGreaterThan(0);
    expect(within(waitingGroup).queryByRole("button", { name: "Bắt đầu khám" })).not.toBeInTheDocument();

    const inProgressGroup = screen.getByRole("region", { name: "Đang khám" });
    expect(within(inProgressGroup).queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows an error when a queue status update fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(appointmentService, "updateAppointmentStatus").mockRejectedValueOnce(new Error("Request failed"));
    renderWithProviders(<QueuePage />);

    const confirmedGroup = screen.getByRole("region", { name: "Đã xác nhận" });
    await user.click(within(confirmedGroup).getAllByRole("button", { name: "Check-in" })[0]);

    expect(await screen.findByRole("alert")).toHaveTextContent("Không thể cập nhật lịch hẹn. Vui lòng thử lại.");
  });

  it("shows an error when queue cancellation fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(appointmentService, "cancelAppointment").mockRejectedValueOnce(new Error("Request failed"));
    renderWithProviders(<QueuePage />);

    const confirmedGroup = screen.getByRole("region", { name: "Đã xác nhận" });
    await user.click(within(confirmedGroup).getAllByRole("button", { name: /Hủy lịch .+/ })[0]);
    await user.click(screen.getByRole("button", { name: "Hủy lịch" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Không thể hủy lịch hẹn. Vui lòng thử lại.");
  });

  it("shows queue lane descriptions and cancellation confirmation context", async () => {
    const user = userEvent.setup();
    renderWithProviders(<QueuePage />);

    const confirmedGroup = screen.getByRole("region", { name: "Đã xác nhận" });
    expect(within(confirmedGroup).getByText("Cần check-in khi bệnh nhân đến.")).toBeInTheDocument();
    expect(within(confirmedGroup).getByText(/lịch trong nhóm này/i)).toBeInTheDocument();

    await user.click(within(confirmedGroup).getAllByRole("button", { name: /Hủy lịch .+/ })[0]);

    expect(screen.getByRole("dialog", { name: "Xác nhận hủy lịch hẹn" })).toBeInTheDocument();
    expect(screen.getByText(/Thao tác này sẽ chuyển lịch hẹn sang trạng thái đã hủy/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Giữ lịch" })).toBeInTheDocument();
  });

  it("finds a patient before creating an appointment", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateAppointmentPage />);

    await user.type(screen.getByLabelText("Tìm patient"), "Nguyễn");
    expect(screen.getByText(/Nguyễn/i)).toBeInTheDocument();
  });

  it("groups the staff appointment form into clear operational sections", () => {
    renderWithProviders(<CreateAppointmentPage />);

    expect(screen.getByRole("group", { name: "1. Chọn bệnh nhân" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "2. Chọn dịch vụ và bác sĩ" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "3. Chọn thời gian" })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Xem lại trước khi tạo" })).toBeInTheDocument();
  });

  it("creates a confirmed appointment for staff", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateAppointmentPage />);
    const staleAppointmentKey = ["appointments", "list", { doctorId: "cached-doctor" }] as const;
    queryClient.setQueryData(staleAppointmentKey, []);

    await user.type(screen.getByLabelText("Tìm patient"), "Nguyễn");
    await user.click(screen.getByRole("button", { name: /Nguyen Minh Anh/i }));
    await user.selectOptions(screen.getByLabelText("Dịch vụ"), "service-cardiology-consult");
    await user.selectOptions(screen.getByLabelText("Bác sĩ"), "doctor-2");
    expectClinicDateField("Ngày khám", { day: 26, month: 8, year: 2026 });
    await user.selectOptions(screen.getByLabelText("Giờ khám"), "09:00");
    await user.click(screen.getByRole("button", { name: "Tạo lịch hẹn" }));
    expect(screen.getByText("Đã xác nhận")).toBeInTheDocument();
    expect(mockStore.appointments.at(-1)?.status).toBe("confirmed");
    expect(queryClient.getQueryState(staleAppointmentKey)?.isInvalidated).toBe(true);
  });

  it("does not offer staff booking slots outside the doctor's working schedule", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateAppointmentPage />);

    await user.selectOptions(screen.getByLabelText("Dịch vụ"), "service-cardiology-consult");
    await user.selectOptions(screen.getByLabelText("Bác sĩ"), "doctor-2");
    await setClinicDateDay(user, "Ngày khám", 30);

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
    await user.click(screen.getByRole("button", { name: "Tạo lịch hẹn" }));
    await user.click(screen.getByRole("button", { name: "Tạo lịch hẹn" }));

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
    await setClinicDateDay(user, "Ngày khám", 25);
    expect(within(screen.getByLabelText("Giờ khám")).getByRole("option", { name: "08:00" })).toBeDisabled();
  });

  it("shows API-mode unavailable staff booking slots disabled with their scheduling reason", async () => {
    const user = userEvent.setup();
    const availabilityQueryOptions = vi.fn(() => ({
      queryKey: ["scheduling", "availability", "test"],
      queryFn: vi.fn().mockResolvedValue({
        data: [
          {
            doctorId: "doctor-1",
            serviceId: "service-general",
            startAt: "2026-08-26T02:00:00.000Z",
            endAt: "2026-08-26T02:30:00.000Z",
            availabilityStatus: "unavailable",
            reasonCode: "blocked",
            reasonLabel: "Bác sĩ bị chặn lịch",
          },
          {
            doctorId: "doctor-1",
            serviceId: "service-general",
            startAt: "2026-08-26T02:30:00.000Z",
            endAt: "2026-08-26T03:00:00.000Z",
            availabilityStatus: "available",
            reasonCode: "available",
            reasonLabel: "Còn trống",
          },
        ],
        meta: { requestId: "test", page: 1, pageSize: 100, total: 2 },
      }),
    }));
    vi.resetModules();
    vi.doMock("../../lib/dataSource", () => ({
      apiBaseUrl: "/api/v1",
      dataSource: "api",
      isApiMode: true,
    }));
    vi.doMock("../catalog/catalogService", () => ({
      catalogQueryOptions: {
        allServices: vi.fn(() => ({
          queryKey: ["catalog", "services", "test"],
          queryFn: vi.fn(),
          initialData: {
            data: [{ id: "service-general", name: "Khám tổng quát", durationMinutes: 30 }],
            meta: { requestId: "test", page: 1, pageSize: 20, total: 1 },
          },
        })),
        allDoctors: vi.fn(() => ({
          queryKey: ["catalog", "doctors", "test"],
          queryFn: vi.fn(),
          initialData: {
            data: [{ id: "doctor-1", fullName: "BS. Tran Quang Huy", status: "active", serviceIds: ["service-general"] }],
            meta: { requestId: "test", page: 1, pageSize: 20, total: 1 },
          },
        })),
      },
    }));
    vi.doMock("../patients/patientService", () => ({
      patientQueryOptions: {
        list: vi.fn(() => ({
          queryKey: ["patients", "test"],
          queryFn: vi.fn(),
          initialData: {
            data: [],
            meta: { requestId: "test", page: 1, pageSize: 100, total: 0 },
          },
        })),
      },
      patientService: { createPatient: vi.fn() },
    }));
    vi.doMock("../scheduling/schedulingService", () => ({
      schedulingQueryOptions: {
        availability: availabilityQueryOptions,
      },
    }));
    try {
      const [{ CreateAppointmentPage: ApiCreateAppointmentPage }, { renderWithProviders: renderApiWithProviders }] = await Promise.all([
        import("./CreateAppointmentPage"),
        import("../../test/render"),
      ]);

      renderApiWithProviders(<ApiCreateAppointmentPage />);
      await user.selectOptions(screen.getByLabelText("Dịch vụ"), "service-general");
      await user.selectOptions(screen.getByLabelText("Bác sĩ"), "doctor-1");

      const timeSelect = screen.getByLabelText("Giờ khám");
      expect(availabilityQueryOptions).toHaveBeenLastCalledWith({
        serviceId: "service-general",
        doctorId: "doctor-1",
        date: "2026-08-26",
        includeUnavailable: true,
        page: 1,
        pageSize: 100,
      });
      await waitFor(() => expect(within(timeSelect).getByRole("option", { name: "09:00 - Bác sĩ bị chặn lịch" })).toBeDisabled());
      expect(within(timeSelect).getByRole("option", { name: "09:30" })).toBeEnabled();
    } finally {
      vi.doUnmock("../../lib/dataSource");
      vi.doUnmock("../catalog/catalogService");
      vi.doUnmock("../patients/patientService");
      vi.doUnmock("../scheduling/schedulingService");
    }
  });

  it("surfaces API-mode unavailable slot reasons from the scheduling boundary", async () => {
    const api: SchedulingApi = {
      listSchedules: vi.fn(),
      createSchedule: vi.fn(),
      updateSchedule: vi.fn(),
      deactivateSchedule: vi.fn(),
      listAvailability: vi.fn().mockResolvedValue({
        data: [{
          doctorId: "doctor-1",
          serviceId: "service-general",
          startAt: "2026-08-25T09:00:00+07:00",
          endAt: "2026-08-25T09:30:00+07:00",
          availabilityStatus: "unavailable",
          reasonCode: "blocked",
          reasonLabel: "Bác sĩ bị chặn lịch",
        }],
        meta: { requestId: "test", page: 1, pageSize: 50, total: 1 },
      }),
    };
    const service = createSchedulingService({ source: "api", api });

    const response = await service.listAvailability({
      serviceId: "service-general",
      doctorId: "doctor-1",
      date: "2026-08-25",
      includeUnavailable: true,
    });

    expect(response.data[0]).toMatchObject({
      availabilityStatus: "unavailable",
      reasonCode: "blocked",
      reasonLabel: "Bác sĩ bị chặn lịch",
    });
  });

  it("keeps mock explanation mode aligned with the backend doctor requirement", async () => {
    const service = createSchedulingService({ source: "mock" });

    await expect(service.listAvailability({
      serviceId: "service-general",
      date: "2026-08-25",
      includeUnavailable: true,
    })).rejects.toThrow("doctorId is required when includeUnavailable is true.");
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

  it("summarizes and resets operations calendar filters", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OperationsCalendar />);

    expect(screen.getByRole("group", { name: "Bộ lọc lịch hoạt động" })).toBeInTheDocument();
    expect(screen.getByText(/Đang hiển thị \d+ lịch hẹn/)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Chuyên khoa"), "specialty-cardiology");
    expect(screen.getByText(/Chuyên khoa: Tim mạch/)).toBeInTheDocument();
    await setClinicDateDay(user, "Ngày", 26);
    expectClinicDateField("Ngày", { day: 26, month: 8, year: 2026 });
    expect(screen.getByText("Ngày: 26/08/2026")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Xóa bộ lọc" }));
    expect(screen.getByLabelText("Chuyên khoa")).toHaveValue("");
    expectClinicDateField("Ngày", { day: 25, month: 8, year: 2026 });
    expect(screen.queryByText(/Chuyên khoa: Tim mạch/)).not.toBeInTheDocument();
    expect(screen.queryByText("Ngày: 26/08/2026")).not.toBeInTheDocument();
  });

  it("clears individual operations calendar filter chips without resetting the rest", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OperationsCalendar />);

    await setClinicDateDay(user, "Ngày", 26);
    await user.selectOptions(screen.getByLabelText("Chuyên khoa"), "specialty-cardiology");
    await user.selectOptions(screen.getByLabelText("Trạng thái"), "confirmed");

    await user.click(screen.getByRole("button", { name: "Xóa filter Chuyên khoa" }));
    expect(screen.getByLabelText("Chuyên khoa")).toHaveValue("");
    expect(screen.queryByText(/Chuyên khoa: Tim mạch/)).not.toBeInTheDocument();
    expect(screen.getByText("Ngày: 26/08/2026")).toBeInTheDocument();
    expect(screen.getByText("Trạng thái: Đã xác nhận")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Xóa filter Ngày" }));
    expect(screen.queryByText("Ngày: 26/08/2026")).not.toBeInTheDocument();
    expect(screen.getByText("Trạng thái: Đã xác nhận")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Xóa filter Trạng thái" }));
    expect(screen.getByLabelText("Trạng thái")).toHaveValue("");
    expect(screen.queryByText("Trạng thái: Đã xác nhận")).not.toBeInTheDocument();
  });

  it("shows today counts and a waiting queue on the dashboard", () => {
    renderWithProviders(<OperationsDashboard />);

    expect(screen.getByText("Lịch hẹn hôm nay")).toBeInTheDocument();
    expect(screen.getByText("Hàng đợi chờ xử lý")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tạo lịch hẹn" })).toBeInTheDocument();
  });
});
