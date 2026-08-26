import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { StatusBadge } from "../../components/StatusBadge";
import type { Doctor } from "../../types/models";
import { catalogQueryOptions } from "../catalog/catalogService";

export function AdminDoctors() {
  const { data: doctorResponse } = useQuery(catalogQueryOptions.allDoctors());
  const { data: specialtyResponse } = useQuery(catalogQueryOptions.allSpecialties());
  const [draftDoctors, setDraftDoctors] = useState<Doctor[]>([]);
  const doctors = [...(doctorResponse?.data ?? []), ...draftDoctors];
  const doctorTotal = (doctorResponse?.meta.total ?? 0) + draftDoctors.length;
  const specialties = specialtyResponse?.data ?? [];
  const [name, setName] = useState("");
  const [specialtyId, setSpecialtyId] = useState("");
  const [error, setError] = useState("");

  function addDoctor() {
    if (!name.trim() || !specialtyId) return setError("Vui lòng nhập đủ các trường bắt buộc.");
    const created: Doctor = { id: `draft-doctor-${doctors.length + 1}`, fullName: name.trim(), specialtyId, serviceIds: [], phone: "", email: "", title: "Chưa cập nhật", room: "Chưa phân phòng", status: "active", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setDraftDoctors((current) => [...current, created]); setName(""); setSpecialtyId(""); setError("");
  }

  const specialtyName = (id: string) => specialties.find((item) => item.id === id)?.name ?? "Chưa xác định";

  return (
    <section className="mx-auto max-w-6xl">
      <p className="text-sm font-medium text-primary">Quản trị nhân sự</p>
      <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-2xl font-semibold text-text">Doctors</h1>
        <p className="text-sm font-medium text-text-muted">{doctorTotal} bác sĩ trong mock workspace</p>
      </div>
      <form className="mt-5 rounded-md border border-border bg-surface p-4 shadow-sm" onSubmit={(event) => { event.preventDefault(); addDoctor(); }}>
        <div className="flex flex-col gap-1 border-b border-border pb-3">
          <h2 className="text-base font-semibold text-text">Thêm bác sĩ thử nghiệm</h2>
          <p className="text-sm text-text-muted">Form chỉ cập nhật state frontend để kiểm thử workflow quản trị.</p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <label className="text-sm font-medium text-text">Tên bác sĩ<input className="mt-1 h-10 w-full rounded-md border border-border px-3" onChange={(event) => setName(event.target.value)} value={name} /></label>
          <label className="text-sm font-medium text-text">Chuyên khoa<select className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3" onChange={(event) => setSpecialtyId(event.target.value)} value={specialtyId}><option value="">Chọn chuyên khoa</option>{specialties.map((specialty) => <option key={specialty.id} value={specialty.id}>{specialty.name}</option>)}</select></label>
          <button className="h-10 self-end rounded-md bg-primary px-3 text-sm font-semibold text-white" type="submit">Thêm bác sĩ</button>
          {error ? <p className="text-sm text-danger sm:col-span-3" role="alert">{error}</p> : null}
        </div>
      </form>
      <div className="mt-6 overflow-x-auto rounded-md border border-border bg-surface shadow-sm">
        <table aria-label="Doctors" className="hidden min-w-full text-left text-sm md:table">
          <thead className="bg-surface-muted text-text-muted">
            <tr><th className="p-3 font-medium">Bác sĩ</th><th className="p-3 font-medium">Chuyên khoa</th><th className="p-3 font-medium">Phòng</th><th className="p-3 font-medium">Trạng thái</th></tr>
          </thead>
          <tbody>{doctors.map((doctor) => <tr className="border-t border-border" key={doctor.id}><td className="p-3 font-medium text-text">{doctor.fullName}</td><td className="p-3">{specialtyName(doctor.specialtyId)}</td><td className="p-3">{doctor.room}</td><td className="p-3"><StatusBadge status={doctor.status} /></td></tr>)}</tbody>
        </table>
        <ul className="divide-y divide-border md:hidden">{doctors.map((doctor) => <li className="p-3" key={doctor.id}><p className="font-medium text-text">{doctor.fullName}</p><p className="mt-1 text-sm text-text-muted">{specialtyName(doctor.specialtyId)} · {doctor.room}</p><div className="mt-2"><StatusBadge status={doctor.status} /></div></li>)}</ul>
      </div>
    </section>
  );
}
