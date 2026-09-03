import { Activity, CalendarDays, ClipboardList, Home, Settings, UserRound, UserRoundPlus, Users } from "lucide-react";
import type { UserRole } from "../types/models";

export type NavItem = {
  icon: typeof Home;
  label: string;
  to: string;
};

const operationsNavigation: NavItem[] = [
  { icon: Home, label: "Tổng quan", to: "/app/operations" },
  { icon: ClipboardList, label: "Hàng đợi", to: "/app/operations/queue" },
  { icon: UserRoundPlus, label: "Tiếp nhận trực tiếp", to: "/app/operations/walk-in" },
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
    { icon: Home, label: "Tổng quan", to: "/app/doctor" },
    { icon: CalendarDays, label: "Lịch ngày", to: "/app/doctor/day" },
    { icon: CalendarDays, label: "Lịch tuần", to: "/app/doctor/week" },
  ],
  receptionist: operationsNavigation,
  nurse: operationsNavigation,
  admin: [
    { icon: Home, label: "Tổng quan", to: "/app/admin" },
    { icon: UserRoundPlus, label: "Tiếp nhận trực tiếp", to: "/app/operations/walk-in" },
    { icon: Users, label: "Tài khoản", to: "/app/admin/accounts" },
    { icon: Users, label: "Bác sĩ", to: "/app/admin/doctors" },
    { icon: CalendarDays, label: "Lịch làm việc", to: "/app/admin/schedules" },
    { icon: Settings, label: "Dịch vụ", to: "/app/admin/services" },
    { icon: Settings, label: "Chuyên khoa", to: "/app/admin/specialties" },
    { icon: Users, label: "Nhân sự", to: "/app/admin/staff" },
    { icon: ClipboardList, label: "Nhật ký kiểm toán", to: "/app/admin/audit" },
  ],
};

export function navigationForRole(role: UserRole): NavItem[] {
  return [...navigationByRole[role], { icon: UserRound, label: "Tài khoản của tôi", to: "/app/account" }];
}
