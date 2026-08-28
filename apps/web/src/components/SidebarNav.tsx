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
    <aside className={`sticky top-0 hidden h-screen shrink-0 border-r border-border bg-white/90 shadow-panel backdrop-blur transition-[width] duration-200 md:flex md:flex-col ${collapsed ? "w-20" : "w-64"}`}>
      <div className={`flex h-16 items-center border-b border-border px-3 text-primary ${collapsed ? "justify-center" : "justify-between gap-3"}`}>
        {collapsed ? null : (
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-md bg-primary text-white shadow-panel">
              <Menu aria-hidden="true" size={19} />
            </span>
            <div className="min-w-0">
              <span className="block truncate text-sm font-semibold text-text">CareFlow</span>
              <span className="block truncate text-xs text-text-muted">Vận hành phòng khám</span>
            </div>
          </div>
        )}
        <button
          aria-expanded={!collapsed}
          aria-label={toggleLabel}
          className="flex size-9 items-center justify-center rounded-md border border-border bg-surface text-text-muted transition-colors hover:border-border-strong hover:bg-surface-muted hover:text-text"
          onClick={() => onCollapsedChange(!collapsed)}
          title={toggleLabel}
          type="button"
        >
          <ToggleIcon aria-hidden="true" size={18} />
        </button>
      </div>
      <nav aria-label="Điều hướng chính" className="space-y-1.5 p-3">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              aria-label={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex h-10 items-center rounded-md text-sm font-medium transition-colors ${
                  collapsed ? "justify-center px-2" : "gap-3 px-3"
                } ${
                  isActive ? "bg-primary text-white shadow-panel" : "text-text-muted hover:bg-surface-muted hover:text-text"
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
    <nav aria-label="Điều hướng di động" className="sticky bottom-0 z-10 snap-x overflow-x-auto border-t border-border bg-surface/95 shadow-popover backdrop-blur md:hidden">
      <div className="flex min-w-max gap-1 px-2 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              className={({ isActive }) =>
                `flex h-11 shrink-0 snap-start items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors ${
                  isActive ? "bg-primary text-white shadow-panel" : "text-text-muted hover:bg-surface-muted hover:text-text"
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
