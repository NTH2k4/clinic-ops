import { expect, test } from "@playwright/test";

test("patient can request appointment on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/login");

  await page.getByRole("button", { name: /Patient Demo/i }).click();
  await page.getByRole("link", { name: "Đặt lịch" }).click();
  await page.getByRole("button", { name: /Khám tổng quát/i }).click();
  await page.getByLabel("Any available doctor").check();
  await page.getByRole("button", { name: "09:00", exact: true }).click();
  await page.getByLabel("Lý do khám").fill("Đau đầu kéo dài");
  await page.getByRole("button", { name: "Gửi yêu cầu" }).click();

  await expect(page.getByRole("heading", { name: "Yêu cầu đã được gửi" })).toBeVisible();
  await expect(page.getByText("Chờ xác nhận")).toBeVisible();
});

test("doctor can start and complete a checked-in appointment on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/login");

  await page.getByRole("button", { name: /Doctor Demo/i }).click();
  const appointment = page.getByRole("article").filter({ has: page.getByText("09:00", { exact: true }) });
  await appointment.getByRole("button", { name: "Xem chi tiết Nguyen Minh Anh" }).click();
  await page.getByRole("button", { name: "Check in appointment" }).click();
  await page.getByRole("button", { name: "Start appointment" }).click();
  await page.getByRole("button", { name: "Complete appointment" }).click();

  await expect(page.getByRole("dialog", { name: "Chi tiết lịch hẹn" }).getByLabel("Trạng thái: Hoàn tất")).toBeVisible();
});

test("operations can check in a confirmed appointment on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/login");

  await page.getByRole("button", { name: /Receptionist Demo/i }).click();
  await page.getByRole("navigation", { name: "Điều hướng chính" }).getByRole("link", { name: "Hàng đợi", exact: true }).click();
  const confirmedQueue = page.getByRole("region", { name: "Đã xác nhận" });
  const checkedInQueue = page.getByRole("region", { name: "Đang chờ khám" });
  const checkInActions = confirmedQueue.getByRole("button", { name: "Check-in" });
  await expect(checkInActions.first()).toBeVisible();
  const confirmedCount = await checkInActions.count();
  const checkedInCount = await checkedInQueue.getByRole("button", { name: "Bắt đầu khám" }).count();
  await checkInActions.first().click();

  await expect(checkInActions).toHaveCount(confirmedCount - 1);
  await expect(checkedInQueue.getByRole("button", { name: "Bắt đầu khám" })).toHaveCount(checkedInCount + 1);
});
