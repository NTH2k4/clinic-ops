import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { SessionGuard } from "../auth/session.guard";
import { listEnvelope } from "../common/api-response";
import { Roles, RolesGuard } from "../common/roles";
import { parseSchema } from "../common/validation";
import { availabilityQuerySchema, scheduleListQuerySchema } from "./scheduling.dto";
import { SchedulingService } from "./scheduling.service";

@Controller()
@UseGuards(SessionGuard)
export class SchedulingController {
  constructor(private readonly scheduling: SchedulingService) {}

  @Get("doctor-schedules")
  async listSchedules(@Query() rawQuery: Record<string, unknown>) {
    const query = parseSchema(scheduleListQuerySchema, rawQuery);
    const result = await this.scheduling.listSchedules(query);
    return listEnvelope(result.items, query.page, query.pageSize, result.total);
  }

  @Get("availability/slots")
  @UseGuards(RolesGuard)
  @Roles(UserRole.patient, UserRole.receptionist, UserRole.nurse, UserRole.admin)
  async availability(@Query() rawQuery: Record<string, unknown>) {
    const query = parseSchema(availabilityQuerySchema, rawQuery);
    const result = await this.scheduling.availability(query);
    return listEnvelope(result.items, query.page, query.pageSize, result.total);
  }
}
