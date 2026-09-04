import { X } from "lucide-react";
import { formatDateInputValue, formatTime, toDateInputValue } from "../../lib/dateTime";
import type { Appointment, AppointmentStatus, Doctor, Patient, Service } from "../../types/models";

export type RequestedAppointmentReviewAction = {
  cancel?: boolean;
  label: string;
  next?: AppointmentStatus;
};

type RequestedAppointmentReviewDialogProps = {
  actions: RequestedAppointmentReviewAction[];
  appointment: Appointment | null;
  doctor?: Doctor;
  onAction: (action: RequestedAppointmentReviewAction) => void;
  onClose: () => void;
  patient?: Patient;
  service?: Service;
};

export function RequestedAppointmentReviewDialog({
  actions,
  appointment,
  doctor,
  onAction,
  onClose,
  patient,
  service,
}: RequestedAppointmentReviewDialogProps) {
  if (!appointment) return null;

  return (
    <div aria-label="Chi tiết yêu cầu đặt lịch" aria-modal="true" className="fixed inset-0 z-50 flex justify-end bg-black/30" role="dialog">
      <section className="flex h-full w-full max-w-xl flex-col overflow-y-auto bg-surface shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div className="min-w-0">
            <p className="text-sm font-medium text-primary">Yêu cầu chờ xác nhận</p>
            <h2 className="mt-1 text-xl font-semibold text-text">{patient?.fullName ?? "Bệnh nhân chưa xác định"}</h2>
            <p className="mt-1 text-sm text-text-muted">{formatTime(appointment.startAt)} · {service?.name ?? "Dịch vụ chưa xác định"}</p>
          </div>
          <button aria-label="Đóng chi tiết yêu cầu" className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border text-text-muted hover:bg-surface-muted" onClick={onClose} title="Đóng" type="button">
            <X aria-hidden="true" size={18} />
          </button>
        </header>
        <div className="space-y-6 p-5">
          <section>
            <h3 className="text-sm font-semibold text-text">Thông tin bệnh nhân</h3>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-text-muted">Họ tên</dt><dd className="mt-1 font-medium text-text">{patient?.fullName ?? "Chưa xác định"}</dd></div>
              <div><dt className="text-text-muted">Số điện thoại</dt><dd className="mt-1 font-medium text-text">{patient?.phone ?? "Chưa có số điện thoại"}</dd></div>
              <div><dt className="text-text-muted">Ngày sinh</dt><dd className="mt-1 font-medium text-text">{patient?.dateOfBirth ?? "Chưa có ngày sinh"}</dd></div>
              <div><dt className="text-text-muted">Email</dt><dd className="mt-1 font-medium text-text">{patient?.email ?? "Chưa có email"}</dd></div>
            </dl>
          </section>
          <section>
            <h3 className="text-sm font-semibold text-text">Thông tin lịch hẹn</h3>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-text-muted">Bác sĩ</dt><dd className="mt-1 font-medium text-text">{doctor?.fullName ?? "Chưa xác định"}</dd></div>
              <div><dt className="text-text-muted">Phòng</dt><dd className="mt-1 font-medium text-text">{doctor?.room ?? "Chưa gán phòng"}</dd></div>
              <div><dt className="text-text-muted">Dịch vụ</dt><dd className="mt-1 font-medium text-text">{service?.name ?? "Chưa xác định"}</dd></div>
              <div><dt className="text-text-muted">Thời gian</dt><dd className="mt-1 font-medium text-text">{formatDateInputValue(toDateInputValue(appointment.startAt))} {formatTime(appointment.startAt)}</dd></div>
            </dl>
          </section>
          <section><h3 className="text-sm font-semibold text-text">Lý do khám</h3><p className="mt-2 text-sm text-text-muted">{appointment.reason ?? "Chưa có lý do khám."}</p></section>
          <section><h3 className="text-sm font-semibold text-text">Ghi chú nội bộ</h3><p className="mt-2 text-sm text-text-muted">{appointment.internalNote ?? "Chưa có ghi chú nội bộ."}</p></section>
        </div>
        <footer className="mt-auto flex flex-wrap justify-end gap-2 border-t border-border p-5">
          <button className="h-10 rounded-md border border-border px-3 text-sm font-semibold text-text hover:bg-surface-muted" onClick={onClose} type="button">Quay lại</button>
          {actions.map((action) => (
            <button
              className={action.cancel ? "h-10 rounded-md border border-red-200 px-3 text-sm font-semibold text-danger hover:bg-red-50" : "h-10 rounded-md bg-primary px-3 text-sm font-semibold text-white hover:bg-primary-hover"}
              key={action.label}
              onClick={() => onAction(action)}
              type="button"
            >
              {action.label}
            </button>
          ))}
        </footer>
      </section>
    </div>
  );
}
