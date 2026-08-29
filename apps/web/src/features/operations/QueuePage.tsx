import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { EmptyState } from "../../components/EmptyState";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDateInputValue, formatTime, todayInClinicTimeZone } from "../../lib/dateTime";
import type { Appointment, AppointmentStatus, UserRole } from "../../types/models";
import { appointmentDateRange, appointmentQueryOptions, appointmentService, patientsFromAppointments } from "../appointments/appointmentService";
import { canTransitionAppointment } from "../appointments/appointmentRules";
import { useAuth } from "../auth/AuthProvider";
import { catalogQueryOptions } from "../catalog/catalogService";

type QueueGroup = {
  description: string;
  label: string;
  statuses: AppointmentStatus[];
};

const queueGroups: QueueGroup[] = [
  { description: "Yêu cầu mới từ bệnh nhân, cần xác nhận trước khi tiếp đón.", label: "Chờ xác nhận", statuses: ["requested"] },
  { description: "Cần check-in khi bệnh nhân đến.", label: "Đã xác nhận", statuses: ["confirmed"] },
  { description: "Bệnh nhân đã có mặt và đang chờ gọi vào phòng khám.", label: "Đang chờ khám", statuses: ["checked_in"] },
  { description: "Bác sĩ đang xử lý, không cần thao tác tiếp đón.", label: "Đang khám", statuses: ["in_progress"] },
  { description: "Lịch đã kết thúc trong ngày.", label: "Hoàn tất", statuses: ["completed"] },
  { description: "Lịch không còn hoạt động hoặc bệnh nhân không đến.", label: "Đã hủy / không đến", statuses: ["cancelled", "no_show"] },
];

function actionsForStatus(status: AppointmentStatus, role: UserRole = "receptionist"): Array<{ label: string; next?: AppointmentStatus; cancel?: boolean }> {
  const candidates: Array<{ label: string; next: AppointmentStatus; cancel?: boolean }> = status === "requested"
    ? [{ label: "Xác nhận lịch", next: "confirmed" }, { label: "Hủy lịch", next: "cancelled", cancel: true }]
    : status === "confirmed"
      ? [{ label: "Check-in", next: "checked_in" }, { label: "Không đến", next: "no_show" }, { label: "Hủy lịch", next: "cancelled", cancel: true }]
      : status === "checked_in"
        ? [{ label: "Bắt đầu khám", next: "in_progress" }, { label: "Hủy lịch", next: "cancelled", cancel: true }]
        : status === "in_progress"
          ? [{ label: "Hoàn tất", next: "completed" }]
          : [];
  return candidates.filter((action) => canTransitionAppointment(status, action.next, role));
}

const successMessages: Partial<Record<AppointmentStatus, string>> = {
  confirmed: "Đã xác nhận lịch hẹn.",
  checked_in: "Đã check-in lịch hẹn.",
  no_show: "Đã ghi nhận bệnh nhân không đến.",
  completed: "Đã hoàn tất lịch hẹn.",
};

