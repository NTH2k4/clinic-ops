import { resolveWebDistPath, serveWebAppFromEnv } from "./static-assets";

describe("static assets config", () => {
  it("keeps API-only mode when SERVE_WEB_APP is not enabled", () => {
    expect(serveWebAppFromEnv({})).toBe(false);
    expect(serveWebAppFromEnv({ SERVE_WEB_APP: "false" })).toBe(false);
  });

  it("enables SPA serving only when explicitly requested", () => {
    expect(serveWebAppFromEnv({ SERVE_WEB_APP: "true" })).toBe(true);
    expect(serveWebAppFromEnv({ SERVE_WEB_APP: "TRUE" })).toBe(true);
  });

  it("uses WEB_DIST_DIR when the configured directory exists", () => {
    const exists = (path: string) => path === "/tmp/careflow-web-dist/index.html";

    expect(resolveWebDistPath({
      env: { WEB_DIST_DIR: "/tmp/careflow-web-dist" },
      cwd: "/repo/apps/api",
      moduleDir: "/repo/apps/api/dist/src",
      exists,
    })).toBe("/tmp/careflow-web-dist");
  });

  it("finds the web dist directory from API cwd or compiled module dir", () => {
    const exists = (path: string) => path === "/repo/apps/web/dist/index.html";

    expect(resolveWebDistPath({
      env: {},
      cwd: "/repo/apps/api",
      moduleDir: "/repo/apps/api/dist/src",
      exists,
    })).toBe("/repo/apps/web/dist");
  });

  it("throws a clear error when SPA serving is enabled without built web assets", () => {
    expect(() => resolveWebDistPath({
      env: {},
      cwd: "/repo/apps/api",
      moduleDir: "/repo/apps/api/dist/src",
      exists: () => false,
    })).toThrow("Built web index.html was not found. Run the web build before starting the API with SERVE_WEB_APP=true.");
  });
});
