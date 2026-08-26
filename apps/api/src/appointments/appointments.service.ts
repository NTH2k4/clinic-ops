import { Injectable } from "@nestjs/common";
import { AppointmentStatus, Prisma, UserRole } from "@prisma/client";
import type { AuthSession } from "../auth/auth.service";
import { ApiError } from "../common/api-error";
import { PrismaService } from "../prisma/prisma.service";
import { AppointmentConflictsService } from "./appointment-conflicts.service";
import { canTransition } from "./appointment-rules";

type AppointmentInput = Record<string, unknown>;
type Actor = AuthSession["currentUser"];

const appointmentDetail = {
  patient: true,
  doctor: true,
  service: true,
  statusHistory: { orderBy: { changedAt: "asc" as const } },
};

const transactionAttempts = 3;

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly conflicts: AppointmentConflictsService,
  ) {}

  async create(input: AppointmentInput, actor: Actor, linkedProfile: AuthSession["linkedProfile"]) {
    const patientId = actor.role === UserRole.patient ? this.patientIdForActor(linkedProfile) : this.requiredString(input.patientId, "patientId");
    const serviceId = this.requiredString(input.serviceId, "serviceId");
    const startAt = this.dateTime(input.startAt, "startAt");
    const doctorId = this.optionalString(input.doctorId);
    const status = actor.role === UserRole.patient ? AppointmentStatus.requested : AppointmentStatus.confirmed;

    return this.serializableTransaction(async (transaction) => {
      await this.require(transaction.patient.findUnique({ where: { id: patientId } }), "patient");
      const slot = await this.conflicts.assertSlotAvailable({ doctorId, serviceId, startAt, transaction });
      const appointment = await transaction.appointment.create({
        data: {
          patientId,
          doctorId: slot.doctor.id,
          serviceId: slot.service.id,
          startAt: slot.startAt,
          endAt: slot.endAt,
          status,
          reason: this.optionalString(input.reason),
          internalNote: this.optionalString(input.internalNote),
          createdByUserId: actor.id,
        },
        select: { id: true },
      });
      await transaction.appointmentStatusHistory.create({ data: { appointmentId: appointment.id, toStatus: status, actorUserId: actor.id } });
      await this.audit(transaction, actor.id, appointment.id, "appointment_created", { status });
      return this.detail(transaction, appointment.id);
    });
  }

  async transition(id: string, target: AppointmentStatus, input: AppointmentInput, actor: Actor, linkedProfile: AuthSession["linkedProfile"]) {
    return this.prisma.$transaction(async (transaction) => {
      const appointment = await this.require(transaction.appointment.findUnique({ where: { id } }), "appointment");
      this.assertTransition(appointment.status, target, actor.role);
      this.assertAppointmentActor(appointment, actor, linkedProfile, target);

      const now = new Date();
      const cancellationReason = target === AppointmentStatus.cancelled
        ? actor.role === UserRole.patient
          ? this.optionalString(input.cancellationReason)
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
        data: { appointmentId: id, fromStatus: appointment.status, toStatus: target, actorUserId: actor.id, note: this.optionalString(input.note) },
      });
      await this.audit(transaction, actor.id, id, this.transitionAuditAction(target), { fromStatus: appointment.status, toStatus: target });
      return this.detail(transaction, id);
    });
  }

  async reschedule(id: string, input: AppointmentInput, actor: Actor) {
    const startAt = input.startAt === undefined ? undefined : this.dateTime(input.startAt, "startAt");
    const doctorId = input.doctorId === undefined ? undefined : this.requiredString(input.doctorId, "doctorId");
    const serviceId = input.serviceId === undefined ? undefined : this.requiredString(input.serviceId, "serviceId");
    if (!startAt && !doctorId && !serviceId && input.internalNote === undefined) {
      throw new ApiError(400, "VALIDATION_ERROR", "At least one appointment field is required.");
    }

    return this.serializableTransaction(async (transaction) => {
      const appointment = await this.require(transaction.appointment.findUnique({ where: { id } }), "appointment");
      if (([AppointmentStatus.completed, AppointmentStatus.cancelled, AppointmentStatus.no_show] as AppointmentStatus[]).includes(appointment.status)) {
        throw new ApiError(409, "INVALID_APPOINTMENT_TRANSITION", "Terminal appointments cannot be rescheduled.");
      }

      const slot = await this.conflicts.assertSlotAvailable({
        doctorId: doctorId ?? appointment.doctorId,
        serviceId: serviceId ?? appointment.serviceId,
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
          ...(input.internalNote === undefined ? {} : { internalNote: this.optionalString(input.internalNote) }),
        },
      });
      await this.audit(transaction, actor.id, id, "appointment_rescheduled", {
        oldStartAt: appointment.startAt.toISOString(), oldEndAt: appointment.endAt.toISOString(),
        newStartAt: slot.startAt.toISOString(), newEndAt: slot.endAt.toISOString(),
      });
      return this.detail(transaction, id);
    });
  }

  private assertTransition(from: AppointmentStatus, to: AppointmentStatus, role: UserRole) {
    if (!canTransition(from, to, role)) {
      throw new ApiError(409, "INVALID_APPOINTMENT_TRANSITION", "This appointment status transition is not allowed.");
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

  private detail(transaction: Prisma.TransactionClient, id: string) {
    return this.require(transaction.appointment.findUnique({ where: { id }, include: appointmentDetail }), "appointment");
  }

  private requiredString(value: unknown, field: string) {
    const result = this.optionalString(value);
    if (!result) throw new ApiError(400, "VALIDATION_ERROR", `${field} is required.`, { [field]: "Required" });
    return result;
  }

  private optionalString(value: unknown) { return typeof value === "string" ? value.trim() || undefined : undefined; }

  private dateTime(value: unknown, field: string) {
    if (typeof value !== "string" || !/(?:Z|[+-]\d{2}:\d{2})$/i.test(value)) {
      throw new ApiError(400, "VALIDATION_ERROR", `${field} must be an ISO datetime with timezone.`, { [field]: "Invalid" });
    }
    const result = new Date(value);
    if (Number.isNaN(result.valueOf())) throw new ApiError(400, "VALIDATION_ERROR", `${field} must be an ISO datetime with timezone.`, { [field]: "Invalid" });
    return result;
  }

  private async require<T>(value: Promise<T | null>, entity: string): Promise<T> {
    const resource = await value;
    if (!resource) throw new ApiError(404, "NOT_FOUND", `${entity} was not found.`);
    return resource;
  }
}
