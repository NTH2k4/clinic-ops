import { ChevronRight } from "lucide-react";
import { formatTime } from "../lib/dateTime";
import type { Appointment, Patient, Service } from "../types/models";
import { StatusBadge } from "./StatusBadge";

type AppointmentTimelineProps = {
  appointments: Appointment[];
  patients: Patient[];
  services: Service[];
  onSelect: (appointment: Appointment) => void;
  compact?: boolean;
};

export function AppointmentTimeline({ appointments, patients, services, onSelect, compact = false }: AppointmentTimelineProps) {
  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {appointments.map((appointment) => {
        const patient = patients.find((candidate) => candidate.id === appointment.patientId);
        const service = services.find((candidate) => candidate.id === appointment.serviceId);

        return (
          <article
            aria-label={patient?.fullName ?? "Bệnh nhân chưa xác định"}
            className={`flex gap-3 border border-border bg-white p-3 shadow-[0_1px_0_rgb(20_35_38/0.04)] transition-colors hover:border-border-strong ${compact ? "rounded-md" : "rounded-lg sm:p-4"}`}
            key={appointment.id}
          >
            <div className="w-12 shrink-0 rounded-md bg-teal-50 px-2 py-1 text-center text-sm font-semibold text-primary">{formatTime(appointment.startAt)}</div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-text">{patient?.fullName ?? "Bệnh nhân chưa xác định"}</h3>
                <StatusBadge status={appointment.status} />
              </div>
              <p className="mt-1 text-sm text-text-muted">{service?.name ?? "Dịch vụ chưa xác định"}</p>
              {appointment.reason ? <p className="mt-1 line-clamp-1 text-sm text-text-muted">{appointment.reason}</p> : null}
            </div>
            <button
              aria-label={`Xem chi tiết ${patient?.fullName ?? "lịch hẹn"}`}
              className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-text-muted transition-colors hover:border-border-strong hover:bg-surface-muted hover:text-text"
              onClick={() => onSelect(appointment)}
              title="Xem chi tiết"
              type="button"
            >
              <ChevronRight aria-hidden="true" size={18} />
            </button>
          </article>
        );
      })}
    </div>
  );
}
