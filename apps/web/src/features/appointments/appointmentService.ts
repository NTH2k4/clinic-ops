import { ApiClientError } from "../../lib/api/errors";
import { createApiHttpClient } from "../../lib/api/http";
import { mapAppointment } from "../../lib/api/mappers";
import { createAppointmentsApi } from "../../lib/api/appointments";
import type { AppointmentCreateInput as ApiAppointmentCreateInput, AppointmentListFilters, AppointmentsApi, AppointmentTransition, AppointmentUpdateInput } from "../../lib/api/appointments";
import { clearApiSession, getApiSessionToken } from "../../lib/api/session";
import { apiBaseUrl, dataSource } from "../../lib/dataSource";
import { createId } from "../../lib/ids";
import { mockStore } from "../../mocks/mockStore";
import type { Appointment, AppointmentStatus, AuditEvent, Patient } from "../../types/models";
import { getValidNextStatuses, hasDoctorConflict, isActiveAppointmentStatus } from "./appointmentRules";

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
  doctorId?: string;
  serviceId: string;
  startAt: string;
  actorUserId: string;
  reason?: string;
  internalNote?: string;
  source?: "patient_portal" | "staff_portal" | "operations";
}

export type CreatePatientAppointmentInput = CreateAppointmentInput;
export type CreateStaffAppointmentInput = CreateAppointmentInput & { doctorId: string };

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
  code: string;
  requestId?: string;
  fields?: Record<string, string[]>;
  status?: number;
}

export interface AppointmentService {
  listAppointments(filters?: AppointmentFilters): Promise<Appointment[]>;
  getAppointment(id: string): Promise<Appointment>;
  createPatientAppointment(input: CreatePatientAppointmentInput): Promise<Appointment>;
  createStaffAppointment(input: CreateStaffAppointmentInput): Promise<Appointment>;
  updateAppointmentStatus(id: string, status: AppointmentStatus, actorUserId: string): Promise<Appointment>;
  rescheduleAppointment(id: string, input: RescheduleAppointmentInput): Promise<Appointment>;
  cancelAppointment(id: string, input: CancelAppointmentInput): Promise<Appointment>;
}

export interface AppointmentServiceOptions {
  source: "mock" | "api";
  api?: AppointmentsApi;
  fetcher?: typeof fetch;
}

function serviceError(code: string, message: string, cause?: ApiClientError): AppointmentServiceError {
  return Object.assign(new Error(message), {
    code,
    ...(cause?.requestId ? { requestId: cause.requestId } : {}),
    ...(cause?.fields ? { fields: cause.fields } : {}),
    ...(cause?.status ? { status: cause.status } : {}),
  });
}

function mapApiError(error: unknown): never {
  if (error instanceof ApiClientError) {
    const code = error.code === "NOT_FOUND" ? "APPOINTMENT_NOT_FOUND" : error.code;
    throw serviceError(code, error.message, error);
  }
  throw error;
}

async function fromApi<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    return mapApiError(error);
  }
}

function defaultApi(fetcher?: typeof fetch): AppointmentsApi {
  const client = createApiHttpClient({ baseUrl: apiBaseUrl, getToken: getApiSessionToken, onUnauthenticated: clearApiSession, fetcher });
  return createAppointmentsApi(client.request, client.requestEnvelope);
}

function now(): string {
  return new Date().toISOString();
}

function snapshot(appointment: Appointment): Appointment {
  return structuredClone(appointment);
}

function getServiceDuration(serviceId: string): number {
  const service = mockStore.services.find((candidate) => candidate.id === serviceId);
  if (!service) throw serviceError("SERVICE_NOT_FOUND", "Không tìm thấy dịch vụ.");
  return service.durationMinutes;
}

