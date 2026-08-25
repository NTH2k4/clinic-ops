const viDateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const viDateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const viTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

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

export function addMinutes(dateTime: string, minutes: number): string {
  return new Date(new Date(dateTime).getTime() + minutes * 60_000).toISOString();
}
