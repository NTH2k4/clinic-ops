import { afterEach, describe, expect, it, vi } from "vitest";
import { mockStore } from "../../mocks/mockStore";
import { appointmentService } from "./appointmentService";

const patientInput = {
  patientId: "patient-1",
  doctorId: "doctor-1",
  serviceId: "service-general-consult",
  startAt: "2026-08-25T15:00:00+07:00",
  actorUserId: "user-patient-1",
  reason: "Khám theo yêu cầu.",
};

const staffInput = {
  ...patientInput,
  patientId: "patient-2",
  startAt: "2026-08-25T15:30:00+07:00",
  actorUserId: "user-receptionist-1",
};

afterEach(() => {
  mockStore.reset();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

const apiAppointment = {
  id: "appointment-api-1",
  patientId: "patient-1",
  doctorId: "doctor-1",
  serviceId: "service-general-consult",
  startAt: "2026-08-25T08:00:00.000Z",
  endAt: "2026-08-25T08:30:00.000Z",
  status: "requested",
  reason: "Khám theo yêu cầu.",
  internalNote: null,
  cancellationReason: null,
  createdByUserId: "user-patient-1",
  updatedByUserId: null,
  checkedInAt: null,
  startedAt: null,
  completedAt: null,
  cancelledAt: null,
  createdAt: "2026-08-24T08:00:00.000Z",
  updatedAt: "2026-08-24T08:00:00.000Z",
};

function apiSuccess(data: unknown): Response {
  return new Response(JSON.stringify({ data, meta: { requestId: "req-appointment" } }), { status: 200 });
}

async function apiModeService(fetcher: typeof fetch) {
  vi.stubEnv("VITE_DATA_SOURCE", "api");
  vi.stubGlobal("fetch", fetcher);
  return (await import("./appointmentService")).appointmentService;
}

describe("appointmentService", () => {
  it("creates patient appointments as requested and records an audit event", async () => {
    const appointment = await appointmentService.createPatientAppointment(patientInput);

    expect(appointment).toMatchObject({
      status: "requested",
      endAt: "2026-08-25T15:30:00+07:00",
      createdByUserId: "user-patient-1",
    });
    expect(mockStore.auditEvents.at(-1)).toMatchObject({
      actorUserId: "user-patient-1",
      entityId: appointment.id,
      action: "appointment_created",
    });
  });

  it("creates staff appointments as confirmed", async () => {
    await expect(appointmentService.createStaffAppointment(staffInput)).resolves.toMatchObject({
      status: "confirmed",
      endAt: "2026-08-25T16:00:00+07:00",
    });
  });

  it("rejects a staff appointment that conflicts with an active doctor slot", async () => {
    await expect(
      appointmentService.createStaffAppointment({
        ...staffInput,
        startAt: "2026-08-25T09:15:00+07:00",
      }),
    ).rejects.toMatchObject({ code: "APPOINTMENT_CONFLICT" });
  });

  it("allows a new appointment over a terminal appointment slot", async () => {
    const completed = mockStore.appointments.find((appointment) => appointment.status === "completed");
    expect(completed).toBeDefined();

    await expect(
      appointmentService.createStaffAppointment({
        ...staffInput,
        doctorId: completed!.doctorId,
        serviceId: completed!.serviceId,
        startAt: completed!.startAt,
      }),
    ).resolves.toMatchObject({ status: "confirmed" });
  });

  it("updates a confirmed appointment to checked in and records an audit event", async () => {
    const confirmed = mockStore.appointments.find((appointment) => appointment.status === "confirmed");
    expect(confirmed).toBeDefined();

    await expect(
      appointmentService.updateAppointmentStatus(confirmed!.id, "checked_in", "user-receptionist-1"),
    ).resolves.toMatchObject({ status: "checked_in" });
    expect(mockStore.auditEvents.at(-1)).toMatchObject({
      actorUserId: "user-receptionist-1",
      entityId: confirmed!.id,
      action: "appointment_updated",
      metadata: { fromStatus: "confirmed", toStatus: "checked_in" },
    });
  });

  it("rejects transitions from a completed appointment", async () => {
    const completed = mockStore.appointments.find((appointment) => appointment.status === "completed");
    expect(completed).toBeDefined();

    await expect(
      appointmentService.updateAppointmentStatus(completed!.id, "in_progress", "user-doctor-1"),
    ).rejects.toMatchObject({ code: "INVALID_STATUS_TRANSITION" });
  });

  it.each(["completed", "cancelled", "no_show"] as const)(
    "rejects cancellation from %s appointments",
    async (status) => {
      const terminalAppointment = mockStore.appointments.find((appointment) => appointment.status === status);
      expect(terminalAppointment).toBeDefined();

      await expect(
        appointmentService.cancelAppointment(terminalAppointment!.id, { actorUserId: "user-receptionist-1" }),
      ).rejects.toMatchObject({ code: "INVALID_STATUS_TRANSITION" });
    },
  );

  it("rejects rescheduling a terminal appointment", async () => {
    const completed = mockStore.appointments.find((appointment) => appointment.status === "completed");
    expect(completed).toBeDefined();

    await expect(
      appointmentService.rescheduleAppointment(completed!.id, {
        startAt: "2026-08-25T15:00:00+07:00",
        actorUserId: "user-receptionist-1",
      }),
    ).rejects.toMatchObject({ code: "INVALID_STATUS_TRANSITION" });
  });

  it("reschedules with the same id, recalculates the end time, and records old and new times", async () => {
    const requested = mockStore.appointments.find((appointment) => appointment.status === "requested");
    expect(requested).toBeDefined();
    const oldStartAt = requested!.startAt;
    const oldEndAt = requested!.endAt;

    const rescheduled = await appointmentService.rescheduleAppointment(requested!.id, {
      startAt: "2026-08-25T15:00:00+07:00",
      actorUserId: "user-receptionist-1",
    });

    expect(rescheduled).toMatchObject({
      id: requested!.id,
      startAt: "2026-08-25T15:00:00+07:00",
      endAt: "2026-08-25T15:30:00+07:00",
    });
    expect(mockStore.auditEvents.at(-1)).toMatchObject({
      action: "appointment_rescheduled",
      metadata: {
        oldStartAt,
        oldEndAt,
        newStartAt: "2026-08-25T15:00:00+07:00",
        newEndAt: "2026-08-25T15:30:00+07:00",
      },
    });
  });

  it("cancels an appointment with the supplied reason and records an audit event", async () => {
    const requested = mockStore.appointments.find((appointment) => appointment.status === "requested");
    expect(requested).toBeDefined();

    const cancelled = await appointmentService.cancelAppointment(requested!.id, {
      actorUserId: "user-receptionist-1",
      cancellationReason: "Bệnh nhân đổi lịch.",
    });

    expect(cancelled).toMatchObject({
      status: "cancelled",
      cancellationReason: "Bệnh nhân đổi lịch.",
    });
    expect(cancelled.cancelledAt).toBeDefined();
    expect(mockStore.auditEvents.at(-1)).toMatchObject({
      action: "appointment_cancelled",
      actorUserId: "user-receptionist-1",
      entityId: requested!.id,
    });
  });

  it("returns a list snapshot that cannot mutate the store", async () => {
    const [appointment] = await appointmentService.listAppointments();
    const originalStatus = mockStore.appointments[0].status;

    appointment.status = "cancelled";

    expect(mockStore.appointments[0].status).toBe(originalStatus);
  });

  it("returns a create snapshot that cannot mutate the store", async () => {
    const created = await appointmentService.createPatientAppointment(patientInput);

    created.reason = "Thay đổi bên ngoài service";

    expect(mockStore.appointments.find((appointment) => appointment.id === created.id)?.reason).toBe(patientInput.reason);
  });

  it("returns an update snapshot that cannot mutate the store", async () => {
    const confirmed = mockStore.appointments.find((appointment) => appointment.status === "confirmed");
    expect(confirmed).toBeDefined();
    const updated = await appointmentService.updateAppointmentStatus(confirmed!.id, "checked_in", "user-receptionist-1");

    updated.status = "cancelled";

    expect(mockStore.appointments.find((appointment) => appointment.id === updated.id)?.status).toBe("checked_in");
  });

  it("returns a reschedule snapshot that cannot mutate the store", async () => {
    const requested = mockStore.appointments.find((appointment) => appointment.status === "requested");
    expect(requested).toBeDefined();
    const rescheduled = await appointmentService.rescheduleAppointment(requested!.id, {
      startAt: "2026-08-25T15:00:00+07:00",
      actorUserId: "user-receptionist-1",
    });

    rescheduled.startAt = "2026-08-25T16:00:00+07:00";

    expect(mockStore.appointments.find((appointment) => appointment.id === rescheduled.id)?.startAt)
      .toBe("2026-08-25T15:00:00+07:00");
  });

  it("returns a cancellation snapshot that cannot mutate the store", async () => {
    const requested = mockStore.appointments.find((appointment) => appointment.status === "requested");
    expect(requested).toBeDefined();
    const cancelled = await appointmentService.cancelAppointment(requested!.id, {
      actorUserId: "user-receptionist-1",
    });

    cancelled.cancelledAt = "2026-08-25T16:00:00+07:00";

    expect(mockStore.appointments.find((appointment) => appointment.id === cancelled.id)?.cancelledAt)
      .not.toBe("2026-08-25T16:00:00+07:00");
  });
});

describe("appointmentService in API mode", () => {
  it("creates a patient appointment without sending endAt or actorUserId", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(apiSuccess(apiAppointment));
    const service = await apiModeService(fetcher);

    await expect(service.createPatientAppointment({ ...patientInput, internalNote: "Do not expose this field" })).resolves.toMatchObject({
      id: "appointment-api-1",
      endAt: "2026-08-25T08:30:00.000Z",
      status: "requested",
    });

    expect(fetcher).toHaveBeenCalledWith("/api/v1/appointments", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({
        patientId: "patient-1",
        doctorId: "doctor-1",
        serviceId: "service-general-consult",
        startAt: "2026-08-25T15:00:00+07:00",
        reason: "Khám theo yêu cầu.",
      }),
    }));
  });

  it("creates a staff appointment and uses the backend confirmed status", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(apiSuccess({ ...apiAppointment, status: "confirmed" }));
    const service = await apiModeService(fetcher);

    await expect(service.createStaffAppointment(staffInput)).resolves.toMatchObject({ status: "confirmed" });
    expect(fetcher).toHaveBeenCalledWith("/api/v1/appointments", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({
        patientId: "patient-2",
        doctorId: "doctor-1",
        serviceId: "service-general-consult",
        startAt: "2026-08-25T15:30:00+07:00",
        reason: "Khám theo yêu cầu.",
      }),
    }));
  });

  it("surfaces backend appointment conflicts through the service error contract", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      error: { code: "APPOINTMENT_CONFLICT", message: "The doctor already has an active appointment during this slot." },
      meta: { requestId: "req-conflict" },
    }), { status: 409 }));
    const service = await apiModeService(fetcher);

    await expect(service.createPatientAppointment(patientInput)).rejects.toMatchObject({
      code: "APPOINTMENT_CONFLICT",
      message: "The doctor already has an active appointment during this slot.",
    });
  });

  it.each([
    ["confirmed", "confirm"],
    ["checked_in", "check-in"],
    ["in_progress", "start"],
    ["completed", "complete"],
    ["no_show", "no-show"],
  ] as const)("maps %s status updates to the %s endpoint", async (status, endpoint) => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(apiSuccess({ ...apiAppointment, status }));
    const service = await apiModeService(fetcher);

    await expect(service.updateAppointmentStatus("appointment-api-1", status, "user-staff-1"))
      .resolves.toMatchObject({ status });
    expect(fetcher).toHaveBeenCalledWith(`/api/v1/appointments/appointment-api-1/${endpoint}`, expect.objectContaining({
      method: "POST",
      body: "{}",
    }));
  });

  it("cancels through the dedicated endpoint", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(apiSuccess({ ...apiAppointment, status: "cancelled" }));
    const service = await apiModeService(fetcher);

    await service.cancelAppointment("appointment-api-1", {
      actorUserId: "user-staff-1",
      cancellationReason: "Bệnh nhân đổi lịch.",
    });

    expect(fetcher).toHaveBeenCalledWith("/api/v1/appointments/appointment-api-1/cancel", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ cancellationReason: "Bệnh nhân đổi lịch." }),
    }));
  });

  it("clears the in-memory API session and query cache after an unauthenticated response", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      error: { code: "UNAUTHENTICATED", message: "Authentication is required." },
      meta: { requestId: "req-unauthenticated" },
    }), { status: 401 }));
    const service = await apiModeService(fetcher);
    const { queryClient } = await import("../../lib/queryClient");
    const { getApiSessionToken, setApiSessionToken } = await import("../../lib/api/session");
    setApiSessionToken("appointment-session-token");
    queryClient.setQueryData(["appointments", "stale"], { value: "stale" });

    await expect(service.getAppointment("appointment-api-1")).rejects.toMatchObject({ code: "UNAUTHENTICATED" });

    expect(getApiSessionToken()).toBeNull();
    expect(queryClient.getQueryData(["appointments", "stale"])).toBeUndefined();
  });

  it("reschedules with PATCH and leaves endAt to the backend", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(apiSuccess({
      ...apiAppointment,
      startAt: "2026-08-26T09:00:00.000Z",
      endAt: "2026-08-26T09:30:00.000Z",
    }));
    const service = await apiModeService(fetcher);

    await expect(service.rescheduleAppointment("appointment-api-1", {
      startAt: "2026-08-26T16:00:00+07:00",
      doctorId: "doctor-2",
      actorUserId: "user-staff-1",
    })).resolves.toMatchObject({ endAt: "2026-08-26T09:30:00.000Z" });

    expect(fetcher).toHaveBeenCalledWith("/api/v1/appointments/appointment-api-1", expect.objectContaining({
      method: "PATCH",
      body: JSON.stringify({ startAt: "2026-08-26T16:00:00+07:00", doctorId: "doctor-2" }),
    }));
  });
});
