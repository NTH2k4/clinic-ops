import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, RotateCcw, XCircle } from "lucide-react";
import { useState } from "react";
import { StatusBadge } from "../../components/StatusBadge";
import type { ApiListResponse } from "../../lib/api/types";
import type { Specialty } from "../../types/models";
import { catalogQueryOptions, catalogService } from "../catalog/catalogService";

type SpecialtyFormState = {
  name: string;
  description: string;
};

const emptyForm: SpecialtyFormState = {
  name: "",
  description: "",
};

export function AdminSpecialties() {
  const queryClient = useQueryClient();
  const { data: specialtyResponse } = useQuery(catalogQueryOptions.allSpecialties());
  const specialties = specialtyResponse?.data ?? [];
  const [form, setForm] = useState<SpecialtyFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const queryKey = catalogQueryOptions.allSpecialties().queryKey;
  const refreshSpecialties = () => queryClient.invalidateQueries({ queryKey: ["catalog", "specialties"] });
  const writeSpecialtyToCache = (specialty: Specialty) => {
    queryClient.setQueryData<ApiListResponse<Specialty>>(queryKey, (current) => {
      if (!current) return current;
      const exists = current.data.some((item) => item.id === specialty.id);
      const data = exists ? current.data.map((item) => item.id === specialty.id ? specialty : item) : [specialty, ...current.data];
      return { ...current, data, meta: { ...current.meta, total: current.meta.total + (exists ? 0 : 1) } };
    });
  };

  const saveMutation = useMutation({
    mutationFn: () => editingId ? catalogService.updateSpecialty(editingId, form) : catalogService.createSpecialty(form),
    onSuccess: (specialty) => {
      writeSpecialtyToCache(specialty);
      refreshSpecialties();
      resetForm();
    },
    onError: (mutationError) => setError(mutationError instanceof Error ? mutationError.message : "Không thể lưu chuyên khoa."),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => catalogService.deactivateSpecialty(id),
    onSuccess: (specialty) => {
      writeSpecialtyToCache(specialty);
      refreshSpecialties();
    },
    onError: (mutationError) => setError(mutationError instanceof Error ? mutationError.message : "Không thể vô hiệu hóa chuyên khoa."),
  });

  function updateForm<K extends keyof SpecialtyFormState>(key: K, value: SpecialtyFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
  }

  function submitSpecialty(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Vui lòng nhập tên chuyên khoa.");
      return;
    }
    setError("");
    saveMutation.mutate();
  }

  function editSpecialty(specialty: Specialty) {
    setForm({ name: specialty.name, description: specialty.description });
    setEditingId(specialty.id);
    setError("");
  }

  return (
    <section className="mx-auto max-w-6xl">
      <p className="text-sm font-medium text-primary">Danh mục chuyên môn</p>
      <h1 className="mt-1 text-2xl font-semibold text-text">Chuyên khoa</h1>
      <form className="mt-5 rounded-md border border-border bg-surface p-4 shadow-sm" onSubmit={submitSpecialty}>
        <div className="flex flex-col gap-1 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-text">{editingId ? "Cập nhật chuyên khoa" : "Thêm chuyên khoa"}</h2>
          {editingId ? <button className="inline-flex h-8 items-center gap-2 self-start rounded-md border border-border px-2 text-xs font-semibold text-text hover:bg-surface-muted sm:self-auto" onClick={resetForm} type="button"><RotateCcw aria-hidden="true" size={14} />Hủy chỉnh sửa</button> : null}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto]">
          <label className="text-sm font-medium text-text">Tên chuyên khoa<input className="mt-1 h-10 w-full rounded-md border border-border px-3" onChange={(event) => updateForm("name", event.target.value)} value={form.name} /></label>
          <label className="text-sm font-medium text-text">Mô tả<input className="mt-1 h-10 w-full rounded-md border border-border px-3" onChange={(event) => updateForm("description", event.target.value)} value={form.description} /></label>
          <button className="h-10 self-end rounded-md bg-primary px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60" disabled={saveMutation.isPending} type="submit">{editingId ? "Cập nhật" : "Thêm chuyên khoa"}</button>
          {error ? <p className="text-sm text-danger sm:col-span-3" role="alert">{error}</p> : null}
        </div>
      </form>
      <div className="mt-6 overflow-x-auto rounded-md border border-border bg-surface">
        <table aria-label="Chuyên khoa" className="hidden min-w-full text-left text-sm md:table"><thead className="bg-surface-muted text-text-muted"><tr><th className="p-3">Chuyên khoa</th><th className="p-3">Mô tả</th><th className="p-3">Trạng thái</th><th className="p-3 text-right">Thao tác</th></tr></thead><tbody>{specialties.map((specialty) => <tr className="border-t border-border" key={specialty.id}><td className="p-3 font-medium text-text">{specialty.name}</td><td className="p-3 text-text-muted">{specialty.description || "Chưa có mô tả"}</td><td className="p-3"><StatusBadge status={specialty.status} /></td><td className="p-3"><div className="flex justify-end gap-2"><button aria-label={`Sửa ${specialty.name}`} className="inline-flex size-8 items-center justify-center rounded-md border border-border text-text hover:bg-surface-muted" onClick={() => editSpecialty(specialty)} title="Sửa" type="button"><Pencil aria-hidden="true" size={15} /></button><button aria-label={`Vô hiệu hóa ${specialty.name}`} className="inline-flex size-8 items-center justify-center rounded-md border border-border text-danger hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50" disabled={specialty.status === "inactive" || deactivateMutation.isPending} onClick={() => deactivateMutation.mutate(specialty.id)} title="Vô hiệu hóa" type="button"><XCircle aria-hidden="true" size={16} /></button></div></td></tr>)}</tbody></table>
        <ul className="divide-y divide-border md:hidden">{specialties.map((specialty) => <li className="p-3" key={specialty.id}><p className="font-medium text-text">{specialty.name}</p><p className="mt-1 text-sm text-text-muted">{specialty.description || "Chưa có mô tả"}</p><div className="mt-2 flex items-center justify-between gap-3"><StatusBadge status={specialty.status} /><div className="flex gap-2"><button aria-label={`Sửa ${specialty.name}`} className="inline-flex size-8 items-center justify-center rounded-md border border-border text-text" onClick={() => editSpecialty(specialty)} type="button"><Pencil aria-hidden="true" size={15} /></button><button aria-label={`Vô hiệu hóa ${specialty.name}`} className="inline-flex size-8 items-center justify-center rounded-md border border-border text-danger disabled:opacity-50" disabled={specialty.status === "inactive" || deactivateMutation.isPending} onClick={() => deactivateMutation.mutate(specialty.id)} type="button"><XCircle aria-hidden="true" size={16} /></button></div></div></li>)}</ul>
      </div>
    </section>
  );
}
