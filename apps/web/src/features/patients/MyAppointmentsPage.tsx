import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { StatusBadge } from "../../components/StatusBadge";
import { isApiMode } from "../../lib/dataSource";
import { formatDateTime } from "../../lib/dateTime";
import type { Appointment, AppointmentStatus } from "../../types/models";
import { appointmentQueryOptions, appointmentService } from "../appointments/appointmentService";
import { canTransitionAppointment } from "../appointments/appointmentRules";
import { useAuth } from "../auth/AuthProvider";
import { catalogQueryOptions } from "../catalog/catalogService";
import { patientQueryOptions } from "./patientService";

type AppointmentTab = "upcoming" | "past" | "cancelled";

const terminalStatuses: AppointmentStatus[] = ["completed", "cancelled", "no_show"];
const tabs: Array<{ id: AppointmentTab; label: string; summary: string }> = [
  { id: "upcoming", label: "Sắp tới", summary: "sắp tới" },
  { id: "past", label: "Đã qua", summary: "đã qua" },
  { id: "cancelled", label: "Đã hủy", summary: "đã hủy" },
];

function appointmentsForTab(appointments: Appointment[], tab: AppointmentTab): Appointment[] {
  if (tab === "cancelled") return appointments.filter((appointment) => appointment.status === "cancelled");
  if (tab === "past") return appointments.filter((appointment) => appointment.status === "completed" || appointment.status === "no_show");
  return appointments.filter((appointment) => !terminalStatuses.includes(appointment.status));
}

export function MyAppointmentsPage() {
  const { linkedProfile, user } = useAuth();
  const queryClient = useQueryClient();
  const { data: mockPatient } = useQuery({ ...patientQueryOptions.current(user?.id ?? ""), enabled: Boolean(user?.role === "patient" && !isApiMode) });
  const patientId = linkedProfile?.type === "patient" ? linkedProfile.id : mockPatient?.id;
  const [tab, setTab] = useState<AppointmentTab>("upcoming");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const appointmentOptions = appointmentQueryOptions.list({ patientId });
  const { data: appointments = [] } = useQuery({ ...appointmentOptions, enabled: Boolean(patientId) });
  const { data: serviceResponse } = useQuery(catalogQueryOptions.allServices());
  const { data: doctorResponse } = useQuery(catalogQueryOptions.allDoctors());
  const services = serviceResponse?.data ?? [];
  const doctors = doctorResponse?.data ?? [];

  async function cancel(appointmentId: string) {
    if (!user || !patientId) return;
    setError("");

    try {
      const updated = await appointmentService.cancelAppointment(appointmentId, { actorUserId: user.id, cancellationReason: "Bệnh nhân hủy lịch qua cổng thông tin." });
      queryClient.setQueryData<Appointment[]>(appointmentOptions.queryKey, (current = []) =>
        current.map((appointment) => appointment.id === updated.id ? updated : appointment));
      setMessage("Lịch hẹn đã được hủy.");
    } catch {
      setError("Không thể hủy lịch hẹn. Vui lòng thử lại.");
    }
  }

  const tabCounts = Object.fromEntries(
    tabs.map((item) => [item.id, appointmentsForTab(appointments, item.id).length]),
  ) as Record<AppointmentTab, number>;
  const activeTab = tabs.find((item) => item.id === tab) ?? tabs[0];
  const visibleAppointments = appointmentsForTab(appointments, tab).slice().sort((left, right) => left.startAt.localeCompare(right.startAt));

  return (
    <section className="mx-auto max-w-5xl">
      <p className="text-sm font-medium text-primary">Hồ sơ lịch hẹn</p>
      <h1 className="mt-1 text-2xl font-semibold text-text">Lịch của tôi</h1>
      <p className="mt-2 text-sm text-text-muted">Bạn có {visibleAppointments.length} lịch hẹn {activeTab.summary}.</p>
      {message && <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-success" role="status">{message}</p>}
      {error && <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-danger" role="alert">{error}</p>}
      <div aria-label="Loại lịch hẹn" className="mt-5 flex overflow-x-auto border-b border-border" role="tablist">
        {tabs.map((item) => {
          const label = `${item.label} (${tabCounts[item.id]})`;
          return <button aria-controls={`appointments-${item.id}`} aria-selected={tab === item.id} className="h-11 shrink-0 border-b-2 px-4 text-sm font-medium aria-selected:border-primary aria-selected:text-primary" id={`tab-${item.id}`} key={item.id} onClick={() => setTab(item.id)} role="tab" type="button">{label}</button>;
        })}
      </div>
      <div aria-labelledby={`tab-${tab}`} className="mt-5 space-y-3" id={`appointments-${tab}`} role="tabpanel">
        {visibleAppointments.length === 0 ? <EmptyState description="Không có lịch hẹn trong nhóm này." title="Chưa có lịch hẹn" /> : visibleAppointments.map((appointment) => {
          const service = services.find((candidate) => candidate.id === appointment.serviceId);
          const doctor = doctors.find((candidate) => candidate.id === appointment.doctorId);
          const cancellable = canTransitionAppointment(appointment.status, "cancelled", user?.role);
          const serviceName = service?.name ?? "Dịch vụ";
          const appointmentTime = formatDateTime(appointment.startAt);

          return (
            <article aria-label={`${serviceName} ${appointmentTime}`} className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 shadow-panel sm:flex-row sm:items-center sm:justify-between" key={appointment.id}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-text">{serviceName}</h2>
                  <StatusBadge status={appointment.status} />
                </div>
                <p className="mt-2 text-sm text-text-muted">{appointmentTime} · {doctor?.fullName}</p>
                {appointment.reason && <p className="mt-1 text-sm text-text-muted">{appointment.reason}</p>}
                {appointment.cancellationReason && <p className="mt-2 text-sm text-danger">{appointment.cancellationReason}</p>}
              </div>
              {cancellable && <button aria-label={`Hủy lịch ${serviceName} ${appointmentTime}`} className="h-10 shrink-0 rounded-md border border-danger px-3 text-sm font-semibold text-danger hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60" onClick={() => void cancel(appointment.id)} type="button">Hủy lịch</button>}
            </article>
          );
        })}
      </div>
    </section>
  );
}
