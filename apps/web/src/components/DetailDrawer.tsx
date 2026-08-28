import { useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useState } from "react";
import { appointmentService } from "../features/appointments/appointmentService";
import { canTransitionAppointment } from "../features/appointments/appointmentRules";
import { auditQueryOptions } from "../features/audit/auditService";
import { catalogQueryOptions } from "../features/catalog/catalogService";
import { isApiMode } from "../lib/dataSource";
import { formatDateTime } from "../lib/dateTime";
import { mockStore } from "../mocks/mockStore";
import type { Appointment, AppointmentStatus, Patient, UserRole } from "../types/models";
import { StatusBadge } from "./StatusBadge";

type DetailDrawerProps = {
  appointment: Appointment | null;
  actorRole: UserRole;
  actorUserId: string;
  onClose: () => void;
  onUpdated: (appointment: Appointment) => void;
};

type DrawerAction = { label: string; status: AppointmentStatus };

function actionForStatus(status: AppointmentStatus, role: UserRole): DrawerAction | null {
  const candidate = status === "confirmed"
    ? { label: "Check-in lịch hẹn", status: "checked_in" as const }
    : status === "checked_in"
      ? { label: "Bắt đầu khám", status: "in_progress" as const }
      : status === "in_progress"
        ? { label: "Hoàn tất khám", status: "completed" as const }
        : null;
  return candidate && canTransitionAppointment(status, candidate.status, role) ? candidate : null;
}

function statusHistory(appointment: Appointment) {
  if (appointment.statusHistory?.length) {
    const labels: Record<AppointmentStatus, string> = {
      requested: "Đã gửi yêu cầu",
      confirmed: "Đã xác nhận",
      checked_in: "Đã check-in",
      in_progress: "Bắt đầu khám",
      completed: "Hoàn tất khám",
      cancelled: "Đã hủy lịch",
      no_show: "Không đến",
    };
    return appointment.statusHistory.map((item) => ({ label: labels[item.toStatus], timestamp: item.changedAt }));
  }
  const history: Array<{ label: string; timestamp: string }> = [{ label: "Đã tạo lịch hẹn", timestamp: appointment.createdAt }];
  if (appointment.checkedInAt) history.push({ label: "Đã check-in", timestamp: appointment.checkedInAt });
  if (appointment.startedAt) history.push({ label: "Bắt đầu khám", timestamp: appointment.startedAt });
  if (appointment.completedAt) history.push({ label: "Hoàn tất khám", timestamp: appointment.completedAt });
  if (appointment.cancelledAt) history.push({ label: "Đã hủy lịch", timestamp: appointment.cancelledAt });
  return history;
}

export function DetailDrawer({ appointment, actorRole, actorUserId, onClose, onUpdated }: DetailDrawerProps) {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const { data: doctorResponse } = useQuery({ ...catalogQueryOptions.allDoctors(), enabled: Boolean(appointment) });
  const { data: serviceResponse } = useQuery({ ...catalogQueryOptions.allServices(), enabled: Boolean(appointment) });
  const showAudit = !isApiMode || actorRole === "admin";
  const { data: auditResponse } = useQuery({
    ...auditQueryOptions.list({ entityId: appointment?.id, page: 1, pageSize: 100 }),
    enabled: Boolean(appointment) && showAudit,
  });

  if (!appointment) return null;

  const selectedAppointment = appointment;
  const patient: Patient | undefined = isApiMode
    ? selectedAppointment.patient
    : mockStore.patients.find((candidate) => candidate.id === appointment.patientId);
  const doctor = doctorResponse?.data.find((candidate) => candidate.id === appointment.doctorId);
  const service = serviceResponse?.data.find((candidate) => candidate.id === appointment.serviceId);
  const action = actionForStatus(appointment.status, actorRole);
  const auditEvents = auditResponse?.data ?? [];

  async function updateStatus() {
    if (!action) return;
    setIsUpdating(true);
    setUpdateError("");
    try {
      const updated = await appointmentService.updateAppointmentStatus(selectedAppointment.id, action.status, actorUserId);
      onUpdated(updated);
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : "Không thể cập nhật lịch hẹn.");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div aria-label="Chi tiết lịch hẹn" className="fixed inset-0 z-50 flex justify-end bg-black/30" role="dialog" aria-modal="true">
      <section className="flex h-full w-full max-w-xl flex-col overflow-y-auto bg-surface shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div className="min-w-0">
            <p className="text-sm font-medium text-primary">Chi tiết lịch hẹn</p>
            <h2 className="mt-1 text-xl font-semibold text-text">{patient?.fullName ?? "Bệnh nhân chưa xác định"}</h2>
            <p className="mt-1 text-sm text-text-muted">{patient?.phone ?? "Chưa có số điện thoại"} · {patient?.dateOfBirth ?? "Chưa có ngày sinh"}</p>
          </div>
          <button aria-label="Đóng chi tiết" className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border text-text-muted hover:bg-surface-muted" onClick={onClose} title="Đóng" type="button"><X aria-hidden="true" size={18} /></button>
        </header>
        <div className="space-y-6 p-5">
          <section>
            <h3 className="text-sm font-semibold text-text">Thông tin khám</h3>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-text-muted">Bác sĩ</dt><dd className="mt-1 font-medium text-text">{doctor?.fullName ?? "Chưa xác định"}</dd></div>
              <div><dt className="text-text-muted">Dịch vụ</dt><dd className="mt-1 font-medium text-text">{service?.name ?? "Chưa xác định"}</dd></div>
              <div><dt className="text-text-muted">Thời gian</dt><dd className="mt-1 font-medium text-text">{formatDateTime(appointment.startAt)}</dd></div>
              <div><dt className="text-text-muted">Trạng thái</dt><dd className="mt-1"><StatusBadge status={appointment.status} /></dd></div>
            </dl>
          </section>
          <section><h3 className="text-sm font-semibold text-text">Lý do khám</h3><p className="mt-2 text-sm text-text-muted">{appointment.reason ?? "Chưa có lý do khám."}</p></section>
          <section><h3 className="text-sm font-semibold text-text">Ghi chú nội bộ</h3><p className="mt-2 text-sm text-text-muted">{appointment.internalNote ?? "Chưa có ghi chú nội bộ."}</p></section>
          <section><h3 className="text-sm font-semibold text-text">Lịch sử trạng thái</h3><ol className="mt-3 space-y-3 border-l border-border pl-4">{statusHistory(appointment).map((item) => <li key={`${item.label}-${item.timestamp}`}><p className="text-sm font-medium text-text">{item.label}</p><p className="text-xs text-text-muted">{formatDateTime(item.timestamp)}</p></li>)}</ol></section>
          {showAudit ? <section><h3 className="text-sm font-semibold text-text">Nhật ký kiểm toán</h3><ul className="mt-3 space-y-3">{auditEvents.length ? auditEvents.map((event) => <li className="border-b border-border pb-3 text-sm" key={event.id}><p className="font-medium text-text">{event.action}</p><p className="mt-1 text-text-muted">{formatDateTime(event.timestamp)}</p></li>) : <li className="text-sm text-text-muted">Chưa có sự kiện kiểm toán.</li>}</ul></section> : null}
        </div>
        {action ? <footer className="mt-auto border-t border-border p-5">{updateError ? <p className="mb-3 text-sm text-danger" role="alert">{updateError}</p> : null}<button className="h-11 w-full rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60" disabled={isUpdating} onClick={() => void updateStatus()} type="button">{action.label}</button></footer> : null}
      </section>
    </div>
  );
}
