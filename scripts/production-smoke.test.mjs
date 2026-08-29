import assert from "node:assert/strict";
import test from "node:test";
import { runProductionSmoke } from "./production-smoke.mjs";

test("logs out after login when a later smoke check fails", async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ options, url: String(url) });
    const { pathname } = new URL(url);

    if (pathname === "/api/v1/health") {
      return jsonResponse(200, { data: { commit: "commit-1" } });
    }
    if (pathname === "/api/v1/auth/login") {
      return jsonResponse(201, {
        data: {
          currentUser: { role: "admin" },
          sessionToken: "secret-session-token",
        },
      });
    }
    if (pathname === "/api/v1/auth/logout") {
      return jsonResponse(201, { data: { ok: true } });
    }
    if (pathname === "/api/v1/services") {
      return jsonResponse(500, { error: { code: "INTERNAL_ERROR" } });
    }

    return jsonResponse(200, { data: [], meta: { pagination: { total: 1 } } });
  };

  await assert.rejects(
    () =>
      runProductionSmoke({
        env: { RENDER_EXTERNAL_URL: "https://example.test" },
        fetchImpl,
      }),
    /List smoke failed/,
  );

  const logoutCall = calls.find(({ url }) => url === "https://example.test/api/v1/auth/logout");
  assert.equal(logoutCall?.options.method, "POST");
  assert.equal(logoutCall?.options.headers.authorization, "Bearer secret-session-token");
});

test("logs out after successful smoke without returning the session token", async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ options, url: String(url) });
    const { pathname } = new URL(url);

    if (pathname === "/api/v1/health") {
      return jsonResponse(200, { data: { commit: "commit-1" } });
    }
    if (pathname === "/api/v1/auth/login") {
      return jsonResponse(201, {
        data: {
          currentUser: { role: "admin" },
          sessionToken: "secret-session-token",
        },
      });
    }
    if (pathname === "/api/v1/auth/logout") {
      return jsonResponse(201, { data: { ok: true } });
    }
    if (pathname === "/api/v1/availability/slots") {
      return jsonResponse(200, { data: [{ availabilityStatus: "available" }] });
    }
    if (pathname === "/api/v1/services") {
      return jsonResponse(200, {
        data: [{ id: "service-general", name: "Khám tổng quát" }],
        meta: { pagination: { total: 8 } },
      });
    }

    return jsonResponse(200, { data: [], meta: { pagination: { total: 1 } } });
  };

  const evidence = await runProductionSmoke({
    env: { RENDER_EXTERNAL_URL: "https://example.test" },
    fetchImpl,
  });

  const logoutCall = calls.find(({ url }) => url === "https://example.test/api/v1/auth/logout");
  assert.equal(logoutCall?.options.method, "POST");
  assert.equal(logoutCall?.options.headers.authorization, "Bearer secret-session-token");
  assert.equal(JSON.stringify(evidence).includes("secret-session-token"), false);
});

test("fails when the hosted demo service catalog still uses English labels", async () => {
  const fetchImpl = async (url) => {
    const { pathname } = new URL(url);

    if (pathname === "/api/v1/health") {
      return jsonResponse(200, { data: { commit: "commit-1" } });
    }
    if (pathname === "/api/v1/auth/login") {
      return jsonResponse(201, {
        data: {
          currentUser: { role: "admin" },
          sessionToken: "secret-session-token",
        },
      });
    }
    if (pathname === "/api/v1/auth/logout") {
      return jsonResponse(201, { data: { ok: true } });
    }
    if (pathname === "/api/v1/services") {
      return jsonResponse(200, {
        data: [{ id: "service-general", name: "General Consultation" }],
        meta: { pagination: { total: 8 } },
      });
    }
    if (pathname === "/api/v1/availability/slots") {
      return jsonResponse(200, { data: [{ availabilityStatus: "available" }] });
    }

    return jsonResponse(200, { data: [], meta: { pagination: { total: 1 } } });
  };

  await assert.rejects(
    () =>
      runProductionSmoke({
        env: { RENDER_EXTERNAL_URL: "https://example.test" },
        fetchImpl,
      }),
    /Service catalog localization smoke failed/,
  );
});

function jsonResponse(status, body) {
  return {
    status,
    async text() {
      return JSON.stringify(body);
    },
  };
}
