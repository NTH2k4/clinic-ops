# CareFlow Backend Final Review Fixes Report

## Scope

- Worktree: `/home/codexproxy/Codex-ttshieu/clinic-ops/.worktrees/backend-final-review-fixes`
- Branch: `backend-final-review-fixes`
- Base: `27dccdbf911661cd93f7e593c4cf3b75bd4b1cfa`
- API base path remains `/api/v1`.
- No web files, schema migrations, notification providers, or out-of-scope product domains were changed.

## Findings Addressed

1. **Concurrent appointment transitions**
   - `appointments.service.ts` now executes status transitions through the existing serializable transaction/retry helper.
   - `appointments.e2e-spec.ts` races `confirmed -> checked_in` and `confirmed -> no_show` while a test-only PostgreSQL trigger holds both updates after their initial read. Exactly one transition commits and history contains one consistent edge.
   - Mutation verification restored default isolation temporarily and reproduced two successful contradictory writes; restoring serializable isolation returned one success and one conflict.

2. **Patient PATCH authorization and field ownership**
   - `patients.controller.ts` now applies `RolesGuard` with patient, receptionist, nurse, and admin roles only, while retaining patient ownership checks.
   - `patients.dto.ts` uses strict create/update allowlists. Lifecycle `status`, identifiers, timestamps, and other backend-controlled fields are rejected.
   - E2E coverage proves doctors receive `FORBIDDEN` and patient attempts to change `status` receive `VALIDATION_ERROR` without changing persisted status.

3. **Catalog lifecycle invariant bypass**
   - Generic doctor, specialty, and service PATCH operations reject direct `inactive` transitions and direct callers to dedicated deactivate endpoints.
   - Service deactivation now rejects active appointment dependencies, matching doctor/specialty invariant handling.
   - E2E coverage exercises all three generic PATCH bypass attempts.

4. **Appointment create authorization and patient lifecycle**
   - Strict actor-specific create schemas prevent patient actors from setting `internalNote` and prevent unknown fields.
   - Patient ownership remains derived from the linked profile; a supplied patient ID must match that profile.
   - Appointment creation now requires an active patient and emits `PATIENT_INACTIVE` for inactive/locked profiles.
   - `source` is validated and included in `appointment_created` audit metadata.

5. **Integration-critical read endpoints**
   - Added role-scoped, filtered `GET /appointments` and authorized `GET /appointments/:id`.
   - Added filtered `GET /doctor-schedules`.
   - Added deterministic `GET /availability/slots`, deriving 30-minute candidate starts from active persisted schedules and validating every returned slot through `AppointmentConflictsService`.
   - Added `GET /audit-events/:id` and audit filters for `entityId`, `actorUserId`, `from`, and `to` in addition to existing filters.
   - E2E coverage validates patient/doctor appointment scope, unauthorized detail, schedule filters, deterministic availability, audit filters, and audit detail.

6. **Bounded pagination and list envelopes**
   - Added `listEnvelope`, bounded `page`/`pageSize` parsing (default 1/20, maximum 100), and Prisma `skip`/`take` helpers.
   - Applied pagination metadata and count queries to appointments, doctor schedules, availability, doctors, specialties, services, patients, audit events, and notifications.
   - E2E coverage verifies catalog, appointments, schedules, availability, audit, and notification metadata and bounds.

7. **Strict validation and exception envelopes**
   - Added reusable strict date-only (`yyyy-MM-dd`), ISO datetime-with-timezone, pagination, and Zod-to-`ApiError` helpers.
   - Patient and appointment bodies and touched list queries now reject unknown or malformed values.
   - `ApiExceptionFilter` is now catch-all and maps `ApiError`, Nest HTTP exceptions, Prisma uniqueness/foreign-key/not-found errors, and unexpected failures into the contract envelope.
   - E2E coverage proves date-only enforcement, rejection of timezone-less/non-ISO datetimes, and Prisma `P2002` mapping to `RESOURCE_IN_USE`.

8. **Transition error code**
   - Replaced `INVALID_APPOINTMENT_TRANSITION` with contract-defined `INVALID_STATUS_TRANSITION` for transition and terminal-reschedule errors.

