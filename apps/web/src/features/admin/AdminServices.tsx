import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, RotateCcw, XCircle } from "lucide-react";
import { useState } from "react";
import { StatusBadge } from "../../components/StatusBadge";
import type { ApiListResponse } from "../../lib/api/types";
import type { Service } from "../../types/models";
import { catalogQueryOptions, catalogService } from "../catalog/catalogService";

type ServiceFormState = {
  name: string;
  specialtyId: string;
  durationMinutes: number;
  price: number;
  description: string;
};

const emptyForm: ServiceFormState = {
  name: "",
  specialtyId: "",
  durationMinutes: 30,
  price: 0,
  description: "",
};

export function AdminServices() {
  const queryClient = useQueryClient();
  const { data: serviceResponse } = useQuery(catalogQueryOptions.allServices());
  const { data: specialtyResponse } = useQuery(catalogQueryOptions.allSpecialties());
  const services = serviceResponse?.data ?? [];
  const specialties = specialtyResponse?.data ?? [];
  const [form, setForm] = useState<ServiceFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const queryKey = catalogQueryOptions.allServices().queryKey;
  const refreshServices = () => queryClient.invalidateQueries({ queryKey: ["catalog", "services"] });
  const writeServiceToCache = (service: Service) => {
    queryClient.setQueryData<ApiListResponse<Service>>(queryKey, (current) => {
      if (!current) return current;
      const exists = current.data.some((item) => item.id === service.id);
      const data = exists ? current.data.map((item) => item.id === service.id ? service : item) : [service, ...current.data];
      return { ...current, data, meta: { ...current.meta, total: current.meta.total + (exists ? 0 : 1) } };
    });
  };

  const saveMutation = useMutation({
    mutationFn: () => editingId ? catalogService.updateService(editingId, { ...form, currency: "VND" }) : catalogService.createService({ ...form, currency: "VND" }),
    onSuccess: (service) => {
      writeServiceToCache(service);
      refreshServices();
      resetForm();
    },
    onError: (mutationError) => setError(mutationError instanceof Error ? mutationError.message : "Không thể lưu dịch vụ."),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => catalogService.deactivateService(id),
    onSuccess: (service) => {
      writeServiceToCache(service);
      refreshServices();
    },
    onError: (mutationError) => setError(mutationError instanceof Error ? mutationError.message : "Không thể vô hiệu hóa dịch vụ."),
  });

  const specialtyName = (id: string) => specialties.find((item) => item.id === id)?.name ?? "Chưa xác định";

  function updateForm<K extends keyof ServiceFormState>(key: K, value: ServiceFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
  }

  function submitService(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim() || !form.specialtyId || form.durationMinutes <= 0 || form.price < 0) {
      setError("Vui lòng nhập đủ các trường bắt buộc.");
      return;
    }
    setError("");
    saveMutation.mutate();
  }

  function editService(service: Service) {
    setForm({
      name: service.name,
      specialtyId: service.specialtyId,
      durationMinutes: service.durationMinutes,
      price: service.price,
      description: service.description,
    });
    setEditingId(service.id);
    setError("");
  }

  return (
    <section className="mx-auto max-w-6xl">
      <p className="text-sm font-medium text-primary">Danh mục dịch vụ</p>
      <h1 className="mt-1 text-2xl font-semibold text-text">Dịch vụ</h1>
      <form className="mt-5 rounded-md border border-border bg-surface p-4 shadow-sm" onSubmit={submitService}>
        <div className="flex flex-col gap-1 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-text">{editingId ? "Cập nhật dịch vụ" : "Thêm dịch vụ"}</h2>
          {editingId ? <button className="inline-flex h-8 items-center gap-2 self-start rounded-md border border-border px-2 text-xs font-semibold text-text hover:bg-surface-muted sm:self-auto" onClick={resetForm} type="button"><RotateCcw aria-hidden="true" size={14} />Hủy chỉnh sửa</button> : null}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="text-sm font-medium text-text">Tên dịch vụ<input className="mt-1 h-10 w-full rounded-md border border-border px-3" onChange={(event) => updateForm("name", event.target.value)} value={form.name} /></label>
          <label className="text-sm font-medium text-text">Chuyên khoa<select className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3" onChange={(event) => updateForm("specialtyId", event.target.value)} value={form.specialtyId}><option value="">Chọn chuyên khoa</option>{specialties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="text-sm font-medium text-text">Thời lượng phút<input className="mt-1 h-10 w-full rounded-md border border-border px-3" min={1} onChange={(event) => updateForm("durationMinutes", Number(event.target.value))} type="number" value={form.durationMinutes} /></label>
          <label className="text-sm font-medium text-text">Giá VND<input className="mt-1 h-10 w-full rounded-md border border-border px-3" min={0} onChange={(event) => updateForm("price", Number(event.target.value))} type="number" value={form.price} /></label>
          <label className="text-sm font-medium text-text md:col-span-2">Mô tả<input className="mt-1 h-10 w-full rounded-md border border-border px-3" onChange={(event) => updateForm("description", event.target.value)} value={form.description} /></label>
          <button className="h-10 self-end rounded-md bg-primary px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 md:col-span-3" disabled={saveMutation.isPending} type="submit">{editingId ? "Cập nhật dịch vụ" : "Thêm dịch vụ"}</button>
          {error ? <p className="text-sm text-danger md:col-span-3" role="alert">{error}</p> : null}
        </div>
      </form>
      <div className="mt-6 overflow-x-auto rounded-md border border-border bg-surface">
        <table aria-label="Dịch vụ" className="hidden min-w-full text-left text-sm md:table"><thead className="bg-surface-muted text-text-muted"><tr><th className="p-3">Dịch vụ</th><th className="p-3">Chuyên khoa</th><th className="p-3">Thời lượng</th><th className="p-3">Trạng thái</th><th className="p-3 text-right">Thao tác</th></tr></thead><tbody>{services.map((service) => <tr className="border-t border-border" key={service.id}><td className="p-3 font-medium text-text">{service.name}</td><td className="p-3">{specialtyName(service.specialtyId)}</td><td className="p-3">{service.durationMinutes} phút</td><td className="p-3"><StatusBadge status={service.status} /></td><td className="p-3"><div className="flex justify-end gap-2"><button aria-label={`Sửa ${service.name}`} className="inline-flex size-8 items-center justify-center rounded-md border border-border text-text hover:bg-surface-muted" onClick={() => editService(service)} title="Sửa" type="button"><Pencil aria-hidden="true" size={15} /></button><button aria-label={`Vô hiệu hóa ${service.name}`} className="inline-flex size-8 items-center justify-center rounded-md border border-border text-danger hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50" disabled={service.status === "inactive" || deactivateMutation.isPending} onClick={() => deactivateMutation.mutate(service.id)} title="Vô hiệu hóa" type="button"><XCircle aria-hidden="true" size={16} /></button></div></td></tr>)}</tbody></table>
        <ul className="divide-y divide-border md:hidden">{services.map((service) => <li className="p-3" key={service.id}><p className="font-medium text-text">{service.name}</p><p className="mt-1 text-sm text-text-muted">{specialtyName(service.specialtyId)} · {service.durationMinutes} phút</p><div className="mt-2 flex items-center justify-between gap-3"><StatusBadge status={service.status} /><div className="flex gap-2"><button aria-label={`Sửa ${service.name}`} className="inline-flex size-8 items-center justify-center rounded-md border border-border text-text" onClick={() => editService(service)} type="button"><Pencil aria-hidden="true" size={15} /></button><button aria-label={`Vô hiệu hóa ${service.name}`} className="inline-flex size-8 items-center justify-center rounded-md border border-border text-danger disabled:opacity-50" disabled={service.status === "inactive" || deactivateMutation.isPending} onClick={() => deactivateMutation.mutate(service.id)} type="button"><XCircle aria-hidden="true" size={16} /></button></div></div></li>)}</ul>
      </div>
    </section>
  );
}
