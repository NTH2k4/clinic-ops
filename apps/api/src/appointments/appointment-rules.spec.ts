import { AppointmentStatus, UserRole } from "@prisma/client";
import { canTransition } from "./appointment-rules";

describe("canTransition", () => {
  it.each([
    ["requested", "confirmed", ["receptionist", "nurse", "admin"]],
    ["requested", "cancelled", ["patient", "receptionist", "nurse", "admin"]],
    ["confirmed", "checked_in", ["receptionist", "nurse", "admin"]],
    ["confirmed", "cancelled", ["patient", "receptionist", "nurse", "admin"]],
    ["confirmed", "no_show", ["receptionist", "nurse", "admin"]],
    ["checked_in", "in_progress", ["doctor"]],
    ["checked_in", "cancelled", ["receptionist", "nurse", "admin"]],
    ["in_progress", "completed", ["doctor"]],
  ] as const)("allows %s to transition to %s for permitted roles", (from, to, roles) => {
    for (const role of roles) expect(canTransition(from, to, role)).toBe(true);
  });

  it.each([
    ["requested", "confirmed", "patient"],
    ["confirmed", "checked_in", "doctor"],
    ["checked_in", "in_progress", "nurse"],
    ["in_progress", "completed", "admin"],
  ] as const)("rejects %s to %s for prohibited role %s", (from, to, role) => {
    expect(canTransition(from, to, role)).toBe(false);
  });

  it.each([AppointmentStatus.completed, AppointmentStatus.cancelled, AppointmentStatus.no_show])("rejects every transition from terminal status %s", (from) => {
    for (const to of Object.values(AppointmentStatus)) {
      for (const role of Object.values(UserRole)) expect(canTransition(from, to, role)).toBe(false);
    }
  });
});
