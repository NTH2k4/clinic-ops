import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import type { AuthenticatedRequest } from "../auth/session.guard";
import { SessionGuard } from "../auth/session.guard";
import { listEnvelope, successEnvelope } from "../common/api-response";
import { Roles, RolesGuard } from "../common/roles";
import { parseSchema } from "../common/validation";
import { availabilityQuerySchema, scheduleCreateSchema, scheduleListQuerySchema, scheduleUpdateSchema } from "./scheduling.dto";
import { SchedulingService } from "./scheduling.service";

@Controller()
@UseGuards(SessionGuard, RolesGuard)
export class SchedulingController {
  constructor(private readonly scheduling: SchedulingService) {}

  @Get("doctor-schedules")
  async listSchedules(@Query() rawQuery: Record<string, unknown>) {
    const query = parseSchema(scheduleListQuerySchema, rawQuery);
    const result = await this.scheduling.listSchedules(query);
    return listEnvelope(result.items, query.page, query.pageSize, result.total);
  }

  @Post("doctor-schedules")
  @Roles(UserRole.admin)
  async createSchedule(@Body() body: Record<string, unknown>, @Req() request: AuthenticatedRequest) {
    return successEnvelope(await this.scheduling.createSchedule(parseSchema(scheduleCreateSchema, body), request.currentUser.id));
  }

  @Patch("doctor-schedules/:id")
  @Roles(UserRole.admin)
  async updateSchedule(@Param("id") id: string, @Body() body: Record<string, unknown>, @Req() request: AuthenticatedRequest) {
    return successEnvelope(await this.scheduling.updateSchedule(id, parseSchema(scheduleUpdateSchema, body), request.currentUser.id));
  }

  @Post("doctor-schedules/:id/deactivate")
  @Roles(UserRole.admin)
  async deactivateSchedule(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    return successEnvelope(await this.scheduling.deactivateSchedule(id, request.currentUser.id));
  }

  @Get("availability/slots")
  @Roles(UserRole.patient, UserRole.receptionist, UserRole.nurse, UserRole.admin)
  async availability(@Query() rawQuery: Record<string, unknown>) {
    const query = parseSchema(availabilityQuerySchema, rawQuery);
    const result = await this.scheduling.availability(query);
    return listEnvelope(result.items, query.page, query.pageSize, result.total);
  }
}
