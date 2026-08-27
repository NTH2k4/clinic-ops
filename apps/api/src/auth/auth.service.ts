import { Injectable } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { createHash, randomUUID } from "node:crypto";
import { ApiError } from "../common/api-error";
import { PrismaService } from "../prisma/prisma.service";

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

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(email: string, password: string) {
    if (password !== "careflow-demo") {
      throw this.unauthenticated();
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { patient: true, staff: true, doctor: true },
    });

    if (!user || user.status !== "active") {
      throw this.unauthenticated();
    }

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
    await this.prisma.authSession.create({
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
