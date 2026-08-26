import { Injectable } from "@nestjs/common";
import { AccountStatus, DoctorStatus, Prisma, ScheduleType, ServiceStatus } from "@prisma/client";
import { ApiError } from "../common/api-error";
import { paginationArgs } from "../common/validation";
import { AppointmentConflictsService } from "../appointments/appointment-conflicts.service";
import { PrismaService } from "../prisma/prisma.service";
import type { AvailabilityQuery, ScheduleListQuery } from "./scheduling.dto";

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
    const [items, total] = await this.prisma.$transaction([
      this.prisma.doctorSchedule.findMany({ where, orderBy: [{ effectiveFrom: "asc" }, { startTime: "asc" }, { id: "asc" }], ...paginationArgs(query) }),
      this.prisma.doctorSchedule.count({ where }),
    ]);
    return { items, total };
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
}
