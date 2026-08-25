import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  CircleX,
  Clock3,
  Stethoscope,
  UserCheck,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

export type AppointmentStatus =
  | "requested"
  | "confirmed"
  | "checked_in"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

const labels = {
  requested: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  checked_in: "Đã check-in",
  in_progress: "Đang khám",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
  no_show: "Không đến",
} as const satisfies Record<AppointmentStatus, string>;

const styles = {
  requested: "border-blue-200 bg-blue-50 text-info",
  confirmed: "border-teal-200 bg-teal-50 text-primary",
  checked_in: "border-amber-200 bg-amber-50 text-warning",
  in_progress: "border-blue-200 bg-blue-50 text-accent",
  completed: "border-emerald-200 bg-emerald-50 text-success",
  cancelled: "border-red-200 bg-red-50 text-danger",
  no_show: "border-slate-200 bg-slate-100 text-slate-700",
} as const satisfies Record<AppointmentStatus, string>;

const icons = {
  requested: Clock3,
  confirmed: CalendarCheck,
  checked_in: UserCheck,
  in_progress: Stethoscope,
  completed: CheckCircle2,
  cancelled: CircleX,
  no_show: AlertCircle,
} as const satisfies Record<AppointmentStatus, ComponentType<SVGProps<SVGSVGElement>>>;

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const label = labels[status];
  const Icon = icons[status];

  return (
    <span
      aria-label={`Trạng thái: ${label}`}
      className={`inline-flex h-7 items-center gap-1.5 rounded-sm border px-2.5 text-sm font-medium ${styles[status]}`}
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
      {label}
    </span>
  );
}
