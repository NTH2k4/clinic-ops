import userEvent from "@testing-library/user-event";
import { cleanup, screen } from "@testing-library/react";
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

async function prepareApiMode() {
  vi.resetModules();
  vi.stubEnv("VITE_DATA_SOURCE", "api");
  vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(emptyListResponse()));
  return import("../../test/render");
}

describe("API appointment workflow guards", () => {
  it("does not expose the patient booking workflow before Task 4", async () => {
    const { renderWithProviders } = await prepareApiMode();
    const { BookAppointmentPage } = await import("../patients/BookAppointmentPage");

    renderWithProviders(<BookAppointmentPage />);

    expect(screen.getByRole("heading", { name: "Đặt lịch chưa khả dụng" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Gửi yêu cầu" })).not.toBeInTheDocument();
  });

  it("does not expose the staff appointment creation workflow before Task 4", async () => {
    const { renderWithProviders } = await prepareApiMode();
    const { CreateAppointmentPage } = await import("../operations/CreateAppointmentPage");

    renderWithProviders(<CreateAppointmentPage />);

    expect(screen.getByRole("heading", { name: "Tạo lịch hẹn chưa khả dụng" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tạo appointment" })).not.toBeInTheDocument();
  });

  it("does not expose queue mutation controls before Task 4", async () => {
    const { renderWithProviders } = await prepareApiMode();
    const { QueuePage } = await import("../operations/QueuePage");

    renderWithProviders(<QueuePage />);

    expect(screen.getByRole("heading", { name: "Hàng đợi chưa khả dụng" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Check-in" })).not.toBeInTheDocument();
  });

  it("disables appointment status changes in the detail drawer before Task 4", async () => {
    const { renderWithProviders } = await prepareApiMode();
    const { DetailDrawer } = await import("../../components/DetailDrawer");
    const { mockStore } = await import("../../mocks/mockStore");
    const appointment = mockStore.appointments.find((candidate) => candidate.status === "checked_in");
    if (!appointment) throw new Error("Missing checked-in appointment fixture");

    renderWithProviders(
      <DetailDrawer
        actorUserId="user-doctor-1"
        appointment={appointment}
        onClose={() => undefined}
        onUpdated={() => undefined}
      />,
    );

    expect(screen.getByRole("button", { name: /Start appointment/i })).toBeDisabled();
    expect(screen.getByText("Cập nhật lịch hẹn qua API chưa khả dụng.")).toBeInTheDocument();
  });

  it("disables patient appointment cancellation before Task 4", async () => {
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
    cancelButtons.forEach((button) => expect(button).toBeDisabled());
    expect(screen.getByText("Hủy lịch qua API chưa khả dụng.")).toBeInTheDocument();
  });
});
