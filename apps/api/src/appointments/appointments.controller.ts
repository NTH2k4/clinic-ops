import { Body, Controller, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { AppointmentStatus, UserRole } from "@prisma/client";
import { type AuthenticatedRequest, SessionGuard } from "../auth/session.guard";
import { successEnvelope } from "../common/api-response";
import { Roles, RolesGuard } from "../common/roles";
import { AppointmentsService } from "./appointments.service";

@Controller("appointments")
@UseGuards(SessionGuard)
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.patient, UserRole.receptionist, UserRole.nurse, UserRole.admin)
  async create(@Body() body: Record<string, unknown>, @Req() request: AuthenticatedRequest) {
    return successEnvelope(await this.appointments.create(body, request.currentUser, request.linkedProfile));
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(UserRole.receptionist, UserRole.nurse, UserRole.admin)
  async reschedule(@Param("id") id: string, @Body() body: Record<string, unknown>, @Req() request: AuthenticatedRequest) {
    return successEnvelope(await this.appointments.reschedule(id, body, request.currentUser));
  }

  @Post(":id/confirm")
  @UseGuards(RolesGuard)
  @Roles(UserRole.receptionist, UserRole.nurse, UserRole.admin)
  async confirm(@Param("id") id: string, @Body() body: Record<string, unknown> = {}, @Req() request: AuthenticatedRequest) {
    return successEnvelope(await this.appointments.transition(id, AppointmentStatus.confirmed, body, request.currentUser, request.linkedProfile));
  }

  @Post(":id/cancel")
  @UseGuards(RolesGuard)
  @Roles(UserRole.patient, UserRole.receptionist, UserRole.nurse, UserRole.admin)
  async cancel(@Param("id") id: string, @Body() body: Record<string, unknown> = {}, @Req() request: AuthenticatedRequest) {
    return successEnvelope(await this.appointments.transition(id, AppointmentStatus.cancelled, body, request.currentUser, request.linkedProfile));
  }

  @Post(":id/check-in")
  @UseGuards(RolesGuard)
  @Roles(UserRole.receptionist, UserRole.nurse, UserRole.admin)
  async checkIn(@Param("id") id: string, @Body() body: Record<string, unknown> = {}, @Req() request: AuthenticatedRequest) {
    return successEnvelope(await this.appointments.transition(id, AppointmentStatus.checked_in, body, request.currentUser, request.linkedProfile));
  }

  @Post(":id/start")
  @UseGuards(RolesGuard)
  @Roles(UserRole.doctor)
  async start(@Param("id") id: string, @Body() body: Record<string, unknown> = {}, @Req() request: AuthenticatedRequest) {
    return successEnvelope(await this.appointments.transition(id, AppointmentStatus.in_progress, body, request.currentUser, request.linkedProfile));
  }

  @Post(":id/complete")
  @UseGuards(RolesGuard)
  @Roles(UserRole.doctor)
  async complete(@Param("id") id: string, @Body() body: Record<string, unknown> = {}, @Req() request: AuthenticatedRequest) {
    return successEnvelope(await this.appointments.transition(id, AppointmentStatus.completed, body, request.currentUser, request.linkedProfile));
  }

  @Post(":id/no-show")
  @UseGuards(RolesGuard)
  @Roles(UserRole.receptionist, UserRole.nurse, UserRole.admin)
  async noShow(@Param("id") id: string, @Body() body: Record<string, unknown> = {}, @Req() request: AuthenticatedRequest) {
    return successEnvelope(await this.appointments.transition(id, AppointmentStatus.no_show, body, request.currentUser, request.linkedProfile));
  }
}
