import { Menu } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";
import { navigationForRole } from "./navigation";

export function SidebarNav() {
  const { user } = useAuth();
  const items = user ? navigationForRole(user.role) : [];

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-surface md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-border px-5 text-primary">
        <Menu aria-hidden="true" size={20} />
        <span className="font-semibold">CareFlow</span>
      </div>
      <nav aria-label="Điều hướng chính" className="space-y-1 p-3">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              className={({ isActive }) =>
                `flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors ${
                  isActive ? "bg-surface-muted text-primary" : "text-text-muted hover:bg-surface-muted hover:text-text"
                }`
              }
              end={item.to.split("/").length === 3}
              key={item.to}
              to={item.to}
            >
              <Icon aria-hidden="true" size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

export function MobileNav() {
  const { user } = useAuth();
  const items = user ? navigationForRole(user.role) : [];

  return (
    <nav aria-label="Điều hướng di động" className="overflow-x-auto border-t border-border bg-surface md:hidden">
      <div className="flex min-w-max gap-1 px-2 py-2">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              className={({ isActive }) =>
                `flex h-11 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors ${
                  isActive ? "bg-surface-muted text-primary" : "text-text-muted hover:bg-surface-muted hover:text-text"
                }`
              }
              end={item.to.split("/").length === 3}
              key={item.to}
              to={item.to}
            >
              <Icon aria-hidden="true" size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
