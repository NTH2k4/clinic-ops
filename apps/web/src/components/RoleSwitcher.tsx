import { useNavigate } from "react-router-dom";
import { isApiMode } from "../lib/dataSource";
import { roleHomePath } from "../routes/RoleHomeRedirect";
import type { UserRole } from "../types/models";
import { useAuth } from "../features/auth/AuthProvider";

const roleOptions: Array<{ label: string; value: UserRole }> = [
  { label: "Patient", value: "patient" },
  { label: "Doctor", value: "doctor" },
  { label: "Operations", value: "receptionist" },
  { label: "Nurse", value: "nurse" },
  { label: "Admin", value: "admin" },
];

export function RoleSwitcher() {
  const navigate = useNavigate();
  const { switchRole, user } = useAuth();

  if (isApiMode || !user) {
    return null;
  }

  function handleRoleChange(role: UserRole) {
    switchRole(role);
    navigate(roleHomePath(role));
  }

  return (
    <select
      aria-description="Công cụ prototype để xem các không gian làm việc theo vai trò."
      aria-label="Chuyển vai trò"
      className="h-11 max-w-32 rounded-md border border-border bg-surface px-2 text-sm text-text"
      onChange={(event) => handleRoleChange(event.target.value as UserRole)}
      value={user.role}
    >
      {roleOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
