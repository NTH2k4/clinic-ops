import { useQuery } from "@tanstack/react-query";
import { MetricCard } from "../../components/MetricCard";
import { toDateInputValue } from "../../lib/dateTime";
import { mockStore } from "../../mocks/mockStore";
import { catalogQueryOptions } from "../catalog/catalogService";

const ADMIN_PROTOTYPE_TODAY = "2026-08-25";

function percent(value: number) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1, style: "percent" }).format(value);
}

export function AdminDashboard() {
  const { data: doctorResponse } = useQuery(catalogQueryOptions.allDoctors({ status: "active" }));
  const { data: serviceResponse } = useQuery(catalogQueryOptions.allServices({ status: "active" }));
  const activeDoctors = doctorResponse?.data ?? [];
  const activeServices = serviceResponse?.data ?? [];
  const activeDoctorTotal = doctorResponse?.meta.total ?? 0;
  const activeServiceTotal = serviceResponse?.meta.total ?? 0;
  const today = ADMIN_PROTOTYPE_TODAY;
  const appointmentsToday = mockStore.appointments.filter((appointment) => toDateInputValue(appointment.startAt) === today);
  const cancellationRate = mockStore.appointments.length
    ? mockStore.appointments.filter((appointment) => appointment.status === "cancelled").length / mockStore.appointments.length
    : 0;
  const popularServices = activeServices
    .map((service) => ({ ...service, appointments: mockStore.appointments.filter((appointment) => appointment.serviceId === service.id).length }))
    .sort((left, right) => right.appointments - left.appointments)
    .slice(0, 5);
  const workload = activeDoctors.map((doctor) => ({
    doctor,
    appointments: mockStore.appointments.filter((appointment) => appointment.doctorId === doctor.id).length,
  }));

  return (
    <section className="mx-auto max-w-6xl">
      <div className="rounded-lg border border-border bg-surface p-5 shadow-panel md:p-6">
        <p className="text-sm font-medium text-primary">Quản trị phòng khám</p>
        <h1 className="mt-1 text-2xl font-semibold text-text">Bảng điều khiển quản trị</h1>
        <p className="mt-1 text-sm text-text-muted">Theo dõi năng lực vận hành, danh mục đang hoạt động và tín hiệu chất lượng đặt lịch.</p>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard helper="Sẵn sàng tiếp nhận lịch hẹn đang hoạt động." label="Bác sĩ đang hoạt động" tone="primary" value={activeDoctorTotal} />
        <MetricCard helper="Danh mục dịch vụ đang mở cho đặt lịch." label="Dịch vụ đang hoạt động" tone="accent" value={activeServiceTotal} />
        <MetricCard helper={`Ngày vận hành ${today.split("-").reverse().join("/")}.`} label="Lịch hẹn hôm nay" tone="success" value={appointmentsToday.length} />
        <MetricCard helper="Tỷ lệ lịch đã hủy trên toàn bộ dữ liệu demo." label="Tỷ lệ hủy lịch" tone="warning" value={percent(cancellationRate)} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="popular-services-heading" className="rounded-lg border border-border bg-surface p-5 shadow-panel">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-lg font-semibold text-text" id="popular-services-heading">Dịch vụ phổ biến</h2>
            <p className="text-sm font-medium text-text-muted">{popularServices.length} dịch vụ có lịch hẹn nhiều nhất</p>
          </div>
          {popularServices.some((service) => service.appointments > 0) ? <ul className="mt-3 divide-y divide-border rounded-md border border-border bg-white">
            {popularServices.map((service) => <li className="flex items-center justify-between gap-3 p-3 text-sm" key={service.id}><span className="font-semibold text-text">{service.name}</span><span className="shrink-0 rounded-sm bg-surface-muted px-2 py-1 text-text-muted">{service.appointments} lịch hẹn</span></li>)}
          </ul> : <p className="mt-3 text-sm text-text-muted">Chưa có dữ liệu tổng hợp.</p>}
        </section>
        <section aria-labelledby="workload-heading" className="rounded-lg border border-border bg-surface p-5 shadow-panel">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-lg font-semibold text-text" id="workload-heading">Khối lượng lịch theo bác sĩ</h2>
            <p className="text-sm font-medium text-text-muted">{activeDoctorTotal} bác sĩ đang hoạt động</p>
          </div>
          {workload.length > 1 && workload.some((item) => item.appointments > 0) ? <ul className="mt-3 divide-y divide-border rounded-md border border-border bg-white">
            {workload.map(({ doctor, appointments }) => <li className="flex items-center justify-between gap-3 p-3 text-sm" key={doctor.id}><span className="font-semibold text-text">{doctor.fullName}</span><span className="shrink-0 rounded-sm bg-surface-muted px-2 py-1 text-text-muted">{appointments} lịch hẹn</span></li>)}
          </ul> : <p className="mt-3 text-sm text-text-muted">Chưa có dữ liệu tổng hợp.</p>}
        </section>
      </div>
    </section>
  );
}
