import { Activity, CalendarDays, ClipboardList, Home, Menu, Settings, Users } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";
import type { UserRole } from "../types/models";

type NavItem = {
  icon: typeof Home;
  label: string;
  to: string;
};

const navigationByRole: Record<UserRole, NavItem[]> = {
  patient: [
    { icon: Home, label: "Trang chính", to: "/app/patient" },
    { icon: Activity, label: "Dịch vụ", to: "/app/patient/services" },
    { icon: CalendarDays, label: "Đặt lịch", to: "/app/patient/book" },
    { icon: ClipboardList, label: "Lịch của tôi", to: "/app/patient/appointments" },
  ],
  doctor: [
    { icon: Home, label: "Dashboard", to: "/app/doctor" },
    { icon: CalendarDays, label: "Lịch ngày", to: "/app/doctor/day" },
    { icon: CalendarDays, label: "Lịch tuần", to: "/app/doctor/week" },
  ],
  receptionist: [
    { icon: Home, label: "Dashboard", to: "/app/operations" },
    { icon: ClipboardList, label: "Hàng đợi", to: "/app/operations/queue" },
    { icon: CalendarDays, label: "Lịch", to: "/app/operations/calendar" },
    { icon: CalendarDays, label: "Tạo lịch", to: "/app/operations/appointments/new" },
  ],
  nurse: [
    { icon: Home, label: "Dashboard", to: "/app/operations" },
    { icon: ClipboardList, label: "Hàng đợi", to: "/app/operations/queue" },
    { icon: CalendarDays, label: "Lịch", to: "/app/operations/calendar" },
    { icon: CalendarDays, label: "Tạo lịch", to: "/app/operations/appointments/new" },
  ],
  admin: [
    { icon: Home, label: "Dashboard", to: "/app/admin" },
    { icon: Users, label: "Bác sĩ", to: "/app/admin/doctors" },
    { icon: Settings, label: "Dịch vụ", to: "/app/admin/services" },
    { icon: Settings, label: "Chuyên khoa", to: "/app/admin/specialties" },
    { icon: Users, label: "Nhân sự", to: "/app/admin/staff" },
    { icon: ClipboardList, label: "Audit log", to: "/app/admin/audit" },
  ],
};

export function SidebarNav() {
  const { user } = useAuth();
  const items = user ? navigationByRole[user.role] : [];

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
