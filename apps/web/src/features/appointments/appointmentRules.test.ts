import { describe, expect, it } from "vitest";
import {
  appointmentsOverlap,
  getValidNextStatuses,
  hasDoctorConflict,
  isActiveAppointmentStatus,
} from "./appointmentRules";
import { appointments } from "../../mocks/fixtures";

const requestedAppointment = {
  id: "appointment-requested",
  doctorId: "doctor-1",
  startAt: "2026-08-25T09:00:00+07:00",
  endAt: "2026-08-25T09:30:00+07:00",
  status: "requested" as const,
};

describe("appointment rules", () => {
  it("treats intersecting appointment ranges as overlapping", () => {
    expect(
      appointmentsOverlap(
        { startAt: "2026-08-25T09:00:00+07:00", endAt: "2026-08-25T09:30:00+07:00" },
        { startAt: "2026-08-25T09:15:00+07:00", endAt: "2026-08-25T09:45:00+07:00" },
      ),
    ).toBe(true);
  });

  it("allows appointments whose half-open ranges only touch", () => {
    expect(
      appointmentsOverlap(
        { startAt: "2026-08-25T09:00:00+07:00", endAt: "2026-08-25T09:30:00+07:00" },
        { startAt: "2026-08-25T09:30:00+07:00", endAt: "2026-08-25T10:00:00+07:00" },
      ),
    ).toBe(false);
  });

  it("identifies only slot-consuming statuses as active", () => {
    expect(isActiveAppointmentStatus("requested")).toBe(true);
    expect(isActiveAppointmentStatus("completed")).toBe(false);
  });

  it("returns valid status transitions", () => {
    expect(getValidNextStatuses("checked_in")).toEqual(["in_progress", "cancelled"]);
  });

  it("detects an overlapping active appointment for the same doctor", () => {
    expect(
      hasDoctorConflict({
        appointment: {
          ...requestedAppointment,
          id: "appointment-candidate",
          startAt: "2026-08-25T09:15:00+07:00",
          endAt: "2026-08-25T09:45:00+07:00",
        },
        appointments: [requestedAppointment],
      }),
    ).toBe(true);
  });

  it("does not report a conflict when the candidate no longer consumes a slot", () => {
    expect(
      hasDoctorConflict({
        appointment: {
          ...requestedAppointment,
          id: "appointment-completed-candidate",
          status: "completed",
        },
        appointments: [requestedAppointment],
      }),
    ).toBe(false);
  });

  it("ignores other doctors and terminal appointments when checking conflicts", () => {
    expect(
      hasDoctorConflict({
        appointment: {
          ...requestedAppointment,
          id: "appointment-candidate",
          startAt: "2026-08-25T09:15:00+07:00",
          endAt: "2026-08-25T09:45:00+07:00",
        },
        appointments: [
          { ...requestedAppointment, id: "appointment-other-doctor", doctorId: "doctor-2" },
          { ...requestedAppointment, id: "appointment-completed", status: "completed" },
        ],
      }),
    ).toBe(false);
  });

  it("keeps active appointments in the main fixture conflict-free per doctor", () => {
    const activeAppointments = appointments.filter((appointment) =>
      isActiveAppointmentStatus(appointment.status),
    );

    for (const appointment of activeAppointments) {
      expect(
        activeAppointments.some(
          (otherAppointment) =>
            otherAppointment.id !== appointment.id
            && otherAppointment.doctorId === appointment.doctorId
            && appointmentsOverlap(appointment, otherAppointment),
        ),
      ).toBe(false);
    }
  });
});
