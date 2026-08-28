import { Injectable } from "@nestjs/common";
import { AccountStatus, type Patient, type Staff, type Doctor, type User, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createHash, randomUUID } from "node:crypto";
import { ApiError } from "../common/api-error";
import { PrismaService } from "../prisma/prisma.service";
import type { ChangePasswordInput, PatientRegistrationInput } from "./auth.dto";

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

function hashSessionToken(sessionToken: string) {
  return createHash("sha256").update(sessionToken).digest("hex");
}

export type CurrentUser = {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  status: "active" | "inactive" | "locked";
};

export type LinkedProfile =
  | { type: "patient"; id: string }
  | { type: "staff"; id: string }
  | { type: "doctor"; id: string }
  | null;

export type AuthSession = {
  currentUser: CurrentUser;
  linkedProfile: LinkedProfile;
};

export type AuthLoginResult = AuthSession & {
  sessionToken: string;
};

type UserWithProfiles = User & {
  patient: Patient | null;
  staff: Staff | null;
  doctor: Doctor | null;
};

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(email: string, password: string): Promise<AuthLoginResult> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { patient: true, staff: true, doctor: true },
    });

    if (!user || user.status !== "active" || !(await bcrypt.compare(password, user.passwordHash))) {
      throw this.unauthenticated();
    }

    return this.prisma.$transaction(async (tx) => {
      const lockedUserCount = await tx.$executeRaw`
        UPDATE "User"
        SET "passwordHash" = "passwordHash"
        WHERE "id" = ${user.id} AND "passwordHash" = ${user.passwordHash} AND "status" = ${AccountStatus.active}::"AccountStatus"
      `;
      if (lockedUserCount !== 1) throw this.unauthenticated();

      return this.createAuthSession(user, tx);
    });
  }

  async registerPatient(input: PatientRegistrationInput): Promise<AuthLoginResult> {
    const passwordHash = await bcrypt.hash(input.password, 10);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          displayName: input.displayName,
          email: input.email,
          phone: input.phone,
          passwordHash,
          role: UserRole.patient,
          status: AccountStatus.active,
          patient: {
            create: {
              fullName: input.displayName,
              email: input.email,
              phone: input.phone,
              status: AccountStatus.active,
            },
          },
        },
        include: { patient: true, staff: true, doctor: true },
      });

      return this.createAuthSession(user, tx);
    });
  }

  async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !(await bcrypt.compare(input.currentPassword, user.passwordHash))) {
      throw new ApiError(401, "UNAUTHENTICATED", "Current password is incorrect.");
    }
    if (await bcrypt.compare(input.newPassword, user.passwordHash)) {
      throw new ApiError(400, "VALIDATION_ERROR", "New password must be different from the current password.");
    }

    const passwordHash = await bcrypt.hash(input.newPassword, 10);
    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.updateMany({
        where: { id: userId, passwordHash: user.passwordHash, status: AccountStatus.active },
        data: { passwordHash },
      });
      if (updated.count !== 1) {
        throw new ApiError(401, "UNAUTHENTICATED", "Current password is incorrect.");
      }
      await tx.authSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });
  }

  private async createAuthSession(user: UserWithProfiles, prisma: Pick<PrismaService, "authSession"> = this.prisma): Promise<AuthLoginResult> {
    const session: AuthSession = {
      currentUser: {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      linkedProfile: user.patient
        ? { type: "patient", id: user.patient.id }
        : user.staff
          ? { type: "staff", id: user.staff.id }
          : user.doctor
            ? { type: "doctor", id: user.doctor.id }
            : null,
    };
    const sessionToken = randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await prisma.authSession.create({
      data: {
        tokenHash: hashSessionToken(sessionToken),
        userId: user.id,
        expiresAt,
      },
    });

    return { ...session, sessionToken };
  }

  async getSession(sessionToken: string) {
    const storedSession = await this.prisma.authSession.findUnique({
      where: { tokenHash: hashSessionToken(sessionToken) },
      include: {
        user: {
          include: { patient: true, staff: true, doctor: true },
        },
      },
    });

    if (!storedSession || storedSession.revokedAt || storedSession.expiresAt <= new Date()) {
      return undefined;
    }

    const user = storedSession.user;
    if (user.status !== "active") {
      return undefined;
    }

    return {
      currentUser: {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      linkedProfile: user.patient
        ? { type: "patient", id: user.patient.id }
        : user.staff
          ? { type: "staff", id: user.staff.id }
          : user.doctor
            ? { type: "doctor", id: user.doctor.id }
            : null,
    } satisfies AuthSession;
  }

  async logout(sessionToken: string) {
    await this.prisma.authSession.updateMany({
      where: { tokenHash: hashSessionToken(sessionToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private unauthenticated() {
    return new ApiError(401, "UNAUTHENTICATED", "Authentication is required.");
  }
}
