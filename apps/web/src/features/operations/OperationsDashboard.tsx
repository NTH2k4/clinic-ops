import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, ClipboardList } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { AppointmentTimeline } from "../../components/AppointmentTimeline";
import { DetailDrawer } from "../../components/DetailDrawer";
import { EmptyState } from "../../components/EmptyState";
import { MetricCard } from "../../components/MetricCard";
import { formatDateInputValue, todayInClinicTimeZone } from "../../lib/dateTime";
import type { Appointment, AppointmentStatus } from "../../types/models";
import { appointmentDateRange, appointmentQueryOptions, patientsFromAppointments } from "../appointments/appointmentService";
import { useAuth } from "../auth/AuthProvider";
import { catalogQueryOptions } from "../catalog/catalogService";

const metrics: Array<{ label: string; statuses?: AppointmentStatus[] }> = [
  { label: "Lịch hẹn hôm nay" },
  { label: "Chờ xác nhận", statuses: ["requested"] },
  { label: "Đã xác nhận", statuses: ["confirmed"] },
  { label: "Đã check-in", statuses: ["checked_in"] },
  { label: "Đang khám", statuses: ["in_progress"] },
  { label: "Đã hủy / không đến", statuses: ["cancelled", "no_show"] },
];

export function OperationsDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: serviceResponse } = useQuery(catalogQueryOptions.allServices());
  const services = serviceResponse?.data ?? [];
  const today = todayInClinicTimeZone();
  const appointmentOptions = appointmentQueryOptions.list(appointmentDateRange(today));
  const { data: appointmentResponse = [] } = useQuery(appointmentOptions);
  const appointments = appointmentResponse.slice().sort((left, right) => left.startAt.localeCompare(right.startAt));
  const patients = patientsFromAppointments(appointments);
  const waiting = appointments.filter((appointment) => appointment.status === "requested" || appointment.status === "confirmed" || appointment.status === "checked_in");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  function updateAppointment(updated: Appointment) {
    queryClient.setQueryData<Appointment[]>(appointmentOptions.queryKey, (current = []) =>
      current.map((appointment) => appointment.id === updated.id ? updated : appointment));
    setSelectedAppointment(updated);
  }

  return (
    <section className="mx-auto max-w-6xl">
      <div className="rounded-lg border border-border bg-surface p-5 shadow-panel md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">Điều hành phòng khám</p>
            <h1 className="mt-1 text-2xl font-semibold text-text">Không gian điều hành</h1>
            <p className="mt-1 text-sm text-text-muted">Tổng quan tiếp đón và điều phối lịch ngày {formatDateInputValue(today)}.</p>
          </div>
          <Link className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-white shadow-panel transition-colors hover:bg-primary-hover" to="/app/operations/appointments/new"><CalendarPlus aria-hidden="true" size={18} />Tạo lịch hẹn</Link>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">{metrics.map((metric, index) => <MetricCard key={metric.label} label={metric.label} tone={index === 0 ? "primary" : metric.statuses?.includes("cancelled") ? "danger" : metric.statuses?.includes("checked_in") ? "warning" : "neutral"} value={metric.statuses ? appointments.filter((appointment) => metric.statuses?.includes(appointment.status)).length : appointments.length} />)}</div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="rounded-lg border border-border bg-surface p-5 shadow-panel">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-text">Hàng đợi chờ xử lý</h2>
              <p className="mt-1 text-sm text-text-muted">Yêu cầu mới, lịch đã xác nhận và bệnh nhân đã check-in.</p>
            </div>
            <Link className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm font-semibold text-text transition-colors hover:border-border-strong hover:bg-surface-muted" to="/app/operations/queue"><ClipboardList aria-hidden="true" size={17} />Mở hàng đợi</Link>
          </div>
          <div className="mt-4">{waiting.length ? <AppointmentTimeline appointments={waiting} compact onSelect={setSelectedAppointment} patients={patients} services={services} /> : <EmptyState description="Chưa có lịch hẹn cần tiếp đón." title="Hàng đợi trống" />}</div>
        </section>
        <aside className="rounded-lg border border-border bg-surface p-5 shadow-panel">
          <h2 className="text-base font-semibold text-text">Tác vụ nhanh</h2>
          <div className="mt-3 grid gap-2">
            <Link className="rounded-md border border-border bg-white p-3 text-sm font-semibold text-text transition-colors hover:border-primary hover:bg-teal-50" to="/app/operations/appointments/new">Tạo lịch hẹn mới</Link>
            <Link className="rounded-md border border-border bg-white p-3 text-sm font-semibold text-text transition-colors hover:border-primary hover:bg-teal-50" to="/app/operations/calendar">Xem lịch hoạt động</Link>
          </div>
        </aside>
      </div>
      <DetailDrawer actorRole={user?.role ?? "receptionist"} actorUserId={user?.id ?? ""} appointment={selectedAppointment} onClose={() => setSelectedAppointment(null)} onUpdated={updateAppointment} />
    </section>
  );
}
