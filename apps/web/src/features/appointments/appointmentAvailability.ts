import { mockStore } from "../../mocks/mockStore";
import { isAtLeastMinutesFromClinicNow } from "../../lib/dateTime";
import { hasDoctorConflict } from "./appointmentRules";

function timeToMinutes(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function calendarDayOfWeek(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function appointmentStart(date: string, time: string): string {
  return `${date}T${time}:00+07:00`;
}

function appointmentEnd(startAt: string, durationMinutes: number): string {
  return new Date(new Date(startAt).getTime() + durationMinutes * 60_000).toISOString();
}

export function isDoctorAvailableForSlot(doctorId: string, date: string, time: string, durationMinutes: number): boolean {
  if (!isAtLeastMinutesFromClinicNow(date, time, 30)) return false;

  const startMinutes = timeToMinutes(time);
  const endMinutes = startMinutes + durationMinutes;
  const schedules = mockStore.doctorSchedules.filter(
    (schedule) => schedule.doctorId === doctorId
      && schedule.status === "active"
      && schedule.dayOfWeek === calendarDayOfWeek(date)
      && schedule.effectiveFrom <= date
      && date <= schedule.effectiveTo,
  );
  const isWithinSchedule = (schedule: { startTime: string; endTime: string }) =>
    timeToMinutes(schedule.startTime) <= startMinutes && endMinutes <= timeToMinutes(schedule.endTime);
  const overlapsSchedule = (schedule: { startTime: string; endTime: string }) =>
    startMinutes < timeToMinutes(schedule.endTime) && timeToMinutes(schedule.startTime) < endMinutes;
  const startAt = appointmentStart(date, time);

  return schedules.some((schedule) => schedule.type === "working" && isWithinSchedule(schedule))
    && !schedules.some((schedule) => (schedule.type === "blocked" || schedule.type === "leave") && overlapsSchedule(schedule))
    && !hasDoctorConflict({
      appointment: { id: "availability-candidate", doctorId, startAt, endAt: appointmentEnd(startAt, durationMinutes), status: "requested" },
      appointments: mockStore.appointments,
    });
}
