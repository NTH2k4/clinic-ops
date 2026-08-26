import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { AppointmentStatus, UserRole } from "@prisma/client";
import { type AuthenticatedRequest, SessionGuard } from "../auth/session.guard";
import { listEnvelope, successEnvelope } from "../common/api-response";
import { Roles, RolesGuard } from "../common/roles";
import { parseSchema } from "../common/validation";
import { appointmentListQuerySchema, appointmentTransitionSchema, appointmentUpdateSchema, patientAppointmentCreateSchema, staffAppointmentCreateSchema } from "./appointments.dto";
import { AppointmentsService } from "./appointments.service";

@Controller("appointments")
@UseGuards(SessionGuard)
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Get()
  async list(@Query() rawQuery: Record<string, unknown>, @Req() request: AuthenticatedRequest) {
    const query = parseSchema(appointmentListQuerySchema, rawQuery);
    const result = await this.appointments.list(query, request.currentUser, request.linkedProfile);
    return listEnvelope(result.items, query.page, query.pageSize, result.total);
  }

  @Get(":id")
  async detail(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    return successEnvelope(await this.appointments.authorizedDetail(id, request.currentUser, request.linkedProfile));
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.patient, UserRole.receptionist, UserRole.nurse, UserRole.admin)
  async create(@Body() body: Record<string, unknown>, @Req() request: AuthenticatedRequest) {
    const schema = request.currentUser.role === UserRole.patient ? patientAppointmentCreateSchema : staffAppointmentCreateSchema;
    return successEnvelope(await this.appointments.create(parseSchema(schema, body), request.currentUser, request.linkedProfile));
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(UserRole.receptionist, UserRole.nurse, UserRole.admin)
  async reschedule(@Param("id") id: string, @Body() body: Record<string, unknown>, @Req() request: AuthenticatedRequest) {
    return successEnvelope(await this.appointments.reschedule(id, parseSchema(appointmentUpdateSchema, body), request.currentUser));
  }

  @Post(":id/confirm")
  @UseGuards(RolesGuard)
  @Roles(UserRole.receptionist, UserRole.nurse, UserRole.admin)
  async confirm(@Param("id") id: string, @Body() body: Record<string, unknown> = {}, @Req() request: AuthenticatedRequest) {
    return successEnvelope(await this.appointments.transition(id, AppointmentStatus.confirmed, parseSchema(appointmentTransitionSchema, body), request.currentUser, request.linkedProfile));
  }

  @Post(":id/cancel")
  @UseGuards(RolesGuard)
  @Roles(UserRole.patient, UserRole.receptionist, UserRole.nurse, UserRole.admin)
  async cancel(@Param("id") id: string, @Body() body: Record<string, unknown> = {}, @Req() request: AuthenticatedRequest) {
    return successEnvelope(await this.appointments.transition(id, AppointmentStatus.cancelled, parseSchema(appointmentTransitionSchema, body), request.currentUser, request.linkedProfile));
  }

  @Post(":id/check-in")
  @UseGuards(RolesGuard)
  @Roles(UserRole.receptionist, UserRole.nurse, UserRole.admin)
  async checkIn(@Param("id") id: string, @Body() body: Record<string, unknown> = {}, @Req() request: AuthenticatedRequest) {
    return successEnvelope(await this.appointments.transition(id, AppointmentStatus.checked_in, parseSchema(appointmentTransitionSchema, body), request.currentUser, request.linkedProfile));
  }

  @Post(":id/start")
  @UseGuards(RolesGuard)
  @Roles(UserRole.doctor)
  async start(@Param("id") id: string, @Body() body: Record<string, unknown> = {}, @Req() request: AuthenticatedRequest) {
    return successEnvelope(await this.appointments.transition(id, AppointmentStatus.in_progress, parseSchema(appointmentTransitionSchema, body), request.currentUser, request.linkedProfile));
  }

  @Post(":id/complete")
  @UseGuards(RolesGuard)
  @Roles(UserRole.doctor)
  async complete(@Param("id") id: string, @Body() body: Record<string, unknown> = {}, @Req() request: AuthenticatedRequest) {
    return successEnvelope(await this.appointments.transition(id, AppointmentStatus.completed, parseSchema(appointmentTransitionSchema, body), request.currentUser, request.linkedProfile));
  }

  @Post(":id/no-show")
  @UseGuards(RolesGuard)
  @Roles(UserRole.receptionist, UserRole.nurse, UserRole.admin)
  async noShow(@Param("id") id: string, @Body() body: Record<string, unknown> = {}, @Req() request: AuthenticatedRequest) {
    return successEnvelope(await this.appointments.transition(id, AppointmentStatus.no_show, parseSchema(appointmentTransitionSchema, body), request.currentUser, request.linkedProfile));
  }
}
