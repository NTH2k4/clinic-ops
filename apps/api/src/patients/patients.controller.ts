import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { type AuthenticatedRequest, SessionGuard } from "../auth/session.guard";
import { ApiError } from "../common/api-error";
import { successEnvelope } from "../common/api-response";
import { Roles, RolesGuard } from "../common/roles";
import { PatientsService } from "./patients.service";

@Controller("patients")
@UseGuards(SessionGuard)
export class PatientsController {
  constructor(private readonly patients: PatientsService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.receptionist, UserRole.nurse, UserRole.admin)
  async list(@Req() request: AuthenticatedRequest, @Query("q") q?: string, @Query("status") status?: string) { return successEnvelope(await this.patients.list(q, status, request.currentUser.role === UserRole.admin)); }

  @Get(":id")
  async detail(@Param("id") id: string, @Req() request: AuthenticatedRequest) { await this.assertOwnerOrStaff(id, request); return successEnvelope(await this.patients.patient(id)); }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.patient, UserRole.receptionist, UserRole.nurse, UserRole.admin)
  async create(@Body() body: Record<string, unknown>, @Req() request: AuthenticatedRequest) {
    const userId = request.currentUser.role === UserRole.patient ? request.currentUser.id : undefined;
    return successEnvelope(await this.patients.create(body, userId));
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Req() request: AuthenticatedRequest, @Body() body: Record<string, unknown>) { await this.assertOwnerOrStaff(id, request); return successEnvelope(await this.patients.update(id, body)); }

  @Post(":id/deactivate")
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin)
  async deactivate(@Param("id") id: string, @Req() request: AuthenticatedRequest) { return successEnvelope(await this.patients.deactivate(id, request.currentUser.id)); }

  private async assertOwnerOrStaff(id: string, request: AuthenticatedRequest) {
    if (request.currentUser.role !== UserRole.patient) return;
    if (request.linkedProfile?.type !== "patient" || request.linkedProfile.id !== id) throw new ApiError(403, "FORBIDDEN", "You do not have permission to access this resource.");
  }
}
