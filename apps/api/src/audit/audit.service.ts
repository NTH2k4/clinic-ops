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

type AuditEventRecord = Prisma.AuditEventGetPayload<{
  include: {
    actorUser: { select: { displayName: true; email: true } };
    appointment: { include: { patient: true; doctor: true; service: true } };
  };
}>;

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
      this.prisma.auditEvent.findMany({
        where,
        include: this.auditEventDetail,
        orderBy: [{ timestamp: "desc" }, { id: "desc" }],
        ...paginationArgs(query),
      }),
      this.prisma.auditEvent.count({ where }),
    ]);
    return { items: await this.enrich(items), total };
  }

  async detail(id: string) {
    const event = await this.prisma.auditEvent.findUnique({ where: { id }, include: this.auditEventDetail });
    if (!event) throw new ApiError(404, "NOT_FOUND", "audit event was not found.");
    return (await this.enrich([event]))[0];
  }

  private readonly auditEventDetail = {
    actorUser: { select: { displayName: true, email: true } },
    appointment: { include: { patient: true, doctor: true, service: true } },
  } satisfies Prisma.AuditEventInclude;

  private async enrich(events: AuditEventRecord[]) {
    const displayNames = await this.entityDisplayNames(events);
    return events.map((event) => {
      const { actorUser, appointment, ...record } = event;
      return {
        ...record,
        actorDisplayName: actorUser.displayName || actorUser.email,
        entityDisplayName: displayNames.get(this.entityKey(event.entityType, event.entityId))
          ?? this.appointmentDisplayName(appointment)
          ?? event.entityId,
      };
    });
  }

  private async entityDisplayNames(events: AuditEventRecord[]) {
    const idsByType = new Map<string, Set<string>>();
    for (const event of events) {
      if (event.entityType === "appointment") continue;
      const ids = idsByType.get(event.entityType) ?? new Set<string>();
      ids.add(event.entityId);
      idsByType.set(event.entityType, ids);
    }

    const names = new Map<string, string>();
    await Promise.all([
      this.addNames(names, "doctor", idsByType.get("doctor"), (ids) => this.prisma.doctor.findMany({ where: { id: { in: ids } }, select: { id: true, fullName: true } }), (item) => item.fullName),
      this.addNames(names, "patient", idsByType.get("patient"), (ids) => this.prisma.patient.findMany({ where: { id: { in: ids } }, select: { id: true, fullName: true } }), (item) => item.fullName),
      this.addNames(names, "service", idsByType.get("service"), (ids) => this.prisma.service.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }), (item) => item.name),
      this.addNames(names, "specialty", idsByType.get("specialty"), (ids) => this.prisma.specialty.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }), (item) => item.name),
      this.addNames(names, "schedule", idsByType.get("schedule"), async (ids) => {
        const schedules = await this.prisma.doctorSchedule.findMany({ where: { id: { in: ids } }, include: { doctor: { select: { fullName: true } } } });
        return schedules.map((schedule) => ({ id: schedule.id, name: `${schedule.doctor.fullName} ${schedule.startTime}-${schedule.endTime}` }));
      }, (item) => item.name),
      this.addNames(names, "user", idsByType.get("user"), (ids) => this.prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, displayName: true, email: true } }), (item) => item.displayName || item.email),
    ]);
    return names;
  }

  private async addNames<T extends { id: string }>(
    names: Map<string, string>,
    entityType: string,
    ids: Set<string> | undefined,
    load: (ids: string[]) => Promise<T[]>,
    label: (item: T) => string,
  ) {
    if (!ids?.size) return;
    const items = await load([...ids]);
    for (const item of items) {
      names.set(this.entityKey(entityType, item.id), label(item));
    }
  }

  private appointmentDisplayName(appointment: AuditEventRecord["appointment"]) {
    if (!appointment) return undefined;
    return `${appointment.patient.fullName} - ${appointment.service.name}`;
  }

  private entityKey(entityType: string, entityId: string) {
    return `${entityType}:${entityId}`;
  }
}
