import { Injectable } from "@nestjs/common";
import {
  AppointmentStatus,
  DoctorStatus,
  ScheduleType,
  ServiceStatus,
  type Doctor,
  type DoctorSchedule,
  type Prisma,
  type Service,
} from "@prisma/client";
import { ApiError } from "../common/api-error";
import { PrismaService } from "../prisma/prisma.service";

const clinicTimeZone = "Asia/Ho_Chi_Minh";
const activeAppointmentStatuses = [
  AppointmentStatus.requested,
  AppointmentStatus.confirmed,
  AppointmentStatus.checked_in,
  AppointmentStatus.in_progress,
];

const dateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: clinicTimeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

type DoctorWithSchedules = Doctor & { schedules: DoctorSchedule[] };

export type AppointmentSlotInput = {
  doctorId?: string;
  serviceId: string;
  startAt: Date;
  excludeAppointmentId?: string;
  transaction?: Prisma.TransactionClient;
};

export type AvailableAppointmentSlot = {
  doctor: Doctor;
  service: Service;
  startAt: Date;
  endAt: Date;
};

@Injectable()
export class AppointmentConflictsService {
  constructor(private readonly prisma: PrismaService) {}

  async assertSlotAvailable(input: AppointmentSlotInput): Promise<AvailableAppointmentSlot> {
    if (Number.isNaN(input.startAt.valueOf())) {
      throw new ApiError(400, "VALIDATION_ERROR", "startAt must be a valid ISO datetime.", { startAt: "Invalid" });
    }

    if (input.transaction) return this.assertSlotAvailableInTransaction(input.transaction, input);
    return this.prisma.$transaction((transaction) => this.assertSlotAvailableInTransaction(transaction, input));
  }

  private async assertSlotAvailableInTransaction(
    transaction: Prisma.TransactionClient,
    input: AppointmentSlotInput,
  ): Promise<AvailableAppointmentSlot> {
    const service = await transaction.service.findUnique({ where: { id: input.serviceId } });
    if (!service) throw new ApiError(404, "NOT_FOUND", "service was not found.");
    if (service.status !== ServiceStatus.active) throw new ApiError(409, "SERVICE_INACTIVE", "service is not active.");

    const endAt = new Date(input.startAt.getTime() + service.durationMinutes * 60_000);
    if (input.doctorId) {
      const doctor = await this.findDoctor(transaction, input.doctorId);
      await this.assertDoctorCanProvide(transaction, doctor, service, input, endAt);
      return { doctor, service, startAt: input.startAt, endAt };
    }

    const doctors = await transaction.doctor.findMany({
      where: { status: DoctorStatus.active, services: { some: { id: service.id } } },
      include: { schedules: true },
      orderBy: { id: "asc" },
    });
    for (const doctor of doctors) {
      try {
        await this.assertDoctorCanProvide(transaction, doctor, service, input, endAt);
        return { doctor, service, startAt: input.startAt, endAt };
      } catch (error) {
        if (!(error instanceof ApiError) || !["OUTSIDE_WORKING_HOURS", "DOCTOR_UNAVAILABLE", "APPOINTMENT_CONFLICT"].includes(error.code)) throw error;
      }
    }

    throw new ApiError(409, "NO_DOCTOR_AVAILABLE", "No doctor is available for this slot.");
  }

  private async findDoctor(transaction: Prisma.TransactionClient, doctorId: string): Promise<DoctorWithSchedules> {
    const doctor = await transaction.doctor.findUnique({ where: { id: doctorId }, include: { schedules: true, services: true } });
    if (!doctor) throw new ApiError(404, "NOT_FOUND", "doctor was not found.");
    if (doctor.status !== DoctorStatus.active) throw new ApiError(409, "DOCTOR_UNAVAILABLE", "doctor is not active.");
    return doctor;
  }

  private async assertDoctorCanProvide(
    transaction: Prisma.TransactionClient,
    doctor: DoctorWithSchedules,
    service: Service,
    input: AppointmentSlotInput,
    endAt: Date,
  ) {
    const providesService = await transaction.doctor.count({ where: { id: doctor.id, services: { some: { id: service.id } } } });
    if (!providesService) throw new ApiError(409, "DOCTOR_SERVICE_UNAVAILABLE", "doctor does not provide this service.");
    if (!this.isScheduled(doctor.schedules, input.startAt, endAt)) {
      throw new ApiError(409, "OUTSIDE_WORKING_HOURS", "The appointment is outside the doctor's working hours.");
    }
    if (this.isBlocked(doctor.schedules, input.startAt, endAt)) {
      throw new ApiError(409, "DOCTOR_UNAVAILABLE", "The doctor is unavailable during this slot.");
    }

    const overlap = await transaction.appointment.findFirst({
      where: {
        doctorId: doctor.id,
        status: { in: activeAppointmentStatuses },
        startAt: { lt: endAt },
        endAt: { gt: input.startAt },
        ...(input.excludeAppointmentId ? { id: { not: input.excludeAppointmentId } } : {}),
      },
      select: { id: true },
    });
    if (overlap) throw new ApiError(409, "APPOINTMENT_CONFLICT", "The doctor already has an active appointment during this slot.");
  }

  private isScheduled(schedules: DoctorSchedule[], startAt: Date, endAt: Date) {
    const start = this.localDateTime(startAt);
    const end = this.localDateTime(endAt);
    if (end.date !== start.date) return false;

    const intervals = schedules
      .filter((schedule) => schedule.type === ScheduleType.working && this.matchesDate(schedule, start.date))
      .map((schedule) => ({ start: this.timeInMinutes(schedule.startTime), end: this.timeInMinutes(schedule.endTime) }))
      .sort((left, right) => left.start - right.start);

    let coveredUntil = start.minutes;
    for (const interval of intervals) {
      if (interval.end <= coveredUntil) continue;
      if (interval.start > coveredUntil) return false;
      coveredUntil = interval.end;
      if (coveredUntil >= end.minutes) return true;
    }
    return false;
  }

  private isBlocked(schedules: DoctorSchedule[], startAt: Date, endAt: Date) {
    return schedules.some((schedule) => (
      (schedule.type === ScheduleType.blocked || schedule.type === ScheduleType.leave)
      && this.overlaps(schedule, startAt, endAt)
    ));
  }

  private overlaps(schedule: DoctorSchedule, startAt: Date, endAt: Date) {
    const start = this.localDateTime(startAt);
    const end = this.localDateTime(endAt);
    if (!this.matchesDate(schedule, start.date) || end.date !== start.date) return false;
    return start.minutes < this.timeInMinutes(schedule.endTime) && end.minutes > this.timeInMinutes(schedule.startTime);
  }

  private matchesDate(schedule: DoctorSchedule, date: string) {
    const effectiveFrom = schedule.effectiveFrom.toISOString().slice(0, 10);
    const effectiveTo = schedule.effectiveTo.toISOString().slice(0, 10);
    return schedule.status === "active" && schedule.dayOfWeek === this.dayOfWeek(date)
      && date >= effectiveFrom && date <= effectiveTo;
  }

  private localDateTime(date: Date) {
    const parts = Object.fromEntries(dateTimeFormatter.formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]));
    const localDate = `${parts.year}-${parts.month}-${parts.day}`;
    return { date: localDate, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
  }

  private dayOfWeek(date: string) {
    const day = new Date(`${date}T00:00:00.000Z`).getUTCDay();
    return day === 0 ? 7 : day;
  }

  private timeInMinutes(time: string) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  }
}
