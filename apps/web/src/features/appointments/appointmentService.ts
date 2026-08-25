import { createId } from "../../lib/ids";
import { mockStore } from "../../mocks/mockStore";
import type { Appointment, AppointmentStatus, AuditEvent } from "../../types/models";
import { getValidNextStatuses, hasDoctorConflict } from "./appointmentRules";

export interface AppointmentFilters {
  patientId?: string;
  doctorId?: string;
  serviceId?: string;
  status?: AppointmentStatus;
  startAt?: string;
  endAt?: string;
}

interface CreateAppointmentInput {
  patientId: string;
  doctorId: string;
  serviceId: string;
  startAt: string;
  actorUserId: string;
  reason?: string;
  internalNote?: string;
}

export type CreatePatientAppointmentInput = CreateAppointmentInput;
export type CreateStaffAppointmentInput = CreateAppointmentInput;

export interface RescheduleAppointmentInput {
  startAt: string;
  actorUserId: string;
  doctorId?: string;
  serviceId?: string;
}

export interface CancelAppointmentInput {
  actorUserId: string;
  cancellationReason?: string;
}

export interface AppointmentServiceError extends Error {
  code: "APPOINTMENT_CONFLICT" | "INVALID_STATUS_TRANSITION" | "APPOINTMENT_NOT_FOUND" | "SERVICE_NOT_FOUND";
}

function serviceError(code: AppointmentServiceError["code"], message: string): AppointmentServiceError {
  return Object.assign(new Error(message), { code });
}

function now(): string {
  return new Date().toISOString();
}

function getServiceDuration(serviceId: string): number {
  const service = mockStore.services.find((candidate) => candidate.id === serviceId);

  if (!service) {
    throw serviceError("SERVICE_NOT_FOUND", "Không tìm thấy dịch vụ.");
  }

  return service.durationMinutes;
}

