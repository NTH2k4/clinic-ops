import { afterEach, describe, expect, it } from "vitest";
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
});

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
