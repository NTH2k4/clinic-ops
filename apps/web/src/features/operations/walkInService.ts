import { createSessionApiHttpClient } from "../../lib/api/session";
import { dataSource } from "../../lib/dataSource";
import { createId } from "../../lib/ids";
import { mockStore } from "../../mocks/mockStore";
import type { Appointment, Doctor, DoctorSchedule, Patient } from "../../types/models";

export type WalkInAssignmentReason = "room_empty" | "lowest_queue" | "continued_shift" | "next_shift";

export interface WalkInPatientInput {
  fullName: string;
  phone: string;
  email?: string | null;
  citizenIdNumber?: string | null;
  healthInsuranceNumber?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  identityDocumentType?: string | null;
  notes?: string | null;
}

export interface WalkInInput {
  patientId?: string;
  patient?: WalkInPatientInput;
  serviceId: string;
  specialtyId?: string;
  reason?: string;
  internalNote?: string;
}

export interface WalkInQuote {
  patientMatch: "existing" | "new";
  patientId: string | null;
  doctorId: string;
  doctorName: string;
  room: string | null;
  serviceId: string;
  startAt: string;
  estimatedWaitMinutes: number;
  queueAhead: number;
  assignmentReason: WalkInAssignmentReason;
}

export interface WalkInCreateResult {
  appointment: Appointment;
  quote: WalkInQuote;
}

export interface WalkInService {
  quote(input: WalkInInput): Promise<WalkInQuote>;
  create(input: WalkInInput): Promise<WalkInCreateResult>;
}

interface WalkInServiceOptions {
  source: "mock" | "api";
  fetcher?: typeof fetch;
}

const activeQueueStatuses = new Set(["confirmed", "checked_in", "in_progress"]);

function snapshot<T>(value: T): T {
  return structuredClone(value);
}

function timeToMinutes(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function todayInClinicTimeZone(now = new Date()): string {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
  }).formatToParts(now).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function localMinutes(now = new Date()): number {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Ho_Chi_Minh",
  }).formatToParts(now).map((part) => [part.type, part.value]));
  return Number(parts.hour) * 60 + Number(parts.minute);
}

function dayOfWeek(date: string): number {
  const day = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  return day === 0 ? 7 : day;
}

function activeWorkingSchedules(doctorId: string, date: string): DoctorSchedule[] {
  return mockStore.doctorSchedules
    .filter((schedule) =>
      schedule.doctorId === doctorId
      && schedule.status === "active"
      && schedule.type === "working"
      && schedule.dayOfWeek === dayOfWeek(date)
      && schedule.effectiveFrom <= date
      && date <= schedule.effectiveTo)
    .sort((left, right) => left.startTime.localeCompare(right.startTime));
}

function scheduleStartAt(date: string, time: string): string {
  return new Date(`${date}T${time}:00+07:00`).toISOString();
}

function scheduleCandidate(doctor: Doctor, date: string, now: Date): { startAt: string; reason: WalkInAssignmentReason } | null {
  const minute = localMinutes(now);
  const schedules = activeWorkingSchedules(doctor.id, date);
  for (const schedule of schedules) {
    const start = timeToMinutes(schedule.startTime);
    const end = timeToMinutes(schedule.endTime);
    if (minute >= start && minute < end) {
      if (end - minute < 5) {
        const continues = schedules.some((candidate) => candidate.startTime === schedule.endTime);
        if (!continues) continue;
        return { startAt: now.toISOString(), reason: "continued_shift" };
      }
      return { startAt: now.toISOString(), reason: "room_empty" };
    }
    if (minute < start) return { startAt: scheduleStartAt(date, schedule.startTime), reason: "next_shift" };
  }
  return null;
}

function resolvePatient(input: WalkInInput): Patient | undefined {
  if (input.patientId) return mockStore.patients.find((patient) => patient.id === input.patientId);
  const candidate = input.patient;
  if (!candidate) return undefined;
  return mockStore.patients.find((patient) =>
    (candidate.citizenIdNumber && patient.citizenIdNumber === candidate.citizenIdNumber)
    || (candidate.healthInsuranceNumber && patient.healthInsuranceNumber === candidate.healthInsuranceNumber)
    || (candidate.dateOfBirth && candidate.address && patient.fullName.toLocaleLowerCase() === candidate.fullName.toLocaleLowerCase()
      && patient.dateOfBirth === candidate.dateOfBirth && patient.address?.toLocaleLowerCase() === candidate.address.toLocaleLowerCase()));
}

function serviceDuration(serviceId: string): number {
  return mockStore.services.find((service) => service.id === serviceId)?.durationMinutes ?? 30;
}

function addMinutes(startAt: string, minutes: number): string {
  return new Date(new Date(startAt).getTime() + minutes * 60_000).toISOString();
}

function queueLoad(doctorId: string, startAt: string, durationMinutes: number) {
  const due = mockStore.appointments.filter((appointment) =>
    appointment.doctorId === doctorId
    && activeQueueStatuses.has(appointment.status)
    && new Date(appointment.startAt).getTime() <= new Date(startAt).getTime());
  const inProgress = due.filter((appointment) => appointment.status === "in_progress").length;
  const queueAhead = due.filter((appointment) => appointment.status === "checked_in" || appointment.status === "confirmed").length;
  const estimatedWaitMinutes = due.reduce((total, appointment) => total + serviceDuration(appointment.serviceId), 0);
  return { inProgress, queueAhead, estimatedWaitMinutes: Math.max(estimatedWaitMinutes, inProgress || queueAhead ? durationMinutes : 0) };
}

