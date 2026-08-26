import { loadEnv } from "vite";
import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "VITE_");

  return {
    base: mode === "github-pages" ? "/clinic-ops/" : "/",
    plugins: [react()],
    server: env.VITE_DATA_SOURCE === "api"
      ? { proxy: { "/api/v1": { target: env.VITE_API_PROXY_TARGET ?? "http://127.0.0.1:3000", changeOrigin: true } } }
      : undefined,
    test: {
      environment: "jsdom",
      exclude: [...configDefaults.exclude, "e2e/**"],
      setupFiles: "./src/test/setupTests.ts",
    },
  };
});
