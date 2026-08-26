import { type CanActivate, type ExecutionContext, Injectable, SetMetadata } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { ApiError } from "./api-error";

export const ROLES_KEY = "roles";
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

type AuthenticatedRequest = Request & {
  currentUser?: { role: UserRole };
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!roles || roles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.currentUser || !roles.includes(request.currentUser.role)) {
      throw new ApiError(403, "FORBIDDEN", "You do not have permission to access this resource.");
    }

    return true;
  }
}
