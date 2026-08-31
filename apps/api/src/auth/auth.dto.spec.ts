import { changePasswordSchema, patientRegistrationSchema, updateAccountProfileSchema } from "./auth.dto";

describe("auth dto password policy", () => {
  const strongPassword = "Careflow#123";

  it.each([
    ["too short", "Care#123"],
    ["missing lowercase", "CAREFLOW#123"],
    ["missing uppercase", "careflow#123"],
    ["missing number", "Careflow#abc"],
    ["missing special character", "Careflow123"],
    ["over bcrypt byte limit", `${"Aa1!".repeat(18)}x`],
  ])("rejects registration passwords that are %s", (_caseName, password) => {
    const result = patientRegistrationSchema.safeParse({
      displayName: "New Patient",
      email: "new.patient@example.test",
      phone: "+84919990001",
      password,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.join(".") === "password")).toBe(true);
    }
  });

  it("accepts strong registration passwords within bcrypt limits", () => {
    const result = patientRegistrationSchema.safeParse({
      displayName: "New Patient",
      email: "new.patient@example.test",
      phone: "+84919990001",
      password: strongPassword,
    });

    expect(result.success).toBe(true);
  });

  it.each([
    ["too short", "Care#123"],
    ["missing lowercase", "CAREFLOW#123"],
    ["missing uppercase", "careflow#123"],
    ["missing number", "Careflow#abc"],
    ["missing special character", "Careflow123"],
  ])("rejects new change-password values that are %s", (_caseName, newPassword) => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "careflow-demo",
      newPassword,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.join(".") === "newPassword")).toBe(true);
    }
  });

  it("accepts only display name and email for account profile updates", () => {
    expect(updateAccountProfileSchema.safeParse({
      displayName: "Updated Profile User",
      email: "updated.profile@example.test",
    }).success).toBe(true);

    expect(updateAccountProfileSchema.safeParse({
      displayName: "",
      email: "not-an-email",
    }).success).toBe(false);

    expect(updateAccountProfileSchema.safeParse({
      displayName: "Updated Profile User",
      email: "updated.profile@example.test",
      role: "admin",
    }).success).toBe(false);
  });
});
