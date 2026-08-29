import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";
import { roleHomePath } from "./RoleHomeRedirect";
import type { UserRole } from "../types/models";

type RequireRoleProps = {
  allowedRoles: UserRole[];
};

export function RequireRole({ allowedRoles }: RequireRoleProps) {
  const { isRestoringSession, user } = useAuth();

  if (isRestoringSession) {
    return <p className="p-6 text-sm text-text-muted">Đang khôi phục phiên đăng nhập...</p>;
  }

  if (!user) return <Navigate replace to="/login" />;
  if (!allowedRoles.includes(user.role)) return <Navigate replace to={roleHomePath(user.role)} />;

  return <Outlet />;
}
