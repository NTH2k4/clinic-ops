import { Injectable } from "@nestjs/common";
import { AccountStatus, DoctorStatus, Prisma, ScheduleType, ServiceStatus } from "@prisma/client";
import { ApiError } from "../common/api-error";
import { paginationArgs } from "../common/validation";
import { AppointmentConflictsService } from "../appointments/appointment-conflicts.service";
import { PrismaService } from "../prisma/prisma.service";
import type { AvailabilityQuery, ScheduleCreateInput, ScheduleListQuery, ScheduleUpdateInput } from "./scheduling.dto";

const unavailableCodes = new Set(["APPOINTMENT_CONFLICT", "DOCTOR_UNAVAILABLE", "NO_DOCTOR_AVAILABLE", "OUTSIDE_WORKING_HOURS"]);

@Injectable()
export class SchedulingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly conflicts: AppointmentConflictsService,
  ) {}

  async listSchedules(query: ScheduleListQuery) {
    const from = query.from ? this.date(query.from) : undefined;
    const to = query.to ? this.date(query.to) : undefined;
    const where: Prisma.DoctorScheduleWhereInput = {
      doctorId: query.doctorId,
      effectiveTo: from ? { gte: from } : undefined,
      effectiveFrom: to ? { lte: to } : undefined,
    };
    const [schedules, total] = await this.prisma.$transaction([
      this.prisma.doctorSchedule.findMany({ where, orderBy: [{ effectiveFrom: "asc" }, { startTime: "asc" }, { id: "asc" }], ...paginationArgs(query) }),
      this.prisma.doctorSchedule.count({ where }),
    ]);
    const items = schedules.map((schedule) => this.serializeSchedule(schedule));
    return { items, total };
  }

  async createSchedule(input: ScheduleCreateInput, actorUserId: string) {
    await this.require(this.prisma.doctor.findUnique({ where: { id: input.doctorId } }), "doctor");
    this.assertScheduleRange(input);
    return this.prisma.$transaction(async (transaction) => {
      const schedule = await transaction.doctorSchedule.create({
        data: {
          doctorId: input.doctorId,
          dayOfWeek: input.dayOfWeek,
          startTime: input.startTime,
          endTime: input.endTime,
          effectiveFrom: this.date(input.effectiveFrom),
          effectiveTo: this.date(input.effectiveTo),
          type: input.type,
        },
      });
      await this.audit(transaction, actorUserId, schedule.id, "doctor_schedule_created");
      return this.serializeSchedule(schedule);
    });
  }

  async updateSchedule(id: string, input: ScheduleUpdateInput, actorUserId: string) {
    return this.prisma.$transaction(async (transaction) => {
      const existing = await this.require(transaction.doctorSchedule.findUnique({ where: { id } }), "doctor schedule");
      if (input.doctorId) await this.require(transaction.doctor.findUnique({ where: { id: input.doctorId } }), "doctor");

      const next = {
        startTime: input.startTime ?? existing.startTime,
        endTime: input.endTime ?? existing.endTime,
        effectiveFrom: input.effectiveFrom ?? existing.effectiveFrom.toISOString().slice(0, 10),
        effectiveTo: input.effectiveTo ?? existing.effectiveTo.toISOString().slice(0, 10),
      };
      this.assertScheduleRange(next);

      const schedule = await transaction.doctorSchedule.update({
        where: { id },
        data: {
          doctorId: input.doctorId,
          dayOfWeek: input.dayOfWeek,
          startTime: input.startTime,
          endTime: input.endTime,
          effectiveFrom: input.effectiveFrom === undefined ? undefined : this.date(input.effectiveFrom),
          effectiveTo: input.effectiveTo === undefined ? undefined : this.date(input.effectiveTo),
          type: input.type,
        },
      });
      await this.audit(transaction, actorUserId, schedule.id, "doctor_schedule_updated");
      return this.serializeSchedule(schedule);
    });
  }

  async deactivateSchedule(id: string, actorUserId: string) {
    return this.prisma.$transaction(async (transaction) => {
      const existing = await this.require(transaction.doctorSchedule.findUnique({ where: { id } }), "doctor schedule");
      const schedule = await transaction.doctorSchedule.update({ where: { id: existing.id }, data: { status: AccountStatus.inactive } });
      await this.audit(transaction, actorUserId, schedule.id, "doctor_schedule_deactivated");
      return this.serializeSchedule(schedule);
    });
  }

  async availability(query: AvailabilityQuery) {
    const service = await this.prisma.service.findUnique({ where: { id: query.serviceId } });
    if (!service) throw new ApiError(404, "NOT_FOUND", "service was not found.");
    if (service.status !== ServiceStatus.active) throw new ApiError(409, "SERVICE_INACTIVE", "service is not active.");

    const date = this.date(query.date);
    const schedules = await this.prisma.doctorSchedule.findMany({
      where: {
        doctorId: query.doctorId,
        status: AccountStatus.active,
        type: ScheduleType.working,
        dayOfWeek: this.dayOfWeek(query.date),
        effectiveFrom: { lte: date },
        effectiveTo: { gte: date },
        doctor: { status: DoctorStatus.active, services: { some: { id: query.serviceId } } },
      },
      orderBy: [{ startTime: "asc" }, { doctorId: "asc" }, { id: "asc" }],
    });

    const candidateStarts = [...new Set(schedules.flatMap((schedule) => this.starts(query.date, schedule.startTime, schedule.endTime, service.durationMinutes)))].sort();
    const slots: Array<{ doctorId: string; serviceId: string; startAt: Date; endAt: Date }> = [];
    for (const startAtIso of candidateStarts) {
      try {
        const slot = await this.conflicts.assertSlotAvailable({
          doctorId: query.doctorId,
          serviceId: query.serviceId,
          startAt: new Date(startAtIso),
        });
        slots.push({ doctorId: slot.doctor.id, serviceId: slot.service.id, startAt: slot.startAt, endAt: slot.endAt });
      } catch (error) {
        if (!(error instanceof ApiError) || !unavailableCodes.has(error.code)) throw error;
      }
    }

    const start = (query.page - 1) * query.pageSize;
    return { items: slots.slice(start, start + query.pageSize), total: slots.length };
  }

  private starts(date: string, startTime: string, endTime: string, durationMinutes: number) {
    const starts: string[] = [];
    const end = this.minutes(endTime);
    for (let minute = this.minutes(startTime); minute + durationMinutes <= end; minute += 30) {
      const hours = Math.floor(minute / 60).toString().padStart(2, "0");
      const minutes = (minute % 60).toString().padStart(2, "0");
      starts.push(new Date(`${date}T${hours}:${minutes}:00+07:00`).toISOString());
    }
    return starts;
  }

  private date(value: string) {
    return new Date(`${value}T00:00:00.000Z`);
  }

  private dayOfWeek(value: string) {
    const day = this.date(value).getUTCDay();
    return day === 0 ? 7 : day;
  }

  private minutes(value: string) {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
  }

  private assertScheduleRange(schedule: { startTime: string; endTime: string; effectiveFrom: string; effectiveTo: string }) {
    if (this.minutes(schedule.startTime) >= this.minutes(schedule.endTime)) {
      throw new ApiError(400, "VALIDATION_ERROR", "startTime must be before endTime.", { startTime: "Invalid", endTime: "Invalid" });
    }
    if (schedule.effectiveFrom > schedule.effectiveTo) {
      throw new ApiError(400, "VALIDATION_ERROR", "effectiveFrom must be before or equal to effectiveTo.", { effectiveFrom: "Invalid" });
    }
  }

  private serializeSchedule(schedule: { effectiveFrom: Date; effectiveTo: Date } & Record<string, unknown>) {
    return {
      ...schedule,
      effectiveFrom: schedule.effectiveFrom.toISOString().slice(0, 10),
      effectiveTo: schedule.effectiveTo.toISOString().slice(0, 10),
    };
  }

  private async require<T>(value: Promise<T | null>, entity: string): Promise<T> {
    const resource = await value;
    if (!resource) throw new ApiError(404, "NOT_FOUND", `${entity} was not found.`);
    return resource;
  }

  private audit(transaction: Prisma.TransactionClient, actorUserId: string, scheduleId: string, action: string) {
    return transaction.auditEvent.create({ data: { actorUserId, entityType: "doctor_schedule", entityId: scheduleId, action } });
  }
}
