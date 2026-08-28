import { useQuery } from "@tanstack/react-query";
import { Bell, CalendarDays, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { StatusBadge } from "../../components/StatusBadge";
import { isApiMode } from "../../lib/dataSource";
import { formatDateTime } from "../../lib/dateTime";
import { appointmentQueryOptions } from "../appointments/appointmentService";
import { useAuth } from "../auth/AuthProvider";
import { catalogQueryOptions } from "../catalog/catalogService";
import { notificationQueryOptions } from "../notifications/notificationService";
import { patientQueryOptions } from "./patientService";

export function PatientHome() {
  const { linkedProfile, user } = useAuth();
  const navigate = useNavigate();
  const { data: mockPatient } = useQuery({ ...patientQueryOptions.current(user?.id ?? ""), enabled: Boolean(user?.role === "patient" && !isApiMode) });
  const patientId = linkedProfile?.type === "patient" ? linkedProfile.id : mockPatient?.id;
  const { data: serviceResponse } = useQuery(catalogQueryOptions.allServices());
  const { data: doctorResponse } = useQuery(catalogQueryOptions.allDoctors());
  const { data: appointmentResponse = [] } = useQuery({
    ...appointmentQueryOptions.list({ patientId }),
    enabled: Boolean(patientId),
  });
  const { data: notificationResponse } = useQuery({
    ...notificationQueryOptions.list(user?.id ?? ""),
    enabled: Boolean(user),
  });
  const nextAppointment = appointmentResponse
    .filter((appointment) => !["completed", "cancelled", "no_show"].includes(appointment.status))
    .sort((left, right) => left.startAt.localeCompare(right.startAt))[0];
  const service = nextAppointment ? serviceResponse?.data.find((candidate) => candidate.id === nextAppointment.serviceId) : undefined;
  const doctor = nextAppointment ? doctorResponse?.data.find((candidate) => candidate.id === nextAppointment.doctorId) : undefined;
  const notifications = notificationResponse?.data.slice(0, 3) ?? [];

  return (
    <section className="mx-auto grid max-w-6xl gap-6">
      <div className="rounded-lg border border-border bg-surface p-5 shadow-panel md:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">CareFlow cho bệnh nhân</p>
          <h1 className="mt-1 text-2xl font-semibold text-text">Trang chính bệnh nhân</h1>
          <p className="mt-2 text-sm text-text-muted">Theo dõi lịch hẹn và chuẩn bị cho lần khám tiếp theo.</p>
        </div>
        <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white shadow-panel transition-colors hover:bg-primary-hover" onClick={() => navigate("/app/patient/book")} type="button">
          <CalendarDays aria-hidden="true" size={18} />
          Đặt lịch
        </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(16rem,0.65fr)]">
        <article className="rounded-lg border border-border bg-surface p-5 shadow-panel">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <h2 className="text-base font-semibold text-text">Lịch hẹn tiếp theo</h2>
            {nextAppointment && <StatusBadge status={nextAppointment.status} />}
          </div>
          {nextAppointment ? (
            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-md bg-surface-muted p-3"><p className="text-text-muted">Dịch vụ</p><p className="mt-1 font-semibold text-text">{service?.name}</p></div>
              <div className="rounded-md bg-blue-50 p-3"><p className="text-text-muted">Thời gian</p><p className="mt-1 font-semibold text-text">{formatDateTime(nextAppointment.startAt)}</p></div>
              <div className="rounded-md bg-surface-muted p-3"><p className="text-text-muted">Bác sĩ</p><p className="mt-1 font-semibold text-text">{doctor?.fullName}</p></div>
              <Link className="inline-flex items-center justify-between rounded-md border border-border px-3 py-2 font-semibold text-primary transition-colors hover:border-primary hover:bg-teal-50 hover:text-primary-hover" to="/app/patient/appointments">Xem lịch của tôi <ChevronRight size={16} /></Link>
            </div>
          ) : <p className="mt-4 text-sm text-text-muted">Bạn chưa có lịch hẹn sắp tới.</p>}
        </article>

        <article className="rounded-lg border border-border bg-surface p-5 shadow-panel">
          <div className="flex items-center gap-2"><Bell aria-hidden="true" className="text-primary" size={18} /><h2 className="text-base font-semibold">Thông báo gần đây</h2></div>
          <ul className="mt-4 space-y-3">
            {notifications.map((notification) => <li className="rounded-md border border-border bg-white p-3 last:border-border" key={notification.id}><p className="text-sm font-semibold text-text">{notification.title}</p><p className="mt-1 text-sm text-text-muted">{notification.message}</p></li>)}
          </ul>
        </article>
      </div>
    </section>
  );
}
