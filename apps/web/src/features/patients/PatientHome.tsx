import { useQuery } from "@tanstack/react-query";
import { Bell, CalendarDays, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDateTime } from "../../lib/dateTime";
import { mockStore } from "../../mocks/mockStore";
import { useAuth } from "../auth/AuthProvider";
import { catalogQueryOptions } from "../catalog/catalogService";

export function PatientHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const patient = mockStore.patients.find((candidate) => candidate.userId === user?.id);
  const { data: serviceResponse } = useQuery(catalogQueryOptions.services({ pageSize: 100 }));
  const { data: doctorResponse } = useQuery(catalogQueryOptions.doctors({ pageSize: 100 }));
  const nextAppointment = mockStore.appointments
    .filter((appointment) => appointment.patientId === patient?.id && !["completed", "cancelled", "no_show"].includes(appointment.status))
    .sort((left, right) => left.startAt.localeCompare(right.startAt))[0];
  const service = nextAppointment ? serviceResponse?.data.find((candidate) => candidate.id === nextAppointment.serviceId) : undefined;
  const doctor = nextAppointment ? doctorResponse?.data.find((candidate) => candidate.id === nextAppointment.doctorId) : undefined;
  const notifications = mockStore.notifications.filter((notification) => notification.recipientUserId === user?.id).slice(0, 3);

  return (
    <section className="mx-auto grid max-w-6xl gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">CareFlow cho bệnh nhân</p>
          <h1 className="mt-1 text-2xl font-semibold text-text">Trang chính patient</h1>
          <p className="mt-2 text-sm text-text-muted">Theo dõi lịch hẹn và chuẩn bị cho lần khám tiếp theo.</p>
        </div>
        <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover" onClick={() => navigate("/app/patient/book")} type="button">
          <CalendarDays aria-hidden="true" size={18} />
          Đặt lịch
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(16rem,0.65fr)]">
        <article className="rounded-lg border border-border bg-surface p-5 shadow-panel">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-text">Lịch hẹn tiếp theo</h2>
            {nextAppointment && <StatusBadge status={nextAppointment.status} />}
          </div>
          {nextAppointment ? (
            <div className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
              <div><p className="text-text-muted">Dịch vụ</p><p className="mt-1 font-medium text-text">{service?.name}</p></div>
              <div><p className="text-text-muted">Thời gian</p><p className="mt-1 font-medium text-text">{formatDateTime(nextAppointment.startAt)}</p></div>
              <div><p className="text-text-muted">Bác sĩ</p><p className="mt-1 font-medium text-text">{doctor?.fullName}</p></div>
              <Link className="inline-flex items-center gap-1 font-medium text-primary hover:text-primary-hover" to="/app/patient/appointments">Xem lịch của tôi <ChevronRight size={16} /></Link>
            </div>
          ) : <p className="mt-4 text-sm text-text-muted">Bạn chưa có lịch hẹn sắp tới.</p>}
        </article>

        <article className="rounded-lg border border-border bg-surface p-5 shadow-panel">
          <div className="flex items-center gap-2"><Bell aria-hidden="true" className="text-primary" size={18} /><h2 className="text-base font-semibold">Thông báo gần đây</h2></div>
          <ul className="mt-4 space-y-3">
            {notifications.map((notification) => <li className="border-b border-border pb-3 last:border-0 last:pb-0" key={notification.id}><p className="text-sm font-medium text-text">{notification.title}</p><p className="mt-1 text-sm text-text-muted">{notification.message}</p></li>)}
          </ul>
        </article>
      </div>
    </section>
  );
}
