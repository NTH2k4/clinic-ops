import { Injectable } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { ApiError } from "../common/api-error";
import { PrismaService } from "../prisma/prisma.service";

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
  private readonly sessions = new Map<string, AuthSession>();

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
    this.sessions.set(sessionToken, session);

    return { ...session, sessionToken };
  }

  getSession(sessionToken: string) {
    return this.sessions.get(sessionToken);
  }

  logout(sessionToken: string) {
    this.sessions.delete(sessionToken);
  }

  private unauthenticated() {
    return new ApiError(401, "UNAUTHENTICATED", "Authentication is required.");
  }
}
