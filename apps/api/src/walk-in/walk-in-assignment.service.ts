import { Injectable } from "@nestjs/common";
import { AccountStatus, AppointmentStatus, DoctorStatus, Prisma, ScheduleType, ServiceStatus, type User } from "@prisma/client";
import { ApiError } from "../common/api-error";
import { currentRequestId } from "../common/request-context";
import { PrismaService } from "../prisma/prisma.service";
import type { WalkInCreateInput, WalkInPatientInput, WalkInQuoteInput } from "./walk-in.dto";

const clinicTimeZone = "Asia/Ho_Chi_Minh";
const activeQueueStatuses = [AppointmentStatus.confirmed, AppointmentStatus.checked_in, AppointmentStatus.in_progress] as const;
const shiftBoundaryMinutes = 5;

const dateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: clinicTimeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function currentSystemTime(): Date {
  return process.env.CAREFLOW_SYSTEM_NOW ? new Date(process.env.CAREFLOW_SYSTEM_NOW) : new Date();
}

type AssignmentReason = "room_empty" | "lowest_queue" | "continued_shift" | "next_shift";

export type WalkInAssignmentQuote = {
  patientMatch: "existing" | "new";
  patientId: string | null;
  doctorId: string;
  doctorName: string;
  room: string | null;
  serviceId: string;
  startAt: string;
  estimatedWaitMinutes: number;
  queueAhead: number;
  assignmentReason: AssignmentReason;
};

type CandidateDoctor = Prisma.DoctorGetPayload<{ include: { schedules: true; services: true } }>;
type Candidate = {
  doctor: CandidateDoctor;
  startAt: Date;
  estimatedWaitMinutes: number;
  queueAhead: number;
  assignmentReason: AssignmentReason;
};

@Injectable()
export class WalkInAssignmentService {
  constructor(private readonly prisma: PrismaService) {}

  async quote(input: WalkInQuoteInput): Promise<WalkInAssignmentQuote> {
    return this.prisma.$transaction((transaction) => this.quoteInTransaction(transaction, input));
  }

