import { useState } from "react";
import { AppointmentTimeline } from "../../components/AppointmentTimeline";
import { DetailDrawer } from "../../components/DetailDrawer";
import { EmptyState } from "../../components/EmptyState";
import { toDateInputValue } from "../../lib/dateTime";
import { mockStore } from "../../mocks/mockStore";
import type { Appointment } from "../../types/models";
import { useAuth } from "../auth/AuthProvider";
import { DOCTOR_PROTOTYPE_TODAY } from "./doctorPrototype";

export function DoctorDaySchedule() {
  const { user } = useAuth();
  const doctor = mockStore.doctors.find((candidate) => candidate.userId === user?.id);
  const [date, setDate] = useState(DOCTOR_PROTOTYPE_TODAY);
  const [appointments, setAppointments] = useState<Appointment[]>(() => mockStore.appointments.filter((appointment) => appointment.doctorId === doctor?.id).sort((left, right) => left.startAt.localeCompare(right.startAt)));
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const visibleAppointments = appointments.filter((appointment) => toDateInputValue(appointment.startAt) === date);

  function updateAppointment(updated: Appointment) {
    setAppointments((current) => current.map((appointment) => appointment.id === updated.id ? updated : appointment));
    setSelectedAppointment(updated);
  }

  return <section className="mx-auto max-w-4xl"><p className="text-sm font-medium text-primary">Lịch cá nhân</p><h1 className="mt-1 text-2xl font-semibold text-text">Lịch ngày</h1><div className="mt-5 flex flex-wrap items-end justify-between gap-3"><label className="grid gap-1 text-sm font-medium text-text" htmlFor="doctor-day-date">Ngày xem lịch<input className="h-11 rounded-md border border-border bg-surface px-3 text-text" id="doctor-day-date" onChange={(event) => setDate(event.target.value)} type="date" value={date} /></label><p className="text-sm text-text-muted">Dòng thời gian gọn, phù hợp khi xem trên điện thoại.</p></div><div className="mt-5">{visibleAppointments.length ? <AppointmentTimeline appointments={visibleAppointments} compact onSelect={setSelectedAppointment} patients={mockStore.patients} services={mockStore.services} /> : <EmptyState description="Không có lịch hẹn trong ngày đã chọn." title="Chưa có lịch hẹn" />}</div><DetailDrawer actorUserId={user?.id ?? ""} appointment={selectedAppointment} onClose={() => setSelectedAppointment(null)} onUpdated={updateAppointment} /></section>;
}