function addMinutes(startAt: string, durationMinutes: number): string {
  const timestamp = new Date(startAt).getTime() + durationMinutes * 60_000;
  const offset = startAt.match(/(Z|[+-]\d{2}:\d{2})$/)?.[1];

  if (!offset || offset === "Z") {
    return new Date(timestamp).toISOString();
  }

  const offsetMinutes = Number(offset.slice(0, 3)) * 60 + Number(offset.slice(4, 6)) * Math.sign(Number(offset.slice(0, 3)));
  const localDate = new Date(timestamp + offsetMinutes * 60_000);
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${localDate.getUTCFullYear()}-${pad(localDate.getUTCMonth() + 1)}-${pad(localDate.getUTCDate())}`
    + `T${pad(localDate.getUTCHours())}:${pad(localDate.getUTCMinutes())}:${pad(localDate.getUTCSeconds())}${offset}`;
}

function findAppointment(id: string): Appointment {
  const appointment = mockStore.appointments.find((candidate) => candidate.id === id);

  if (!appointment) {
    throw serviceError("APPOINTMENT_NOT_FOUND", "Không tìm thấy lịch hẹn.");
  }

  return appointment;
}

function assertNoDoctorConflict(appointment: Pick<Appointment, "id" | "doctorId" | "startAt" | "endAt" | "status">): void {
  if (hasDoctorConflict({ appointment, appointments: mockStore.appointments })) {
    throw serviceError("APPOINTMENT_CONFLICT", "Khung giờ của bác sĩ đã có lịch hẹn.");
  }
}

function writeAuditEvent(
  actorUserId: string,
  entityId: string,
  action: string,
  metadata?: Record<string, unknown>,
): void {
  const event: AuditEvent = {
    id: createId("audit-event"),
    actorUserId,
    entityType: "appointment",
    entityId,
    action,
    timestamp: now(),
    ...(metadata ? { metadata } : {}),
  };

  mockStore.auditEvents.push(event);
}

function createAppointment(input: CreateAppointmentInput, status: "requested" | "confirmed"): Appointment {
  const timestamp = now();
  const appointment: Appointment = {
    id: createId("appointment"),
    patientId: input.patientId,
    doctorId: input.doctorId,
    serviceId: input.serviceId,
    startAt: input.startAt,
    endAt: addMinutes(input.startAt, getServiceDuration(input.serviceId)),
    status,
    createdByUserId: input.actorUserId,
    updatedByUserId: input.actorUserId,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...(input.reason ? { reason: input.reason } : {}),
    ...(input.internalNote ? { internalNote: input.internalNote } : {}),
  };

  assertNoDoctorConflict(appointment);
  mockStore.appointments.push(appointment);
  writeAuditEvent(input.actorUserId, appointment.id, "appointment_created");

  return appointment;
}

export const appointmentService = {
  async listAppointments(filters?: AppointmentFilters): Promise<Appointment[]> {
    return mockStore.appointments.filter((appointment) =>
      (!filters?.patientId || appointment.patientId === filters.patientId)
      && (!filters?.doctorId || appointment.doctorId === filters.doctorId)
      && (!filters?.serviceId || appointment.serviceId === filters.serviceId)
      && (!filters?.status || appointment.status === filters.status)
      && (!filters?.startAt || appointment.startAt >= filters.startAt)
      && (!filters?.endAt || appointment.endAt <= filters.endAt),
    );
  },

  async createPatientAppointment(input: CreatePatientAppointmentInput): Promise<Appointment> {
    return createAppointment(input, "requested");
  },

  async createStaffAppointment(input: CreateStaffAppointmentInput): Promise<Appointment> {
    return createAppointment(input, "confirmed");
  },

  async updateAppointmentStatus(
    id: string,
    status: AppointmentStatus,
    actorUserId: string,
  ): Promise<Appointment> {
    const appointment = findAppointment(id);

    if (!getValidNextStatuses(appointment.status).includes(status)) {
      throw serviceError("INVALID_STATUS_TRANSITION", "Chuyển trạng thái lịch hẹn không hợp lệ.");
    }

    const fromStatus = appointment.status;
    const timestamp = now();
    Object.assign(appointment, {
      status,
      updatedByUserId: actorUserId,
      updatedAt: timestamp,
      ...(status === "checked_in" ? { checkedInAt: timestamp } : {}),
      ...(status === "in_progress" ? { startedAt: timestamp } : {}),
      ...(status === "completed" ? { completedAt: timestamp } : {}),
    });
    writeAuditEvent(actorUserId, id, "appointment_updated", { fromStatus, toStatus: status });

    return appointment;
  },

  async rescheduleAppointment(id: string, input: RescheduleAppointmentInput): Promise<Appointment> {
    const appointment = findAppointment(id);
    const serviceId = input.serviceId ?? appointment.serviceId;
    const candidate = {
      ...appointment,
      doctorId: input.doctorId ?? appointment.doctorId,
      serviceId,
      startAt: input.startAt,
      endAt: addMinutes(input.startAt, getServiceDuration(serviceId)),
    };

    assertNoDoctorConflict(candidate);
    const oldStartAt = appointment.startAt;
    const oldEndAt = appointment.endAt;
    Object.assign(appointment, candidate, {
      updatedByUserId: input.actorUserId,
      updatedAt: now(),
    });
    writeAuditEvent(input.actorUserId, id, "appointment_rescheduled", {
      oldStartAt,
      oldEndAt,
      newStartAt: appointment.startAt,
      newEndAt: appointment.endAt,
    });

    return appointment;
  },

  async cancelAppointment(id: string, input: CancelAppointmentInput): Promise<Appointment> {
    const appointment = findAppointment(id);
    const timestamp = now();
    Object.assign(appointment, {
      status: "cancelled",
      cancelledAt: timestamp,
      updatedByUserId: input.actorUserId,
      updatedAt: timestamp,
      ...(input.cancellationReason ? { cancellationReason: input.cancellationReason } : {}),
    });
    writeAuditEvent(input.actorUserId, id, "appointment_cancelled", {
      ...(input.cancellationReason ? { cancellationReason: input.cancellationReason } : {}),
    });

    return appointment;
  },
};
