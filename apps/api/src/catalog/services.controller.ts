import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { type AuthenticatedRequest, SessionGuard } from "../auth/session.guard";
import { successEnvelope } from "../common/api-response";
import { Roles, RolesGuard } from "../common/roles";
import { CatalogService } from "./catalog.service";

@Controller("services")
@UseGuards(SessionGuard)
export class ServicesController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  async list(@Req() request: AuthenticatedRequest, @Query() query: Record<string, string | undefined>) {
    return successEnvelope(await this.catalog.listServices({ ...query, includeRequestedStatus: request.currentUser.role === UserRole.admin }));
  }

  @Get(":id")
  async detail(@Param("id") id: string) { return successEnvelope(await this.catalog.service(id)); }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin)
  async create(@Body() body: Record<string, unknown>, @Req() request: AuthenticatedRequest) { return successEnvelope(await this.catalog.createService(body, request.currentUser.id)); }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin)
  async update(@Param("id") id: string, @Body() body: Record<string, unknown>, @Req() request: AuthenticatedRequest) { return successEnvelope(await this.catalog.updateService(id, body, request.currentUser.id)); }

  @Post(":id/deactivate")
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin)
  async deactivate(@Param("id") id: string, @Req() request: AuthenticatedRequest) { return successEnvelope(await this.catalog.deactivateService(id, request.currentUser.id)); }
}
