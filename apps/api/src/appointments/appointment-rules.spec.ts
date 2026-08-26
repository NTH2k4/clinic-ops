import { canTransition } from "./appointment-rules";

describe("canTransition", () => {
  it("allows receptionist to check in a confirmed appointment", () => {
    expect(canTransition("confirmed", "checked_in", "receptionist")).toBe(true);
  });

  it("rejects a patient transition reserved for a doctor", () => {
    expect(canTransition("checked_in", "in_progress", "patient")).toBe(false);
  });

  it("rejects editing terminal appointments", () => {
    expect(canTransition("completed", "cancelled", "admin")).toBe(false);
  });
});
