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
import type { AppointmentStatus } from "../types/models";

type Status = AppointmentStatus | "active" | "inactive" | "locked" | "on_leave";

const labels = {
  requested: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  checked_in: "Đã check-in",
  in_progress: "Đang khám",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
  no_show: "Không đến",
  active: "Đang hoạt động",
  inactive: "Không hoạt động",
  locked: "Đã khóa",
  on_leave: "Nghỉ phép",
} as const satisfies Record<Status, string>;

const styles = {
  requested: "border-blue-200 bg-blue-50 text-info",
  confirmed: "border-teal-200 bg-teal-50 text-primary",
  checked_in: "border-amber-200 bg-amber-50 text-warning",
  in_progress: "border-blue-200 bg-blue-50 text-accent",
  completed: "border-emerald-200 bg-emerald-50 text-success",
  cancelled: "border-red-200 bg-red-50 text-danger",
  no_show: "border-slate-200 bg-slate-100 text-slate-700",
  active: "border-emerald-200 bg-emerald-50 text-success",
  inactive: "border-slate-200 bg-slate-100 text-slate-700",
  locked: "border-amber-200 bg-amber-50 text-warning",
  on_leave: "border-amber-200 bg-amber-50 text-warning",
} as const satisfies Record<Status, string>;

const icons = {
  requested: Clock3,
  confirmed: CalendarCheck,
  checked_in: UserCheck,
  in_progress: Stethoscope,
  completed: CheckCircle2,
  cancelled: CircleX,
  no_show: AlertCircle,
  active: CheckCircle2,
  inactive: AlertCircle,
  locked: AlertCircle,
  on_leave: Clock3,
} as const satisfies Record<Status, ComponentType<SVGProps<SVGSVGElement>>>;

export function StatusBadge({ status }: { status: Status }) {
  const label = labels[status];
  const Icon = icons[status];

  return (
    <span
      aria-label={`Trạng thái: ${label}`}
      className={`inline-flex h-7 items-center gap-1.5 rounded-sm border px-2.5 text-sm font-semibold shadow-[inset_0_1px_0_rgb(255_255_255/0.65)] ${styles[status]}`}
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
      {label}
    </span>
  );
}
