import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { SessionGuard } from "../auth/session.guard";
import { successEnvelope } from "../common/api-response";
import { Roles, RolesGuard } from "../common/roles";
import { AuditService } from "./audit.service";

@Controller("audit-events")
@UseGuards(SessionGuard)
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin)
  async list(@Query("entityType") entityType: string | undefined, @Query("action") action: string | undefined) {
    return successEnvelope(await this.audit.list({ entityType, action }));
  }
}
