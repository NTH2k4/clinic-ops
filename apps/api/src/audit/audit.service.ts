import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

type AuditRecordInput = {
  entityType: string;
  entityId: string;
  actorUserId: string;
  action: string;
  metadata?: Prisma.InputJsonValue;
  timestamp?: Date;
};

type AuditFilters = {
  entityType?: string;
  action?: string;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  record(input: AuditRecordInput) {
    return this.prisma.auditEvent.create({
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

  list(filters: AuditFilters) {
    return this.prisma.auditEvent.findMany({
      where: { entityType: filters.entityType, action: filters.action },
      orderBy: { timestamp: "desc" },
    });
  }
}
