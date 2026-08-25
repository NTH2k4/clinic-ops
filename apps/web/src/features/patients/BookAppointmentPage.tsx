import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDate, formatDateInputValue, formatTime } from "../../lib/dateTime";
import { mockStore } from "../../mocks/mockStore";
import { appointmentStart, isDoctorAvailableForSlot } from "../appointments/appointmentAvailability";
import { appointmentService } from "../appointments/appointmentService";
import { useAuth } from "../auth/AuthProvider";

const slotTimes = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30"];
const bookingDate = "2026-08-26";

export function BookAppointmentPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const patient = mockStore.patients.find((candidate) => candidate.userId === user?.id);
  const initialServiceId = searchParams.get("serviceId") ?? "";
  const [serviceId, setServiceId] = useState(initialServiceId);
  const [doctorMode, setDoctorMode] = useState<"any" | "specific">("any");
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState(bookingDate);
  const [slot, setSlot] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const service = mockStore.services.find((candidate) => candidate.id === serviceId && candidate.status === "active");
  const specialty = service ? mockStore.specialties.find((candidate) => candidate.id === service.specialtyId) : undefined;
  const eligibleDoctors = useMemo(
    () => service ? mockStore.doctors.filter((doctor) => doctor.status === "active" && doctor.serviceIds.includes(service.id)).sort((left, right) => left.id.localeCompare(right.id)) : [],
    [service],
  );
  const startAt = slot ? appointmentStart(date, slot) : "";
  const assignedDoctor = eligibleDoctors.find((doctor) => doctor.id === doctorId)
    ?? (doctorMode === "any" && service && slot
      ? eligibleDoctors.find((doctor) => isDoctorAvailableForSlot(doctor.id, date, slot, service.durationMinutes))
      : undefined);
  const canSubmit = Boolean(patient && user && service && assignedDoctor && slot && reason.trim());

  function selectService(nextServiceId: string) {
    setServiceId(nextServiceId);
    setDoctorId("");
    setSlot("");
    setError("");
    setSubmitted(false);
  }

  async function submit() {
    if (!patient || !user || !service || !assignedDoctor || !startAt) return;
    setError("");
    try {
      await appointmentService.createPatientAppointment({ patientId: patient.id, doctorId: assignedDoctor.id, serviceId: service.id, startAt, actorUserId: user.id, reason: reason.trim() });
      setSubmitted(true);
    } catch (submitError) {
      if ((submitError as { code?: string }).code === "APPOINTMENT_CONFLICT") setError("Khung giờ vừa được đặt bởi lịch hẹn khác. Vui lòng chọn khung giờ khác.");
      else setError("Không thể gửi yêu cầu đặt lịch. Vui lòng thử lại.");
    }
  }

  if (submitted && service && assignedDoctor && startAt) {
    return <section className="mx-auto max-w-3xl rounded-lg border border-border bg-surface p-6 shadow-panel"><div className="flex items-start gap-3"><CheckCircle2 aria-hidden="true" className="shrink-0 text-success" size={24} /><div><h1 className="text-2xl font-semibold text-text">Yêu cầu đã được gửi</h1><div className="mt-3"><StatusBadge status="requested" /></div><p className="mt-4 text-sm text-text-muted">{service.name} với {assignedDoctor.fullName}, {formatDate(startAt)} lúc {formatTime(startAt)}.</p><div className="mt-5 flex flex-col gap-2 sm:flex-row"><Link className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover" to="/app/patient/appointments">Xem lịch của tôi</Link><Link className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-semibold text-text hover:bg-surface-muted" to="/app/patient/services">Đặt lịch khác</Link></div></div></div></section>;
  }

  return (
    <section className="mx-auto max-w-5xl">
      <p className="text-sm font-medium text-primary">Đặt lịch trực tuyến</p>
      <h1 className="mt-1 text-2xl font-semibold text-text">Đặt lịch</h1>
      <p className="mt-2 text-sm text-text-muted">Chọn dịch vụ, bác sĩ và khung giờ phù hợp.</p>
      <nav aria-label="Tiến trình đặt lịch" className="mt-5 rounded-lg border border-border bg-surface p-4 shadow-panel">
        <p className="text-sm font-semibold text-text">Tiến trình đặt lịch</p>
        <ol className="mt-3 grid gap-2 text-sm text-text-muted sm:grid-cols-4">
          <li className="rounded-md bg-primary/10 px-3 py-2 font-medium text-primary">1. Dịch vụ</li>
          <li className="rounded-md bg-surface-muted px-3 py-2">2. Bác sĩ</li>
          <li className="rounded-md bg-surface-muted px-3 py-2">3. Thời gian</li>
          <li className="rounded-md bg-surface-muted px-3 py-2">4. Xác nhận</li>
        </ol>
      </nav>
      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="space-y-5">
          <fieldset className="rounded-lg border border-border bg-surface p-5 shadow-panel"><legend className="px-1 text-base font-semibold">1. Dịch vụ và chuyên khoa</legend><div className="mt-3 grid gap-3 sm:grid-cols-2">
            {mockStore.services.filter((candidate) => candidate.status === "active").map((candidate) => <button aria-pressed={serviceId === candidate.id} className="min-w-0 rounded-md border border-border p-3 text-left text-sm aria-pressed:border-primary aria-pressed:bg-surface-muted" key={candidate.id} onClick={() => selectService(candidate.id)} type="button"><span className="block text-xs text-primary">{mockStore.specialties.find((item) => item.id === candidate.specialtyId)?.name}</span><span className="mt-1 block font-semibold text-text">{candidate.name}</span><span className="mt-1 block text-text-muted">{candidate.durationMinutes} phút</span></button>)}
          </div></fieldset>
          {service && <>
            <fieldset className="rounded-lg border border-border bg-surface p-5 shadow-panel"><legend className="px-1 text-base font-semibold">2. Bác sĩ</legend><div className="mt-3 space-y-3"><label className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-3" htmlFor="any-available-doctor"><input aria-label="Any available doctor" checked={doctorMode === "any"} id="any-available-doctor" name="doctor-mode" onChange={() => { setDoctorMode("any"); setDoctorId(""); setSlot(""); }} type="radio" value="any" /><span><span className="block font-medium text-text">Any available doctor</span><span className="block text-sm text-text-muted">Tự động chọn bác sĩ còn trống cho khung giờ.</span></span></label><label className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-3" htmlFor="specific-doctor"><input checked={doctorMode === "specific"} id="specific-doctor" name="doctor-mode" onChange={() => { setDoctorMode("specific"); setDoctorId(""); setSlot(""); }} type="radio" value="specific" /><span className="font-medium text-text">Chọn bác sĩ cụ thể</span></label>{doctorMode === "specific" && <select aria-label="Bác sĩ" className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm" onChange={(event) => { setDoctorId(event.target.value); setSlot(""); }} value={doctorId}><option value="">Chọn bác sĩ</option>{eligibleDoctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.fullName} - {doctor.title}</option>)}</select>}</div></fieldset>
            <fieldset className="rounded-lg border border-border bg-surface p-5 shadow-panel"><legend className="px-1 text-base font-semibold">3. Ngày và khung giờ</legend><label className="mt-3 block text-sm font-medium text-text" htmlFor="appointment-date">Ngày khám</label><input className="mt-1 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm sm:max-w-64" id="appointment-date" min={bookingDate} onChange={(event) => { setDate(event.target.value); setDoctorId(""); setSlot(""); }} type="date" value={date} /><p className="mt-3 text-sm text-text-muted">Khung giờ màu xám là không khả dụng do lịch làm việc hoặc lịch hẹn đã trùng.</p><div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">{slotTimes.map((time) => { const unavailable = doctorMode === "specific" ? !doctorId || !isDoctorAvailableForSlot(doctorId, date, time, service.durationMinutes) : !eligibleDoctors.some((doctor) => isDoctorAvailableForSlot(doctor.id, date, time, service.durationMinutes)); return <button aria-pressed={slot === time} className="h-10 rounded-md border border-border text-sm font-medium disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 aria-pressed:border-primary aria-pressed:bg-surface-muted aria-pressed:text-primary" disabled={unavailable} key={time} onClick={() => { if (doctorMode === "any") setDoctorId(eligibleDoctors.find((doctor) => isDoctorAvailableForSlot(doctor.id, date, time, service.durationMinutes))?.id ?? ""); setSlot(time); setError(""); }} type="button">{time}</button>; })}</div></fieldset>
            <fieldset className="rounded-lg border border-border bg-surface p-5 shadow-panel"><legend className="px-1 text-base font-semibold">4. Lý do khám</legend><label className="sr-only" htmlFor="reason">Lý do khám</label><textarea className="mt-3 min-h-24 w-full rounded-md border border-border p-3 text-sm" id="reason" onChange={(event) => setReason(event.target.value)} placeholder="Mô tả ngắn triệu chứng hoặc nhu cầu khám" value={reason} /></fieldset>
          </>}
        </div>
        <aside className="h-fit rounded-lg border border-border bg-surface p-5 shadow-panel lg:sticky lg:top-6"><h2 className="text-base font-semibold">5. Xem lại yêu cầu</h2>{service ? <dl className="mt-4 space-y-3 text-sm"><div><dt className="text-text-muted">Dịch vụ</dt><dd className="mt-1 font-medium">{service.name}</dd></div><div><dt className="text-text-muted">Chuyên khoa</dt><dd className="mt-1 font-medium">{specialty?.name}</dd></div><div><dt className="text-text-muted">Bác sĩ</dt><dd className="mt-1 font-medium">{assignedDoctor?.fullName ?? "Chọn khung giờ"}</dd></div><div><dt className="text-text-muted">Thời gian</dt><dd className="mt-1 font-medium">{slot ? `${formatDateInputValue(date)} ${slot}` : "Chưa chọn"}</dd></div></dl> : <p className="mt-3 text-sm text-text-muted">Chọn dịch vụ để tiếp tục.</p>}{error && <p className="mt-4 flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-danger" role="alert"><AlertCircle aria-hidden="true" size={18} />{error}</p>}<button className="mt-5 h-11 w-full rounded-md bg-primary px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-border-strong" disabled={!canSubmit} onClick={() => void submit()} type="button">Gửi yêu cầu</button></aside>
      </div>
    </section>
  );
}
