import { Activity, CalendarDays, ClipboardList, Home, Settings, Users } from "lucide-react";
import type { UserRole } from "../types/models";

export type NavItem = {
  icon: typeof Home;
  label: string;
  to: string;
};

const operationsNavigation: NavItem[] = [
  { icon: Home, label: "Dashboard", to: "/app/operations" },
  { icon: ClipboardList, label: "Hàng đợi", to: "/app/operations/queue" },
  { icon: CalendarDays, label: "Lịch", to: "/app/operations/calendar" },
  { icon: CalendarDays, label: "Tạo lịch", to: "/app/operations/appointments/new" },
];

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
  receptionist: operationsNavigation,
  nurse: operationsNavigation,
  admin: [
    { icon: Home, label: "Dashboard", to: "/app/admin" },
    { icon: Users, label: "Accounts", to: "/app/admin/accounts" },
    { icon: Users, label: "Bác sĩ", to: "/app/admin/doctors" },
    { icon: CalendarDays, label: "Schedules", to: "/app/admin/schedules" },
    { icon: Settings, label: "Dịch vụ", to: "/app/admin/services" },
    { icon: Settings, label: "Chuyên khoa", to: "/app/admin/specialties" },
    { icon: Users, label: "Nhân sự", to: "/app/admin/staff" },
    { icon: ClipboardList, label: "Audit log", to: "/app/admin/audit" },
  ],
};

export function navigationForRole(role: UserRole): NavItem[] {
  return navigationByRole[role];
}
