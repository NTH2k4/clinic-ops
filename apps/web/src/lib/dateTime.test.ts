import { describe, expect, it } from "vitest";
import { addDays, formatDateRange, getIsoWeekNumber, getWeekStartDate } from "./dateTime";

describe("dateTime helpers", () => {
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
