# Backend Architecture

## Document Control

| Field | Value |
| --- | --- |
| Status | Baseline |
| Primary audience | Human contributors, AI agents and subagents |
| Last updated | 2026-08-26 |
| Source of truth | `apps/api/src`, `apps/api/prisma/schema.prisma`, `docs/03-architecture/api-contract.md` |

## Purpose

This document describes the implemented backend architecture for CareFlow. It is an as-built reference for contributors who need to modify the API without rereading the whole implementation history.

## Runtime Stack

- Runtime: Node.js 22.
- Framework: NestJS 11.
- Database access: Prisma 6 with PostgreSQL.
- Validation: Zod schemas at controller boundaries.
- Test stack: Jest, Supertest and Prisma-backed E2E tests.
- API base path: `/api/v1`.

## Module Map

| Module | Path | Responsibility |
| --- | --- | --- |
| `AppModule` | `apps/api/src/app.module.ts` | Wires shared modules, domain modules and the global exception filter. |
| `PrismaModule` | `apps/api/src/prisma` | Provides one `PrismaService` for database access and lifecycle hooks. |
| `AuthModule` | `apps/api/src/auth` | Demo login, persisted bearer session lookup, logout revocation and `/auth/me`. |
| `CatalogModule` | `apps/api/src/catalog` | Doctors, specialties and services, including admin create/update/deactivate flows. |
| `PatientsModule` | `apps/api/src/patients` | Patient search, detail, create, update and deactivate flows. |
| `SchedulingModule` | `apps/api/src/scheduling` | Doctor schedule reads and availability slot calculation. |
| `AppointmentsModule` | `apps/api/src/appointments` | Appointment creation, listing, detail, reschedule and status transitions. |
| `AuditModule` | `apps/api/src/audit` | Admin-only audit event listing and detail. |
| `NotificationsModule` | `apps/api/src/notifications` | Current-user notification inbox and read state updates. |
| `HealthController` | `apps/api/src/health` | Health probe for local and CI checks. |

## Request Lifecycle

1. Nest receives the request under `/api/v1`.
2. `RequestLoggingMiddleware` accepts a valid inbound `x-request-id` or creates one, sets the response `x-request-id` header and stores the value in request context.
3. Controllers parse route params, query strings and bodies.
4. Protected controllers run `SessionGuard` to extract `Authorization: Bearer <token>` and load the persisted session from `AuthService`.
5. Role-restricted handlers run `RolesGuard` with metadata from the `@Roles(...)` decorator.
6. Controllers call `parseSchema(...)` with a Zod schema. Invalid payloads raise `VALIDATION_ERROR`.
7. Domain services execute Prisma reads/writes and throw `ApiError` for expected failures.
8. `ApiExceptionFilter` maps known errors into the shared error envelope and logs structured error metadata.
9. Controllers wrap successful responses with `successEnvelope(...)` or `listEnvelope(...)`, reusing the request context ID.

## API Envelope

Successful single-resource responses use:

```json
{
  "data": {},
  "meta": {
    "requestId": "uuid"
  }
}
```

Paginated list responses add `page`, `pageSize` and `total` to `meta`.

Errors use:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "fields": {}
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

The implementation deliberately keeps the envelope helper small in `apps/api/src/common/api-response.ts`, request ID context in `apps/api/src/common/request-context.ts` and error mapping centralized in `apps/api/src/common/api-exception.filter.ts`.

## Observability

`RequestLoggingMiddleware` logs a JSON payload through Nest `Logger` when each request finishes. The log includes `requestId`, HTTP method, query-free path, status code and duration in milliseconds.

`ApiExceptionFilter` logs structured error metadata with the same `requestId`. Client errors use warning logs without stack traces. Server errors use error logs with stack traces. API clients still receive the stable public error envelope and do not receive stack traces or internal exception details.

Operational troubleshooting steps live in `docs/03-architecture/backend-runbook.md`.

## Authentication And Authorization

The API uses stored password hashes and bearer sessions:

- `POST /auth/login` verifies the submitted password against `User.passwordHash` with bcrypt.
- Seeded demo users still use password `careflow-demo`.
- `AuthService` creates a random UUID session token and stores only its SHA-256 hash in PostgreSQL in `AuthSession`.
- Sessions expire after 12 hours and can be revoked.
- `SessionGuard` attaches `currentUser` and `linkedProfile` to the request.
- `POST /auth/logout` revokes the token by setting `revokedAt`.
- `GET /auth/me` returns the current user and linked profile.

This is sufficient for demo deployment and E2E verification, but it is not a complete production auth system. Production hardening should define account lockout, password reset and password rotation behavior.

Authorization uses two layers:

- Route-level role gates through `RolesGuard` and `@Roles(...)`.
- Domain-level ownership gates inside services for patient and doctor scoped reads/actions.

Patient-facing appointment responses omit `internalNote`, and patient status history omits staff notes. That projection rule is part of the privacy boundary and should not be removed without a product/security decision.

## Validation Boundary

The API validates input at the controller boundary with strict Zod schemas:

