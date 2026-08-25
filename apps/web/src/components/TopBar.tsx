import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";
import { RoleSwitcher } from "./RoleSwitcher";

export function TopBar() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  function handleSignOut() {
    signOut();
    navigate("/login", { replace: true });
  }

  return (
    <header className="flex min-h-16 items-center justify-between gap-3 border-b border-border bg-surface px-4 md:px-6">
      <p className="font-semibold text-text md:hidden">CareFlow</p>
      <div className="ml-auto flex items-center gap-2">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-text">{user?.displayName}</p>
          <p className="text-xs text-text-muted">{user?.role}</p>
        </div>
        <RoleSwitcher />
        <button
          aria-label="Đăng xuất"
          className="flex size-11 items-center justify-center rounded-md border border-border text-text-muted hover:bg-surface-muted hover:text-text"
          onClick={handleSignOut}
          title="Đăng xuất"
          type="button"
        >
          <LogOut aria-hidden="true" size={18} />
        </button>
      </div>
    </header>
  );
}
