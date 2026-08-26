import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { type AuthenticatedRequest, SessionGuard } from "../auth/session.guard";
import { ApiError } from "../common/api-error";
import { listEnvelope, successEnvelope } from "../common/api-response";
import { Roles, RolesGuard } from "../common/roles";
import { parseSchema } from "../common/validation";
import { patientCreateSchema, patientListQuerySchema, patientOwnerUpdateSchema, patientUpdateSchema } from "./patients.dto";
import { PatientsService } from "./patients.service";

@Controller("patients")
@UseGuards(SessionGuard)
export class PatientsController {
  constructor(private readonly patients: PatientsService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.receptionist, UserRole.nurse, UserRole.admin)
  async list(@Req() request: AuthenticatedRequest, @Query() rawQuery: Record<string, unknown>) {
    const query = parseSchema(patientListQuerySchema, rawQuery);
    const result = await this.patients.list(query, request.currentUser.role === UserRole.admin);
    return listEnvelope(result.items, query.page, query.pageSize, result.total);
  }

  @Get(":id")
  async detail(@Param("id") id: string, @Req() request: AuthenticatedRequest) { this.assertOwnerOrStaff(id, request); return successEnvelope(await this.patients.patient(id)); }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.patient, UserRole.receptionist, UserRole.nurse, UserRole.admin)
  async create(@Body() body: Record<string, unknown>, @Req() request: AuthenticatedRequest) {
    const userId = request.currentUser.role === UserRole.patient ? request.currentUser.id : undefined;
    return successEnvelope(await this.patients.create(parseSchema(patientCreateSchema, body), userId));
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(UserRole.patient, UserRole.receptionist, UserRole.nurse, UserRole.admin)
  async update(@Param("id") id: string, @Req() request: AuthenticatedRequest, @Body() body: Record<string, unknown>) {
    this.assertOwnerOrStaff(id, request);
    const input = request.currentUser.role === UserRole.patient
      ? parseSchema(patientOwnerUpdateSchema, body)
      : parseSchema(patientUpdateSchema, body);
    return successEnvelope(await this.patients.update(id, input));
  }

  @Post(":id/deactivate")
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin)
  async deactivate(@Param("id") id: string, @Req() request: AuthenticatedRequest) { return successEnvelope(await this.patients.deactivate(id, request.currentUser.id)); }

  private assertOwnerOrStaff(id: string, request: AuthenticatedRequest) {
    if (request.currentUser.role !== UserRole.patient) return;
    if (request.linkedProfile?.type !== "patient" || request.linkedProfile.id !== id) throw new ApiError(403, "FORBIDDEN", "You do not have permission to access this resource.");
  }
}
