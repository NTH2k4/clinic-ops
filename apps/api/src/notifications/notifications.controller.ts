import { Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { type AuthenticatedRequest, SessionGuard } from "../auth/session.guard";
import { listEnvelope, successEnvelope } from "../common/api-response";
import { paginationFields, parseSchema } from "../common/validation";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
@UseGuards(SessionGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  async list(@Req() request: AuthenticatedRequest, @Query() rawQuery: Record<string, unknown>) {
    const pagination = parseSchema(z.object(paginationFields).strict(), rawQuery);
    const result = await this.notifications.list(request.currentUser.id, pagination);
    return listEnvelope(result.items, pagination.page, pagination.pageSize, result.total);
  }

  @Post(":id/read")
  async markRead(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    return successEnvelope(await this.notifications.markRead(id, request.currentUser.id));
  }

  @Post("read-all")
  async markAllRead(@Req() request: AuthenticatedRequest) {
    return successEnvelope(await this.notifications.markAllRead(request.currentUser.id));
  }
}