- Unknown fields are rejected by `.strict()`.
- `dateOnlySchema` accepts only `yyyy-MM-dd` and validates real calendar dates.
- `dateTimeSchema` accepts ISO 8601 datetimes with an explicit timezone.
- Pagination defaults to `page=1` and `pageSize=20`, capped at `100`.
- Appointment list filters require `from <= to` when both are provided.

Keep new validation in DTO files next to the module that owns the endpoint. Shared primitives belong in `apps/api/src/common/validation.ts`.

## Appointment Workflow

Appointments are the core transactional domain. The implemented status graph is:

| From | To | Allowed roles |
| --- | --- | --- |
| `requested` | `confirmed` | `receptionist`, `nurse`, `admin` |
| `requested` | `cancelled` | `patient`, `receptionist`, `nurse`, `admin` |
| `confirmed` | `checked_in` | `receptionist`, `nurse`, `admin` |
| `confirmed` | `cancelled` | `patient`, `receptionist`, `nurse`, `admin` |
| `confirmed` | `no_show` | `receptionist`, `nurse`, `admin` |
| `checked_in` | `in_progress` | `doctor` |
| `checked_in` | `cancelled` | `receptionist`, `nurse`, `admin` |
| `in_progress` | `completed` | `doctor` |

Terminal states are `completed`, `cancelled` and `no_show`. Terminal appointments cannot be rescheduled.

Creation rules:

- Patient-created appointments start as `requested`.
- Staff-created appointments start as `confirmed`.
- Patients may only create appointments for their own linked patient profile.
- Staff must provide `patientId`.

Transition rules:

- Patients may only cancel their own appointments.
- Doctors may only start or complete appointments linked to their doctor profile.
- Staff cancellation requires a `cancellationReason`.
- Every transition writes `AppointmentStatusHistory` and an `AuditEvent`.

## Conflict And Availability Model

`AppointmentConflictsService` owns slot validation. It checks:

- The service exists and is active.
- The selected doctor exists, is active and provides the service.
- If no doctor is supplied, the first active doctor who provides the service and is available is selected by deterministic `id` order.
- The slot stays within one local clinic day in `Asia/Ho_Chi_Minh`.
- Working schedules cover the full requested interval.
- `blocked` and `leave` schedules reject overlapping intervals.
- Active appointments reject overlapping intervals for the same doctor.

Active conflict statuses are `requested`, `confirmed`, `checked_in` and `in_progress`. Completed, cancelled and no-show appointments do not block future scheduling.

Appointment create and reschedule operations run inside Serializable Prisma transactions and retry Prisma `P2034` serialization conflicts up to three attempts.

## Audit And Notification Boundaries

Audit events are currently written for appointment lifecycle actions and admin-managed catalog/patient changes. The audit log is admin-only through `/audit-events`.

Notifications are modeled as persisted inbox rows. Users can list their own notifications, mark one notification as read, or mark all notifications as read. The MVP does not send email, SMS or push notifications.

## Endpoint Surface

| Resource | Endpoints |
| --- | --- |
| Health | `GET /health` |
| Auth | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| Catalog | `GET /doctors`, `GET /doctors/:id`, `POST /doctors`, `PATCH /doctors/:id`, `POST /doctors/:id/deactivate` |
| Catalog | `GET /specialties`, `POST /specialties`, `PATCH /specialties/:id`, `POST /specialties/:id/deactivate` |
| Catalog | `GET /services`, `GET /services/:id`, `POST /services`, `PATCH /services/:id`, `POST /services/:id/deactivate` |
| Patients | `GET /patients`, `GET /patients/:id`, `POST /patients`, `PATCH /patients/:id`, `POST /patients/:id/deactivate` |
| Scheduling | `GET /doctor-schedules`, `GET /availability/slots` |
| Appointments | `GET /appointments`, `GET /appointments/:id`, `POST /appointments`, `PATCH /appointments/:id` |
| Appointment actions | `POST /appointments/:id/confirm`, `POST /appointments/:id/cancel`, `POST /appointments/:id/check-in`, `POST /appointments/:id/start`, `POST /appointments/:id/complete`, `POST /appointments/:id/no-show` |
| Audit | `GET /audit-events`, `GET /audit-events/:id` |
| Notifications | `GET /notifications`, `POST /notifications/:id/read`, `POST /notifications/read-all` |

Detailed request and response shapes live in `docs/03-architecture/api-contract.md`.

## Testing Gates

Backend changes should run the smallest relevant test first, then the full API gate when touching shared behavior:

```bash
cd apps/api
npm run typecheck
npm run lint
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run build
```

For database-backed E2E tests, PostgreSQL must be running and `DATABASE_URL` must point at the local CareFlow database.

## Known MVP Limits

- Auth uses persisted bearer sessions and bcrypt password hashes, but demo users still share the seeded `careflow-demo` password.
- The demo password hash is hardcoded for seeded users and migration backfill.
- There is no OpenAPI machine-readable specification yet.
- CORS is configured through `CORS_ALLOWED_ORIGINS`; TLS is owned by the hosting provider.
- Notifications are in-app records only.
- Audit coverage is focused on MVP workflows, not every read/write.
- Database migrations exist, but the project does not yet define a production migration review policy.
