import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ClinicDateField } from "../../components/ClinicDateField";
import { EmptyState } from "../../components/EmptyState";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDateInputValue, formatTime, todayInClinicTimeZone, toDateInputValue } from "../../lib/dateTime";
import type { Appointment, AppointmentStatus, DoctorSchedule, UserRole } from "../../types/models";
import { appointmentDateRange, appointmentQueryOptions, appointmentService, patientsFromAppointments } from "../appointments/appointmentService";
import { canTransitionAppointment } from "../appointments/appointmentRules";
import { useAuth } from "../auth/AuthProvider";
import { catalogQueryOptions } from "../catalog/catalogService";
import { schedulingQueryOptions } from "../scheduling/schedulingService";

const statuses: Array<{ value: "" | AppointmentStatus; label: string }> = [{ value: "", label: "Tất cả trạng thái" }, { value: "requested", label: "Chờ xác nhận" }, { value: "confirmed", label: "Đã xác nhận" }, { value: "checked_in", label: "Đã check-in" }, { value: "in_progress", label: "Đang khám" }, { value: "completed", label: "Hoàn tất" }, { value: "cancelled", label: "Đã hủy" }, { value: "no_show", label: "Không đến" }];
const dayLabels: Record<number, string> = {
  1: "Thứ Hai",
  2: "Thứ Ba",
  3: "Thứ Tư",
  4: "Thứ Năm",
  5: "Thứ Sáu",
  6: "Thứ Bảy",
  7: "Chủ Nhật",
};

function calendarDayOfWeek(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return dayOfWeek === 0 ? 7 : dayOfWeek;
}

function scheduleMatchesDate(schedule: DoctorSchedule, date: string): boolean {
  return schedule.status === "active" && schedule.dayOfWeek === calendarDayOfWeek(date) && schedule.effectiveFrom <= date && date <= schedule.effectiveTo;
}

function checkInGuardMessage(appointment: Appointment, selectedDate: string, today: string): string {
  if (appointment.status !== "confirmed") return "";
  const appointmentDate = toDateInputValue(appointment.startAt);
  if (appointmentDate > today || selectedDate > today) return "Chỉ check-in trong ngày khám.";
  if (appointmentDate < today || selectedDate < today) return "Lịch đã qua ngày khám, không thể check-in.";
  return "";
}

function calendarActionsForAppointment(appointment: Appointment, role: UserRole = "receptionist", selectedDate: string, today: string): Array<{ label: string; next: AppointmentStatus }> {
  const appointmentDate = toDateInputValue(appointment.startAt);
  if (appointmentDate < today || selectedDate < today) return [];
  const candidates: Array<{ label: string; next: AppointmentStatus }> = appointment.status === "requested"
    ? [{ label: "Xác nhận lịch", next: "confirmed" }]
    : appointment.status === "confirmed" && !checkInGuardMessage(appointment, selectedDate, today)
      ? [{ label: "Check-in", next: "checked_in" }]
      : [];
  return candidates.filter((action) => canTransitionAppointment(appointment.status, action.next, role));
}

const successMessages: Partial<Record<AppointmentStatus, string>> = {
  confirmed: "Đã xác nhận lịch hẹn.",
  checked_in: "Đã check-in lịch hẹn.",
};