  async create(input: WalkInCreateInput, actor: Pick<User, "id">) {
    return this.prisma.$transaction(async (transaction) => {
      const quote = await this.quoteInTransaction(transaction, input);
      const patientId = quote.patientId ?? await this.createPatient(transaction, this.requirePatientInput(input));
      const startAt = new Date(quote.startAt);
      const service = await this.requireService(transaction, input.serviceId, input.specialtyId);
      const endAt = new Date(startAt.getTime() + service.durationMinutes * 60_000);
      const now = currentSystemTime();
      const appointment = await transaction.appointment.create({
        data: {
          patientId,
          doctorId: quote.doctorId,
          serviceId: service.id,
          startAt,
          endAt,
          status: AppointmentStatus.checked_in,
          reason: input.reason,
          internalNote: input.internalNote,
          createdByUserId: actor.id,
          updatedByUserId: actor.id,
          checkedInAt: now,
        },
        include: {
          patient: true,
          doctor: true,
          service: true,
          statusHistory: { orderBy: { changedAt: "asc" } },
        },
      });
      await transaction.appointmentStatusHistory.create({
        data: { appointmentId: appointment.id, toStatus: AppointmentStatus.checked_in, actorUserId: actor.id, note: "Walk-in intake at reception." },
      });
      await transaction.auditEvent.create({
        data: {
          actorUserId: actor.id,
          appointmentId: appointment.id,
          entityType: "appointment",
          entityId: appointment.id,
          action: "walk_in_intake_created",
          metadata: {
            requestId: currentRequestId(),
            source: "walk_in_intake",
            assignmentReason: quote.assignmentReason,
            queueAhead: quote.queueAhead,
            estimatedWaitMinutes: quote.estimatedWaitMinutes,
          },
        },
      });

      return { appointment: { ...appointment, statusHistory: [{ toStatus: AppointmentStatus.checked_in }] }, quote: { ...quote, patientId } };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  private async quoteInTransaction(transaction: Prisma.TransactionClient, input: WalkInQuoteInput): Promise<WalkInAssignmentQuote> {
    const service = await this.requireService(transaction, input.serviceId, input.specialtyId);
    const patient = await this.findPatient(transaction, input);
    const candidate = await this.bestCandidate(transaction, service.id, service.durationMinutes);
    return {
      patientMatch: patient ? "existing" : "new",
      patientId: patient?.id ?? null,
      doctorId: candidate.doctor.id,
      doctorName: candidate.doctor.fullName,
      room: candidate.doctor.room,
      serviceId: service.id,
      startAt: candidate.startAt.toISOString(),
      estimatedWaitMinutes: candidate.estimatedWaitMinutes,
      queueAhead: candidate.queueAhead,
      assignmentReason: candidate.assignmentReason,
    };
  }

  private async requireService(transaction: Prisma.TransactionClient, serviceId: string, specialtyId?: string) {
    const service = await transaction.service.findUnique({ where: { id: serviceId } });
    if (!service) throw new ApiError(404, "NOT_FOUND", "service was not found.");
    if (service.status !== ServiceStatus.active) throw new ApiError(409, "SERVICE_INACTIVE", "service is not active.");
    if (specialtyId && service.specialtyId !== specialtyId) throw new ApiError(409, "SERVICE_SPECIALTY_MISMATCH", "service does not belong to specialty.");
    return service;
  }

  private async findPatient(transaction: Prisma.TransactionClient, input: WalkInQuoteInput) {
    if (input.patientId) {
      const patient = await transaction.patient.findUnique({ where: { id: input.patientId } });
      if (!patient) throw new ApiError(404, "NOT_FOUND", "patient was not found.");
      if (patient.status !== AccountStatus.active) throw new ApiError(409, "PATIENT_INACTIVE", "patient is not active.");
      return patient;
    }
    if (!input.patient) return null;
    const patient = input.patient;
    const byCitizenId = patient.citizenIdNumber ? await transaction.patient.findUnique({ where: { citizenIdNumber: patient.citizenIdNumber } }) : null;
    if (byCitizenId) return byCitizenId;
    const byHealthInsurance = patient.healthInsuranceNumber ? await transaction.patient.findUnique({ where: { healthInsuranceNumber: patient.healthInsuranceNumber } }) : null;
    if (byHealthInsurance) return byHealthInsurance;
    const byFallback = patient.dateOfBirth && patient.address ? await transaction.patient.findFirst({
      where: {
        fullName: { equals: patient.fullName, mode: "insensitive" },
        dateOfBirth: new Date(`${patient.dateOfBirth}T00:00:00.000Z`),
        address: { equals: patient.address, mode: "insensitive" },
        ...(patient.guardianName ? { guardianName: { equals: patient.guardianName, mode: "insensitive" } } : {}),
      },
    }) : null;
    return byFallback;
  }

  private async createPatient(transaction: Prisma.TransactionClient, patient: WalkInPatientInput) {
    const created = await transaction.patient.create({
      data: {
        fullName: patient.fullName,
        phone: patient.phone,
        email: patient.email,
        citizenIdNumber: patient.citizenIdNumber,
        healthInsuranceNumber: patient.healthInsuranceNumber,
        dateOfBirth: patient.dateOfBirth ? new Date(`${patient.dateOfBirth}T00:00:00.000Z`) : patient.dateOfBirth,
        gender: patient.gender,
        address: patient.address,
        guardianName: patient.guardianName,
        guardianPhone: patient.guardianPhone,
        identityDocumentType: patient.identityDocumentType,
        notes: patient.notes,
      },
    });
    return created.id;
  }

  private requirePatientInput(input: WalkInCreateInput) {
    if (!input.patient) throw new ApiError(400, "VALIDATION_ERROR", "patient is required when no existing patient matches.", { patient: "Required" });
    return input.patient;
  }

  private async bestCandidate(transaction: Prisma.TransactionClient, serviceId: string, durationMinutes: number): Promise<Candidate> {
    const now = currentSystemTime();
    const localNow = this.localDateTime(now);
    const doctors = await transaction.doctor.findMany({
      where: { status: DoctorStatus.active, services: { some: { id: serviceId } } },
      include: { schedules: true, services: true },
      orderBy: [{ fullName: "asc" }, { id: "asc" }],
    });
    const candidates: Candidate[] = [];
    for (const doctor of doctors) {
      const scheduleCandidate = this.scheduleCandidate(doctor.schedules, localNow, now);
      if (!scheduleCandidate) continue;
      if (this.isBlocked(doctor.schedules, scheduleCandidate.startAt, durationMinutes)) continue;
      const load = await this.queueLoad(transaction, doctor.id, durationMinutes, scheduleCandidate.startAt);
      candidates.push({
        doctor,
        startAt: scheduleCandidate.startAt,
        estimatedWaitMinutes: load.estimatedWaitMinutes,
        queueAhead: load.queueAhead,
        assignmentReason: load.queueAhead === 0 && load.inProgress === 0
          ? scheduleCandidate.reason === "continued_shift" ? "continued_shift" : scheduleCandidate.reason === "next_shift" ? "next_shift" : "room_empty"
          : "lowest_queue",
      });
    }
    candidates.sort((left, right) =>
      left.estimatedWaitMinutes - right.estimatedWaitMinutes
      || left.queueAhead - right.queueAhead
      || left.doctor.fullName.localeCompare(right.doctor.fullName)
      || left.doctor.id.localeCompare(right.doctor.id));
    const candidate = candidates[0];
    if (!candidate) throw new ApiError(409, "NO_DOCTOR_AVAILABLE", "No doctor is available for walk-in intake.");
    return candidate;
  }

  private scheduleCandidate(schedules: CandidateDoctor["schedules"], localNow: ReturnType<WalkInAssignmentService["localDateTime"]>, now: Date) {
    const workingSchedules = schedules
      .filter((schedule) => schedule.type === ScheduleType.working && this.matchesDate(schedule, localNow.date))
      .sort((left, right) => left.startTime.localeCompare(right.startTime));
    for (const schedule of workingSchedules) {
      const start = this.minutes(schedule.startTime);
      const end = this.minutes(schedule.endTime);
      if (localNow.minutes >= start && localNow.minutes < end) {
        const minutesUntilEnd = end - localNow.minutes;
        if (minutesUntilEnd < shiftBoundaryMinutes) {
          const continues = workingSchedules.some((candidate) => candidate.startTime === schedule.endTime);
          if (!continues) continue;
          return { startAt: now, reason: "continued_shift" as const };
        }
        return { startAt: now, reason: "room_empty" as const };
      }
      if (localNow.minutes < start) {
        return { startAt: new Date(`${localNow.date}T${schedule.startTime}:00+07:00`), reason: "next_shift" as const };
      }
    }
    return null;
  }

  private isBlocked(schedules: CandidateDoctor["schedules"], startAt: Date, durationMinutes: number) {
    const endAt = new Date(startAt.getTime() + durationMinutes * 60_000);
    const start = this.localDateTime(startAt);
    const end = this.localDateTime(endAt);
    return schedules.some((schedule) => {
      if ((schedule.type !== ScheduleType.blocked && schedule.type !== ScheduleType.leave) || !this.matchesDate(schedule, start.date) || end.date !== start.date) return false;
      return start.minutes < this.minutes(schedule.endTime) && end.minutes > this.minutes(schedule.startTime);
    });
  }

  private async queueLoad(transaction: Prisma.TransactionClient, doctorId: string, durationMinutes: number, startAt: Date) {
    const local = this.localDateTime(startAt);
    const appointments = await transaction.appointment.findMany({
      where: {
        doctorId,
        status: { in: [...activeQueueStatuses] },
        startAt: { lt: new Date(`${local.date}T23:59:59.999+07:00`) },
        endAt: { gt: new Date(`${local.date}T00:00:00.000+07:00`) },
      },
      include: { service: true },
    });
    const dueAppointments = appointments.filter((appointment) => appointment.startAt.getTime() <= startAt.getTime());
    const inProgress = dueAppointments.filter((appointment) => appointment.status === AppointmentStatus.in_progress).length;
    const queueAhead = dueAppointments.filter((appointment) => appointment.status === AppointmentStatus.checked_in || appointment.status === AppointmentStatus.confirmed).length;
    const serviceMinutes = dueAppointments.reduce((total, appointment) => {
      if (appointment.status === AppointmentStatus.in_progress || appointment.status === AppointmentStatus.checked_in || appointment.status === AppointmentStatus.confirmed) {
        return total + appointment.service.durationMinutes;
      }
      return total;
    }, 0);
    return { inProgress, queueAhead, estimatedWaitMinutes: Math.max(serviceMinutes, inProgress || queueAhead ? durationMinutes : 0) };
  }

  private matchesDate(schedule: CandidateDoctor["schedules"][number], date: string) {
    const effectiveFrom = schedule.effectiveFrom.toISOString().slice(0, 10);
    const effectiveTo = schedule.effectiveTo.toISOString().slice(0, 10);
    return schedule.status === AccountStatus.active && schedule.dayOfWeek === this.dayOfWeek(date) && date >= effectiveFrom && date <= effectiveTo;
  }

  private localDateTime(date: Date) {
    const parts = Object.fromEntries(dateTimeFormatter.formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]));
    const localDate = `${parts.year}-${parts.month}-${parts.day}`;
    return { date: localDate, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
  }

  private dayOfWeek(value: string) {
    const day = new Date(`${value}T00:00:00.000Z`).getUTCDay();
    return day === 0 ? 7 : day;
  }

  private minutes(value: string) {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
  }
}
