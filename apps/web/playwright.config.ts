import { defineConfig } from "playwright/test";

const apiMode = process.env.PLAYWRIGHT_API_MODE === "true";
const apiModeSystemNow = "2026-08-25T00:59:00.000Z";

export default defineConfig({
  testDir: "./e2e",
  globalTeardown: apiMode ? "./e2e/api-global-teardown.ts" : undefined,
  testIgnore: apiMode ? undefined : "api-careflow.spec.ts",
  testMatch: apiMode ? "api-careflow.spec.ts" : undefined,
  use: {
    baseURL: apiMode ? "http://127.0.0.1:4174" : "http://127.0.0.1:4173",
  },
  webServer: apiMode
    ? [
      {
        command: `npm run prisma:generate && npx prisma migrate deploy && npm run prisma:seed && CAREFLOW_SYSTEM_NOW=${apiModeSystemNow} npm run dev -- --port 3000`,
        cwd: "../api",
        url: "http://127.0.0.1:3000/api/v1/health",
        reuseExistingServer: false,
      },
      {
        command: "VITE_DATA_SOURCE=api VITE_API_BASE_URL=/api/v1 npm run dev -- --host 127.0.0.1 --port 4174",
        url: "http://127.0.0.1:4174",
        reuseExistingServer: false,
      },
    ]
    : {
      command: "npm run dev -- --host 127.0.0.1 --port 4173",
      url: "http://127.0.0.1:4173",
      reuseExistingServer: !process.env.CI,
    },
});
