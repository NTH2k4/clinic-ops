import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { SessionGuard } from "../auth/session.guard";
import { listEnvelope, successEnvelope } from "../common/api-response";
import { Roles, RolesGuard } from "../common/roles";
import { parseSchema } from "../common/validation";
import { auditListQuerySchema } from "./audit.dto";
import { AuditService } from "./audit.service";

@Controller("audit-events")
@UseGuards(SessionGuard)
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin)
  async list(@Query() rawQuery: Record<string, unknown>) {
    const query = parseSchema(auditListQuerySchema, rawQuery);
    const result = await this.audit.list(query);
    return listEnvelope(result.items, query.page, query.pageSize, result.total);
  }

  @Get(":id")
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin)
  async detail(@Param("id") id: string) {
    return successEnvelope(await this.audit.detail(id));
  }
}
