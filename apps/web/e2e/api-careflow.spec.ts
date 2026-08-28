import { expect, type APIRequestContext, type Page, test } from "@playwright/test";

const password = "careflow-demo";

type PatientCredentials = {
  displayName: string;
  email: string;
  phone: string;
  password: string;
};

function createPatientCredentials(): PatientCredentials {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`;

  return {
    displayName: `API Patient ${suffix}`,
    email: `api.patient.${suffix}@example.test`,
    phone: `+849${suffix.slice(-8).padStart(8, "0")}`,
    password: `CareFlow!${suffix}`,
  };
}

async function signIn(page: Page, email: string, signInPassword = password) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(signInPassword);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
}

async function registerPatient(page: Page, patient: PatientCredentials) {
  await page.goto("/register");
  await page.getByLabel("Họ và tên").fill(patient.displayName);
  await page.getByLabel("Email").fill(patient.email);
  await page.getByLabel("Số điện thoại").fill(patient.phone);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(patient.password);
  await page.getByLabel("Xác nhận mật khẩu", { exact: true }).fill(patient.password);
  await page.getByRole("button", { name: "Tạo tài khoản" }).click();
}

async function apiSessionHeaders(request: APIRequestContext, email: string) {
  const login = await request.post("/api/v1/auth/login", { data: { email, password } });
  expect(login.ok()).toBe(true);
  const { data } = await login.json() as { data: { sessionToken: string } };
  return { Authorization: `Bearer ${data.sessionToken}` };
}

test("patient registration creates an authenticated booking workspace", async ({ page }) => {
  const patient = createPatientCredentials();

  await registerPatient(page, patient);

  await expect(page).toHaveURL(/\/app\/patient$/);
  await expect(page.getByRole("navigation", { name: "Điều hướng chính" }).getByRole("link", { name: "Đặt lịch", exact: true })).toBeVisible();
});

test("password change clears the session and requires login with the new password", async ({ page }) => {
  const patient = createPatientCredentials();
  const newPassword = `${patient.password}-new`;

  await registerPatient(page, patient);
  await page.getByRole("button", { name: "Bảo mật tài khoản" }).click();
  await page.getByLabel("Mật khẩu hiện tại", { exact: true }).fill(patient.password);
  await page.getByLabel("Mật khẩu mới", { exact: true }).fill(newPassword);
  await page.getByRole("button", { name: "Đổi mật khẩu" }).click();

  await expect(page).toHaveURL(/\/login$/);
  await signIn(page, patient.email, patient.password);
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("alert")).toBeVisible();

  await signIn(page, patient.email, newPassword);
  await expect(page).toHaveURL(/\/app\/patient$/);
});

test("admin can lock and unlock a registered patient account", async ({ page, request }) => {
  const patient = createPatientCredentials();

  const registration = await request.post("/api/v1/auth/register", { data: patient });
  expect(registration.ok()).toBe(true);

  await signIn(page, "admin@careflow.local");
  await expect(page).toHaveURL(/\/app\/admin$/);
  await page.getByRole("navigation", { name: "Điều hướng chính" }).getByRole("link", { name: "Accounts", exact: true }).click();
  await page.getByLabel("Search").fill(patient.email);

  const account = page.getByRole("row", { name: new RegExp(patient.email) });
  await expect(account).toBeVisible();
  await account.getByRole("button", { name: `Lock ${patient.displayName}` }).click();
  await expect(account.getByRole("button", { name: `Unlock ${patient.displayName}` })).toBeVisible();
  await account.getByRole("button", { name: `Unlock ${patient.displayName}` }).click();
  await expect(account.getByRole("button", { name: `Lock ${patient.displayName}` })).toBeVisible();
});

test("patient can request an appointment and sees a duplicate-slot conflict", async ({ page }) => {
  await signIn(page, "patient@careflow.local");
  await page.getByRole("navigation", { name: "Điều hướng chính" }).getByRole("link", { name: "Đặt lịch", exact: true }).click();
  await page.getByRole("button", { name: /General Consultation/ }).click();
  await page.getByLabel("Chọn bác sĩ cụ thể").check();
  await page.getByLabel("Bác sĩ", { exact: true }).selectOption("doctor-4");
  await page.getByRole("button", { name: "09:00", exact: true }).click();
  await page.getByLabel("Lý do khám").fill("API appointment request");
  await page.getByRole("button", { name: "Gửi yêu cầu" }).click();

  await expect(page.getByRole("heading", { name: "Yêu cầu đã được gửi" })).toBeVisible();

  await page.getByRole("link", { name: "Đặt lịch khác" }).click();
  await page.getByRole("link", { name: "Đặt lịch General Consultation" }).click();
  await page.getByLabel("Chọn bác sĩ cụ thể").check();
  await page.getByLabel("Bác sĩ", { exact: true }).selectOption("doctor-4");
  await page.getByRole("button", { name: "09:00", exact: true }).click();
  await page.getByLabel("Lý do khám").fill("Duplicate API appointment request");
  await page.getByRole("button", { name: "Gửi yêu cầu" }).click();

  await expect(page.getByRole("alert")).toContainText("Khung giờ vừa được đặt bởi lịch hẹn khác");
});

test("receptionist can create an appointment and check in a confirmed appointment", async ({ page }) => {
  await signIn(page, "reception@careflow.local");
  await page.getByRole("navigation", { name: "Điều hướng chính" }).getByRole("link", { name: "Tạo lịch", exact: true }).click();
  await page.getByLabel("Tìm patient").fill("Demo Patient 2");
  await page.getByRole("button", { name: /Demo Patient 2/ }).click();
  await page.getByLabel("Dịch vụ").selectOption("service-general");
  const schedulingGroup = page.getByRole("group", { name: "2. Chọn dịch vụ và bác sĩ" });
  const doctorSelect = schedulingGroup.getByRole("combobox").nth(1);
  await expect(doctorSelect).toBeEnabled();
  await expect.poll(async () => doctorSelect.locator("option").allTextContents()).toContain("Dr. Hoa Le");
  await doctorSelect.selectOption({ label: "Dr. Hoa Le" });
  await page.getByLabel("Giờ khám").selectOption("10:00");
  await page.getByRole("button", { name: "Tạo appointment" }).click();
  await expect(page.getByLabel("Xem lại trước khi tạo")).toContainText("Đã xác nhận");

  await page.getByRole("link", { name: "Hàng đợi", exact: true }).click();
  const confirmedQueue = page.getByRole("region", { name: "Đã xác nhận" });
  const checkedInQueue = page.getByRole("region", { name: "Đang chờ khám" });
  const before = await checkedInQueue.getByLabel("Trạng thái: Đã check-in").count();
  await confirmedQueue.getByRole("button", { name: "Check-in" }).first().click();
  await expect(checkedInQueue.getByLabel("Trạng thái: Đã check-in")).toHaveCount(before + 1);
  await expect(checkedInQueue.getByRole("button", { name: "Bắt đầu khám" })).toHaveCount(0);
});

test("schedule management block disables the matching operations booking slot with a reason", async ({ page, request }) => {
  await signIn(page, "admin@careflow.local");
  await expect(page).toHaveURL(/\/app\/admin$/);
  await page.getByRole("navigation", { name: "Điều hướng chính" }).getByRole("link", { name: "Schedules", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Schedules" })).toBeVisible();

  const headers = await apiSessionHeaders(request, "admin@careflow.local");
  const createdSchedule = await request.post("/api/v1/doctor-schedules", {
    headers,
    data: {
      doctorId: "doctor-4",
      type: "blocked",
      dayOfWeek: 3,
      startTime: "11:30",
      endTime: "12:00",
      effectiveFrom: "2026-08-26",
      effectiveTo: "2026-08-26",
    },
  });
  expect(createdSchedule.ok()).toBe(true);

  await page.getByRole("button", { name: "Đăng xuất" }).click();
  await signIn(page, "reception@careflow.local");
  await page.getByRole("navigation", { name: "Điều hướng chính" }).getByRole("link", { name: "Tạo lịch", exact: true }).click();
  await page.getByLabel("Tìm patient").fill("Demo Patient 3");
  await page.getByRole("button", { name: /Demo Patient 3/ }).click();
  await page.getByLabel("Dịch vụ").selectOption("service-general");
  const schedulingGroup = page.getByRole("group", { name: "2. Chọn dịch vụ và bác sĩ" });
  const doctorSelect = schedulingGroup.getByRole("combobox").nth(1);
  await expect(doctorSelect).toBeEnabled();
  await expect.poll(async () => doctorSelect.locator("option").allTextContents()).toContain("Dr. Hoa Le");
  await doctorSelect.selectOption({ label: "Dr. Hoa Le" });

  const timeSelect = page.getByLabel("Giờ khám");
  await expect.poll(async () => timeSelect.locator("option").allTextContents()).toContain("11:30 - Bác sĩ bị chặn lịch");
  await expect(timeSelect.locator("option", { hasText: "11:30 - Bác sĩ bị chặn lịch" })).toHaveAttribute("disabled", "");
});

test("doctor can start a checked-in appointment and complete it", async ({ page, request }) => {
  const headers = await apiSessionHeaders(request, "reception@careflow.local");
  expect((await request.post("/api/v1/appointments/appointment-1/confirm", { headers })).ok()).toBe(true);
  expect((await request.post("/api/v1/appointments/appointment-1/check-in", { headers })).ok()).toBe(true);

  await signIn(page, "minh.nguyen@careflow.local");
  await page.getByRole("link", { name: "Lịch ngày" }).click();
  await page.getByRole("button", { name: "Ngày trước" }).click();
  const appointment = page.getByRole("article", { name: "Patient Demo" });
  await appointment.getByRole("button", { name: /Xem chi tiết/ }).click();
  const dialog = page.getByRole("dialog", { name: "Chi tiết lịch hẹn" });
  const start = dialog.getByRole("button", { name: "Start appointment" });
  await expect(start).toBeVisible();
  await start.click();
  await expect(dialog.getByLabel("Trạng thái: Đang khám")).toBeVisible();
  await dialog.getByRole("button", { name: "Complete appointment" }).click();
  await expect(dialog.getByLabel("Trạng thái: Hoàn tất")).toBeVisible();
});

test("admin can filter audit events and a notification reference opens its target workspace", async ({ page }) => {
  await signIn(page, "admin@careflow.local");
  await page.getByRole("link", { name: "Audit log" }).click();
  await page.getByLabel("Entity type").selectOption("appointment");
  await page.getByLabel("Action").selectOption("appointment_created");
  await expect(page.getByRole("table", { name: "Audit events" })).toContainText("appointment_created");

  await page.getByRole("button", { name: "Đăng xuất" }).click();
  await signIn(page, "patient@careflow.local");
  await page.getByRole("button", { name: "Thông báo" }).click();
  await page.getByRole("button", { name: /Mở appointment appointment-/ }).first().click();
  await expect(page).toHaveURL(/\/app\/patient\/appointments$/);
});

test("unauthorized routes redirect and forbidden actions leave the patient UI unchanged", async ({ page }) => {
  await page.goto("/app/admin/audit");
  await expect(page).toHaveURL(/\/login$/);

  await signIn(page, "patient@careflow.local");
  await page.getByRole("navigation", { name: "Điều hướng chính" }).getByRole("link", { name: "Lịch của tôi", exact: true }).click();
  const cancellation = page.getByRole("button", { name: /Hủy lịch .+/ }).first();
  await expect(cancellation).toBeVisible();

  await page.route("**/api/v1/appointments/*/cancel", async (route) => {
    await route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({
        error: { code: "FORBIDDEN", message: "You do not have permission to access this resource." },
        meta: { requestId: "forbidden-transition" },
      }),
    });
  });

  await cancellation.click();

  await expect(page.getByRole("alert")).toContainText("Không thể hủy lịch hẹn. Vui lòng thử lại.");
  await expect(cancellation).toBeVisible();
});
