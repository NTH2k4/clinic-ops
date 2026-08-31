import { useNavigate } from "react-router-dom";
import { isApiMode } from "../lib/dataSource";
import { roleHomePath } from "../routes/RoleHomeRedirect";
import type { UserRole } from "../types/models";
import { useAuth } from "../features/auth/AuthProvider";

const roleOptions: Array<{ label: string; value: UserRole }> = [
  { label: "Người dùng", value: "patient" },
  { label: "Bác sĩ", value: "doctor" },
  { label: "Lễ tân", value: "receptionist" },
  { label: "Điều dưỡng", value: "nurse" },
  { label: "Quản trị", value: "admin" },
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
      aria-description="Chuyển không gian làm việc theo vai trò."
      aria-label="Chuyển vai trò"
      className="h-11 max-w-28 rounded-md border border-border bg-surface px-2 text-sm font-medium text-text transition-colors hover:border-border-strong hover:bg-surface-muted sm:max-w-32"
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
