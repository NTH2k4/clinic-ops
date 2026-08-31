const viDateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Asia/Ho_Chi_Minh",
});

const viDateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Ho_Chi_Minh",
});

const viTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Ho_Chi_Minh",
});

const clinicDatePartsFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Asia/Ho_Chi_Minh",
  year: "numeric",
});

export function todayInClinicTimeZone(now = new Date()): string {
  const parts = Object.fromEntries(clinicDatePartsFormatter.formatToParts(now).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function formatDate(dateTime: string): string {
  return viDateFormatter.format(new Date(dateTime));
}

export function formatDateTime(dateTime: string): string {
  return viDateTimeFormatter.format(new Date(dateTime));
}

export function formatTime(dateTime: string): string {
  return viTimeFormatter.format(new Date(dateTime));
}

export function toDateInputValue(dateTime: string): string {
  return dateTime.slice(0, 10);
}

export function isDateInputValue(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function formatDateInputValue(date: string): string {
  return formatDate(`${date}T00:00:00+07:00`);
}

export function formatDateRange(startDate: string, endDate: string): string {
  return `${formatDateInputValue(startDate)} - ${formatDateInputValue(endDate)}`;
}

export function getWeekStartDate(date: string): string {
  const value = new Date(`${date}T00:00:00Z`);
  const day = value.getUTCDay() || 7;
  value.setUTCDate(value.getUTCDate() - day + 1);
  return value.toISOString().slice(0, 10);
}

export function getIsoWeekNumber(date: string): number {
  const value = new Date(`${date}T00:00:00Z`);
  const day = value.getUTCDay() || 7;
  value.setUTCDate(value.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(value.getUTCFullYear(), 0, 1));
  return Math.ceil(((value.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

export function addMinutes(dateTime: string, minutes: number): string {
  return new Date(new Date(dateTime).getTime() + minutes * 60_000).toISOString();
}

export function isAtLeastMinutesFromClinicNow(date: string, time: string, minutes: number, now = new Date()): boolean {
  const today = todayInClinicTimeZone(now);
  if (date < today) return false;
  if (date > today) return true;

  const appointmentTime = new Date(`${date}T${time}:00+07:00`).getTime();
  return appointmentTime >= now.getTime() + minutes * 60_000;
}
