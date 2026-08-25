import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";
import { navigationForRole } from "./navigation";

type SidebarNavProps = {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
};

export function SidebarNav({ collapsed, onCollapsedChange }: SidebarNavProps) {
  const { user } = useAuth();
  const items = user ? navigationForRole(user.role) : [];
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;
  const toggleLabel = collapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng";

  return (
    <aside className={`hidden shrink-0 border-r border-border bg-surface transition-[width] duration-200 md:flex md:flex-col ${collapsed ? "w-20" : "w-60"}`}>
      <div className={`flex h-16 items-center border-b border-border px-3 text-primary ${collapsed ? "justify-center" : "justify-between gap-2"}`}>
        {collapsed ? null : (
          <div className="flex min-w-0 items-center gap-2">
            <Menu aria-hidden="true" size={20} />
            <span className="truncate font-semibold">CareFlow</span>
          </div>
        )}
        <button
          aria-expanded={!collapsed}
          aria-label={toggleLabel}
          className="flex size-9 items-center justify-center rounded-md border border-border text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
          onClick={() => onCollapsedChange(!collapsed)}
          title={toggleLabel}
          type="button"
        >
          <ToggleIcon aria-hidden="true" size={18} />
        </button>
      </div>
      <nav aria-label="Điều hướng chính" className="space-y-1 p-3">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              aria-label={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex h-10 items-center rounded-md text-sm font-medium transition-colors ${
                  collapsed ? "justify-center px-2" : "gap-3 px-3"
                } ${
                  isActive ? "bg-primary/10 text-primary ring-1 ring-primary/20" : "text-text-muted hover:bg-surface-muted hover:text-text"
                }`
              }
              end={item.to.split("/").length === 3}
              key={item.to}
              title={collapsed ? item.label : undefined}
              to={item.to}
            >
              <Icon aria-hidden="true" size={18} />
              <span className={collapsed ? "sr-only" : ""}>{item.label}</span>
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
