import { ArrowRight, Clock3, Stethoscope } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { mockStore } from "../../mocks/mockStore";

function formatPrice(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
}

export function ServicesPage() {
  const [specialtyId, setSpecialtyId] = useState<string | undefined>();
  const specialties = mockStore.specialties.filter((specialty) => specialty.status === "active");
  const services = mockStore.services.filter((service) => service.status === "active" && (!specialtyId || service.specialtyId === specialtyId));
  const allServices = mockStore.services.filter((service) => service.status === "active");
  const summary = specialtyId
    ? `${services.length} dịch vụ phù hợp`
    : `${allServices.length} dịch vụ đang mở từ ${specialties.length} chuyên khoa`;

  return (
    <section className="mx-auto max-w-6xl">
      <p className="text-sm font-medium text-primary">Danh mục chăm sóc</p>
      <h1 className="mt-1 text-2xl font-semibold text-text">Dịch vụ</h1>
      <div className="mt-3 flex flex-col gap-3 rounded-md border border-border bg-surface p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-muted">Chọn chuyên khoa để tìm dịch vụ phù hợp.</p>
        <p className="text-sm font-semibold text-primary">{summary}</p>
      </div>
      <div className="mt-5 flex flex-wrap gap-2" aria-label="Lọc theo chuyên khoa" role="group">
        <button aria-pressed={!specialtyId} className="h-10 rounded-md border border-border px-3 text-sm font-medium transition-colors hover:bg-surface-muted aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-primary" onClick={() => setSpecialtyId(undefined)} type="button">Tất cả</button>
        {specialties.map((specialty) => <button aria-pressed={specialtyId === specialty.id} className="h-10 rounded-md border border-border px-3 text-sm font-medium transition-colors hover:bg-surface-muted aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-primary" key={specialty.id} onClick={() => setSpecialtyId(specialty.id)} type="button">{specialty.name}</button>)}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => {
          const specialty = specialties.find((candidate) => candidate.id === service.specialtyId);
          return <article aria-label={service.name} className="flex min-w-0 flex-col rounded-lg border border-border bg-surface p-5 shadow-panel transition-shadow hover:shadow-lg" key={service.id}>
            <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-primary">{specialty?.name}</p><h2 className="mt-1 text-base font-semibold text-text">{service.name}</h2></div><span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><Stethoscope aria-hidden="true" size={20} /></span></div>
            <p className="mt-3 text-sm leading-6 text-text-muted">{service.description}</p>
            <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4 text-sm"><span className="inline-flex items-center gap-1.5 text-text-muted"><Clock3 size={16} />{service.durationMinutes} phút</span><span className="font-semibold text-text">{formatPrice(service.price)}</span></div>
            <Link aria-label={`Đặt lịch ${service.name}`} className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-md border border-primary px-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10" to={`/app/patient/book?serviceId=${service.id}`}>Đặt lịch<ArrowRight aria-hidden="true" size={16} /></Link>
          </article>;
        })}
      </div>
    </section>
  );
}
