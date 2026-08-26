import type { AppointmentStatus } from "../../types/models";
import type { ApiEnvelopeRequest, ApiRequest } from "./http";
import type { ApiPatientRecord } from "./patients";
import type { ApiListResponse } from "./types";

export interface AppointmentListFilters {
  patientId?: string;
  doctorId?: string;
  serviceId?: string;
  specialtyId?: string;
  status?: AppointmentStatus;
  from?: string;
  to?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface ApiAppointmentStatusHistoryRecord {
  id: string;
  appointmentId: string;
  fromStatus: AppointmentStatus | null;
  toStatus: AppointmentStatus;
  actorUserId: string;
  note: string | null;
  changedAt: string;
}

export interface ApiAppointmentRecord {
  id: string;
  patientId: string;
  doctorId: string;
  serviceId: string;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  reason: string | null;
  internalNote: string | null;
  cancellationReason: string | null;
  createdByUserId: string;
  updatedByUserId: string | null;
  checkedInAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  patient?: ApiPatientRecord;
  statusHistory?: ApiAppointmentStatusHistoryRecord[];
}

export interface AppointmentCreateInput {
  patientId?: string;
  doctorId?: string;
  serviceId: string;
  startAt: string;
  reason?: string;
  internalNote?: string;
  source?: "patient_portal" | "staff_portal" | "operations";
}

export interface AppointmentUpdateInput {
  doctorId?: string;
  serviceId?: string;
  startAt?: string;
  internalNote?: string | null;
}

export interface AppointmentTransitionInput {
  cancellationReason?: string;
  note?: string;
}

export type AppointmentTransition = "confirm" | "cancel" | "check-in" | "start" | "complete" | "no-show";

export interface AppointmentsApi {
  listAppointments(filters?: AppointmentListFilters): Promise<ApiListResponse<ApiAppointmentRecord>>;
  getAppointment(id: string): Promise<ApiAppointmentRecord>;
  createAppointment(input: AppointmentCreateInput): Promise<ApiAppointmentRecord>;
  updateAppointment(id: string, input: AppointmentUpdateInput): Promise<ApiAppointmentRecord>;
  transitionAppointment(id: string, transition: AppointmentTransition, input?: AppointmentTransitionInput): Promise<ApiAppointmentRecord>;
}

function query(filters: AppointmentListFilters = {}): string {
  const params = new URLSearchParams();
  const keys: Array<keyof AppointmentListFilters> = [
    "patientId", "doctorId", "serviceId", "specialtyId", "status", "from", "to", "q", "page", "pageSize",
  ];

  for (const key of keys) {
    const value = filters[key];
    if (value !== undefined && value !== "") params.set(key, String(value));
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export function createAppointmentsApi(request: ApiRequest, requestEnvelope: ApiEnvelopeRequest): AppointmentsApi {
  return {
    listAppointments(filters) {
      return requestEnvelope<ApiAppointmentRecord[]>(`/appointments${query(filters)}`) as Promise<ApiListResponse<ApiAppointmentRecord>>;
    },
    getAppointment(id) {
      return request<ApiAppointmentRecord>(`/appointments/${id}`);
    },
    createAppointment(input) {
      return request<ApiAppointmentRecord>("/appointments", { method: "POST", body: JSON.stringify(input) });
    },
    updateAppointment(id, input) {
      return request<ApiAppointmentRecord>(`/appointments/${id}`, { method: "PATCH", body: JSON.stringify(input) });
    },
    transitionAppointment(id, transition, input = {}) {
      return request<ApiAppointmentRecord>(`/appointments/${id}/${transition}`, { method: "POST", body: JSON.stringify(input) });
    },
  };
}
