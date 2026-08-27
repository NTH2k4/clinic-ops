import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { ApiError } from "../common/api-error";
import { paginationArgs } from "../common/validation";
import { PrismaService } from "../prisma/prisma.service";
import type { AuditListQuery } from "./audit.dto";

type AuditRecordInput = {
  entityType: string;
  entityId: string;
  actorUserId: string;
  action: string;
  metadata?: Prisma.InputJsonValue;
  timestamp?: Date;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  record(input: AuditRecordInput, prisma: Pick<PrismaService, "auditEvent"> = this.prisma) {
    return prisma.auditEvent.create({
      data: {
        entityType: input.entityType,
        entityId: input.entityId,
        actorUserId: input.actorUserId,
        action: input.action,
        metadata: input.metadata,
        timestamp: input.timestamp,
      },
    });
  }

  async list(query: AuditListQuery) {
    const where: Prisma.AuditEventWhereInput = {
      entityType: query.entityType,
      entityId: query.entityId,
      actorUserId: query.actorUserId,
      action: query.action,
      timestamp: query.from || query.to ? { gte: query.from ? new Date(query.from) : undefined, lte: query.to ? new Date(query.to) : undefined } : undefined,
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditEvent.findMany({ where, orderBy: [{ timestamp: "desc" }, { id: "desc" }], ...paginationArgs(query) }),
      this.prisma.auditEvent.count({ where }),
    ]);
    return { items, total };
  }

  async detail(id: string) {
    const event = await this.prisma.auditEvent.findUnique({ where: { id } });
    if (!event) throw new ApiError(404, "NOT_FOUND", "audit event was not found.");
    return event;
  }
}
