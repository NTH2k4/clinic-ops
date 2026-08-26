import { expect, type Page, test } from "@playwright/test";

type ViewportCase = {
  roleButton: RegExp;
  size: { width: number; height: number };
  links: string[];
  expectedHeading: string;
};

async function expectNoPageOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const documentWidth = document.documentElement.scrollWidth;
    const viewportWidth = document.documentElement.clientWidth;
    const bodyWidth = document.body.scrollWidth;

    return {
      bodyWidth,
      documentWidth,
      overflowBy: Math.max(documentWidth, bodyWidth) - viewportWidth,
      viewportWidth,
    };
  });

  expect(overflow.overflowBy, JSON.stringify(overflow)).toBeLessThanOrEqual(1);
}

async function signIn(page: Page, roleButton: RegExp) {
  await page.goto("/login");
  await page.getByRole("button", { name: roleButton }).click();
}

async function clickVisibleLink(page: Page, name: string) {
  const links = page.getByRole("link", { name, exact: true });
  const count = await links.count();

  for (let index = 0; index < count; index += 1) {
    const link = links.nth(index);
    if (await link.isVisible()) {
      await link.click();
      return;
    }
  }

  throw new Error(`No visible link found for ${name}`);
}

const viewportCases: ViewportCase[] = [
  {
    expectedHeading: "Trang chính patient",
    links: ["Dịch vụ", "Lịch của tôi"],
    roleButton: /Patient Demo/i,
    size: { width: 360, height: 800 },
  },
  {
    expectedHeading: "Operations Workspace",
    links: ["Hàng đợi", "Lịch", "Tạo lịch"],
    roleButton: /Receptionist Demo/i,
    size: { width: 768, height: 900 },
  },
  {
    expectedHeading: "Không gian bác sĩ",
    links: ["Lịch ngày", "Lịch tuần"],
    roleButton: /Doctor Demo/i,
    size: { width: 1280, height: 800 },
  },
  {
    expectedHeading: "Admin dashboard",
    links: ["Bác sĩ", "Dịch vụ", "Chuyên khoa", "Nhân sự", "Audit log"],
    roleButton: /Admin Demo/i,
    size: { width: 1440, height: 900 },
  },
];

for (const viewportCase of viewportCases) {
  test(`main ${viewportCase.size.width}px workspace pages do not create page-level horizontal overflow`, async ({ page }) => {
    await page.setViewportSize(viewportCase.size);
    await signIn(page, viewportCase.roleButton);

    await expect(page.getByRole("heading", { name: viewportCase.expectedHeading })).toBeVisible();
    await expectNoPageOverflow(page);

    for (const linkName of viewportCase.links) {
      await clickVisibleLink(page, linkName);
      await expectNoPageOverflow(page);
    }
  });
}

test("keyboard users can operate the role switcher and notification panel", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await signIn(page, /Patient Demo/i);

  const roleSwitcher = page.getByLabel("Chuyển vai trò");
  await roleSwitcher.focus();
  await roleSwitcher.selectOption("admin");
  await expect(page.getByRole("heading", { name: "Admin dashboard" })).toBeVisible();

  const notificationsButton = page.getByRole("button", { name: "Thông báo" });
  await notificationsButton.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Thông báo" })).toBeVisible();

  const closeNotificationsButton = page.getByRole("button", { name: "Đóng thông báo" });
  await closeNotificationsButton.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Thông báo" })).toBeHidden();
});

test("keyboard users can open and close the doctor appointment detail drawer", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await signIn(page, /Doctor Demo/i);

  const detailButton = page.getByRole("button", { name: "Xem chi tiết", exact: true });
  await detailButton.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Chi tiết lịch hẹn" })).toBeVisible();

  const closeDetailButton = page.getByRole("button", { name: "Đóng chi tiết" });
  await closeDetailButton.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Chi tiết lịch hẹn" })).toBeHidden();
});
