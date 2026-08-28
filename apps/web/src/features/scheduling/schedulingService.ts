import { createSchedulingApi } from "../../lib/api/scheduling";
import type {
  ApiAvailabilitySlotRecord,
  AvailabilityListFilters,
  AvailabilityReasonCode,
  ScheduleCreateInput,
  ScheduleListFilters,
  SchedulingApi,
  ScheduleUpdateInput,
} from "../../lib/api/scheduling";
import { createSessionApiHttpClient } from "../../lib/api/session";
import type { ApiListMeta, ApiListResponse } from "../../lib/api/types";
import { dataSource } from "../../lib/dataSource";
import { createId } from "../../lib/ids";
import { mockStore } from "../../mocks/mockStore";
import type { Appointment, DoctorSchedule, ScheduleType } from "../../types/models";
import { isActiveAppointmentStatus } from "../appointments/appointmentRules";

export type AvailabilitySlot = ApiAvailabilitySlotRecord;

export interface SchedulingService {
  listSchedules(filters?: ScheduleListFilters): Promise<ApiListResponse<DoctorSchedule>>;
  listAvailability(filters: AvailabilityListFilters): Promise<ApiListResponse<AvailabilitySlot>>;
  createSchedule(input: ScheduleCreateInput): Promise<DoctorSchedule>;
  updateSchedule(id: string, input: ScheduleUpdateInput): Promise<DoctorSchedule>;
  deactivateSchedule(id: string): Promise<DoctorSchedule>;
}

interface SchedulingServiceOptions {
  source: "mock" | "api";
  api?: SchedulingApi;
  fetcher?: typeof fetch;
}

const availabilityReasonLabels: Record<AvailabilityReasonCode, string> = {
  available: "Còn trống",
  blocked: "Bác sĩ bị chặn lịch",
  leave: "Bác sĩ nghỉ phép",
  appointment_conflict: "Bác sĩ đã có lịch hẹn",
};

function defaultApi(fetcher?: typeof fetch): SchedulingApi {
  const client = createSessionApiHttpClient(fetcher);
  return createSchedulingApi(client.request, client.requestEnvelope);
}

function snapshot<T>(item: T): T {
  return structuredClone(item);
}

function paginate<T>(items: T[], filters: Pick<ScheduleListFilters, "page" | "pageSize"> = {}): ApiListResponse<T> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const start = (page - 1) * pageSize;
  const meta: ApiListMeta = { requestId: "mock", page, pageSize, total: items.length };
  return { data: items.slice(start, start + pageSize).map(snapshot), meta };
}

function calendarDayOfWeek(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return dayOfWeek === 0 ? 7 : dayOfWeek;
}

