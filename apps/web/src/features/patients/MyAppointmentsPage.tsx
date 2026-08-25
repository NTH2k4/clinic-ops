import { useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDateTime } from "../../lib/dateTime";
import { mockStore } from "../../mocks/mockStore";
import type { Appointment, AppointmentStatus } from "../../types/models";
import { appointmentService } from "../appointments/appointmentService";
import { useAuth } from "../auth/AuthProvider";

type AppointmentTab = "upcoming" | "past" | "cancelled";
const terminalStatuses: AppointmentStatus[] = ["completed", "cancelled", "no_show"];

function appointmentsForTab(appointments: Appointment[], tab: AppointmentTab): Appointment[] {
  if (tab === "cancelled") return appointments.filter((appointment) => appointment.status === "cancelled");
  if (tab === "past") return appointments.filter((appointment) => appointment.status === "completed" || appointment.status === "no_show");
  return appointments.filter((appointment) => !terminalStatuses.includes(appointment.status));
}

export function MyAppointmentsPage() {
  const { user } = useAuth();
  const patient = mockStore.patients.find((candidate) => candidate.userId === user?.id);
  const [tab, setTab] = useState<AppointmentTab>("upcoming");
  const [appointments, setAppointments] = useState(() => mockStore.appointments.filter((appointment) => appointment.patientId === patient?.id));

  async function cancel(appointmentId: string) {
    if (!user) return;
    await appointmentService.cancelAppointment(appointmentId, { actorUserId: user.id, cancellationReason: "Bệnh nhân hủy lịch qua cổng thông tin." });
    setAppointments(await appointmentService.listAppointments({ patientId: patient?.id }));
  }

  const visibleAppointments = appointmentsForTab(appointments, tab).sort((left, right) => left.startAt.localeCompare(right.startAt));
  const tabs: Array<{ id: AppointmentTab; label: string }> = [{ id: "upcoming", label: "Sắp tới" }, { id: "past", label: "Đã qua" }, { id: "cancelled", label: "Đã hủy" }];

  return <section className="mx-auto max-w-5xl"><p className="text-sm font-medium text-primary">Hồ sơ lịch hẹn</p><h1 className="mt-1 text-2xl font-semibold text-text">Lịch của tôi</h1><div aria-label="Loại lịch hẹn" className="mt-5 flex border-b border-border" role="tablist">{tabs.map((item) => <button aria-controls={`appointments-${item.id}`} aria-selected={tab === item.id} className="h-11 border-b-2 px-4 text-sm font-medium aria-selected:border-primary aria-selected:text-primary" id={`tab-${item.id}`} key={item.id} onClick={() => setTab(item.id)} role="tab" type="button">{item.label}</button>)}</div><div aria-labelledby={`tab-${tab}`} className="mt-5 space-y-3" id={`appointments-${tab}`} role="tabpanel">{visibleAppointments.length === 0 ? <EmptyState description="Không có lịch hẹn trong nhóm này." title="Chưa có lịch hẹn" /> : visibleAppointments.map((appointment) => { const service = mockStore.services.find((candidate) => candidate.id === appointment.serviceId); const doctor = mockStore.doctors.find((candidate) => candidate.id === appointment.doctorId); const cancellable = !terminalStatuses.includes(appointment.status); return <article className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 shadow-panel sm:flex-row sm:items-center sm:justify-between" key={appointment.id}><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-text">{service?.name}</h2><StatusBadge status={appointment.status} /></div><p className="mt-2 text-sm text-text-muted">{formatDateTime(appointment.startAt)} · {doctor?.fullName}</p>{appointment.reason && <p className="mt-1 text-sm text-text-muted">{appointment.reason}</p>}</div>{cancellable && <button className="h-10 shrink-0 rounded-md border border-danger px-3 text-sm font-semibold text-danger hover:bg-red-50" onClick={() => void cancel(appointment.id)} type="button">Hủy lịch</button>}</article>; })}</div></section>;
}
