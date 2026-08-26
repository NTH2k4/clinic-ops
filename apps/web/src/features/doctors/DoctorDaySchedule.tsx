import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { AppointmentTimeline } from "../../components/AppointmentTimeline";
import { ClinicDateField } from "../../components/ClinicDateField";
import { DetailDrawer } from "../../components/DetailDrawer";
import { EmptyState } from "../../components/EmptyState";
import { addDays, formatDateInputValue, isDateInputValue, toDateInputValue } from "../../lib/dateTime";
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

  function updateDate(value: string) {
    if (isDateInputValue(value)) setDate(value);
  }

  return (
    <section className="mx-auto max-w-4xl">
      <p className="text-sm font-medium text-primary">Lịch cá nhân</p>
      <h1 className="mt-1 text-2xl font-semibold text-text">Lịch ngày</h1>
      <div className="mt-5 rounded-md border border-border bg-surface p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Ngày đang xem</p>
            <p className="mt-1 flex items-center gap-2 text-xl font-semibold text-text">
              <CalendarDays aria-hidden="true" className="h-5 w-5 text-primary" />
              {formatDateInputValue(date)}
            </p>
            <p className="mt-1 text-sm text-text-muted">Dòng thời gian gọn, phù hợp khi xem trên điện thoại.</p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <button className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-text transition-colors hover:bg-surface-muted" onClick={() => setDate(addDays(date, -1))} type="button">
              <ChevronLeft aria-hidden="true" className="h-4 w-4" />
              Ngày trước
            </button>
            <button className="h-10 rounded-md border border-primary/30 bg-primary/10 px-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/15" onClick={() => setDate(DOCTOR_PROTOTYPE_TODAY)} type="button">
              Hôm nay
            </button>
            <button className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-text transition-colors hover:bg-surface-muted" onClick={() => setDate(addDays(date, 1))} type="button">
              Ngày sau
              <ChevronRight aria-hidden="true" className="h-4 w-4" />
            </button>
            <ClinicDateField id="doctor-day-date" label="Ngày xem lịch" labelClassName="grid gap-1 text-sm font-medium text-text" onChange={updateDate} value={date} />
          </div>
        </div>
      </div>
      <div className="mt-5">{visibleAppointments.length ? <AppointmentTimeline appointments={visibleAppointments} compact onSelect={setSelectedAppointment} patients={mockStore.patients} services={mockStore.services} /> : <EmptyState description="Không có lịch hẹn trong ngày đã chọn." title="Chưa có lịch hẹn" />}</div>
      <DetailDrawer actorUserId={user?.id ?? ""} appointment={selectedAppointment} onClose={() => setSelectedAppointment(null)} onUpdated={updateAppointment} />
    </section>
  );
}
