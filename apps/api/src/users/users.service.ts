import { Injectable } from "@nestjs/common";
import { AccountStatus, type Doctor, type Patient, type Prisma, type Staff, type User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { AuditService } from "../audit/audit.service";
import { ApiError } from "../common/api-error";
import { paginationArgs } from "../common/validation";
import { PrismaService } from "../prisma/prisma.service";
import type { UserListQuery } from "./users.dto";

type UserWithProfiles = User & {
  patient: Patient | null;
  staff: Staff | null;
  doctor: Doctor | null;
};
const resetTemporaryPassword = "careflow123";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async list(query: UserListQuery) {
    const where: Prisma.UserWhereInput = {
      role: query.role,
      status: query.status,
      ...(query.q ? {
        OR: [
          { displayName: { contains: query.q, mode: "insensitive" } },
          { email: { contains: query.q, mode: "insensitive" } },
          { phone: { contains: query.q, mode: "insensitive" } },
        ],
      } : {}),
    };
    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({ where, include: this.profiles, orderBy: [{ displayName: "asc" }, { id: "asc" }], ...paginationArgs(query) }),
      this.prisma.user.count({ where }),
    ]);
    return { items: users.map((user) => this.toResponse(user)), total };
  }

  async detail(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, include: this.profiles });
    if (!user) throw this.notFound();
    return this.toResponse(user);
  }

  async lock(id: string, actorUserId: string) {
    this.assertNotSelf(id, actorUserId, "lock");
    return this.setStatus(id, AccountStatus.locked, [AccountStatus.active], true, {
      actorUserId,
      entityType: "user",
      entityId: id,
      action: "admin_user_locked",
    });
  }

  async unlock(id: string, actorUserId: string) {
    return this.setStatus(id, AccountStatus.active, [AccountStatus.locked], false, {
      actorUserId,
      entityType: "user",
      entityId: id,
      action: "admin_user_unlocked",
    });
  }

  async deactivate(id: string, actorUserId: string) {
    this.assertNotSelf(id, actorUserId, "deactivate");
    return this.setStatus(id, AccountStatus.inactive, [AccountStatus.active, AccountStatus.locked], true, {
      actorUserId,
      entityType: "user",
      entityId: id,
      action: "admin_user_deactivated",
    });
  }

  async resetPassword(id: string, actorUserId: string) {
    const passwordHash = await bcrypt.hash(resetTemporaryPassword, 10);
    await this.prisma.$transaction(async (transaction) => {
      await this.require(transaction.user.findUnique({ where: { id } }));
      await transaction.user.update({ where: { id }, data: { passwordHash } });
      await transaction.authSession.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
      await this.audit.record({ actorUserId, entityType: "user", entityId: id, action: "admin_password_reset" }, transaction);
    });
    return { temporaryPassword: resetTemporaryPassword };
  }

  private readonly profiles = { patient: true, staff: true, doctor: true } satisfies Prisma.UserInclude;

  private async setStatus(
    id: string,
    status: AccountStatus,
    allowedFrom: AccountStatus[],
    revokeSessions: boolean,
    audit: { actorUserId: string; entityType: string; entityId: string; action: string },
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const user = await this.require(transaction.user.findUnique({ where: { id }, include: this.profiles }));
      if (!allowedFrom.includes(user.status)) {
        throw new ApiError(400, "INVALID_STATUS_TRANSITION", "This account status transition is not allowed.");
      }
      const updatedCount = await transaction.user.updateMany({
        where: { id, status: { in: allowedFrom } },
        data: { status },
      });
      if (updatedCount.count !== 1) {
        throw new ApiError(400, "INVALID_STATUS_TRANSITION", "This account status transition is not allowed.");
      }
      if (revokeSessions) {
        await transaction.authSession.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
      }
      await this.audit.record(audit, transaction);
      const updated = await transaction.user.findUniqueOrThrow({ where: { id }, include: this.profiles });
      return this.toResponse(updated);
    });
  }

  private toResponse(user: UserWithProfiles) {
    return {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      linkedProfile: user.patient
        ? { type: "patient", id: user.patient.id }
        : user.staff
          ? { type: "staff", id: user.staff.id }
          : user.doctor
            ? { type: "doctor", id: user.doctor.id }
            : null,
    };
  }

  private assertNotSelf(id: string, actorUserId: string, action: string) {
    if (id === actorUserId) throw new ApiError(400, "VALIDATION_ERROR", `Administrators cannot ${action} their own account.`);
  }

  private async require<T>(value: Promise<T | null>): Promise<T> {
    const user = await value;
    if (!user) throw this.notFound();
    return user;
  }

  private notFound() {
    return new ApiError(404, "NOT_FOUND", "User was not found.");
  }
}
