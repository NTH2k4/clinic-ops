import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { AppointmentTimeline } from "../../components/AppointmentTimeline";
import { ClinicDateField } from "../../components/ClinicDateField";
import { DetailDrawer } from "../../components/DetailDrawer";
import { EmptyState } from "../../components/EmptyState";
import { addDays, formatDate, formatDateRange, getIsoWeekNumber, getWeekStartDate, isDateInputValue, toDateInputValue } from "../../lib/dateTime";
import type { Appointment } from "../../types/models";
import { appointmentQueryOptions, patientsFromAppointments } from "../appointments/appointmentService";
import { useAuth } from "../auth/AuthProvider";
import { catalogQueryOptions } from "../catalog/catalogService";
import { DOCTOR_PROTOTYPE_TODAY } from "./doctorPrototype";

function weekDates(startDate: string) {
  const start = new Date(`${startDate}T00:00:00Z`);
  return Array.from({ length: 7 }, (_, index) => new Date(start.getTime() + index * 86_400_000).toISOString().slice(0, 10));
}

export function DoctorWeekSchedule() {
  const { linkedProfile, user } = useAuth();
  const queryClient = useQueryClient();
  const { data: doctorResponse } = useQuery(catalogQueryOptions.allDoctors());
  const { data: serviceResponse } = useQuery(catalogQueryOptions.allServices());
  const doctor = doctorResponse?.data.find((candidate) => candidate.id === (linkedProfile?.type === "doctor" ? linkedProfile.id : undefined) || candidate.userId === user?.id);
  const services = serviceResponse?.data ?? [];
  const currentWeekStart = getWeekStartDate(DOCTOR_PROTOTYPE_TODAY);
  const [weekStart, setWeekStart] = useState(currentWeekStart);
  const dates = useMemo(() => weekDates(weekStart), [weekStart]);
  const [selectedDate, setSelectedDate] = useState(weekStart);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const weekEnd = dates[6];
  const appointmentOptions = appointmentQueryOptions.list({
    doctorId: doctor?.id,
    startAt: `${weekStart}T00:00:00+07:00`,
    endAt: `${weekEnd}T23:59:59.999+07:00`,
  });
  const { data: appointments = [] } = useQuery(appointmentOptions);
  const patients = patientsFromAppointments(appointments);
  const visibleAppointments = appointments.filter((appointment) => toDateInputValue(appointment.startAt) === selectedDate).sort((left, right) => left.startAt.localeCompare(right.startAt));
  const weekLabel = `Tuần ${getIsoWeekNumber(weekStart)}, ${formatDateRange(weekStart, weekEnd)}`;

  function updateWeekStart(value: string) {
    if (!isDateInputValue(value)) return;
    const nextWeekStart = getWeekStartDate(value);
    setWeekStart(nextWeekStart);
    setSelectedDate(nextWeekStart);
  }

  function moveWeek(days: number) {
    updateWeekStart(addDays(weekStart, days));
  }

  function updateAppointment(updated: Appointment) {
    queryClient.setQueryData<Appointment[]>(appointmentOptions.queryKey, (current = []) =>
      current.map((appointment) => appointment.id === updated.id ? updated : appointment));
    setSelectedAppointment(updated);
  }

  return (
    <section className="mx-auto max-w-4xl">
      <p className="text-sm font-medium text-primary">Lịch cá nhân</p>
      <h1 className="mt-1 text-2xl font-semibold text-text">Lịch tuần</h1>
      <div className="mt-5 rounded-md border border-border bg-surface p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Tuần đang xem</p>
            <p className="mt-1 flex items-center gap-2 text-xl font-semibold text-text">
              <CalendarDays aria-hidden="true" className="h-5 w-5 text-primary" />
              {weekLabel}
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <button className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-text transition-colors hover:bg-surface-muted" onClick={() => moveWeek(-7)} type="button">
              <ChevronLeft aria-hidden="true" className="h-4 w-4" />
              Tuần trước
            </button>
            <button className="h-10 rounded-md border border-primary/30 bg-primary/10 px-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/15" onClick={() => updateWeekStart(currentWeekStart)} type="button">
              Tuần hiện tại
            </button>
            <button className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-text transition-colors hover:bg-surface-muted" onClick={() => moveWeek(7)} type="button">
              Tuần sau
              <ChevronRight aria-hidden="true" className="h-4 w-4" />
            </button>
            <ClinicDateField id="doctor-week-start" label="Bắt đầu tuần" labelClassName="grid gap-1 text-sm font-medium text-text" onChange={updateWeekStart} value={weekStart} />
          </div>
        </div>
      </div>
      <div aria-label="Chọn ngày trong tuần" className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">{dates.map((date) => <button aria-pressed={selectedDate === date} className="min-h-14 rounded-md border border-border bg-surface px-2 py-2 text-left text-sm font-medium text-text aria-pressed:border-primary aria-pressed:bg-surface-muted aria-pressed:text-primary" key={date} onClick={() => setSelectedDate(date)} type="button">{formatDate(`${date}T00:00:00+07:00`)}</button>)}</div>
      <div className="mt-5">{visibleAppointments.length ? <AppointmentTimeline appointments={visibleAppointments} compact onSelect={setSelectedAppointment} patients={patients} services={services} /> : <EmptyState description="Không có lịch hẹn trong ngày đã chọn." title="Chưa có lịch hẹn" />}</div>
      <DetailDrawer actorRole={user?.role ?? "doctor"} actorUserId={user?.id ?? ""} appointment={selectedAppointment} onClose={() => setSelectedAppointment(null)} onUpdated={updateAppointment} />
    </section>
  );
}
