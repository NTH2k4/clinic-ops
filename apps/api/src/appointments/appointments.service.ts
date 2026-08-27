import { Injectable, Logger } from "@nestjs/common";
import { AccountStatus, AppointmentStatus, Prisma, UserRole } from "@prisma/client";
import type { AuthSession } from "../auth/auth.service";
import { ApiError } from "../common/api-error";
import { currentRequestId } from "../common/request-context";
import { paginationArgs } from "../common/validation";
import { PrismaService } from "../prisma/prisma.service";
import { AppointmentConflictsService } from "./appointment-conflicts.service";
import type { AppointmentCreateInput, AppointmentListQuery, AppointmentTransitionInput, AppointmentUpdateInput } from "./appointments.dto";
import { canTransition } from "./appointment-rules";

type Actor = AuthSession["currentUser"];

const appointmentDetail = {
  patient: true,
  doctor: true,
  service: true,
  statusHistory: { orderBy: { changedAt: "asc" as const } },
};

const patientAppointmentDetail = {
  omit: { internalNote: true },
  include: {
    patient: true,
    doctor: true,
    service: true,
    statusHistory: { omit: { note: true }, orderBy: { changedAt: "asc" as const } },
  },
};

const transactionAttempts = 3;

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly conflicts: AppointmentConflictsService,
  ) {}

  async list(query: AppointmentListQuery, actor: Actor, linkedProfile: AuthSession["linkedProfile"]) {
    const where: Prisma.AppointmentWhereInput = {
      status: query.status,
      patientId: query.patientId,
      doctorId: query.doctorId,
      serviceId: query.serviceId,
      service: query.specialtyId ? { specialtyId: query.specialtyId } : undefined,
      startAt: query.from || query.to ? { gte: query.from ? new Date(query.from) : undefined, lte: query.to ? new Date(query.to) : undefined } : undefined,
      ...(query.q ? { OR: [
        { patient: { fullName: { contains: query.q, mode: "insensitive" } } },
        { doctor: { fullName: { contains: query.q, mode: "insensitive" } } },
        { service: { name: { contains: query.q, mode: "insensitive" } } },
        { reason: { contains: query.q, mode: "insensitive" } },
      ] } : {}),
      ...this.actorScope(actor, linkedProfile),
    };
    if (actor.role === UserRole.patient) {
      const [items, total] = await this.prisma.$transaction([
        this.prisma.appointment.findMany({ where, ...patientAppointmentDetail, orderBy: [{ startAt: "asc" }, { id: "asc" }], ...paginationArgs(query) }),
        this.prisma.appointment.count({ where }),
      ]);
      return { items, total };
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.appointment.findMany({ where, include: appointmentDetail, orderBy: [{ startAt: "asc" }, { id: "asc" }], ...paginationArgs(query) }),
      this.prisma.appointment.count({ where }),
    ]);
    return { items, total };
  }

  async authorizedDetail(id: string, actor: Actor, linkedProfile: AuthSession["linkedProfile"]) {
    if (actor.role === UserRole.patient) {
      const appointment = await this.require(this.prisma.appointment.findUnique({ where: { id }, ...patientAppointmentDetail }), "appointment");
      this.assertReadActor(appointment, actor, linkedProfile);
      return appointment;
    }
    const appointment = await this.require(this.prisma.appointment.findUnique({ where: { id }, include: appointmentDetail }), "appointment");
    this.assertReadActor(appointment, actor, linkedProfile);
    return appointment;
  }

  async create(input: AppointmentCreateInput, actor: Actor, linkedProfile: AuthSession["linkedProfile"]) {
    const actorPatientId = actor.role === UserRole.patient ? this.patientIdForActor(linkedProfile) : undefined;
    if (actorPatientId && "patientId" in input && input.patientId !== undefined && input.patientId !== actorPatientId) {
      throw new ApiError(403, "FORBIDDEN", "You cannot create an appointment for another patient.");
    }
    const patientId = actorPatientId ?? ("patientId" in input ? input.patientId : undefined);
    if (!patientId) throw new ApiError(400, "VALIDATION_ERROR", "patientId is required.");
    const startAt = new Date(input.startAt);
    const status = actor.role === UserRole.patient ? AppointmentStatus.requested : AppointmentStatus.confirmed;

    const created = await this.serializableTransaction(async (transaction) => {
      const patient = await this.require(transaction.patient.findUnique({ where: { id: patientId } }), "patient");
      if (patient.status !== AccountStatus.active) throw new ApiError(409, "PATIENT_INACTIVE", "patient is not active.");
      const slot = await this.conflicts.assertSlotAvailable({ doctorId: input.doctorId, serviceId: input.serviceId, startAt, transaction });
      const appointment = await transaction.appointment.create({
        data: {
          patientId,
          doctorId: slot.doctor.id,
          serviceId: slot.service.id,
          startAt: slot.startAt,
          endAt: slot.endAt,
          status,
          reason: input.reason,
          internalNote: "internalNote" in input ? input.internalNote : undefined,
          createdByUserId: actor.id,
        },
        select: { id: true },
      });
      await transaction.appointmentStatusHistory.create({ data: { appointmentId: appointment.id, toStatus: status, actorUserId: actor.id } });
      await this.audit(transaction, actor.id, appointment.id, "appointment_created", { status, ...(input.source ? { source: input.source } : {}) });
      return this.detail(transaction, appointment.id, actor.role);
    });
    this.logAppointmentWorkflow("appointment_created", created.id, actor.id, { status: created.status });
    return created;
  }

  async transition(id: string, target: AppointmentStatus, input: AppointmentTransitionInput, actor: Actor, linkedProfile: AuthSession["linkedProfile"]) {
    const transitioned = await this.serializableTransaction(async (transaction) => {
      const appointment = await this.require(transaction.appointment.findUnique({ where: { id } }), "appointment");
      this.assertTransition(appointment.status, target, actor.role);
      this.assertAppointmentActor(appointment, actor, linkedProfile, target);

      const now = new Date();
      const cancellationReason = target === AppointmentStatus.cancelled
        ? actor.role === UserRole.patient
          ? input.cancellationReason
          : this.requiredString(input.cancellationReason, "cancellationReason")
        : undefined;
      await transaction.appointment.update({
        where: { id },
        data: {
          status: target,
          updatedByUserId: actor.id,
          ...(target === AppointmentStatus.checked_in ? { checkedInAt: now } : {}),
          ...(target === AppointmentStatus.in_progress ? { startedAt: now } : {}),
          ...(target === AppointmentStatus.completed ? { completedAt: now } : {}),
          ...(target === AppointmentStatus.cancelled ? { cancelledAt: now, cancellationReason } : {}),
        },
      });
      await transaction.appointmentStatusHistory.create({
        data: { appointmentId: id, fromStatus: appointment.status, toStatus: target, actorUserId: actor.id, note: input.note },
      });
      await this.audit(transaction, actor.id, id, this.transitionAuditAction(target), { fromStatus: appointment.status, toStatus: target });
      return this.detail(transaction, id, actor.role);
    });
    this.logAppointmentWorkflow(this.transitionAuditAction(target), id, actor.id, { status: transitioned.status });
    return transitioned;
  }

  async reschedule(id: string, input: AppointmentUpdateInput, actor: Actor) {
    const startAt = input.startAt === undefined ? undefined : new Date(input.startAt);
    const rescheduled = await this.serializableTransaction(async (transaction) => {
      const appointment = await this.require(transaction.appointment.findUnique({ where: { id } }), "appointment");
      if (([AppointmentStatus.completed, AppointmentStatus.cancelled, AppointmentStatus.no_show] as AppointmentStatus[]).includes(appointment.status)) {
        throw new ApiError(409, "INVALID_STATUS_TRANSITION", "Terminal appointments cannot be rescheduled.");
      }

      const hasSlotChange = startAt !== undefined || input.doctorId !== undefined || input.serviceId !== undefined;
      if (!hasSlotChange) {
        await transaction.appointment.update({ where: { id }, data: { internalNote: input.internalNote, updatedByUserId: actor.id } });
        await this.audit(transaction, actor.id, id, "appointment_updated", { fields: ["internalNote"] });
        return this.detail(transaction, id, actor.role);
      }

      const slot = await this.conflicts.assertSlotAvailable({
        doctorId: input.doctorId ?? appointment.doctorId,
        serviceId: input.serviceId ?? appointment.serviceId,
        startAt: startAt ?? appointment.startAt,
        excludeAppointmentId: appointment.id,
        transaction,
      });
      await transaction.appointment.update({
        where: { id },
        data: {
          doctorId: slot.doctor.id,
          serviceId: slot.service.id,
          startAt: slot.startAt,
          endAt: slot.endAt,
          updatedByUserId: actor.id,
          ...(input.internalNote === undefined ? {} : { internalNote: input.internalNote }),
        },
      });
      await this.audit(transaction, actor.id, id, "appointment_rescheduled", {
        oldStartAt: appointment.startAt.toISOString(), oldEndAt: appointment.endAt.toISOString(),
        newStartAt: slot.startAt.toISOString(), newEndAt: slot.endAt.toISOString(),
      });
      return this.detail(transaction, id, actor.role);
    });
    this.logAppointmentWorkflow(
      startAt !== undefined || input.doctorId !== undefined || input.serviceId !== undefined ? "appointment_rescheduled" : "appointment_updated",
      id,
      actor.id,
      { status: rescheduled.status },
    );
    return rescheduled;
  }

  private assertTransition(from: AppointmentStatus, to: AppointmentStatus, role: UserRole) {
    if (!canTransition(from, to, role)) {
      throw new ApiError(409, "INVALID_STATUS_TRANSITION", "This appointment status transition is not allowed.");
    }
  }

  private assertAppointmentActor(appointment: { patientId: string; doctorId: string }, actor: Actor, linkedProfile: AuthSession["linkedProfile"], target: AppointmentStatus) {
    if (actor.role === UserRole.patient && (target !== AppointmentStatus.cancelled || linkedProfile?.type !== "patient" || linkedProfile.id !== appointment.patientId)) {
      throw new ApiError(403, "FORBIDDEN", "You do not have permission to access this resource.");
    }
    if (actor.role === UserRole.doctor && (linkedProfile?.type !== "doctor" || linkedProfile.id !== appointment.doctorId)) {
      throw new ApiError(403, "FORBIDDEN", "You do not have permission to access this resource.");
    }
  }

  private actorScope(actor: Actor, linkedProfile: AuthSession["linkedProfile"]): Prisma.AppointmentWhereInput {
    if (actor.role === UserRole.patient) return { patientId: this.patientIdForActor(linkedProfile) };
    if (actor.role === UserRole.doctor) {
      if (linkedProfile?.type !== "doctor") throw new ApiError(403, "FORBIDDEN", "You do not have a doctor profile.");
      return { doctorId: linkedProfile.id };
    }
    return {};
  }

  private assertReadActor(appointment: { patientId: string; doctorId: string }, actor: Actor, linkedProfile: AuthSession["linkedProfile"]) {
    if (actor.role === UserRole.patient && (linkedProfile?.type !== "patient" || linkedProfile.id !== appointment.patientId)) {
      throw new ApiError(403, "FORBIDDEN", "You do not have permission to access this resource.");
    }
    if (actor.role === UserRole.doctor && (linkedProfile?.type !== "doctor" || linkedProfile.id !== appointment.doctorId)) {
      throw new ApiError(403, "FORBIDDEN", "You do not have permission to access this resource.");
    }
  }

  private patientIdForActor(linkedProfile: AuthSession["linkedProfile"]) {
    if (linkedProfile?.type !== "patient") throw new ApiError(403, "FORBIDDEN", "You do not have a patient profile.");
    return linkedProfile.id;
  }

  private transitionAuditAction(status: AppointmentStatus) {
    const actions: Partial<Record<AppointmentStatus, string>> = {
      confirmed: "appointment_confirmed",
      cancelled: "appointment_cancelled",
      checked_in: "appointment_checked_in",
      in_progress: "appointment_started",
      completed: "appointment_completed",
      no_show: "appointment_no_show",
    };
    return actions[status] ?? "appointment_status_changed";
  }

  private audit(transaction: Prisma.TransactionClient, actorUserId: string, appointmentId: string, action: string, metadata: Prisma.InputJsonValue) {
    return transaction.auditEvent.create({ data: { actorUserId, appointmentId, entityType: "appointment", entityId: appointmentId, action, metadata } });
  }

  private logAppointmentWorkflow(action: string, appointmentId: string, actorUserId: string, metadata: Record<string, unknown>) {
    this.logger.log(JSON.stringify({
      event: "appointment_workflow",
      requestId: currentRequestId(),
      action,
      appointmentId,
      actorUserId,
      metadata,
    }));
  }

  private async serializableTransaction<T>(work: (transaction: Prisma.TransactionClient) => Promise<T>) {
    let lastError: unknown;
    for (let attempt = 0; attempt < transactionAttempts; attempt += 1) {
      try {
        return await this.prisma.$transaction(work, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      } catch (error) {
        lastError = error;
        if (!this.isSerializationFailure(error) || attempt === transactionAttempts - 1) throw error;
      }
    }
    throw lastError;
  }

  private isSerializationFailure(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
  }

  private detail(transaction: Prisma.TransactionClient, id: string, role: UserRole) {
    if (role === UserRole.patient) {
      return this.require(transaction.appointment.findUnique({ where: { id }, ...patientAppointmentDetail }), "appointment");
    }
    return this.require(transaction.appointment.findUnique({ where: { id }, include: appointmentDetail }), "appointment");
  }

  private requiredString(value: unknown, field: string) {
    const result = this.optionalString(value);
    if (!result) throw new ApiError(400, "VALIDATION_ERROR", `${field} is required.`, { [field]: "Required" });
    return result;
  }

  private optionalString(value: unknown) { return typeof value === "string" ? value.trim() || undefined : undefined; }

  private async require<T>(value: Promise<T | null>, entity: string): Promise<T> {
    const resource = await value;
    if (!resource) throw new ApiError(404, "NOT_FOUND", `${entity} was not found.`);
    return resource;
  }
}
