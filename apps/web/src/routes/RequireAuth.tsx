import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";

export function RequireAuth() {
  const { isRestoringSession, user } = useAuth();
  const location = useLocation();

  if (isRestoringSession) {
    return <p className="p-6 text-sm text-text-muted">Đang khôi phục phiên đăng nhập...</p>;
  }

  if (!user) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  return <Outlet />;
}
