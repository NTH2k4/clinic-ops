# Backend Runbook

## Document Control

| Field | Value |
| --- | --- |
| Status | Baseline |
| Primary audience | Operators, senior engineers and AI agents |
| Last updated | 2026-08-28 |
| Source of truth | `apps/api`, Render service logs, PostgreSQL provider logs |

## Purpose

This runbook covers the first operational checks for the CareFlow backend after local or Render deployment.

## Request Correlation

Every API response includes `meta.requestId` and the `x-request-id` response header. If a client sends `x-request-id`, the API reuses it when the value is non-empty and at most 128 characters.

Use the request ID from a failed response to search backend logs. Logged paths omit query strings to avoid recording search/filter values. Request completion logs include a JSON payload like:

```json
{"requestId":"request-1","method":"GET","path":"/api/v1/health","statusCode":200,"durationMs":12}
```

Error logs include:

```json
{"requestId":"request-1","method":"GET","path":"/api/v1/auth/me","statusCode":401,"code":"UNAUTHENTICATED"}
```

Client errors are logged without stack traces. Server errors include stack traces in server logs only.

Appointment workflow logs include:

```json
{"event":"appointment_workflow","requestId":"request-1","action":"appointment_created","appointmentId":"appointment-1","actorUserId":"user-patient-1","metadata":{"status":"requested"}}
```

Use these logs with audit events when diagnosing booking, reschedule or status transition issues. Audit events are the durable business record; logs are the operational correlation trail.

## Database Down

Symptom:

- API requests that need Prisma return `500 INTERNAL_ERROR`.
- Render logs show Prisma connection or timeout errors.

Checks:

```bash
DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npx prisma migrate status
```

Expected local output: Prisma can connect and reports the migration state. If this fails, verify PostgreSQL is running and `DATABASE_URL` points to the intended database.

## Migration Failed

Symptom:

- Render build fails during `npx prisma migrate deploy`.
- API starts but logs show missing table or column errors.

Checks:

```bash
cd apps/api
DATABASE_URL=<target-database-url> npx prisma migrate status
DATABASE_URL=<target-database-url> npx prisma migrate deploy
```

Expected output: all checked-in migrations are applied. Do not edit an already deployed migration; add a new migration for follow-up schema changes.

## Seed Guard Failure

Symptom:

- `npm run prisma:seed` refuses to run against a non-local database.

Checks:

```bash
cd apps/api
DATABASE_URL=<target-database-url> npm run prisma:seed
```

Expected behavior: non-local databases require `ALLOW_DATABASE_SEED=true`. Use that override only for intentional demo seeding.

## Hosted Demo Baseline Repair

Symptom:

- Render health and login pass, but catalog or scheduling smoke returns empty collections.
- `/api/v1/availability/slots?serviceId=service-general...` returns `404 service was not found`.

Expected hosted behavior:

- When `SERVE_WEB_APP=true`, startup repair creates missing demo auth users plus baseline demo specialties, services, staff, doctors and doctor schedules.
- The repair is idempotent and duplicate-safe; it does not reset, delete or overwrite registered user/patient data.
- Do not run the full Prisma seed against Render to fix this case unless intentionally resetting demo data. `prisma/seed.ts` is destructive by design and is guarded for non-local databases.

Checks:

```bash
curl "$RENDER_EXTERNAL_URL/api/v1/services?pageSize=1"
curl "$RENDER_EXTERNAL_URL/api/v1/doctors?pageSize=1"
curl "$RENDER_EXTERNAL_URL/api/v1/doctor-schedules?doctorId=doctor-4&from=2026-08-26&to=2026-08-26&pageSize=5"
```

Expected output: services/doctors/schedules return non-empty data after the deployed app has restarted on a commit containing hosted demo baseline repair.

## Auth Failures

Symptoms:

- Login returns `401 UNAUTHENTICATED`.
- Authenticated requests return `401 UNAUTHENTICATED`.

Checks:

```bash
curl -X POST "$RENDER_EXTERNAL_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -H "x-request-id: auth-smoke-1" \
  -d '{"email":"admin@careflow.local","password":"careflow-demo"}'
```

Expected output: success envelope with `sessionToken`. If login succeeds but later requests fail, verify the bearer token is sent as `Authorization: Bearer <sessionToken>`, the session is not expired, and `revokedAt` is still null.
