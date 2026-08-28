import type { DoctorSchedule, ScheduleType } from "../../types/models";
import type { ApiEnvelopeRequest, ApiRequest } from "./http";
import type { ApiListResponse } from "./types";

export interface ScheduleListFilters {
  doctorId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface AvailabilityListFilters {
  serviceId: string;
  date: string;
  doctorId?: string;
  includeUnavailable?: boolean;
  page?: number;
  pageSize?: number;
}

export type AvailabilityStatus = "available" | "unavailable";
export type AvailabilityReasonCode = "available" | "blocked" | "leave" | "appointment_conflict";

export interface ApiAvailabilitySlotRecord {
  doctorId: string;
  serviceId: string;
  startAt: string;
  endAt: string;
  availabilityStatus?: AvailabilityStatus;
  reasonCode?: AvailabilityReasonCode;
  reasonLabel?: string;
}

export type ScheduleCreateInput = Pick<
  DoctorSchedule,
  "doctorId" | "dayOfWeek" | "startTime" | "endTime" | "effectiveFrom" | "effectiveTo" | "type"
>;

export type ScheduleUpdateInput = Partial<ScheduleCreateInput>;

export type ApiDoctorScheduleRecord = DoctorSchedule;

export interface SchedulingApi {
  listSchedules(filters?: ScheduleListFilters): Promise<ApiListResponse<ApiDoctorScheduleRecord>>;
  createSchedule(input: ScheduleCreateInput): Promise<ApiDoctorScheduleRecord>;
  updateSchedule(id: string, input: ScheduleUpdateInput): Promise<ApiDoctorScheduleRecord>;
  deactivateSchedule(id: string): Promise<ApiDoctorScheduleRecord>;
  listAvailability(filters: AvailabilityListFilters): Promise<ApiListResponse<ApiAvailabilitySlotRecord>>;
}

type QueryValue = string | number | boolean | undefined;

function query(filters: object): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters) as Array<[string, QueryValue]>) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export function createSchedulingApi(request: ApiRequest, requestEnvelope: ApiEnvelopeRequest): SchedulingApi {
  return {
    listSchedules(filters = {}) {
      return requestEnvelope<ApiDoctorScheduleRecord[]>(`/doctor-schedules${query(filters)}`) as Promise<ApiListResponse<ApiDoctorScheduleRecord>>;
    },
    createSchedule(input) {
      return request<ApiDoctorScheduleRecord>("/doctor-schedules", { method: "POST", body: JSON.stringify(input) });
    },
    updateSchedule(id, input) {
      return request<ApiDoctorScheduleRecord>(`/doctor-schedules/${id}`, { method: "PATCH", body: JSON.stringify(input) });
    },
    deactivateSchedule(id) {
      return request<ApiDoctorScheduleRecord>(`/doctor-schedules/${id}/deactivate`, { method: "POST" });
    },
    listAvailability(filters) {
      return requestEnvelope<ApiAvailabilitySlotRecord[]>(`/availability/slots${query(filters)}`) as Promise<ApiListResponse<ApiAvailabilitySlotRecord>>;
    },
  };
}

export type { ScheduleType };
