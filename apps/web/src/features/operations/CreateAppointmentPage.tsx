import { CheckCircle2, Search, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { formatDateInputValue } from "../../lib/dateTime";
import { createId } from "../../lib/ids";
import { mockStore } from "../../mocks/mockStore";
import type { Patient } from "../../types/models";
import { appointmentStart, isDoctorAvailableForSlot } from "../appointments/appointmentAvailability";
import { appointmentService } from "../appointments/appointmentService";
import { useAuth } from "../auth/AuthProvider";

const OPERATIONS_DATE = "2026-08-26";
const appointmentTimes = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30"];

function normalized(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").toLowerCase();
}

export function CreateAppointmentPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientPhone, setNewPatientPhone] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState(OPERATIONS_DATE);
  const [time, setTime] = useState("");
  const [error, setError] = useState("");
  const [created, setCreated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const matches = useMemo(() => search.trim() ? mockStore.patients.filter((patient) => normalized(`${patient.fullName} ${patient.phone}`).includes(normalized(search))) : [], [search]);
  const selectedService = mockStore.services.find((service) => service.id === serviceId);
  const doctors = mockStore.doctors.filter((doctor) => doctor.status === "active" && (!selectedService || doctor.serviceIds.includes(selectedService.id)));
  const actorUserId = user?.id ?? "user-receptionist-1";
  const isSelectedSlotAvailable = Boolean(selectedService && doctorId && time && isDoctorAvailableForSlot(doctorId, date, time, selectedService.durationMinutes));
  const canSubmit = Boolean(selectedPatient && serviceId && doctorId && date && time && isSelectedSlotAvailable && !created && !isSubmitting);

  function selectPatient(patient: Patient) {
    setSelectedPatient(patient);
    setSearch(patient.fullName);
    setShowNewPatient(false);
    setCreated(false);
  }

  function createPatient() {
    if (!newPatientName.trim() || !newPatientPhone.trim()) return;
    const timestamp = new Date().toISOString();
    const patient: Patient = { id: createId("patient"), fullName: newPatientName.trim(), phone: newPatientPhone.trim(), dateOfBirth: "", gender: "prefer_not_to_say", status: "active", createdAt: timestamp, updatedAt: timestamp };
    mockStore.patients.push(patient);
    selectPatient(patient);
  }

  async function submit() {
    if (!selectedPatient || !selectedService || !doctorId || !date || !time || created || isSubmitting) return;
    if (!isDoctorAvailableForSlot(doctorId, date, time, selectedService.durationMinutes)) {
      setError("Khung giờ đã chọn không khả dụng.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await appointmentService.createStaffAppointment({ patientId: selectedPatient.id, doctorId, serviceId, startAt: appointmentStart(date, time), actorUserId });
      setCreated(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể tạo lịch hẹn.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-5xl">
      <p className="text-sm font-medium text-primary">Tiếp đón</p>
      <h1 className="mt-1 text-2xl font-semibold text-text">Tạo appointment</h1>
      <p className="mt-2 text-sm text-text-muted">Tạo lịch hẹn đã xác nhận cho bệnh nhân tại quầy.</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="space-y-5">
          <fieldset className="rounded-lg border border-border bg-surface p-5 shadow-panel">
            <legend className="px-1 text-base font-semibold text-text">1. Chọn bệnh nhân</legend>
            <label className="mt-3 block text-sm font-medium text-text" htmlFor="patient-search">Tìm patient</label>
            <div className="relative mt-1">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 text-text-muted" size={18} />
              <input className="h-11 w-full rounded-md border border-border bg-surface pl-10 pr-3 text-sm" id="patient-search" onChange={(event) => { setSearch(event.target.value); setSelectedPatient(null); }} placeholder="Tên hoặc số điện thoại" value={search} />
            </div>
            {search.trim() ? <div className="mt-3 space-y-2">{matches.map((patient) => <button className="flex w-full items-center justify-between rounded-md border border-border p-3 text-left hover:bg-surface-muted" key={patient.id} onClick={() => selectPatient(patient)} type="button"><span><span className="block font-medium text-text">{patient.fullName}</span><span className="text-sm text-text-muted">{patient.phone}</span></span><span className="text-sm text-primary">Chọn</span></button>)}{!matches.length ? <p className="text-sm text-text-muted">Kết quả tìm kiếm cho "{search}" không có bệnh nhân phù hợp.</p> : <p className="text-sm text-text-muted">Kết quả tìm kiếm cho "{search}".</p>}</div> : null}
            <button className="mt-4 inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-text hover:bg-surface-muted" onClick={() => setShowNewPatient((current) => !current)} type="button"><UserPlus aria-hidden="true" size={17} />Tạo patient mới</button>
            {showNewPatient ? <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium text-text">Tên patient<input className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm" onChange={(event) => setNewPatientName(event.target.value)} value={newPatientName} /></label><label className="text-sm font-medium text-text">Số điện thoại<input className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm" onChange={(event) => setNewPatientPhone(event.target.value)} value={newPatientPhone} /></label><button className="h-10 rounded-md bg-primary px-3 text-sm font-semibold text-white sm:col-span-2" onClick={createPatient} type="button">Lưu patient</button></div> : null}
            {selectedPatient ? <p className="mt-3 text-sm font-medium text-success">Đã chọn: {selectedPatient.fullName}</p> : null}
          </fieldset>
          <fieldset className="rounded-lg border border-border bg-surface p-5 shadow-panel">
            <legend className="px-1 text-base font-semibold text-text">2. Chọn dịch vụ và bác sĩ</legend>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-text">Dịch vụ<select className="mt-1 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm" onChange={(event) => { setServiceId(event.target.value); setDoctorId(""); setTime(""); setCreated(false); }} value={serviceId}><option value="">Chọn dịch vụ</option>{mockStore.services.filter((service) => service.status === "active").map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></label>
              <label className="text-sm font-medium text-text">Bác sĩ<select className="mt-1 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm" disabled={!serviceId} onChange={(event) => { setDoctorId(event.target.value); setTime(""); setCreated(false); }} value={doctorId}><option value="">Chọn bác sĩ</option>{doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.fullName}</option>)}</select></label>
            </div>
          </fieldset>
          <fieldset className="rounded-lg border border-border bg-surface p-5 shadow-panel">
            <legend className="px-1 text-base font-semibold text-text">3. Chọn thời gian</legend>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-text">Ngày khám<input className="mt-1 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm" onChange={(event) => { setDate(event.target.value); setTime(""); setCreated(false); }} type="date" value={date} /></label>
              <label className="text-sm font-medium text-text">Giờ khám<select className="mt-1 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm" disabled={!selectedService || !doctorId} onChange={(event) => { setTime(event.target.value); setCreated(false); }} value={time}><option value="">Chọn giờ</option>{appointmentTimes.map((appointmentTime) => <option disabled={!selectedService || !doctorId || !isDoctorAvailableForSlot(doctorId, date, appointmentTime, selectedService.durationMinutes)} key={appointmentTime} value={appointmentTime}>{appointmentTime}</option>)}</select></label>
            </div>
            <p className="mt-3 text-sm text-text-muted">Chỉ các khung giờ còn khả dụng theo lịch làm việc và lịch hẹn hiện có mới được chọn.</p>
          </fieldset>
        </div>
        <aside aria-label="Xem lại trước khi tạo" className="h-fit rounded-lg border border-border bg-surface p-5 shadow-panel lg:sticky lg:top-6">
          <h2 className="text-base font-semibold text-text">Xem lại trước khi tạo</h2>
          {selectedPatient ? <dl className="mt-4 space-y-3 text-sm"><div><dt className="text-text-muted">Bệnh nhân</dt><dd className="font-medium text-text">{selectedPatient.fullName}</dd></div><div><dt className="text-text-muted">Dịch vụ</dt><dd className="font-medium text-text">{selectedService?.name ?? "Chưa chọn"}</dd></div><div><dt className="text-text-muted">Thời gian</dt><dd className="font-medium text-text">{time ? `${formatDateInputValue(date)} ${time}` : "Chưa chọn"}</dd></div></dl> : <p className="mt-3 text-sm text-text-muted">Chọn bệnh nhân để tiếp tục.</p>}
          {error ? <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-danger" role="alert">{error}</p> : null}
          {created ? <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-success"><CheckCircle2 aria-hidden="true" size={18} />Đã xác nhận</p> : null}
          <button className="mt-5 h-11 w-full rounded-md bg-primary px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-border-strong" disabled={!canSubmit} onClick={() => void submit()} type="button">{isSubmitting ? "Đang tạo..." : "Tạo appointment"}</button>
        </aside>
      </div>
    </section>
  );
}
