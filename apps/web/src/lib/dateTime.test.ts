import { afterEach, describe, expect, it, vi } from "vitest";
import { addDays, formatDateRange, getIsoWeekNumber, getWeekStartDate, todayInClinicTimeZone } from "./dateTime";

describe("dateTime helpers", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("derives today from the clinic timezone instead of a fixed prototype date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-29T02:30:00.000Z"));

    expect(todayInClinicTimeZone()).toBe("2026-08-29");
  });

  it("moves date input values by whole clinic days without changing the display format", () => {
    expect(addDays("2026-08-25", -1)).toBe("2026-08-24");
    expect(addDays("2026-08-25", 1)).toBe("2026-08-26");
    expect(formatDateRange("2026-08-24", "2026-08-30")).toBe("24/08/2026 - 30/08/2026");
  });

  it("calculates ISO week starts and week numbers for Vietnamese schedule labels", () => {
    expect(getWeekStartDate("2026-08-25")).toBe("2026-08-24");
    expect(getIsoWeekNumber("2026-08-24")).toBe(35);
  });
});
