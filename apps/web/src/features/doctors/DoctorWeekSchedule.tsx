import { useMemo, useState } from "react";
import { AppointmentTimeline } from "../../components/AppointmentTimeline";
import { DetailDrawer } from "../../components/DetailDrawer";
import { EmptyState } from "../../components/EmptyState";
import { formatDate, toDateInputValue } from "../../lib/dateTime";
import { mockStore } from "../../mocks/mockStore";
import type { Appointment } from "../../types/models";
import { useAuth } from "../auth/AuthProvider";
import { DOCTOR_PROTOTYPE_TODAY } from "./doctorPrototype";

function weekDates(startDate: string) {
  const start = new Date(`${startDate}T00:00:00Z`);
  return Array.from({ length: 7 }, (_, index) => new Date(start.getTime() + index * 86_400_000).toISOString().slice(0, 10));
}

export function DoctorWeekSchedule() {
  const { user } = useAuth();
  const doctor = mockStore.doctors.find((candidate) => candidate.userId === user?.id);
  const [weekStart, setWeekStart] = useState(DOCTOR_PROTOTYPE_TODAY);
  const dates = useMemo(() => weekDates(weekStart), [weekStart]);
  const [selectedDate, setSelectedDate] = useState(weekStart);
  const [appointments, setAppointments] = useState<Appointment[]>(() => mockStore.appointments.filter((appointment) => appointment.doctorId === doctor?.id).sort((left, right) => left.startAt.localeCompare(right.startAt)));
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const visibleAppointments = appointments.filter((appointment) => toDateInputValue(appointment.startAt) === selectedDate);

  function updateWeekStart(value: string) {
    setWeekStart(value);
    setSelectedDate(value);
  }

  function updateAppointment(updated: Appointment) {
    setAppointments((current) => current.map((appointment) => appointment.id === updated.id ? updated : appointment));
    setSelectedAppointment(updated);
  }

  return <section className="mx-auto max-w-4xl"><p className="text-sm font-medium text-primary">Lịch cá nhân</p><h1 className="mt-1 text-2xl font-semibold text-text">Lịch tuần</h1><label className="mt-5 grid max-w-xs gap-1 text-sm font-medium text-text" htmlFor="doctor-week-start">Bắt đầu tuần<input className="h-11 rounded-md border border-border bg-surface px-3 text-text" id="doctor-week-start" onChange={(event) => updateWeekStart(event.target.value)} type="date" value={weekStart} /></label><div aria-label="Chọn ngày trong tuần" className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">{dates.map((date) => <button aria-pressed={selectedDate === date} className="min-h-14 rounded-md border border-border bg-surface px-2 py-2 text-left text-sm font-medium text-text aria-pressed:border-primary aria-pressed:bg-surface-muted aria-pressed:text-primary" key={date} onClick={() => setSelectedDate(date)} type="button">{formatDate(`${date}T00:00:00+07:00`)}</button>)}</div><div className="mt-5">{visibleAppointments.length ? <AppointmentTimeline appointments={visibleAppointments} compact onSelect={setSelectedAppointment} patients={mockStore.patients} services={mockStore.services} /> : <EmptyState description="Không có lịch hẹn trong ngày đã chọn." title="Chưa có lịch hẹn" />}</div><DetailDrawer actorUserId={user?.id ?? ""} appointment={selectedAppointment} onClose={() => setSelectedAppointment(null)} onUpdated={updateAppointment} /></section>;
}
