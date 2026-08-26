import type { Appointment, AppointmentStatus, UserRole } from "../../types/models";
import { ACTIVE_APPOINTMENT_STATUSES, VALID_NEXT_STATUSES, type TimeRange } from "./appointmentTypes";

export interface HasDoctorConflictInput {
  appointment: Pick<Appointment, "id" | "doctorId" | "startAt" | "endAt" | "status">;
  appointments: ReadonlyArray<Pick<Appointment, "id" | "doctorId" | "startAt" | "endAt" | "status">>;
}

export function isActiveAppointmentStatus(status: AppointmentStatus): boolean {
  return ACTIVE_APPOINTMENT_STATUSES.includes(status);
}

export function appointmentsOverlap(a: TimeRange, b: TimeRange): boolean {
  return new Date(a.startAt).getTime() < new Date(b.endAt).getTime()
    && new Date(b.startAt).getTime() < new Date(a.endAt).getTime();
}

export function hasDoctorConflict({ appointment, appointments }: HasDoctorConflictInput): boolean {
  if (!isActiveAppointmentStatus(appointment.status)) {
    return false;
  }

  return appointments.some(
    (existingAppointment) =>
      existingAppointment.id !== appointment.id
      && existingAppointment.doctorId === appointment.doctorId
      && isActiveAppointmentStatus(existingAppointment.status)
      && appointmentsOverlap(appointment, existingAppointment),
  );
}

export function getValidNextStatuses(status: AppointmentStatus): AppointmentStatus[] {
  return VALID_NEXT_STATUSES[status];
}

const rolesForTransition: Readonly<Record<AppointmentStatus, Readonly<Partial<Record<AppointmentStatus, readonly UserRole[]>>>>> = {
  requested: {
    confirmed: ["receptionist", "nurse", "admin"],
    cancelled: ["patient", "receptionist", "nurse", "admin"],
  },
  confirmed: {
    checked_in: ["receptionist", "nurse", "admin"],
    cancelled: ["patient", "receptionist", "nurse", "admin"],
    no_show: ["receptionist", "nurse", "admin"],
  },
  checked_in: {
    in_progress: ["doctor"],
    cancelled: ["receptionist", "nurse", "admin"],
  },
  in_progress: { completed: ["doctor"] },
  completed: {},
  cancelled: {},
  no_show: {},
};

export function canTransitionAppointment(status: AppointmentStatus, target: AppointmentStatus, role?: UserRole): boolean {
  return Boolean(role && rolesForTransition[status][target]?.includes(role));
}
