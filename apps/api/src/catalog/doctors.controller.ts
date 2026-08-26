import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { type AuthenticatedRequest, SessionGuard } from "../auth/session.guard";
import { listEnvelope, successEnvelope } from "../common/api-response";
import { Roles, RolesGuard } from "../common/roles";
import { parseSchema } from "../common/validation";
import { doctorCreateSchema, doctorListQuerySchema, doctorUpdateSchema } from "./catalog.dto";
import { CatalogService } from "./catalog.service";

@Controller("doctors")
@UseGuards(SessionGuard)
export class DoctorsController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  async list(@Req() request: AuthenticatedRequest, @Query() rawQuery: Record<string, unknown>) {
    const query = parseSchema(doctorListQuerySchema, rawQuery);
    const result = await this.catalog.listDoctors({ ...query, includeRequestedStatus: request.currentUser.role === UserRole.admin });
    return listEnvelope(result.items, query.page, query.pageSize, result.total);
  }

  @Get(":id")
  async detail(@Param("id") id: string) { return successEnvelope(await this.catalog.doctor(id)); }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin)
  async create(@Body() body: Record<string, unknown>, @Req() request: AuthenticatedRequest) {
    return successEnvelope(await this.catalog.createDoctor(parseSchema(doctorCreateSchema, body), request.currentUser.id));
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin)
  async update(@Param("id") id: string, @Body() body: Record<string, unknown>, @Req() request: AuthenticatedRequest) {
    return successEnvelope(await this.catalog.updateDoctor(id, parseSchema(doctorUpdateSchema, body), request.currentUser.id));
  }

  @Post(":id/deactivate")
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin)
  async deactivate(@Param("id") id: string, @Req() request: AuthenticatedRequest) { return successEnvelope(await this.catalog.deactivateDoctor(id, request.currentUser.id)); }
}