function timeToMinutes(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function timeFromMinutes(minutes: number): string {
  const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
  const minute = String(minutes % 60).padStart(2, "0");
  return `${hour}:${minute}`;
}

function appointmentStart(date: string, time: string): string {
  return `${date}T${time}:00+07:00`;
}

function appointmentEnd(startAt: string, durationMinutes: number): string {
  return new Date(new Date(startAt).getTime() + durationMinutes * 60_000).toISOString();
}

function overlapsMinutes(startMinutes: number, endMinutes: number, schedule: Pick<DoctorSchedule, "startTime" | "endTime">): boolean {
  return startMinutes < timeToMinutes(schedule.endTime) && timeToMinutes(schedule.startTime) < endMinutes;
}

function overlapsAppointment(startAt: string, endAt: string, appointment: Pick<Appointment, "startAt" | "endAt">): boolean {
  return new Date(startAt) < new Date(appointment.endAt) && new Date(endAt) > new Date(appointment.startAt);
}

function activeSchedulesForDate(filters: { doctorId?: string; date: string }): DoctorSchedule[] {
  const dayOfWeek = calendarDayOfWeek(filters.date);
  return mockStore.doctorSchedules.filter((schedule) =>
    schedule.status === "active"
    && (!filters.doctorId || schedule.doctorId === filters.doctorId)
    && schedule.dayOfWeek === dayOfWeek
    && schedule.effectiveFrom <= filters.date
    && filters.date <= schedule.effectiveTo,
  );
}

function listMockSchedules(filters: ScheduleListFilters = {}): ApiListResponse<DoctorSchedule> {
  const schedules = mockStore.doctorSchedules
    .filter((schedule) =>
      (!filters.doctorId || schedule.doctorId === filters.doctorId)
      && (!filters.from || schedule.effectiveTo >= filters.from)
      && (!filters.to || schedule.effectiveFrom <= filters.to))
    .sort((left, right) =>
      left.effectiveFrom.localeCompare(right.effectiveFrom)
      || left.startTime.localeCompare(right.startTime)
      || left.id.localeCompare(right.id));

  return paginate(schedules, filters);
}

function serviceDuration(serviceId: string): number {
  return mockStore.services.find((service) => service.id === serviceId)?.durationMinutes ?? 30;
}

function doctorSupportsService(doctorId: string, serviceId: string): boolean {
  return mockStore.doctors.some((doctor) =>
    doctor.id === doctorId
    && doctor.status === "active"
    && doctor.serviceIds.includes(serviceId));
}

function availabilityReason(
  doctorId: string,
  startAt: string,
  endAt: string,
  startMinutes: number,
  endMinutes: number,
  schedules: DoctorSchedule[],
): AvailabilityReasonCode {
  const unavailableSchedule = schedules.find((schedule) =>
    (schedule.type === "blocked" || schedule.type === "leave") && overlapsMinutes(startMinutes, endMinutes, schedule),
  );
  if (unavailableSchedule?.type === "blocked") return "blocked";
  if (unavailableSchedule?.type === "leave") return "leave";

  const hasAppointmentConflict = mockStore.appointments.some((appointment) =>
    appointment.doctorId === doctorId
    && isActiveAppointmentStatus(appointment.status)
    && overlapsAppointment(startAt, endAt, appointment));

  return hasAppointmentConflict ? "appointment_conflict" : "available";
}

function listMockAvailability(filters: AvailabilityListFilters): ApiListResponse<AvailabilitySlot> {
  const durationMinutes = serviceDuration(filters.serviceId);
  const schedules = activeSchedulesForDate({ doctorId: filters.doctorId, date: filters.date })
    .filter((schedule) => doctorSupportsService(schedule.doctorId, filters.serviceId));
  const workingSchedules = schedules.filter((schedule) => schedule.type === "working");
  const slots = new Map<string, AvailabilitySlot>();

  for (const schedule of workingSchedules) {
    const end = timeToMinutes(schedule.endTime);
    for (let minute = timeToMinutes(schedule.startTime); minute + durationMinutes <= end; minute += 30) {
      const time = timeFromMinutes(minute);
      const startAt = appointmentStart(filters.date, time);
      const endAt = appointmentEnd(startAt, durationMinutes);
      const reasonCode = availabilityReason(schedule.doctorId, startAt, endAt, minute, minute + durationMinutes, schedules);
      if (reasonCode !== "available" && !filters.includeUnavailable) continue;

      const key = `${schedule.doctorId}-${startAt}`;
      slots.set(key, {
        doctorId: schedule.doctorId,
        serviceId: filters.serviceId,
        startAt,
        endAt,
        ...(filters.includeUnavailable ? {
          availabilityStatus: reasonCode === "available" ? "available" : "unavailable",
          reasonCode,
          reasonLabel: availabilityReasonLabels[reasonCode],
        } : {}),
      });
    }
  }

  const sorted = [...slots.values()].sort((left, right) => left.startAt.localeCompare(right.startAt) || left.doctorId.localeCompare(right.doctorId));
  return paginate(sorted, filters);
}

function createMockSchedule(input: ScheduleCreateInput): DoctorSchedule {
  const timestamp = new Date().toISOString();
  const schedule: DoctorSchedule = {
    id: createId("doctor-schedule"),
    ...input,
    status: "active",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  mockStore.doctorSchedules.push(schedule);
  return snapshot(schedule);
}

function updateMockSchedule(id: string, input: ScheduleUpdateInput): DoctorSchedule {
  const schedule = mockStore.doctorSchedules.find((candidate) => candidate.id === id);
  if (!schedule) throw new Error("Không tìm thấy lịch bác sĩ.");
  Object.assign(schedule, input, { updatedAt: new Date().toISOString() });
  return snapshot(schedule);
}

function deactivateMockSchedule(id: string): DoctorSchedule {
  const schedule = mockStore.doctorSchedules.find((candidate) => candidate.id === id);
  if (!schedule) throw new Error("Không tìm thấy lịch bác sĩ.");
  Object.assign(schedule, { status: "inactive", updatedAt: new Date().toISOString() });
  return snapshot(schedule);
}

export function createSchedulingService(options: SchedulingServiceOptions): SchedulingService {
  const api = options.source === "api" ? (options.api ?? defaultApi(options.fetcher)) : undefined;

  return {
    async listSchedules(filters = {}) {
      if (!api) return listMockSchedules(filters);
      const response = await api.listSchedules(filters);
      return { data: response.data.map(snapshot), meta: response.meta };
    },
    async listAvailability(filters) {
      if (!api) return listMockAvailability(filters);
      const response = await api.listAvailability(filters);
      return { data: response.data.map(snapshot), meta: response.meta };
    },
    async createSchedule(input) {
      if (!api) return createMockSchedule(input);
      return snapshot(await api.createSchedule(input));
    },
    async updateSchedule(id, input) {
      if (!api) return updateMockSchedule(id, input);
      return snapshot(await api.updateSchedule(id, input));
    },
    async deactivateSchedule(id) {
      if (!api) return deactivateMockSchedule(id);
      return snapshot(await api.deactivateSchedule(id));
    },
  };
}

export const schedulingService = createSchedulingService({ source: dataSource });

export const schedulingQueryOptions = {
  schedules: (filters: ScheduleListFilters = {}) => ({
    queryKey: ["scheduling", "schedules", filters] as const,
    queryFn: () => schedulingService.listSchedules(filters),
    initialData: dataSource === "mock" ? listMockSchedules(filters) : undefined,
  }),
  availability: (filters: AvailabilityListFilters) => ({
    queryKey: ["scheduling", "availability", filters] as const,
    queryFn: () => schedulingService.listAvailability(filters),
    initialData: dataSource === "mock" ? listMockAvailability(filters) : undefined,
  }),
};

export type { AvailabilityListFilters, ScheduleCreateInput, ScheduleListFilters, ScheduleType, ScheduleUpdateInput };
