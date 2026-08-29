import { type CanActivate, type ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from "express";
import { ApiError } from "../common/api-error";
import { AuthService, type AuthSession } from "./auth.service";

export type AuthenticatedRequest = Request & AuthSession;

export const SESSION_COOKIE_NAME = "careflow_session";

export function extractBearerToken(authorization: string | undefined) {
  return /^Bearer (\S+)$/.exec(authorization ?? "")?.[1];
}

export function extractCookieValue(cookieHeader: string | undefined, name: string) {
  return cookieHeader
    ?.split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export function extractSessionToken(request: Request) {
  return extractBearerToken(request.headers.authorization) ?? extractCookieValue(request.headers.cookie, SESSION_COOKIE_NAME);
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const sessionToken = extractSessionToken(request);
    const session = sessionToken ? await this.authService.getSession(sessionToken) : undefined;

    if (!session) {
      throw new ApiError(401, "UNAUTHENTICATED", "Authentication is required.");
    }

    request.currentUser = session.currentUser;
    request.linkedProfile = session.linkedProfile;
    return true;
  }
}
