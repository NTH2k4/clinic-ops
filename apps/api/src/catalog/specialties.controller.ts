import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { type AuthenticatedRequest, SessionGuard } from "../auth/session.guard";
import { listEnvelope, successEnvelope } from "../common/api-response";
import { Roles, RolesGuard } from "../common/roles";
import { parseSchema } from "../common/validation";
import { specialtyCreateSchema, specialtyListQuerySchema, specialtyUpdateSchema } from "./catalog.dto";
import { CatalogService } from "./catalog.service";

@Controller("specialties")
@UseGuards(SessionGuard)
export class SpecialtiesController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  async list(@Req() request: AuthenticatedRequest, @Query() rawQuery: Record<string, unknown>) {
    const query = parseSchema(specialtyListQuerySchema, rawQuery);
    const result = await this.catalog.listSpecialties({ ...query, includeRequestedStatus: request.currentUser.role === UserRole.admin });
    return listEnvelope(result.items, query.page, query.pageSize, result.total);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin)
  async create(@Body() body: Record<string, unknown>, @Req() request: AuthenticatedRequest) {
    return successEnvelope(await this.catalog.createSpecialty(parseSchema(specialtyCreateSchema, body), request.currentUser.id));
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin)
  async update(@Param("id") id: string, @Body() body: Record<string, unknown>, @Req() request: AuthenticatedRequest) {
    return successEnvelope(await this.catalog.updateSpecialty(id, parseSchema(specialtyUpdateSchema, body), request.currentUser.id));
  }

  @Post(":id/deactivate")
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin)
  async deactivate(@Param("id") id: string, @Req() request: AuthenticatedRequest) { return successEnvelope(await this.catalog.deactivateSpecialty(id, request.currentUser.id)); }
}
