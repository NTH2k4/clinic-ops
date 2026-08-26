import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { EmptyState } from "../../components/EmptyState";
import { StatusBadge } from "../../components/StatusBadge";
import { formatTime } from "../../lib/dateTime";
import type { Appointment, AppointmentStatus } from "../../types/models";
import { appointmentDateRange, appointmentQueryOptions, appointmentService, patientsFromAppointments } from "../appointments/appointmentService";
import { useAuth } from "../auth/AuthProvider";
import { catalogQueryOptions } from "../catalog/catalogService";

const OPERATIONS_TODAY = "2026-08-25";

type QueueGroup = {
  description: string;
  label: string;
  statuses: AppointmentStatus[];
};

const queueGroups: QueueGroup[] = [
  { description: "Cần check-in khi bệnh nhân đến.", label: "Đã xác nhận", statuses: ["confirmed"] },
  { description: "Bệnh nhân đã có mặt và đang chờ gọi vào phòng khám.", label: "Đang chờ khám", statuses: ["checked_in"] },
  { description: "Bác sĩ đang xử lý, không cần thao tác tiếp đón.", label: "Đang khám", statuses: ["in_progress"] },
  { description: "Lịch đã kết thúc trong ngày.", label: "Hoàn tất", statuses: ["completed"] },
  { description: "Lịch không còn hoạt động hoặc bệnh nhân không đến.", label: "Đã hủy / không đến", statuses: ["cancelled", "no_show"] },
];

function actionsForStatus(status: AppointmentStatus): Array<{ label: string; next?: AppointmentStatus; cancel?: boolean }> {
  if (status === "confirmed") return [{ label: "Check-in", next: "checked_in" }, { label: "Không đến", next: "no_show" }, { label: "Hủy lịch", cancel: true }];
  if (status === "checked_in") return [{ label: "Bắt đầu khám", next: "in_progress" }, { label: "Hủy lịch", cancel: true }];
  if (status === "in_progress") return [{ label: "Hoàn tất", next: "completed" }];
  return [];
}

export function QueuePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: serviceResponse } = useQuery(catalogQueryOptions.allServices());
  const services = serviceResponse?.data ?? [];
  const appointmentOptions = appointmentQueryOptions.list(appointmentDateRange(OPERATIONS_TODAY));
  const { data: appointmentResponse = [] } = useQuery(appointmentOptions);
  const appointments = useMemo(
    () => appointmentResponse.filter((appointment) => appointment.status !== "requested").sort((left, right) => left.startAt.localeCompare(right.startAt)),
    [appointmentResponse],
  );
  const patients = useMemo(() => patientsFromAppointments(appointments), [appointments]);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const actorUserId = user?.id ?? "user-receptionist-1";
  const groupedAppointments = useMemo(() => queueGroups.map((group) => ({ ...group, appointments: appointments.filter((appointment) => group.statuses.includes(appointment.status)) })), [appointments]);

  function cacheUpdatedAppointment(updated: Appointment) {
    queryClient.setQueryData<Appointment[]>(appointmentOptions.queryKey, (current = []) =>
      current.map((candidate) => candidate.id === updated.id ? updated : candidate));
  }

  async function updateStatus(appointment: Appointment, status: AppointmentStatus) {
    const updated = await appointmentService.updateAppointmentStatus(appointment.id, status, actorUserId);
    cacheUpdatedAppointment(updated);
  }

  async function cancelAppointment() {
    if (!cancelTarget) return;
    const updated = await appointmentService.cancelAppointment(cancelTarget.id, {
      actorUserId,
      cancellationReason: "Nhân viên hủy lịch trong hàng đợi vận hành.",
    });
    cacheUpdatedAppointment(updated);
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
            <div className="flex items-start justify-between gap-3"><div><h2 className="text-base font-semibold text-text">{group.label}</h2><p className="mt-1 text-sm text-text-muted">{group.description}</p></div><span className="rounded-md bg-surface-muted px-2.5 py-1 text-sm font-semibold text-text">{group.appointments.length}</span></div>
            <p className="mt-3 text-sm text-text-muted">{group.appointments.length} lịch trong nhóm này.</p>
            {group.appointments.length ? <ul className="mt-3 divide-y divide-border">{group.appointments.map((appointment) => {
              const patient = patients.find((candidate) => candidate.id === appointment.patientId);
              const service = services.find((candidate) => candidate.id === appointment.serviceId);
              return <li className="py-3 first:pt-0 last:pb-0" key={appointment.id}><div className="flex flex-wrap items-center gap-2"><p className="w-12 text-sm font-semibold text-primary">{formatTime(appointment.startAt)}</p><p className="min-w-36 flex-1 font-medium text-text">{patient?.fullName ?? "Bệnh nhân chưa xác định"}</p><StatusBadge status={appointment.status} /></div><p className="mt-1 pl-14 text-sm text-text-muted">{service?.name ?? "Dịch vụ chưa xác định"}</p><div className="mt-3 flex flex-wrap gap-2 pl-14">{actionsForStatus(appointment.status).map((action) => <button aria-label={action.cancel ? `Hủy lịch ${patient?.fullName ?? "bệnh nhân"} ${formatTime(appointment.startAt)}` : undefined} className="h-9 rounded-md border border-border px-3 text-sm font-semibold text-text hover:bg-surface-muted" key={action.label} onClick={() => { if (action.cancel) setCancelTarget(appointment); else if (action.next) void updateStatus(appointment, action.next); }} type="button">{action.label}</button>)}</div></li>;
            })}</ul> : <EmptyState description="Không có lịch hẹn trong nhóm này." title="Trống" />}
          </section>
        ))}
      </div>
      <ConfirmDialog cancelLabel="Giữ lịch" confirmLabel="Hủy lịch" description="Thao tác này sẽ chuyển lịch hẹn sang trạng thái đã hủy và ghi nhận trong audit log." isOpen={Boolean(cancelTarget)} onCancel={() => setCancelTarget(null)} onConfirm={() => void cancelAppointment()} title="Xác nhận hủy lịch hẹn" />
    </section>
  );
}
