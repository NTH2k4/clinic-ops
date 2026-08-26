import userEvent from "@testing-library/user-event";
import { cleanup, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

function emptyListResponse() {
  return new Response(JSON.stringify({
    data: [],
    meta: { requestId: "req-list", page: 1, pageSize: 100, total: 0 },
  }), { status: 200 });
}

const apiPatient = {
  id: "patient-1",
  userId: "user-patient-1",
  fullName: "API Patient",
  phone: "0900000000",
  email: "patient@example.test",
  dateOfBirth: "1990-01-01",
  gender: "female",
  address: null,
  notes: null,
  status: "active",
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
};

const apiAppointment = {
  id: "appointment-api-1",
  patientId: "patient-1",
  doctorId: "doctor-1",
  serviceId: "service-general-consult",
  startAt: "2026-08-25T08:00:00+07:00",
  endAt: "2026-08-25T08:30:00+07:00",
  status: "confirmed",
  reason: "API appointment",
  internalNote: null,
  cancellationReason: null,
  createdByUserId: "user-receptionist-1",
  updatedByUserId: null,
  checkedInAt: null,
  startedAt: null,
  completedAt: null,
  cancelledAt: null,
  createdAt: "2026-08-24T00:00:00.000Z",
  updatedAt: "2026-08-24T00:00:00.000Z",
  patient: apiPatient,
  statusHistory: [],
};

function appointmentListResponse() {
  return new Response(JSON.stringify({
    data: [apiAppointment],
    meta: { requestId: "req-appointments", page: 1, pageSize: 100, total: 1 },
  }), { status: 200 });
}

async function prepareApiMode(fetcher = vi.fn<typeof fetch>().mockResolvedValue(emptyListResponse())) {
  vi.resetModules();
  vi.stubEnv("VITE_DATA_SOURCE", "api");
  vi.stubGlobal("fetch", fetcher);
  return import("../../test/render");
}

describe("API appointment workflows", () => {
  it("exposes the patient booking workflow", async () => {
    const { renderWithProviders } = await prepareApiMode();
    const { BookAppointmentPage } = await import("../patients/BookAppointmentPage");

    renderWithProviders(<BookAppointmentPage />);

    expect(screen.getByRole("heading", { name: "Đặt lịch" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gửi yêu cầu" })).toBeInTheDocument();
  });

  it("exposes the staff appointment creation workflow", async () => {
    const { renderWithProviders } = await prepareApiMode();
    const { CreateAppointmentPage } = await import("../operations/CreateAppointmentPage");

    renderWithProviders(<CreateAppointmentPage />);

    expect(screen.getByRole("heading", { name: "Tạo appointment" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tạo appointment" })).toBeInTheDocument();
  });

  it("exposes queue mutation controls for API appointments", async () => {
    const fetcher = vi.fn<typeof fetch>(async (input) => String(input).includes("/appointments")
      ? appointmentListResponse()
      : emptyListResponse());
    const { renderWithProviders } = await prepareApiMode(fetcher);
    const { QueuePage } = await import("../operations/QueuePage");

    renderWithProviders(<QueuePage />);

    expect(screen.getByRole("heading", { name: "Hàng đợi khám" })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Check-in" })).toBeEnabled();
  });

  it("renders API appointments and embedded patients in the operations calendar", async () => {
    const fetcher = vi.fn<typeof fetch>(async (input) => String(input).includes("/appointments")
      ? appointmentListResponse()
      : emptyListResponse());
    const { renderWithProviders } = await prepareApiMode(fetcher);
    const { OperationsCalendar } = await import("../operations/OperationsCalendar");

    renderWithProviders(<OperationsCalendar />);

    expect(await screen.findByRole("cell", { name: "API Patient" })).toBeInTheDocument();
    expect(screen.queryByText("Nguyen Minh Anh")).not.toBeInTheDocument();
  });

  it("renders API appointments and embedded patients in the doctor dashboard", async () => {
    const fetcher = vi.fn<typeof fetch>(async (input) => String(input).includes("/appointments")
      ? appointmentListResponse()
      : emptyListResponse());
    const { renderWithProviders } = await prepareApiMode(fetcher);
    const { DoctorDashboard } = await import("../doctors/DoctorDashboard");

    renderWithProviders(<DoctorDashboard />);

    expect(await screen.findByText("API Patient")).toBeInTheDocument();
    expect(screen.queryByText("Nguyen Minh Anh")).not.toBeInTheDocument();
  });

  it("offers doctor transitions without requesting the admin-only audit endpoint", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(emptyListResponse());
    const { renderWithProviders } = await prepareApiMode(fetcher);
    const { DetailDrawer } = await import("../../components/DetailDrawer");
    const { mockStore } = await import("../../mocks/mockStore");
    const appointment = mockStore.appointments.find((candidate) => candidate.status === "checked_in");
    if (!appointment) throw new Error("Missing checked-in appointment fixture");

    renderWithProviders(
      <DetailDrawer
        actorRole="doctor"
        actorUserId="user-doctor-1"
        appointment={appointment}
        onClose={() => undefined}
        onUpdated={() => undefined}
      />,
    );

    expect(screen.getByRole("button", { name: /Start appointment/i })).toBeEnabled();
    expect(screen.queryByText("Cập nhật lịch hẹn qua API chưa khả dụng.")).not.toBeInTheDocument();
    await waitFor(() => expect(fetcher).toHaveBeenCalled());
    expect(fetcher.mock.calls.some(([url]) => String(url).includes("/audit-events"))).toBe(false);
  });

  it("shows API notifications on the patient home", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_DATA_SOURCE", "api");
    vi.stubGlobal("fetch", vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url.endsWith("/auth/login")) {
        return new Response(JSON.stringify({
          data: {
            sessionToken: "api-session-token",
            currentUser: {
              id: "user-patient-1",
              displayName: "API Patient",
              email: "patient@example.test",
              role: "patient",
              status: "active",
            },
            linkedProfile: { type: "patient", id: "patient-1" },
          },
          meta: { requestId: "req-login" },
        }), { status: 200 });
      }
      if (url.includes("/notifications")) {
        return new Response(JSON.stringify({
          data: [{
            id: "notification-api-1",
            recipientUserId: "user-patient-1",
            type: "appointment_confirmed",
            title: "API patient notification",
            message: "Your appointment was confirmed.",
            referenceType: "appointment",
            referenceId: "appointment-api-1",
            readAt: null,
            createdAt: "2026-08-24T02:00:00.000Z",
          }],
          meta: { requestId: "req-notifications", page: 1, pageSize: 100, total: 1 },
        }), { status: 200 });
      }
      if (url.includes("/patients/patient-1")) {
        return new Response(JSON.stringify({ data: apiPatient, meta: { requestId: "req-patient" } }), { status: 200 });
      }
      return emptyListResponse();
    }));
    const { renderWithProviders } = await import("../../test/render");
    const { App } = await import("../../app/App");
    const user = userEvent.setup();

    renderWithProviders(<App />);
    await user.type(screen.getByLabelText("Email"), "patient@example.test");
    await user.type(screen.getByLabelText("Mật khẩu"), "secret");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));

    expect(await screen.findByText("API patient notification")).toBeInTheDocument();
    expect(screen.getByText("Your appointment was confirmed.")).toBeInTheDocument();
  });

  it("enables patient appointment cancellation", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_DATA_SOURCE", "api");
    vi.stubGlobal("fetch", vi.fn<typeof fetch>(async (input) => {
      if (String(input).endsWith("/auth/login")) {
        return new Response(JSON.stringify({
          data: {
            sessionToken: "api-session-token",
            currentUser: {
              id: "user-patient-1",
              displayName: "API Patient",
              email: "patient@example.test",
              role: "patient",
              status: "active",
            },
            linkedProfile: { type: "patient", id: "patient-1" },
          },
          meta: { requestId: "req-login" },
        }), { status: 200 });
      }

      if (String(input).includes("/appointments")) return appointmentListResponse();
      return emptyListResponse();
    }));
    const { renderWithProviders } = await import("../../test/render");
    const { App } = await import("../../app/App");
    const user = userEvent.setup();

    renderWithProviders(<App />);
    await user.type(screen.getByLabelText("Email"), "patient@example.test");
    await user.type(screen.getByLabelText("Mật khẩu"), "secret");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));
    const appointmentLinks = await screen.findAllByRole("link", { name: "Lịch của tôi" });
    await user.click(appointmentLinks[0]);

    const cancelButtons = await screen.findAllByRole("button", { name: /Hủy lịch/i });
    expect(cancelButtons.length).toBeGreaterThan(0);
    cancelButtons.forEach((button) => expect(button).toBeEnabled());
    expect(screen.queryByText("Hủy lịch qua API chưa khả dụng.")).not.toBeInTheDocument();
  });
});
