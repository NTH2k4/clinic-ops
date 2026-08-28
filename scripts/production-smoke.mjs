#!/usr/bin/env node

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_SMOKE_EMAIL = "admin@careflow.local";
const DEFAULT_SMOKE_PASSWORD = "careflow-demo";
const DEFAULT_DATE = "2026-08-26";
const DEFAULT_DOCTOR_ID = "doctor-4";
const DEFAULT_SERVICE_ID = "service-general";

function normalizeBaseUrl(url) {
  return url.replace(/\/+$/, "");
}

async function requestJson(fetchImpl, baseUrl, path, options = {}) {
  const response = await fetchImpl(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { rawBody: text };
    }
  }

  return { body, status: response.status };
}

function totalOf(body) {
  if (typeof body?.meta?.pagination?.total === "number") {
    return body.meta.pagination.total;
  }
  if (typeof body?.meta?.total === "number") {
    return body.meta.total;
  }
  if (Array.isArray(body?.data)) {
    return body.data.length;
  }
  return 0;
}

function assertSmoke(condition, message, detail) {
  if (!condition) {
    const error = new Error(message);
    error.detail = detail;
    throw error;
  }
}

async function verifyList(fetchImpl, baseUrl, path, token) {
  const result = await requestJson(fetchImpl, baseUrl, path, {
    headers: { authorization: `Bearer ${token}` },
  });
  const total = totalOf(result.body);
  assertSmoke(result.status === 200 && total >= 1, "List smoke failed.", {
    path,
    status: result.status,
    total,
  });
  return { path, status: result.status, total };
}

export async function runProductionSmoke({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  assertSmoke(typeof fetchImpl === "function", "fetch is not available in this Node.js runtime.");

  const baseUrl = normalizeBaseUrl(requiredEnv("RENDER_EXTERNAL_URL", env));
  const expectedCommit = env.EXPECTED_RENDER_COMMIT?.trim();
  const email = env.CAREFLOW_SMOKE_EMAIL?.trim() || DEFAULT_SMOKE_EMAIL;
  const password = env.CAREFLOW_SMOKE_PASSWORD ?? DEFAULT_SMOKE_PASSWORD;
  let token;
  let smokeError;

  try {
    const health = await requestJson(fetchImpl, baseUrl, "/api/v1/health");
    const commit = health.body?.data?.commit;
    assertSmoke(health.status === 200 && typeof commit === "string" && commit.length > 0, "Health smoke failed.", {
      status: health.status,
    });
    if (expectedCommit) {
      assertSmoke(commit === expectedCommit, "Health commit did not match EXPECTED_RENDER_COMMIT.", {
        actualCommit: commit,
        expectedCommit,
      });
    }

    const login = await requestJson(fetchImpl, baseUrl, "/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    token = login.body?.data?.sessionToken;
    const role = login.body?.data?.currentUser?.role;
    assertSmoke(login.status === 201 && typeof token === "string" && role === "admin", "Admin login smoke failed.", {
      role,
      status: login.status,
    });

    const checks = [];
    checks.push(await verifyList(fetchImpl, baseUrl, "/api/v1/services?pageSize=1", token));
    checks.push(await verifyList(fetchImpl, baseUrl, "/api/v1/doctors?pageSize=1", token));
    checks.push(await verifyList(fetchImpl, baseUrl, "/api/v1/specialties?pageSize=1", token));
    checks.push(
      await verifyList(
        fetchImpl,
        baseUrl,
        `/api/v1/doctor-schedules?doctorId=${DEFAULT_DOCTOR_ID}&from=${DEFAULT_DATE}&to=${DEFAULT_DATE}&pageSize=5`,
        token,
      ),
    );

    const availabilityPath = `/api/v1/availability/slots?serviceId=${DEFAULT_SERVICE_ID}&date=${DEFAULT_DATE}&doctorId=${DEFAULT_DOCTOR_ID}&includeUnavailable=true&pageSize=5`;
    const availability = await requestJson(fetchImpl, baseUrl, availabilityPath, {
      headers: { authorization: `Bearer ${token}` },
    });
    const slots = Array.isArray(availability.body?.data) ? availability.body.data : [];
    assertSmoke(
      availability.status === 200 && slots.length >= 1 && typeof slots[0]?.availabilityStatus === "string",
      "Availability smoke failed.",
      { path: availabilityPath, status: availability.status, slots: slots.length },
    );
    checks.push({
      firstStatus: slots[0].availabilityStatus,
      path: availabilityPath,
      slots: slots.length,
      status: availability.status,
    });

    return {
      ok: true,
      health: { commit, status: health.status },
      login: { role, status: login.status },
      checks,
    };
  } catch (error) {
    smokeError = error;
    throw error;
  } finally {
    if (token) {
      try {
        const logout = await requestJson(fetchImpl, baseUrl, "/api/v1/auth/logout", {
          method: "POST",
          headers: { authorization: `Bearer ${token}` },
        });
        assertSmoke(logout.status >= 200 && logout.status < 300, "Logout cleanup failed.", {
          status: logout.status,
        });
      } catch (error) {
        if (!smokeError) {
          throw error;
        }
      }
    }
  }
}

function requiredEnv(name, env) {
  const value = env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

async function main() {
  const evidence = await runProductionSmoke();
  console.log(JSON.stringify(evidence, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(
      JSON.stringify(
        {
          ok: false,
          error: error.message,
          detail: error.detail,
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
  });
}
