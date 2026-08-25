import type { Appointment, AppointmentStatus } from "../../types/models";

export type TimeRange = Pick<Appointment, "startAt" | "endAt">;

export const ACTIVE_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "requested",
  "confirmed",
  "checked_in",
  "in_progress",
];

export const VALID_NEXT_STATUSES: Record<AppointmentStatus, AppointmentStatus[]> = {
  requested: ["confirmed", "cancelled"],
  confirmed: ["checked_in", "cancelled", "no_show"],
  checked_in: ["in_progress", "cancelled"],
  in_progress: ["completed"],
  completed: [],
  cancelled: [],
  no_show: [],
};
