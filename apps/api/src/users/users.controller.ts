import { Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { type AuthenticatedRequest, SessionGuard } from "../auth/session.guard";
import { listEnvelope, successEnvelope } from "../common/api-response";
import { Roles, RolesGuard } from "../common/roles";
import { parseSchema } from "../common/validation";
import { userListQuerySchema } from "./users.dto";
import { UsersService } from "./users.service";

@Controller("users")
@UseGuards(SessionGuard, RolesGuard)
@Roles(UserRole.admin)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  async list(@Query() rawQuery: Record<string, unknown>) {
    const query = parseSchema(userListQuerySchema, rawQuery);
    const result = await this.users.list(query);
    return listEnvelope(result.items, query.page, query.pageSize, result.total);
  }

  @Get(":id")
  async detail(@Param("id") id: string) {
    return successEnvelope(await this.users.detail(id));
  }

  @Post(":id/lock")
  async lock(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    return successEnvelope(await this.users.lock(id, request.currentUser.id));
  }

  @Post(":id/unlock")
  async unlock(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    return successEnvelope(await this.users.unlock(id, request.currentUser.id));
  }

  @Post(":id/deactivate")
  async deactivate(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    return successEnvelope(await this.users.deactivate(id, request.currentUser.id));
  }

  @Post(":id/reset-password")
  async resetPassword(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    return successEnvelope(await this.users.resetPassword(id, request.currentUser.id));
  }
}
