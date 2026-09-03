import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { type AuthenticatedRequest, SessionGuard } from "../auth/session.guard";
import { successEnvelope } from "../common/api-response";
import { Roles, RolesGuard } from "../common/roles";
import { parseSchema } from "../common/validation";
import { WalkInAssignmentService } from "./walk-in-assignment.service";
import { walkInCreateSchema, walkInQuoteSchema } from "./walk-in.dto";

@Controller("walk-in-intake")
@UseGuards(SessionGuard, RolesGuard)
@Roles(UserRole.receptionist, UserRole.nurse, UserRole.admin)
export class WalkInController {
  constructor(private readonly walkIn: WalkInAssignmentService) {}

  @Post("quote")
  async quote(@Body() body: Record<string, unknown>) {
    return successEnvelope(await this.walkIn.quote(parseSchema(walkInQuoteSchema, body)));
  }

  @Post()
  async create(@Body() body: Record<string, unknown>, @Req() request: AuthenticatedRequest) {
    return successEnvelope(await this.walkIn.create(parseSchema(walkInCreateSchema, body), request.currentUser));
  }
}
