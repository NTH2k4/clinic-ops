import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { type AuthenticatedRequest, SessionGuard } from "../auth/session.guard";
import { successEnvelope } from "../common/api-response";
import { Roles, RolesGuard } from "../common/roles";
import { CatalogService } from "./catalog.service";

@Controller("specialties")
@UseGuards(SessionGuard)
export class SpecialtiesController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  async list(@Req() request: AuthenticatedRequest, @Query() query: Record<string, string | undefined>) { return successEnvelope(await this.catalog.listSpecialties({ ...query, includeRequestedStatus: request.currentUser.role === UserRole.admin })); }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin)
  async create(@Body() body: Record<string, unknown>) { return successEnvelope(await this.catalog.createSpecialty(body)); }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin)
  async update(@Param("id") id: string, @Body() body: Record<string, unknown>) { return successEnvelope(await this.catalog.updateSpecialty(id, body)); }

  @Post(":id/deactivate")
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin)
  async deactivate(@Param("id") id: string, @Req() request: AuthenticatedRequest) { return successEnvelope(await this.catalog.deactivateSpecialty(id, request.currentUser.id)); }
}
