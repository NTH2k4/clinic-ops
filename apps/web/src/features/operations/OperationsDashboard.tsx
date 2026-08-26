import { useQuery } from "@tanstack/react-query";
import { CalendarPlus, ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";
import { AppointmentTimeline } from "../../components/AppointmentTimeline";
import { EmptyState } from "../../components/EmptyState";
import { MetricCard } from "../../components/MetricCard";
import { toDateInputValue } from "../../lib/dateTime";
import { mockStore } from "../../mocks/mockStore";
import type { AppointmentStatus } from "../../types/models";
import { catalogQueryOptions } from "../catalog/catalogService";

const OPERATIONS_TODAY = "2026-08-25";

const metrics: Array<{ label: string; statuses?: AppointmentStatus[] }> = [
  { label: "Lịch hẹn hôm nay" },
  { label: "Đang chờ", statuses: ["confirmed"] },
  { label: "Đã check-in", statuses: ["checked_in"] },
  { label: "Đang khám", statuses: ["in_progress"] },
  { label: "Đã hủy / không đến", statuses: ["cancelled", "no_show"] },
];

export function OperationsDashboard() {
  const { data: serviceResponse } = useQuery(catalogQueryOptions.allServices());
  const services = serviceResponse?.data ?? [];
  const appointments = mockStore.appointments.filter((appointment) => toDateInputValue(appointment.startAt) === OPERATIONS_TODAY).sort((left, right) => left.startAt.localeCompare(right.startAt));
  const waiting = appointments.filter((appointment) => appointment.status === "confirmed" || appointment.status === "checked_in");

  return (
    <section className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-primary">Điều hành phòng khám</p><h1 className="mt-1 text-2xl font-semibold text-text">Operations Workspace</h1><p className="mt-1 text-sm text-text-muted">Tổng quan tiếp đón và điều phối lịch ngày {OPERATIONS_TODAY.split("-").reverse().join("/")}.</p></div><Link className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-white hover:bg-primary-hover" to="/app/operations/appointments/new"><CalendarPlus aria-hidden="true" size={18} />Tạo appointment</Link></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{metrics.map((metric) => <MetricCard key={metric.label} label={metric.label} value={metric.statuses ? appointments.filter((appointment) => metric.statuses?.includes(appointment.status)).length : appointments.length} />)}</div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]"><section><div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold text-text">Hàng đợi chờ xử lý</h2><p className="mt-1 text-sm text-text-muted">Lịch đã xác nhận và đã check-in.</p></div><Link className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-text hover:bg-surface-muted" to="/app/operations/queue"><ClipboardList aria-hidden="true" size={17} />Mở hàng đợi</Link></div><div className="mt-4">{waiting.length ? <AppointmentTimeline appointments={waiting} compact onSelect={() => undefined} patients={mockStore.patients} services={services} /> : <EmptyState description="Chưa có lịch hẹn cần tiếp đón." title="Hàng đợi trống" />}</div></section><aside className="border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0"><h2 className="text-base font-semibold text-text">Tác vụ nhanh</h2><div className="mt-3 grid gap-2"><Link className="rounded-md border border-border p-3 text-sm font-semibold text-text hover:bg-surface-muted" to="/app/operations/appointments/new">Tạo lịch hẹn mới</Link><Link className="rounded-md border border-border p-3 text-sm font-semibold text-text hover:bg-surface-muted" to="/app/operations/calendar">Xem lịch hoạt động</Link></div></aside></div>
    </section>
  );
}
