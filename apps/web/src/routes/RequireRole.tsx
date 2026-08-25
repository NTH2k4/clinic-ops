import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";
import { roleHomePath } from "./RoleHomeRedirect";
import type { UserRole } from "../types/models";

type RequireRoleProps = {
  allowedRoles: UserRole[];
};

export function RequireRole({ allowedRoles }: RequireRoleProps) {
  const { user } = useAuth();

  if (!user) return <Navigate replace to="/login" />;
  if (!allowedRoles.includes(user.role)) return <Navigate replace to={roleHomePath(user.role)} />;

  return <Outlet />;
}
