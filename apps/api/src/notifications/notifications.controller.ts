import { Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { type AuthenticatedRequest, SessionGuard } from "../auth/session.guard";
import { successEnvelope } from "../common/api-response";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
@UseGuards(SessionGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  async list(@Req() request: AuthenticatedRequest) {
    return successEnvelope(await this.notifications.list(request.currentUser.id));
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