9. **Internal-note-only PATCH**
   - Note-only updates skip slot validation and emit `appointment_updated` with changed-field metadata instead of `appointment_rescheduled`.
   - E2E coverage verifies the note update and audit action.

10. **Appointment source**
    - Create DTOs accept only `patient_portal`, `staff_portal`, or `operations` and persist a supplied source in creation audit metadata.
    - E2E coverage verifies `patient_portal` metadata.

## TDD RED/GREEN Evidence

### Initial RED

- `appointments.e2e-spec.ts`: 7 failed, 10 passed. Failures exposed patient internal notes, inactive-patient booking, ignored source, concurrent writes, missing list/detail, old transition code, and incorrect note-only audit behavior.
- `catalog.e2e-spec.ts`: 7 failed, 3 passed. Failures exposed missing pagination, lifecycle PATCH bypass, doctor patient mutation, loose date parsing, and raw Prisma 500 responses.
- `audit-notifications.e2e-spec.ts`: 4 failed, 3 passed. Failures exposed missing list metadata, filters/detail, and notification pagination.
- `scheduling.e2e-spec.ts`: 3 failed, 0 passed. Both routes were absent and returned 404.

### Concurrency Mutation RED/GREEN

- With transition temporarily changed back to default isolation, the deterministic race failed: received `[201, 201]`, expected `[201, 409]`.
- After restoring serializable retry, the same test passed with one committed transition and one 409.

### Strict Datetime RED/GREEN

- Added `2026-08-25 09:00:00Z`; before tightening the schema it created an appointment with 201.
- After enforcing the ISO `T` form plus timezone and calendar validity, the focused test passed.

### Final GREEN

- Focused implementation run reached 36/37 before the concurrency scenario was corrected from a sequentially valid status chain; the corrected deterministic test then passed independently.
- Final full e2e verification passed 50/50 tests across 8 suites.

## Verification

Run from `apps/api` unless stated otherwise:

| Command | Result |
| --- | --- |
| `npm run typecheck` | PASS, exit 0 |
| `npm run lint` | PASS, exit 0 |
| `DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm test -- --runInBand` | PASS, 3 suites / 17 tests |
| `DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npx prisma migrate deploy` | PASS, 1 migration found, no pending migrations |
| `DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run prisma:seed` | PASS, exit 0 |
| `DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run test:e2e -- --runInBand` | PASS, 8 suites / 50 tests |
| `npm run build` | PASS, exit 0 |
| `npm audit --audit-level=high` | PASS, 0 vulnerabilities |
| `git diff --check` (worktree root) | PASS, exit 0 |

## Files Changed

- Application/module: `apps/api/src/app.module.ts`
- Common: `apps/api/src/common/api-exception.filter.ts`, `api-response.ts`, `validation.ts`
- Appointments: `appointments.controller.ts`, `appointments.dto.ts`, `appointments.module.ts`, `appointments.service.ts`
- Patients: `patients.controller.ts`, `patients.dto.ts`, `patients.service.ts`
- Catalog: `catalog.dto.ts`, `catalog.service.ts`, `doctors.controller.ts`, `services.controller.ts`, `specialties.controller.ts`
- Scheduling: `scheduling.controller.ts`, `scheduling.dto.ts`, `scheduling.module.ts`, `scheduling.service.ts`
- Audit: `audit.controller.ts`, `audit.dto.ts`, `audit.service.ts`
- Notifications: `notifications.controller.ts`, `notifications.service.ts`
- Tests: `appointments.e2e-spec.ts`, `catalog.e2e-spec.ts`, `audit-notifications.e2e-spec.ts`, `scheduling.e2e-spec.ts`
- Report: `.superpowers/final-review-fixes-report.md`

## Deliberate Deferrals And Concerns

- Doctor schedule create/update/deactivate endpoints remain deferred. This fix implements only the requested Phase 4-critical schedule list and availability reads.
- Availability uses a deterministic 30-minute slot cadence and the existing clinic timezone assumptions (`Asia/Ho_Chi_Minh`, UTC+07:00). A future product requirement for a different cadence should make it explicit in the contract.
- No concurrent reschedule race test was added; reschedule already used the serializable retry helper before this work. The new deterministic concurrency coverage targets the reported transition defect.
