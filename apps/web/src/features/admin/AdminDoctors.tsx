import { useState } from "react";
import { StatusBadge } from "../../components/StatusBadge";
import { mockStore } from "../../mocks/mockStore";
import type { Doctor } from "../../types/models";

export function AdminDoctors() {
  const [doctors, setDoctors] = useState(() => mockStore.doctors);
  const [name, setName] = useState("");
  const [specialtyId, setSpecialtyId] = useState("");
  const [error, setError] = useState("");
  function addDoctor() {
    if (!name.trim() || !specialtyId) return setError("Vui lòng nhập đủ các trường bắt buộc.");
    const specialty = mockStore.specialties.find((item) => item.id === specialtyId);
    const created: Doctor = { id: `draft-doctor-${doctors.length + 1}`, fullName: name.trim(), specialtyId, serviceIds: [], phone: "", email: "", title: "Chưa cập nhật", room: "Chưa phân phòng", status: "active", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setDoctors((current) => [...current, created]); setName(""); setSpecialtyId(""); setError("");
    void specialty;
  }
  const specialtyName = (id: string) => mockStore.specialties.find((item) => item.id === id)?.name ?? "Chưa xác định";
  return <section className="mx-auto max-w-6xl"><p className="text-sm font-medium text-primary">Quản trị nhân sự</p><h1 className="mt-1 text-2xl font-semibold text-text">Doctors</h1><form className="mt-5 grid gap-3 rounded-md border border-border bg-surface p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]" onSubmit={(event) => { event.preventDefault(); addDoctor(); }}><label className="text-sm font-medium text-text">Tên bác sĩ<input className="mt-1 h-10 w-full rounded-md border border-border px-3" onChange={(event) => setName(event.target.value)} value={name} /></label><label className="text-sm font-medium text-text">Chuyên khoa<select className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3" onChange={(event) => setSpecialtyId(event.target.value)} value={specialtyId}><option value="">Chọn chuyên khoa</option>{mockStore.specialties.map((specialty) => <option key={specialty.id} value={specialty.id}>{specialty.name}</option>)}</select></label><button className="h-10 self-end rounded-md bg-primary px-3 text-sm font-semibold text-white" type="submit">Thêm bác sĩ</button>{error ? <p className="text-sm text-danger sm:col-span-3" role="alert">{error}</p> : null}</form><div className="mt-6 overflow-x-auto rounded-md border border-border bg-surface"><table aria-label="Doctors" className="hidden min-w-full text-left text-sm md:table"><thead className="bg-surface-muted text-text-muted"><tr><th className="p-3">Bác sĩ</th><th className="p-3">Chuyên khoa</th><th className="p-3">Phòng</th><th className="p-3">Trạng thái</th></tr></thead><tbody>{doctors.map((doctor) => <tr className="border-t border-border" key={doctor.id}><td className="p-3 font-medium text-text">{doctor.fullName}</td><td className="p-3">{specialtyName(doctor.specialtyId)}</td><td className="p-3">{doctor.room}</td><td className="p-3"><StatusBadge status={doctor.status} /></td></tr>)}</tbody></table><ul className="divide-y divide-border md:hidden">{doctors.map((doctor) => <li className="p-3" key={doctor.id}><p className="font-medium text-text">{doctor.fullName}</p><p className="mt-1 text-sm text-text-muted">{specialtyName(doctor.specialtyId)} · {doctor.room}</p><div className="mt-2"><StatusBadge status={doctor.status} /></div></li>)}</ul></div></section>;
}
