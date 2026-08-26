import { useMemo, useState } from "react";
import { ClinicDateField } from "../../components/ClinicDateField";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDateInputValue, formatTime, toDateInputValue } from "../../lib/dateTime";
import { mockStore } from "../../mocks/mockStore";
import type { AppointmentStatus } from "../../types/models";

const OPERATIONS_TODAY = "2026-08-25";
const statuses: Array<{ value: "" | AppointmentStatus; label: string }> = [{ value: "", label: "Tất cả trạng thái" }, { value: "confirmed", label: "Đã xác nhận" }, { value: "checked_in", label: "Đã check-in" }, { value: "in_progress", label: "Đang khám" }, { value: "completed", label: "Hoàn tất" }, { value: "cancelled", label: "Đã hủy" }, { value: "no_show", label: "Không đến" }];

export function OperationsCalendar() {
  const [date, setDate] = useState(OPERATIONS_TODAY);
  const [doctorId, setDoctorId] = useState("");
  const [specialtyId, setSpecialtyId] = useState("");
  const [status, setStatus] = useState<"" | AppointmentStatus>("");
  const appointments = useMemo(() => mockStore.appointments.filter((appointment) => toDateInputValue(appointment.startAt) === date && (!doctorId || appointment.doctorId === doctorId) && (!specialtyId || mockStore.doctors.find((doctor) => doctor.id === appointment.doctorId)?.specialtyId === specialtyId) && (!status || appointment.status === status)).sort((left, right) => left.startAt.localeCompare(right.startAt)), [date, doctorId, specialtyId, status]);
  const doctor = mockStore.doctors.find((candidate) => candidate.id === doctorId);
  const specialty = mockStore.specialties.find((candidate) => candidate.id === specialtyId);
  const selectedStatus = statuses.find((candidate) => candidate.value === status);

  function resetFilters() {
    setDate(OPERATIONS_TODAY);
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
      <fieldset className="mt-5 rounded-lg border border-border bg-surface p-4 shadow-panel">
        <legend className="px-1 text-base font-semibold text-text">Bộ lọc lịch hoạt động</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ClinicDateField id="operations-calendar-date" label="Ngày" labelClassName="text-sm font-medium text-text" onChange={setDate} value={date} />
          <label className="text-sm font-medium text-text">Bác sĩ<select className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3" onChange={(event) => setDoctorId(event.target.value)} value={doctorId}><option value="">Tất cả bác sĩ</option>{mockStore.doctors.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}</select></label>
          <label className="text-sm font-medium text-text">Chuyên khoa<select className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3" onChange={(event) => setSpecialtyId(event.target.value)} value={specialtyId}><option value="">Tất cả chuyên khoa</option>{mockStore.specialties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="text-sm font-medium text-text">Trạng thái<select className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3" onChange={(event) => setStatus(event.target.value as "" | AppointmentStatus)} value={status}>{statuses.map((item) => <option key={item.value || "all"} value={item.value}>{item.label}</option>)}</select></label>
        </div>
        <div className="mt-4 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="font-medium text-text">Đang hiển thị {appointments.length} lịch hẹn.</p>
          <button className="h-10 rounded-md border border-border px-3 text-sm font-semibold text-text hover:bg-surface-muted" onClick={resetFilters} type="button">Xóa bộ lọc</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-sm text-text-muted">
          {date !== OPERATIONS_TODAY ? renderFilterChip("Ngày", formatDateInputValue(date), () => setDate(OPERATIONS_TODAY)) : null}
          {doctor ? renderFilterChip("Bác sĩ", doctor.fullName, () => setDoctorId("")) : null}
          {specialty ? renderFilterChip("Chuyên khoa", specialty.name, () => setSpecialtyId("")) : null}
          {status && selectedStatus ? renderFilterChip("Trạng thái", selectedStatus.label, () => setStatus("")) : null}
        </div>
      </fieldset>
      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-surface shadow-panel"><table className="hidden min-w-full text-left text-sm md:table"><thead className="bg-surface-muted text-text-muted"><tr><th className="p-3 font-medium">Giờ</th><th className="p-3 font-medium">Bệnh nhân</th><th className="p-3 font-medium">Bác sĩ</th><th className="p-3 font-medium">Dịch vụ</th><th className="p-3 font-medium">Trạng thái</th></tr></thead><tbody>{appointments.map((appointment) => { const patient = mockStore.patients.find((candidate) => candidate.id === appointment.patientId); const appointmentDoctor = mockStore.doctors.find((candidate) => candidate.id === appointment.doctorId); const service = mockStore.services.find((candidate) => candidate.id === appointment.serviceId); return <tr className="border-t border-border" key={appointment.id}><td className="p-3 font-semibold text-primary">{formatTime(appointment.startAt)}</td><td className="p-3 font-medium text-text">{patient?.fullName}</td><td className="p-3 text-text">{appointmentDoctor?.fullName}</td><td className="p-3 text-text-muted">{service?.name}</td><td className="p-3"><StatusBadge status={appointment.status} /></td></tr>; })}</tbody></table><ul className="divide-y divide-border md:hidden">{appointments.map((appointment) => { const patient = mockStore.patients.find((candidate) => candidate.id === appointment.patientId); const appointmentDoctor = mockStore.doctors.find((candidate) => candidate.id === appointment.doctorId); return <li className="flex gap-3 p-3" key={appointment.id}><span className="w-12 shrink-0 font-semibold text-primary">{formatTime(appointment.startAt)}</span><div className="min-w-0 flex-1"><p className="font-medium text-text">{patient?.fullName}</p><p className="mt-1 text-sm text-text-muted">{appointmentDoctor?.fullName}</p><div className="mt-2"><StatusBadge status={appointment.status} /></div></div></li>; })}</ul></div>{!appointments.length ? <p className="mt-4 text-sm text-text-muted">Không có lịch hẹn phù hợp.</p> : null}
    </section>
  );
}