function mockQuote(input: WalkInInput): WalkInQuote {
  const service = mockStore.services.find((candidate) => candidate.id === input.serviceId);
  if (!service) throw new Error("Không tìm thấy dịch vụ khám.");
  const now = new Date();
  const date = todayInClinicTimeZone(now);
  const patient = resolvePatient(input);
  const candidates = mockStore.doctors
    .filter((doctor) => doctor.status === "active" && doctor.serviceIds.includes(input.serviceId))
    .flatMap((doctor) => {
      const schedule = scheduleCandidate(doctor, date, now);
      if (!schedule) return [];
      const load = queueLoad(doctor.id, schedule.startAt, service.durationMinutes);
      return [{
        doctor,
        schedule,
        load,
        reason: load.queueAhead === 0 && load.inProgress === 0 ? schedule.reason : "lowest_queue" as WalkInAssignmentReason,
      }];
    })
    .sort((left, right) =>
      left.load.estimatedWaitMinutes - right.load.estimatedWaitMinutes
      || left.load.queueAhead - right.load.queueAhead
      || left.doctor.fullName.localeCompare(right.doctor.fullName));

  const best = candidates[0];
  if (!best) throw new Error("Không có bác sĩ hoặc phòng phù hợp để tiếp nhận.");
  return {
    patientMatch: patient ? "existing" : "new",
    patientId: patient?.id ?? null,
    doctorId: best.doctor.id,
    doctorName: best.doctor.fullName,
    room: best.doctor.room,
    serviceId: service.id,
    startAt: best.schedule.startAt,
    estimatedWaitMinutes: best.load.estimatedWaitMinutes,
    queueAhead: best.load.queueAhead,
    assignmentReason: best.reason,
  };
}

function createMockPatient(input: WalkInPatientInput): Patient {
  const timestamp = new Date().toISOString();
  const patient: Patient = {
    id: createId("patient"),
    fullName: input.fullName,
    phone: input.phone,
    ...(input.email ? { email: input.email } : {}),
    ...(input.citizenIdNumber ? { citizenIdNumber: input.citizenIdNumber } : {}),
    ...(input.healthInsuranceNumber ? { healthInsuranceNumber: input.healthInsuranceNumber } : {}),
    dateOfBirth: input.dateOfBirth ?? "",
    gender: input.gender === "female" || input.gender === "male" || input.gender === "other" || input.gender === "prefer_not_to_say" ? input.gender : "prefer_not_to_say",
    ...(input.address ? { address: input.address } : {}),
    ...(input.guardianName ? { guardianName: input.guardianName } : {}),
    ...(input.guardianPhone ? { guardianPhone: input.guardianPhone } : {}),
    ...(input.identityDocumentType ? { identityDocumentType: input.identityDocumentType } : {}),
    ...(input.notes ? { notes: input.notes } : {}),
    status: "active",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  mockStore.patients.push(patient);
  return patient;
}

function mockCreate(input: WalkInInput): WalkInCreateResult {
  const quote = mockQuote(input);
  const patient = resolvePatient(input) ?? createMockPatient(input.patient ?? (() => { throw new Error("Thiếu thông tin bệnh nhân."); })());
  const timestamp = new Date().toISOString();
  const appointment: Appointment = {
    id: createId("appointment"),
    patientId: patient.id,
    doctorId: quote.doctorId,
    serviceId: quote.serviceId,
    startAt: quote.startAt,
    endAt: addMinutes(quote.startAt, serviceDuration(quote.serviceId)),
    status: "checked_in",
    createdByUserId: "user-receptionist-1",
    updatedByUserId: "user-receptionist-1",
    checkedInAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...(input.reason ? { reason: input.reason } : {}),
    ...(input.internalNote ? { internalNote: input.internalNote } : {}),
  };
  mockStore.appointments.push(appointment);
  mockStore.auditEvents.push({
    id: createId("audit-event"),
    actorUserId: "user-receptionist-1",
    entityType: "appointment",
    entityId: appointment.id,
    action: "walk_in_intake_created",
    timestamp,
    metadata: { source: "walk_in_intake", assignmentReason: quote.assignmentReason },
  });
  return snapshot({ appointment, quote: { ...quote, patientId: patient.id, patientMatch: quote.patientMatch } });
}

function defaultApi(fetcher?: typeof fetch) {
  const client = createSessionApiHttpClient(fetcher);
  return {
    async quote(input: WalkInInput) {
      return client.request<WalkInQuote>("/walk-in-intake/quote", { method: "POST", body: JSON.stringify(input) });
    },
    async create(input: WalkInInput) {
      return client.request<WalkInCreateResult>("/walk-in-intake", { method: "POST", body: JSON.stringify(input) });
    },
  };
}

export function createWalkInService(options: WalkInServiceOptions): WalkInService {
  const api = options.source === "api" ? defaultApi(options.fetcher) : undefined;
  return {
    quote(input) {
      return api ? api.quote(input) : Promise.resolve(mockQuote(input));
    },
    create(input) {
      return api ? api.create(input) : Promise.resolve(mockCreate(input));
    },
  };
}

export const walkInService = createWalkInService({ source: dataSource });
