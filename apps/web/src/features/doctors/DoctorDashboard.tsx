import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppointmentTimeline } from "../../components/AppointmentTimeline";
import { DetailDrawer } from "../../components/DetailDrawer";
import { EmptyState } from "../../components/EmptyState";
import { MetricCard } from "../../components/MetricCard";
import { formatDateTime } from "../../lib/dateTime";
import type { Appointment, AppointmentStatus } from "../../types/models";
import { useAuth } from "../auth/AuthProvider";
import { isActiveAppointmentStatus } from "../appointments/appointmentRules";
import { appointmentDateRange, appointmentQueryOptions, patientsFromAppointments } from "../appointments/appointmentService";
import { catalogQueryOptions } from "../catalog/catalogService";
import { DOCTOR_PROTOTYPE_NOW, DOCTOR_PROTOTYPE_TODAY } from "./doctorPrototype";

const statusMetrics: Array<{ label: string; status: AppointmentStatus }> = [
  { label: "Waiting", status: "confirmed" },
  { label: "Đã check-in", status: "checked_in" },
  { label: "Đang khám", status: "in_progress" },
  { label: "Hoàn tất", status: "completed" },
];

export function DoctorDashboard() {
  const { linkedProfile, user } = useAuth();
  const queryClient = useQueryClient();
  const { data: doctorResponse } = useQuery(catalogQueryOptions.allDoctors());
  const { data: serviceResponse } = useQuery(catalogQueryOptions.allServices());
  const doctor = doctorResponse?.data.find((candidate) => candidate.id === (linkedProfile?.type === "doctor" ? linkedProfile.id : undefined) || candidate.userId === user?.id);
  const services = serviceResponse?.data ?? [];
  const today = DOCTOR_PROTOTYPE_TODAY;
  const appointmentOptions = appointmentQueryOptions.list({ ...appointmentDateRange(today), doctorId: doctor?.id });
  const { data: appointmentResponse = [] } = useQuery(appointmentOptions);
  const appointments = appointmentResponse.slice().sort((left, right) => left.startAt.localeCompare(right.startAt));
  const patients = patientsFromAppointments(appointments);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const nextAppointment = appointments.find(
    (appointment) => isActiveAppointmentStatus(appointment.status) && appointment.startAt > DOCTOR_PROTOTYPE_NOW,
  );

  const counts = useMemo(() => Object.fromEntries(statusMetrics.map(({ status }) => [status, appointments.filter((appointment) => appointment.status === status).length])), [appointments]);

  function updateAppointment(updated: Appointment) {
    queryClient.setQueryData<Appointment[]>(appointmentOptions.queryKey, (current = []) =>
      current.map((appointment) => appointment.id === updated.id ? updated : appointment));
    setSelectedAppointment(updated);
  }

  return (
    <section className="mx-auto max-w-6xl">
      <p className="text-sm font-medium text-primary">Lịch làm việc hôm nay</p>
      <h1 className="mt-1 text-2xl font-semibold text-text">Không gian bác sĩ</h1>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Lịch hẹn hôm nay" value={appointments.length} />
        {statusMetrics.map(({ label, status }) => <MetricCard key={status} label={label} value={counts[status] ?? 0} />)}
      </div>
      <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          <div className="flex items-end justify-between gap-4"><div><h2 className="text-lg font-semibold text-text">Lịch hẹn theo thời gian</h2><p className="mt-1 text-sm text-text-muted">Danh sách được sắp xếp theo giờ hẹn.</p></div></div>
          <div className="mt-4">{appointments.length ? <AppointmentTimeline appointments={appointments} patients={patients} services={services} onSelect={setSelectedAppointment} /> : <EmptyState description="Không có lịch hẹn trong ngày hôm nay." title="Chưa có lịch hẹn" />}</div>
        </div>
        <aside className="border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0"><p className="text-sm font-semibold text-text">Lịch hẹn tiếp theo</p>{nextAppointment ? <div className="mt-3"><p className="text-lg font-semibold text-primary">{formatDateTime(nextAppointment.startAt)}</p><p className="mt-1 text-sm text-text-muted">{patients.find((patient) => patient.id === nextAppointment.patientId)?.fullName}</p><button className="mt-3 h-10 rounded-md border border-border px-3 text-sm font-semibold text-text hover:bg-surface-muted" onClick={() => setSelectedAppointment(nextAppointment)} type="button">Xem chi tiết</button></div> : <p className="mt-3 text-sm text-text-muted">Không còn lịch hẹn cần xử lý.</p>}</aside>
      </section>
      <DetailDrawer actorRole={user?.role ?? "doctor"} actorUserId={user?.id ?? ""} appointment={selectedAppointment} onClose={() => setSelectedAppointment(null)} onUpdated={updateAppointment} />
    </section>
  );
}
