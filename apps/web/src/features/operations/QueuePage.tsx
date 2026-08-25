import { useMemo, useState } from "react";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { EmptyState } from "../../components/EmptyState";
import { StatusBadge } from "../../components/StatusBadge";
import { formatTime, toDateInputValue } from "../../lib/dateTime";
import { mockStore } from "../../mocks/mockStore";
import type { Appointment, AppointmentStatus } from "../../types/models";
import { appointmentService } from "../appointments/appointmentService";
import { useAuth } from "../auth/AuthProvider";

const OPERATIONS_TODAY = "2026-08-25";

type QueueGroup = {
  label: string;
  statuses: AppointmentStatus[];
};

const queueGroups: QueueGroup[] = [
  { label: "Đã xác nhận", statuses: ["confirmed"] },
  { label: "Đang chờ khám", statuses: ["checked_in"] },
  { label: "Đang khám", statuses: ["in_progress"] },
  { label: "Hoàn tất", statuses: ["completed"] },
  { label: "Đã hủy / không đến", statuses: ["cancelled", "no_show"] },
];

function queueAppointments(): Appointment[] {
  return mockStore.appointments
    .filter((appointment) => toDateInputValue(appointment.startAt) === OPERATIONS_TODAY && appointment.status !== "requested")
    .sort((left, right) => left.startAt.localeCompare(right.startAt));
}

function actionsForStatus(status: AppointmentStatus): Array<{ label: string; next?: AppointmentStatus; cancel?: boolean }> {
  if (status === "confirmed") return [{ label: "Check-in", next: "checked_in" }, { label: "Không đến", next: "no_show" }, { label: "Hủy lịch", cancel: true }];
  if (status === "checked_in") return [{ label: "Bắt đầu khám", next: "in_progress" }, { label: "Hủy lịch", cancel: true }];
  if (status === "in_progress") return [{ label: "Hoàn tất", next: "completed" }];
  return [];
}

export function QueuePage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState(queueAppointments);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const actorUserId = user?.id ?? "user-receptionist-1";
  const groupedAppointments = useMemo(() => queueGroups.map((group) => ({ ...group, appointments: appointments.filter((appointment) => group.statuses.includes(appointment.status)) })), [appointments]);

  async function updateStatus(appointment: Appointment, status: AppointmentStatus) {
    const updated = await appointmentService.updateAppointmentStatus(appointment.id, status, actorUserId);
    setAppointments((current) => current.map((candidate) => candidate.id === updated.id ? updated : candidate));
  }

  async function cancelAppointment() {
    if (!cancelTarget) return;
    const updated = await appointmentService.cancelAppointment(cancelTarget.id, { actorUserId });
    setAppointments((current) => current.map((candidate) => candidate.id === updated.id ? updated : candidate));
    setCancelTarget(null);
  }

  return (
    <section className="mx-auto max-w-6xl">
      <p className="text-sm font-medium text-primary">Điều phối trong ngày</p>
      <h1 className="mt-1 text-2xl font-semibold text-text">Hàng đợi khám</h1>
      <p className="mt-1 text-sm text-text-muted">Theo dõi và cập nhật luồng tiếp đón ngày {OPERATIONS_TODAY.split("-").reverse().join("/")}.</p>
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {groupedAppointments.map((group) => (
          <section aria-label={group.label} className="min-w-0 rounded-lg border border-border bg-surface p-4 shadow-panel" key={group.label}>
            <div className="flex items-center justify-between gap-3"><h2 className="text-base font-semibold text-text">{group.label}</h2><span className="text-sm text-text-muted">{group.appointments.length}</span></div>
            {group.appointments.length ? <ul className="mt-3 divide-y divide-border">{group.appointments.map((appointment) => {
              const patient = mockStore.patients.find((candidate) => candidate.id === appointment.patientId);
              const service = mockStore.services.find((candidate) => candidate.id === appointment.serviceId);
              return <li className="py-3 first:pt-0 last:pb-0" key={appointment.id}><div className="flex flex-wrap items-center gap-2"><p className="w-12 text-sm font-semibold text-primary">{formatTime(appointment.startAt)}</p><p className="min-w-36 flex-1 font-medium text-text">{patient?.fullName ?? "Bệnh nhân chưa xác định"}</p><StatusBadge status={appointment.status} /></div><p className="mt-1 pl-14 text-sm text-text-muted">{service?.name ?? "Dịch vụ chưa xác định"}</p><div className="mt-3 flex flex-wrap gap-2 pl-14">{actionsForStatus(appointment.status).map((action) => <button className="h-9 rounded-md border border-border px-3 text-sm font-semibold text-text hover:bg-surface-muted" key={action.label} onClick={() => { if (action.cancel) setCancelTarget(appointment); else if (action.next) void updateStatus(appointment, action.next); }} type="button">{action.label}</button>)}</div></li>;
            })}</ul> : <EmptyState description="Không có lịch hẹn trong nhóm này." title="Trống" />}
          </section>
        ))}
      </div>
      <ConfirmDialog confirmLabel="Hủy lịch" description="Lịch hẹn sẽ được chuyển sang trạng thái đã hủy." isOpen={Boolean(cancelTarget)} onCancel={() => setCancelTarget(null)} onConfirm={() => void cancelAppointment()} title="Hủy lịch hẹn" />
    </section>
  );
}