export function QueuePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: serviceResponse } = useQuery(catalogQueryOptions.allServices());
  const services = serviceResponse?.data ?? [];
  const today = todayInClinicTimeZone();
  const appointmentOptions = appointmentQueryOptions.list(appointmentDateRange(today));
  const { data: appointmentResponse = [] } = useQuery(appointmentOptions);
  const appointments = useMemo(
    () => appointmentResponse.slice().sort((left, right) => left.startAt.localeCompare(right.startAt)),
    [appointmentResponse],
  );
  const patients = useMemo(() => patientsFromAppointments(appointments), [appointments]);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const actorUserId = user?.id ?? "user-receptionist-1";
  const groupedAppointments = useMemo(() => queueGroups.map((group) => ({ ...group, appointments: appointments.filter((appointment) => group.statuses.includes(appointment.status)) })), [appointments]);

  function cacheUpdatedAppointment(updated: Appointment) {
    queryClient.setQueryData<Appointment[]>(appointmentOptions.queryKey, (current = []) =>
      current.map((candidate) => candidate.id === updated.id ? updated : candidate));
  }

  async function updateStatus(appointment: Appointment, status: AppointmentStatus) {
    setError("");
    setNotice("");

    try {
      const updated = await appointmentService.updateAppointmentStatus(appointment.id, status, actorUserId);
      cacheUpdatedAppointment(updated);
      setNotice(successMessages[status] ?? "Đã cập nhật lịch hẹn.");
    } catch {
      setError("Không thể cập nhật lịch hẹn. Vui lòng thử lại.");
    }
  }

  async function cancelAppointment() {
    if (!cancelTarget) return;
    setError("");
    setNotice("");

    try {
      const updated = await appointmentService.cancelAppointment(cancelTarget.id, {
        actorUserId,
        cancellationReason: "Nhân viên hủy lịch trong hàng đợi vận hành.",
      });
      cacheUpdatedAppointment(updated);
      setNotice("Đã hủy lịch hẹn.");
      setCancelTarget(null);
    } catch {
      setError("Không thể hủy lịch hẹn. Vui lòng thử lại.");
    }
  }

  return (
    <section className="mx-auto max-w-6xl">
      <p className="text-sm font-medium text-primary">Điều phối trong ngày</p>
      <h1 className="mt-1 text-2xl font-semibold text-text">Hàng đợi khám</h1>
      <p className="mt-1 text-sm text-text-muted">Theo dõi và cập nhật luồng tiếp đón ngày {formatDateInputValue(today)}.</p>
      {notice && <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-success" role="status">{notice}</p>}
      {error && <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-danger" role="alert">{error}</p>}
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {groupedAppointments.map((group) => (
          <section aria-label={group.label} className="min-w-0 rounded-lg border border-border bg-surface p-4 shadow-panel" key={group.label}>
            <div className="flex items-start justify-between gap-3"><div><h2 className="text-base font-semibold text-text">{group.label}</h2><p className="mt-1 text-sm text-text-muted">{group.description}</p></div><span className="rounded-md bg-surface-muted px-2.5 py-1 text-sm font-semibold text-text">{group.appointments.length}</span></div>
            <p className="mt-3 text-sm text-text-muted">{group.appointments.length} lịch trong nhóm này.</p>
            {group.appointments.length ? <ul className="mt-3 divide-y divide-border">{group.appointments.map((appointment) => {
              const patient = patients.find((candidate) => candidate.id === appointment.patientId);
              const service = services.find((candidate) => candidate.id === appointment.serviceId);
              return <li className="py-3 first:pt-0 last:pb-0" key={appointment.id}><div className="flex flex-wrap items-center gap-2"><p className="w-12 text-sm font-semibold text-primary">{formatTime(appointment.startAt)}</p><p className="min-w-36 flex-1 font-medium text-text">{patient?.fullName ?? "Bệnh nhân chưa xác định"}</p><StatusBadge status={appointment.status} /></div><p className="mt-1 pl-14 text-sm text-text-muted">{service?.name ?? "Dịch vụ chưa xác định"}</p><div className="mt-3 flex flex-wrap gap-2 pl-14">{actionsForStatus(appointment.status, user?.role ?? "receptionist").map((action) => <button aria-label={action.cancel ? `Hủy lịch ${patient?.fullName ?? "bệnh nhân"} ${formatTime(appointment.startAt)}` : undefined} className="h-9 rounded-md border border-border px-3 text-sm font-semibold text-text hover:bg-surface-muted" key={action.label} onClick={() => { if (action.cancel) setCancelTarget(appointment); else if (action.next) void updateStatus(appointment, action.next); }} type="button">{action.label}</button>)}</div></li>;
            })}</ul> : <EmptyState description="Không có lịch hẹn trong nhóm này." title="Trống" />}
          </section>
        ))}
      </div>
      <ConfirmDialog cancelLabel="Giữ lịch" confirmLabel="Hủy lịch" description="Thao tác này sẽ chuyển lịch hẹn sang trạng thái đã hủy và ghi nhận trong audit log." isOpen={Boolean(cancelTarget)} onCancel={() => setCancelTarget(null)} onConfirm={() => void cancelAppointment()} title="Xác nhận hủy lịch hẹn" />
    </section>
  );
}
