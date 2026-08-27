import { afterEach, describe, expect, it, vi } from "vitest";
import { createAuthApi } from "./auth";
import type { AuthLoginResponse, AuthSession } from "./auth";
import { ApiClientError } from "./errors";
import { createApiHttpClient } from "./http";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("API data source config", () => {
  it("defaults to mock mode and /api/v1 base URL", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_DATA_SOURCE", undefined);
    vi.stubEnv("VITE_API_BASE_URL", undefined);

    const config = await import("../dataSource");

    expect(config.dataSource).toBe("mock");
    expect(config.isApiMode).toBe(false);
    expect(config.apiBaseUrl).toBe("/api/v1");
  });

  it("enables API mode only for the api data source value", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_DATA_SOURCE", "api");
    vi.stubEnv("VITE_API_BASE_URL", "https://api.example.test/api/v1");

    const config = await import("../dataSource");

    expect(config.dataSource).toBe("api");
    expect(config.isApiMode).toBe(true);
    expect(config.apiBaseUrl).toBe("https://api.example.test/api/v1");
  });
});

describe("API HTTP client", () => {
  it("returns success envelope data and sends the bearer token", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ data: { id: "user-1" }, meta: { requestId: "req-1" } }), { status: 200 }),
    );
    const client = createApiHttpClient({
      baseUrl: "/api/v1",
      getToken: () => "token-1",
      fetcher,
    });

    await expect(client.request<{ id: string }>("/auth/me")).resolves.toEqual({ id: "user-1" });

    const [, init] = fetcher.mock.calls[0];
    expect(fetcher).toHaveBeenCalledWith("/api/v1/auth/me", expect.any(Object));
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer token-1");
  });

  it("normalizes backend string field errors while preserving API error details", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Request validation failed.",
            fields: { email: "Invalid email address." },
          },
          meta: { requestId: "req-400" },
        }),
        { status: 400 },
      ),
    );
    const client = createApiHttpClient({ baseUrl: "/api/v1", getToken: () => null, fetcher });

    const error = await client.request("/auth/login").catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(ApiClientError);
    expect(error).toMatchObject({
      code: "VALIDATION_ERROR",
      message: "Request validation failed.",
      fields: { email: ["Invalid email address."] },
      requestId: "req-400",
      status: 400,
    });
  });

  it("calls the unauthenticated handler for UNAUTHENTICATED responses", async () => {
    const onUnauthenticated = vi.fn();
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { code: "UNAUTHENTICATED", message: "Authentication is required." },
          meta: { requestId: "req-401" },
        }),
        { status: 401 },
      ),
    );
    const client = createApiHttpClient({ baseUrl: "/api/v1", getToken: () => null, onUnauthenticated, fetcher });

    await expect(client.request("/auth/me")).rejects.toMatchObject({ code: "UNAUTHENTICATED" });

    expect(onUnauthenticated).toHaveBeenCalledOnce();
  });
});

describe("auth API", () => {
  it("uses the auth endpoints with their required methods and request payloads", async () => {
    const currentUser = {
      id: "user-1",
      displayName: "Patient Demo",
      email: "patient@example.test",
      role: "patient" as const,
      status: "active" as const,
    };
    const loginResponse: AuthLoginResponse = {
      sessionToken: "session-1",
      currentUser,
      linkedProfile: { type: "patient", id: "patient-1" },
    };
    const session: AuthSession = {
      currentUser,
      linkedProfile: null,
    };
    const request = vi.fn()
      .mockResolvedValueOnce(loginResponse)
      .mockResolvedValueOnce(loginResponse)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(session);
    const authApi = createAuthApi(request);

    await expect(authApi.login({ email: "patient@example.test", password: "secret" })).resolves.toMatchObject({
      sessionToken: "session-1",
      currentUser,
      linkedProfile: { type: "patient", id: "patient-1" },
    });
    await expect(authApi.register({
      displayName: "New Patient",
      email: "new.patient@example.test",
      phone: "+84919990001",
      password: "new-password",
    })).resolves.toMatchObject({ sessionToken: "session-1", currentUser });
    await expect(authApi.changePassword({ currentPassword: "secret", newPassword: "new-password" })).resolves.toBeUndefined();
    await expect(authApi.logout()).resolves.toBeUndefined();
    await expect(authApi.me()).resolves.toEqual(session);

    expect(request).toHaveBeenNthCalledWith(1, "/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "patient@example.test", password: "secret" }),
    });
    expect(request).toHaveBeenNthCalledWith(2, "/auth/register", {
      method: "POST",
      body: JSON.stringify({
        displayName: "New Patient",
        email: "new.patient@example.test",
        phone: "+84919990001",
        password: "new-password",
      }),
    });
    expect(request).toHaveBeenNthCalledWith(3, "/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword: "secret", newPassword: "new-password" }),
    });
    expect(request).toHaveBeenNthCalledWith(4, "/auth/logout", { method: "POST" });
    expect(request).toHaveBeenNthCalledWith(5, "/auth/me");
  });
});
