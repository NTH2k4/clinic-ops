import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck, Search, UserRoundPlus } from "lucide-react";
import { useState } from "react";
import { ClinicDateField } from "../../components/ClinicDateField";
import { ShimmerBlock } from "../../components/LoadingState";
import { formatDateTime } from "../../lib/dateTime";
import { catalogQueryOptions } from "../catalog/catalogService";
import { walkInService, type WalkInQuote } from "./walkInService";

const assignmentReasonLabels: Record<WalkInQuote["assignmentReason"], string> = {
  room_empty: "Phòng đang trống",
  lowest_queue: "Hàng đợi ít nhất",
  continued_shift: "Cùng bác sĩ tiếp tục ca",
  next_shift: "Chuyển sang ca tiếp theo",
};

export function WalkInIntakePage() {
  const queryClient = useQueryClient();
  const { data: serviceResponse, isLoading } = useQuery(catalogQueryOptions.allServices({ status: "active" }));
  const services = serviceResponse?.data ?? [];
  const [citizenIdNumber, setCitizenIdNumber] = useState("");
  const [healthInsuranceNumber, setHealthInsuranceNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [reason, setReason] = useState("");
  const [quote, setQuote] = useState<WalkInQuote | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isQuoting, setIsQuoting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const patientPayload = {
    fullName: fullName.trim(),
    phone: phone.trim(),
    citizenIdNumber: citizenIdNumber.trim() || null,
    healthInsuranceNumber: healthInsuranceNumber.trim() || null,
    dateOfBirth: dateOfBirth || null,
    address: address.trim() || null,
    guardianName: guardianName.trim() || null,
    guardianPhone: guardianPhone.trim() || null,
    identityDocumentType: citizenIdNumber.trim() ? "citizen_id" : healthInsuranceNumber.trim() ? "health_insurance" : guardianName.trim() ? "guardian_verified" : null,
  };
  const canQuote = Boolean(patientPayload.fullName && patientPayload.phone && serviceId && !isQuoting && !isCreating);

  async function requestQuote() {
    if (!canQuote) return;
    setError("");
    setNotice("");
    setQuote(null);
    setIsQuoting(true);
    try {
      setQuote(await walkInService.quote({ patient: patientPayload, serviceId, reason: reason.trim() || undefined }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể tìm phòng phù hợp.");
    } finally {
      setIsQuoting(false);
    }
  }

  async function confirmIntake() {
    if (!quote || !canQuote || isCreating) return;
    setError("");
    setNotice("");
    setIsCreating(true);
    try {
      await walkInService.create({ patient: patientPayload, serviceId, reason: reason.trim() || undefined });
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
      setNotice("Đã xếp bệnh nhân vào hàng đợi khám.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể xếp bệnh nhân vào hàng đợi.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <section className="mx-auto max-w-6xl">
      <p className="text-sm font-medium text-primary">Tiếp đón</p>
      <h1 className="mt-1 text-2xl font-semibold text-text">Tiếp nhận trực tiếp</h1>
      <p className="mt-2 text-sm text-text-muted">Xác minh thông tin bệnh nhân và xếp vào phòng khám có tải hàng đợi phù hợp.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <fieldset className="rounded-lg border border-border bg-surface p-5 shadow-panel">
            <legend className="px-1 text-base font-semibold text-text">1. Định danh bệnh nhân</legend>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-text">CCCD<input className="mt-1 h-11 w-full rounded-md border border-border px-3 text-sm" inputMode="numeric" onChange={(event) => { setCitizenIdNumber(event.target.value); setQuote(null); }} value={citizenIdNumber} /></label>
              <label className="text-sm font-medium text-text">BHYT<input className="mt-1 h-11 w-full rounded-md border border-border px-3 text-sm" onChange={(event) => { setHealthInsuranceNumber(event.target.value); setQuote(null); }} value={healthInsuranceNumber} /></label>
              <label className="text-sm font-medium text-text">Họ và tên<input className="mt-1 h-11 w-full rounded-md border border-border px-3 text-sm" onChange={(event) => { setFullName(event.target.value); setQuote(null); }} value={fullName} /></label>
              <label className="text-sm font-medium text-text">Số điện thoại<input className="mt-1 h-11 w-full rounded-md border border-border px-3 text-sm" onChange={(event) => { setPhone(event.target.value); setQuote(null); }} value={phone} /></label>
              <ClinicDateField id="walk-in-date-of-birth" label="Ngày sinh" onChange={(value) => { setDateOfBirth(value); setQuote(null); }} value={dateOfBirth} />
              <label className="text-sm font-medium text-text">Người giám hộ<input className="mt-1 h-11 w-full rounded-md border border-border px-3 text-sm" onChange={(event) => { setGuardianName(event.target.value); setQuote(null); }} value={guardianName} /></label>
              <label className="text-sm font-medium text-text sm:col-span-2">Địa chỉ<input className="mt-1 h-11 w-full rounded-md border border-border px-3 text-sm" onChange={(event) => { setAddress(event.target.value); setQuote(null); }} value={address} /></label>
              <label className="text-sm font-medium text-text">SĐT người giám hộ<input className="mt-1 h-11 w-full rounded-md border border-border px-3 text-sm" onChange={(event) => { setGuardianPhone(event.target.value); setQuote(null); }} value={guardianPhone} /></label>
            </div>
          </fieldset>

          <fieldset className="rounded-lg border border-border bg-surface p-5 shadow-panel">
            <legend className="px-1 text-base font-semibold text-text">2. Nhu cầu khám</legend>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-text">Dịch vụ khám<select className="mt-1 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm" onChange={(event) => { setServiceId(event.target.value); setQuote(null); }} value={serviceId}><option value="">Chọn dịch vụ</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></label>
              <label className="text-sm font-medium text-text">Lý do khám<input className="mt-1 h-11 w-full rounded-md border border-border px-3 text-sm" onChange={(event) => setReason(event.target.value)} value={reason} /></label>
            </div>
            {isLoading ? <div aria-label="Đang tải dịch vụ khám" className="mt-3" role="status"><ShimmerBlock className="h-10 w-full" /></div> : null}
            <button className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-border-strong" disabled={!canQuote} onClick={() => void requestQuote()} type="button">
              <Search aria-hidden="true" size={17} />{isQuoting ? "Đang tìm..." : "Tìm phòng phù hợp"}
            </button>
          </fieldset>
        </div>

        <aside aria-label="Đề xuất tiếp nhận" className="h-fit rounded-lg border border-border bg-surface p-5 shadow-panel lg:sticky lg:top-6">
          <div className="flex items-center gap-2">
            <UserRoundPlus aria-hidden="true" className="text-primary" size={20} />
            <h2 className="text-base font-semibold text-text">Đề xuất tiếp nhận</h2>
          </div>
          {quote ? (
            <dl className="mt-4 space-y-3 text-sm">
              <div><dt className="text-text-muted">Bác sĩ</dt><dd className="font-medium text-text">{quote.doctorName}</dd></div>
              <div><dt className="text-text-muted">Phòng</dt><dd className="font-medium text-text">{quote.room ?? "Chưa gán phòng"}</dd></div>
              <div><dt className="text-text-muted">Thời gian dự kiến</dt><dd className="font-medium text-text">{formatDateTime(quote.startAt)}</dd></div>
              <div><dt className="text-text-muted">Số người chờ</dt><dd className="font-medium text-text">{quote.queueAhead}</dd></div>
              <div><dt className="text-text-muted">Thời gian chờ ước tính</dt><dd className="font-medium text-text">{quote.estimatedWaitMinutes} phút</dd></div>
              <div><dt className="text-text-muted">Lý do chọn</dt><dd className="font-medium text-text">{assignmentReasonLabels[quote.assignmentReason]}</dd></div>
            </dl>
          ) : <p className="mt-3 text-sm text-text-muted">Nhập thông tin bệnh nhân và dịch vụ để tìm phòng phù hợp.</p>}
          {error ? <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-danger" role="alert">{error}</p> : null}
          {notice ? <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-success">{notice}</p> : null}
          <button className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-border-strong" disabled={!quote || isCreating || Boolean(notice)} onClick={() => void confirmIntake()} type="button">
            <ClipboardCheck aria-hidden="true" size={17} />{isCreating ? "Đang xếp..." : "Xếp vào hàng đợi"}
          </button>
        </aside>
      </div>
    </section>
  );
}
