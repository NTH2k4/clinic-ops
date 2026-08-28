#!/usr/bin/env node

const DEFAULT_SMOKE_EMAIL = "admin@careflow.local";
const DEFAULT_SMOKE_PASSWORD = "careflow-demo";
const DEFAULT_DATE = "2026-08-26";
const DEFAULT_DOCTOR_ID = "doctor-4";
const DEFAULT_SERVICE_ID = "service-general";

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

function normalizeBaseUrl(url) {
  return url.replace(/\/+$/, "");
}

async function requestJson(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
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

async function verifyList(baseUrl, path, token) {
  const result = await requestJson(baseUrl, path, {
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

async function main() {
  const baseUrl = normalizeBaseUrl(requiredEnv("RENDER_EXTERNAL_URL"));
  const expectedCommit = process.env.EXPECTED_RENDER_COMMIT?.trim();
  const email = process.env.CAREFLOW_SMOKE_EMAIL?.trim() || DEFAULT_SMOKE_EMAIL;
  const password = process.env.CAREFLOW_SMOKE_PASSWORD ?? DEFAULT_SMOKE_PASSWORD;

  const health = await requestJson(baseUrl, "/api/v1/health");
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

  const login = await requestJson(baseUrl, "/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const token = login.body?.data?.sessionToken;
  const role = login.body?.data?.currentUser?.role;
  assertSmoke(login.status === 201 && typeof token === "string" && role === "admin", "Admin login smoke failed.", {
    role,
    status: login.status,
  });

  const checks = [];
  checks.push(await verifyList(baseUrl, "/api/v1/services?pageSize=1", token));
  checks.push(await verifyList(baseUrl, "/api/v1/doctors?pageSize=1", token));
  checks.push(await verifyList(baseUrl, "/api/v1/specialties?pageSize=1", token));
  checks.push(
    await verifyList(
      baseUrl,
      `/api/v1/doctor-schedules?doctorId=${DEFAULT_DOCTOR_ID}&from=${DEFAULT_DATE}&to=${DEFAULT_DATE}&pageSize=5`,
      token,
    ),
  );

  const availabilityPath = `/api/v1/availability/slots?serviceId=${DEFAULT_SERVICE_ID}&date=${DEFAULT_DATE}&doctorId=${DEFAULT_DOCTOR_ID}&includeUnavailable=true&pageSize=5`;
  const availability = await requestJson(baseUrl, availabilityPath, {
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

  console.log(
    JSON.stringify(
      {
        ok: true,
        health: { commit, status: health.status },
        login: { role, status: login.status },
        checks,
      },
      null,
      2,
    ),
  );
}

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
