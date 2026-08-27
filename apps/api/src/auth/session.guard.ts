import { type CanActivate, type ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from "express";
import { ApiError } from "../common/api-error";
import { AuthService, type AuthSession } from "./auth.service";

export type AuthenticatedRequest = Request & AuthSession;

export function extractBearerToken(authorization: string | undefined) {
  return /^Bearer (\S+)$/.exec(authorization ?? "")?.[1];
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const sessionToken = extractBearerToken(request.headers.authorization);
    const session = sessionToken ? await this.authService.getSession(sessionToken) : undefined;

    if (!session) {
      throw new ApiError(401, "UNAUTHENTICATED", "Authentication is required.");
    }

    request.currentUser = session.currentUser;
    request.linkedProfile = session.linkedProfile;
    return true;
  }
}
