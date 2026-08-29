import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, RotateCcw, XCircle } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { StatusBadge } from "../../components/StatusBadge";
import type { ApiListResponse } from "../../lib/api/types";
import type { Doctor } from "../../types/models";
import { catalogQueryOptions, catalogService } from "../catalog/catalogService";

type DoctorFormState = {
  fullName: string;
  specialtyId: string;
  phone: string;
  email: string;
  title: string;
  room: string;
};

const emptyForm: DoctorFormState = {
  fullName: "",
  specialtyId: "",
  phone: "",
  email: "",
  title: "",
  room: "",
};

export function AdminDoctors() {
  const queryClient = useQueryClient();
  const { data: doctorResponse } = useQuery(catalogQueryOptions.allDoctors());
  const { data: specialtyResponse } = useQuery(catalogQueryOptions.allSpecialties());
  const doctors = doctorResponse?.data ?? [];
  const doctorTotal = doctorResponse?.meta.total ?? doctors.length;
  const specialties = specialtyResponse?.data ?? [];
  const [form, setForm] = useState<DoctorFormState>(emptyForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [deactivateTarget, setDeactivateTarget] = useState<Doctor | null>(null);

  const queryKey = catalogQueryOptions.allDoctors().queryKey;
  const refreshDoctors = () => queryClient.invalidateQueries({ queryKey: ["catalog", "doctors"] });
  const writeDoctorToCache = (doctor: Doctor) => {
    queryClient.setQueryData<ApiListResponse<Doctor>>(queryKey, (current) => {
      if (!current) return current;
      const exists = current.data.some((item) => item.id === doctor.id);
      const data = exists ? current.data.map((item) => item.id === doctor.id ? doctor : item) : [doctor, ...current.data];
      return { ...current, data, meta: { ...current.meta, total: current.meta.total + (exists ? 0 : 1) } };
    });
  };

  const saveMutation = useMutation({
    mutationFn: () => editingId ? catalogService.updateDoctor(editingId, form) : catalogService.createDoctor(form),
    onSuccess: (doctor) => {
      writeDoctorToCache(doctor);
      refreshDoctors();
      resetForm();
    },
    onError: (mutationError) => setError(mutationError instanceof Error ? mutationError.message : "Không thể lưu bác sĩ."),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => catalogService.deactivateDoctor(id),
    onSuccess: (doctor) => {
      writeDoctorToCache(doctor);
      refreshDoctors();
      setDeactivateTarget(null);
    },
    onError: (mutationError) => setError(mutationError instanceof Error ? mutationError.message : "Không thể vô hiệu hóa bác sĩ."),
  });

  function updateForm<K extends keyof DoctorFormState>(key: K, value: DoctorFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setIsFormOpen(false);
    setError("");
  }

  function openCreateForm() {
    setForm(emptyForm);
    setEditingId(null);
    setIsFormOpen(true);
    setError("");
  }

  function submitDoctor(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.fullName.trim() || !form.specialtyId || !form.phone.trim() || !form.email.trim()) {
      setError("Vui lòng nhập đủ các trường bắt buộc.");
      return;
    }
    setError("");
    saveMutation.mutate();
  }

  function editDoctor(doctor: Doctor) {
    setForm({
      fullName: doctor.fullName,
      specialtyId: doctor.specialtyId,
      phone: doctor.phone,
      email: doctor.email,
      title: doctor.title,
      room: doctor.room,
    });
    setEditingId(doctor.id);
    setIsFormOpen(true);
    setError("");
  }

  const specialtyName = (id: string) => specialties.find((item) => item.id === id)?.name ?? "Chưa xác định";

  return (
    <section className="mx-auto max-w-6xl">
      <p className="text-sm font-medium text-primary">Quản trị nhân sự</p>
      <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-2xl font-semibold text-text">Bác sĩ</h1>
        <div className="flex flex-col gap-2 sm:items-end">
          <p className="text-sm font-medium text-text-muted">{doctorTotal} bác sĩ trong danh mục</p>
          <button className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-white shadow-panel hover:bg-primary-hover" onClick={openCreateForm} type="button"><Plus aria-hidden="true" size={16} />Thêm bác sĩ</button>
        </div>
      </div>
      {isFormOpen ? <form className="mt-5 rounded-md border border-border bg-surface p-4 shadow-sm transition-all duration-200 ease-out animate-in fade-in slide-in-from-top-1" onSubmit={submitDoctor}>
        <div className="flex flex-col gap-1 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-text">{editingId ? "Cập nhật bác sĩ" : "Thêm bác sĩ"}</h2>
            <p className="text-sm text-text-muted">Thêm hoặc cập nhật bác sĩ để phục vụ đặt lịch.</p>
          </div>
          <button className="inline-flex h-8 items-center gap-2 self-start rounded-md border border-border px-2 text-xs font-semibold text-text hover:bg-surface-muted sm:self-auto" onClick={resetForm} type="button"><RotateCcw aria-hidden="true" size={14} />Hủy</button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="text-sm font-medium text-text">Tên bác sĩ<input className="mt-1 h-10 w-full rounded-md border border-border px-3" onChange={(event) => updateForm("fullName", event.target.value)} value={form.fullName} /></label>
          <label className="text-sm font-medium text-text">Chuyên khoa<select className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3" onChange={(event) => updateForm("specialtyId", event.target.value)} value={form.specialtyId}><option value="">Chọn chuyên khoa</option>{specialties.map((specialty) => <option key={specialty.id} value={specialty.id}>{specialty.name}</option>)}</select></label>
          <label className="text-sm font-medium text-text">Điện thoại<input className="mt-1 h-10 w-full rounded-md border border-border px-3" onChange={(event) => updateForm("phone", event.target.value)} value={form.phone} /></label>
          <label className="text-sm font-medium text-text">Email<input className="mt-1 h-10 w-full rounded-md border border-border px-3" onChange={(event) => updateForm("email", event.target.value)} type="email" value={form.email} /></label>
          <label className="text-sm font-medium text-text">Chức danh<input className="mt-1 h-10 w-full rounded-md border border-border px-3" onChange={(event) => updateForm("title", event.target.value)} value={form.title} /></label>
          <label className="text-sm font-medium text-text">Phòng<input className="mt-1 h-10 w-full rounded-md border border-border px-3" onChange={(event) => updateForm("room", event.target.value)} value={form.room} /></label>
          <button className="h-10 self-end rounded-md bg-primary px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 md:col-span-3" disabled={saveMutation.isPending} type="submit">Lưu bác sĩ</button>
          {error ? <p className="text-sm text-danger md:col-span-3" role="alert">{error}</p> : null}
        </div>
      </form> : null}
      <div className="mt-6 overflow-x-auto rounded-md border border-border bg-surface shadow-sm">
        <table aria-label="Bác sĩ" className="hidden min-w-full text-left text-sm md:table">
          <thead className="bg-surface-muted text-text-muted">
            <tr><th className="p-3 font-medium">Bác sĩ</th><th className="p-3 font-medium">Chuyên khoa</th><th className="p-3 font-medium">Phòng</th><th className="p-3 font-medium">Trạng thái</th><th className="p-3 text-right font-medium">Thao tác</th></tr>
          </thead>
          <tbody>{doctors.map((doctor) => <tr className="border-t border-border" key={doctor.id}><td className="p-3 font-medium text-text">{doctor.fullName}</td><td className="p-3">{specialtyName(doctor.specialtyId)}</td><td className="p-3">{doctor.room || "Chưa phân phòng"}</td><td className="p-3"><StatusBadge status={doctor.status} /></td><td className="p-3"><div className="flex justify-end gap-2"><button aria-label={`Sửa ${doctor.fullName}`} className="inline-flex size-8 items-center justify-center rounded-md border border-border text-text hover:bg-surface-muted" onClick={() => editDoctor(doctor)} title="Sửa" type="button"><Pencil aria-hidden="true" size={15} /></button><button aria-label={`Vô hiệu hóa ${doctor.fullName}`} className="inline-flex size-8 items-center justify-center rounded-md border border-border text-danger hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50" disabled={doctor.status === "inactive" || deactivateMutation.isPending} onClick={() => setDeactivateTarget(doctor)} title="Vô hiệu hóa" type="button"><XCircle aria-hidden="true" size={16} /></button></div></td></tr>)}</tbody>
        </table>
        <ul className="divide-y divide-border md:hidden">{doctors.map((doctor) => <li className="p-3" key={doctor.id}><p className="font-medium text-text">{doctor.fullName}</p><p className="mt-1 text-sm text-text-muted">{specialtyName(doctor.specialtyId)} · {doctor.room || "Chưa phân phòng"}</p><div className="mt-2 flex items-center justify-between gap-3"><StatusBadge status={doctor.status} /><div className="flex gap-2"><button aria-label={`Sửa ${doctor.fullName}`} className="inline-flex size-8 items-center justify-center rounded-md border border-border text-text" onClick={() => editDoctor(doctor)} type="button"><Pencil aria-hidden="true" size={15} /></button><button aria-label={`Vô hiệu hóa ${doctor.fullName}`} className="inline-flex size-8 items-center justify-center rounded-md border border-border text-danger disabled:opacity-50" disabled={doctor.status === "inactive" || deactivateMutation.isPending} onClick={() => setDeactivateTarget(doctor)} type="button"><XCircle aria-hidden="true" size={16} /></button></div></div></li>)}</ul>
      </div>
      <ConfirmDialog
        confirmLabel="Vô hiệu hóa"
        description={`Bác sĩ ${deactivateTarget?.fullName ?? ""} sẽ không còn xuất hiện cho lịch đặt mới. Các lịch hẹn, hồ sơ và nhật ký kiểm toán cũ vẫn được giữ lại.`}
        isOpen={Boolean(deactivateTarget)}
        onCancel={() => setDeactivateTarget(null)}
        onConfirm={() => deactivateTarget && deactivateMutation.mutate(deactivateTarget.id)}
        title="Xác nhận vô hiệu hóa bác sĩ"
      />
    </section>
  );
}