export function OperationsCalendar() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = todayInClinicTimeZone();
  const [date, setDate] = useState(() => todayInClinicTimeZone());
  const [doctorId, setDoctorId] = useState("");
  const [specialtyId, setSpecialtyId] = useState("");
  const [status, setStatus] = useState<"" | AppointmentStatus>("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const actorUserId = user?.id ?? "user-receptionist-1";
  const { data: doctorResponse } = useQuery(catalogQueryOptions.allDoctors({ specialtyId: specialtyId || undefined }));
  const { data: specialtyResponse } = useQuery(catalogQueryOptions.allSpecialties());
  const { data: serviceResponse } = useQuery(catalogQueryOptions.allServices());
  const { data: scheduleResponse } = useQuery(schedulingQueryOptions.schedules({
    doctorId: doctorId || undefined,
    from: date,
    to: date,
    page: 1,
    pageSize: 100,
  }));
  const appointmentOptions = appointmentQueryOptions.list({
    ...appointmentDateRange(date),
    doctorId: doctorId || undefined,
    status: status || undefined,
  });
  const { data: appointmentResponse = [] } = useQuery(appointmentOptions);
  const doctors = useMemo(() => doctorResponse?.data ?? [], [doctorResponse?.data]);
  const specialties = specialtyResponse?.data ?? [];
  const services = serviceResponse?.data ?? [];
  const appointments = useMemo(() => appointmentResponse
    .filter((appointment) => !specialtyId || doctors.some((doctor) => doctor.id === appointment.doctorId))
    .sort((left, right) => left.startAt.localeCompare(right.startAt)), [appointmentResponse, doctors, specialtyId]);
  const patients = useMemo(() => patientsFromAppointments(appointments), [appointments]);
  const workingDoctors = useMemo(() => {
    const activeDoctors = new Map(doctors.filter((item) => item.status === "active").map((item) => [item.id, item]));
    return (scheduleResponse?.data ?? [])
      .filter((schedule) => schedule.type === "working" && scheduleMatchesDate(schedule, date) && activeDoctors.has(schedule.doctorId))
      .map((schedule) => ({ schedule, doctor: activeDoctors.get(schedule.doctorId)! }))
      .sort((left, right) =>
        left.schedule.startTime.localeCompare(right.schedule.startTime)
        || left.doctor.fullName.localeCompare(right.doctor.fullName));
  }, [date, doctors, scheduleResponse?.data]);
  const doctor = doctors.find((candidate) => candidate.id === doctorId);
  const specialty = specialties.find((candidate) => candidate.id === specialtyId);
  const selectedStatus = statuses.find((candidate) => candidate.value === status);

  function cacheUpdatedAppointment(updated: Appointment) {
    queryClient.setQueryData<Appointment[]>(appointmentOptions.queryKey, (current = []) =>
      current.map((candidate) => candidate.id === updated.id ? updated : candidate));
  }

  async function updateStatus(appointment: Appointment, nextStatus: AppointmentStatus) {
    setError("");
    setNotice("");

    try {
      const updated = await appointmentService.updateAppointmentStatus(appointment.id, nextStatus, actorUserId);
      cacheUpdatedAppointment(updated);
      setNotice(successMessages[nextStatus] ?? "Đã cập nhật lịch hẹn.");
    } catch {
      setError("Không thể cập nhật lịch hẹn. Vui lòng thử lại.");
    }
  }

  function renderAppointmentActions(appointment: Appointment) {
    const guardMessage = checkInGuardMessage(appointment, date, today);
    const actions = calendarActionsForAppointment(appointment, user?.role ?? "receptionist", date, today);

    return (
      <div className="flex flex-col items-start gap-2">
        {guardMessage ? <p className="text-xs font-medium text-text-muted">{guardMessage}</p> : null}
        {actions.map((action) => (
          <button className="h-9 rounded-md border border-border px-3 text-sm font-semibold text-text hover:bg-surface-muted" key={action.label} onClick={() => void updateStatus(appointment, action.next)} type="button">
            {action.label}
          </button>
        ))}
      </div>
    );
  }

  function resetFilters() {
    setDate(todayInClinicTimeZone());
    setDoctorId("");
    setSpecialtyId("");
    setStatus("");
  }

  function renderFilterChip(label: string, value: string, onClear: () => void) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-surface-muted px-2 py-1">
        <span>{label}: {value}</span>
        <button aria-label={`Xóa filter ${label}`} className="inline-flex size-5 items-center justify-center rounded-sm text-text-muted hover:bg-surface hover:text-text" onClick={onClear} type="button">×</button>
      </span>
    );
  }

  return (
    <section className="mx-auto max-w-6xl">
      <p className="text-sm font-medium text-primary">Điều phối lịch</p>
      <h1 className="mt-1 text-2xl font-semibold text-text">Lịch hoạt động</h1>
      {notice && <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-success" role="status">{notice}</p>}
      {error && <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-danger" role="alert">{error}</p>}
      <fieldset className="mt-5 rounded-lg border border-border bg-surface p-4 shadow-panel">
        <legend className="px-1 text-base font-semibold text-text">Bộ lọc lịch hoạt động</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ClinicDateField id="operations-calendar-date" label="Ngày" labelClassName="text-sm font-medium text-text" onChange={setDate} value={date} />
          <label className="text-sm font-medium text-text">Bác sĩ<select className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3" onChange={(event) => setDoctorId(event.target.value)} value={doctorId}><option value="">Tất cả bác sĩ</option>{doctors.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}</select></label>
          <label className="text-sm font-medium text-text">Chuyên khoa<select className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3" onChange={(event) => setSpecialtyId(event.target.value)} value={specialtyId}><option value="">Tất cả chuyên khoa</option>{specialties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="text-sm font-medium text-text">Trạng thái<select className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3" onChange={(event) => setStatus(event.target.value as "" | AppointmentStatus)} value={status}>{statuses.map((item) => <option key={item.value || "all"} value={item.value}>{item.label}</option>)}</select></label>
        </div>
        <div className="mt-4 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="font-medium text-text">Đang hiển thị {appointments.length} lịch hẹn.</p>
          <button className="h-10 rounded-md border border-border px-3 text-sm font-semibold text-text hover:bg-surface-muted" onClick={resetFilters} type="button">Xóa bộ lọc</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-sm text-text-muted">
          {date !== today ? renderFilterChip("Ngày", formatDateInputValue(date), () => setDate(todayInClinicTimeZone())) : null}
          {doctor ? renderFilterChip("Bác sĩ", doctor.fullName, () => setDoctorId("")) : null}
          {specialty ? renderFilterChip("Chuyên khoa", specialty.name, () => setSpecialtyId("")) : null}
          {status && selectedStatus ? renderFilterChip("Trạng thái", selectedStatus.label, () => setStatus("")) : null}
        </div>
      </fieldset>
      <section aria-label="Bác sĩ làm việc trong ngày" className="mt-5 rounded-lg border border-border bg-surface p-4 shadow-panel">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-text">Bác sĩ làm việc trong ngày</h2>
            <p className="mt-1 text-sm text-text-muted">Dựa trên lịch làm việc hàng tuần active cho {dayLabels[calendarDayOfWeek(date)]}, {formatDateInputValue(date)}.</p>
          </div>
          <p className="text-sm font-semibold text-text">{workingDoctors.length} bác sĩ</p>
        </div>
        {workingDoctors.length ? (
          <ul className="mt-3 grid gap-2 md:grid-cols-2">
            {workingDoctors.map(({ doctor: workingDoctor, schedule }) => (
              <li className="rounded-md border border-border bg-white p-3" key={schedule.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-text">{workingDoctor.fullName}</p>
                  <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-success">Có lịch làm việc</span>
                </div>
                <p className="mt-1 text-sm text-text-muted">{workingDoctor.room ?? "Chưa gán phòng"} · {schedule.startTime}-{schedule.endTime}</p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-3">
            <EmptyState description="Không có bác sĩ nào có lịch làm việc active trong ngày đang chọn." title="Chưa có bác sĩ làm việc" />
          </div>
        )}
      </section>
      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-surface shadow-panel"><table className="hidden min-w-full text-left text-sm md:table"><thead className="bg-surface-muted text-text-muted"><tr><th className="p-3 font-medium">Giờ</th><th className="p-3 font-medium">Bệnh nhân</th><th className="p-3 font-medium">Bác sĩ</th><th className="p-3 font-medium">Dịch vụ</th><th className="p-3 font-medium">Trạng thái</th><th className="p-3 font-medium">Thao tác</th></tr></thead><tbody>{appointments.map((appointment) => { const patient = patients.find((candidate) => candidate.id === appointment.patientId); const appointmentDoctor = doctors.find((candidate) => candidate.id === appointment.doctorId); const service = services.find((candidate) => candidate.id === appointment.serviceId); return <tr className="border-t border-border" key={appointment.id}><td className="p-3 font-semibold text-primary">{formatTime(appointment.startAt)}</td><td className="p-3 font-medium text-text">{patient?.fullName}</td><td className="p-3 text-text">{appointmentDoctor?.fullName}</td><td className="p-3 text-text-muted">{service?.name}</td><td className="p-3"><StatusBadge status={appointment.status} /></td><td className="p-3">{renderAppointmentActions(appointment)}</td></tr>; })}</tbody></table><ul className="divide-y divide-border md:hidden">{appointments.map((appointment) => { const patient = patients.find((candidate) => candidate.id === appointment.patientId); const appointmentDoctor = doctors.find((candidate) => candidate.id === appointment.doctorId); return <li className="flex gap-3 p-3" key={appointment.id}><span className="w-12 shrink-0 font-semibold text-primary">{formatTime(appointment.startAt)}</span><div className="min-w-0 flex-1"><p className="font-medium text-text">{patient?.fullName}</p><p className="mt-1 text-sm text-text-muted">{appointmentDoctor?.fullName}</p><div className="mt-2"><StatusBadge status={appointment.status} /></div><div className="mt-3">{renderAppointmentActions(appointment)}</div></div></li>; })}</ul></div>{!appointments.length ? <p className="mt-4 text-sm text-text-muted">Không có lịch hẹn phù hợp.</p> : null}
    </section>
  );
}
