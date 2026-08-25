import { Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";
import type { UserRole } from "../types/models";

// This route mapping is shared by sign-in and role switching.
// eslint-disable-next-line react-refresh/only-export-components
export function roleHomePath(role: UserRole): string {
  switch (role) {
    case "patient":
      return "/app/patient";
    case "doctor":
      return "/app/doctor";
    case "receptionist":
    case "nurse":
      return "/app/operations";
    case "admin":
      return "/app/admin";
  }
}

export function RoleHomeRedirect() {
  const { user } = useAuth();

  return <Navigate replace to={user ? roleHomePath(user.role) : "/login"} />;
}