function addMinutes(startAt: string, durationMinutes: number): string {
  const timestamp = new Date(startAt).getTime() + durationMinutes * 60_000;
  const offset = startAt.match(/(Z|[+-]\d{2}:\d{2})$/)?.[1];
  if (!offset || offset === "Z") return new Date(timestamp).toISOString();

  const offsetMinutes = Number(offset.slice(0, 3)) * 60 + Number(offset.slice(4, 6)) * Math.sign(Number(offset.slice(0, 3)));
  const localDate = new Date(timestamp + offsetMinutes * 60_000);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${localDate.getUTCFullYear()}-${pad(localDate.getUTCMonth() + 1)}-${pad(localDate.getUTCDate())}`
    + `T${pad(localDate.getUTCHours())}:${pad(localDate.getUTCMinutes())}:${pad(localDate.getUTCSeconds())}${offset}`;
}

function findAppointment(id: string): Appointment {
  const appointment = mockStore.appointments.find((candidate) => candidate.id === id);
  if (!appointment) throw serviceError("APPOINTMENT_NOT_FOUND", "Không tìm thấy lịch hẹn.");
  return appointment;
}

function assertNoDoctorConflict(appointment: Pick<Appointment, "id" | "doctorId" | "startAt" | "endAt" | "status">): void {
  if (hasDoctorConflict({ appointment, appointments: mockStore.appointments })) {
    throw serviceError("APPOINTMENT_CONFLICT", "Khung giờ của bác sĩ đã có lịch hẹn.");
  }
}

function writeAuditEvent(actorUserId: string, entityId: string, action: string, metadata?: Record<string, unknown>): void {
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

function createMockAppointment(input: CreateAppointmentInput, status: "requested" | "confirmed"): Appointment {
  if (!input.doctorId) throw serviceError("DOCTOR_NOT_FOUND", "Không tìm thấy bác sĩ.");
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
  return snapshot(appointment);
}

function listMockAppointments(filters: AppointmentFilters = {}): Appointment[] {
  return mockStore.appointments
    .filter((appointment) =>
      (!filters.patientId || appointment.patientId === filters.patientId)
      && (!filters.doctorId || appointment.doctorId === filters.doctorId)
      && (!filters.serviceId || appointment.serviceId === filters.serviceId)
      && (!filters.status || appointment.status === filters.status)
      && (!filters.startAt || appointment.startAt >= filters.startAt)
      && (!filters.endAt || appointment.endAt <= filters.endAt))
    .map(snapshot);
}

function apiListFilters(filters: AppointmentFilters, page: number): AppointmentListFilters {
  return {
    patientId: filters.patientId,
    doctorId: filters.doctorId,
    serviceId: filters.serviceId,
    status: filters.status,
    from: filters.startAt,
    to: filters.endAt,
    page,
    pageSize: 100,
  };
}

function apiCreateInput(input: CreateAppointmentInput, includeInternalNote: boolean): ApiAppointmentCreateInput {
  return {
    patientId: input.patientId,
    doctorId: input.doctorId,
    serviceId: input.serviceId,
    startAt: input.startAt,
    reason: input.reason,
    source: input.source,
    ...(includeInternalNote ? { internalNote: input.internalNote } : {}),
  };
}

function apiRescheduleInput(input: RescheduleAppointmentInput): AppointmentUpdateInput {
  return {
    startAt: input.startAt,
    doctorId: input.doctorId,
    serviceId: input.serviceId,
  };
}

const transitionForStatus: Partial<Record<AppointmentStatus, AppointmentTransition>> = {
  confirmed: "confirm",
  checked_in: "check-in",
  in_progress: "start",
  completed: "complete",
  no_show: "no-show",
};

export function createAppointmentService(options: AppointmentServiceOptions): AppointmentService {
  const api = options.source === "api" ? (options.api ?? defaultApi(options.fetcher)) : undefined;

  return {
    async listAppointments(filters = {}) {
      if (!api) return listMockAppointments(filters);
      const appointments: Appointment[] = [];
      let page = 1;
      let total = 0;
      do {
        const response = await fromApi(() => api.listAppointments(apiListFilters(filters, page)));
        appointments.push(...response.data.map(mapAppointment));
        total = response.meta.total;
        if (response.data.length === 0 && appointments.length < total) {
          throw new Error("Appointment pagination ended before the reported total was loaded.");
        }
        page += 1;
      } while (appointments.length < total);
      return appointments;
    },
    async getAppointment(id) {
      if (!api) return snapshot(findAppointment(id));
      return mapAppointment(await fromApi(() => api.getAppointment(id)));
    },
    async createPatientAppointment(input) {
      if (!api) return createMockAppointment(input, "requested");
      return mapAppointment(await fromApi(() => api.createAppointment(apiCreateInput(input, false))));
    },
    async createStaffAppointment(input) {
      if (!api) return createMockAppointment(input, "confirmed");
      return mapAppointment(await fromApi(() => api.createAppointment(apiCreateInput(input, true))));
    },
    async updateAppointmentStatus(id, status, actorUserId) {
      if (api) {
        const transition = transitionForStatus[status];
        if (!transition) throw serviceError("INVALID_STATUS_TRANSITION", "Chuyển trạng thái lịch hẹn không hợp lệ.");
        return mapAppointment(await fromApi(() => api.transitionAppointment(id, transition)));
      }

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
      return snapshot(appointment);
    },
    async rescheduleAppointment(id, input) {
      if (api) {
        return mapAppointment(await fromApi(() => api.updateAppointment(id, apiRescheduleInput(input))));
      }

      const appointment = findAppointment(id);
      if (!isActiveAppointmentStatus(appointment.status)) {
        throw serviceError("INVALID_STATUS_TRANSITION", "Không thể đổi lịch hẹn đã kết thúc.");
      }
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
      Object.assign(appointment, candidate, { updatedByUserId: input.actorUserId, updatedAt: now() });
      writeAuditEvent(input.actorUserId, id, "appointment_rescheduled", {
        oldStartAt,
        oldEndAt,
        newStartAt: appointment.startAt,
        newEndAt: appointment.endAt,
      });
      return snapshot(appointment);
    },
    async cancelAppointment(id, input) {
      if (api) {
        return mapAppointment(await fromApi(() => api.transitionAppointment(id, "cancel", {
          cancellationReason: input.cancellationReason,
        })));
      }

      const appointment = findAppointment(id);
      if (!getValidNextStatuses(appointment.status).includes("cancelled")) {
        throw serviceError("INVALID_STATUS_TRANSITION", "Chuyển trạng thái lịch hẹn không hợp lệ.");
      }
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
      return snapshot(appointment);
    },
  };
}

export const appointmentService = createAppointmentService({ source: dataSource });

export const appointmentQueryOptions = {
  list: (filters: AppointmentFilters = {}) => ({
    queryKey: ["appointments", "list", filters] as const,
    queryFn: () => appointmentService.listAppointments(filters),
    initialData: dataSource === "mock" ? listMockAppointments(filters) : undefined,
  }),
  detail: (id: string) => ({
    queryKey: ["appointments", "detail", id] as const,
    queryFn: () => appointmentService.getAppointment(id),
    initialData: dataSource === "mock" && id ? snapshot(findAppointment(id)) : undefined,
  }),
};

export function appointmentDateRange(date: string): Pick<AppointmentFilters, "startAt" | "endAt"> {
  return {
    startAt: `${date}T00:00:00+07:00`,
    endAt: `${date}T23:59:59.999+07:00`,
  };
}

export function patientsFromAppointments(appointments: Appointment[]): Patient[] {
  if (dataSource === "mock") return mockStore.patients.map((patient) => structuredClone(patient));
  const patients = new Map<string, Patient>();
  for (const appointment of appointments) {
    if (appointment.patient) patients.set(appointment.patient.id, appointment.patient);
  }
  return [...patients.values()];
}
