# Scheduling Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` for implementation. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn thiện Phase 3 để admin/operations staff quản lý doctor schedules, blocked/leave intervals và hiểu vì sao slot không khả dụng khi tạo appointment.

**Architecture:** Backend scheduling module tiếp tục là source of truth cho doctor schedule CRUD, appointment conflict checks và availability. Frontend thêm một scheduling API/service boundary riêng thay vì nhét logic vào operations screens; mock mode giữ fixture-driven behavior cho local regression, API mode đọc backend. Availability explanation được bổ sung backward-compatible bằng query `includeUnavailable=true` khi có `doctorId`, nên các client cũ vẫn chỉ nhận available slots.

**Tech Stack:** NestJS, Prisma, PostgreSQL, Zod, React, Vite, TypeScript, TanStack Query, Playwright, GitHub Actions, Render Free Web Service.

**Spec:** `docs/04-planning/careflow-v1-delivery-roadmap.md`, `docs/04-planning/careflow-v1-subagent-execution-plan.md`, `docs/02-product/workflows.md`, `docs/03-architecture/api-contract.md`, `docs/03-architecture/openapi.json`.

## Implementation Status

Status as of 2026-08-28: plan created before Phase 3 code. Branch/worktree: `scheduling-operations`. Baseline typecheck passed for API and Web after worktree dependency install.

Completed before implementation:

- Phase 2 Account Administration deployed complete on Render at `a52072e1`, including runtime merge `32464b3d`.
- Phase 2 deployment evidence committed on `main` at `951e21fd`.
- Phase 3 scope confirmed from roadmap and existing code: backend schedule CRUD exists; frontend management/explanation UI is missing.

## Global Constraints

- Do not add multi-branch scheduling.
- Do not add a recurrence-rule engine beyond single-clinic demo needs.
- Do not add per-clinic timezone customization; use existing `Asia/Ho_Chi_Minh` scheduling convention.
- Do not duplicate conflict-authority between frontend and backend in API mode; backend explains unavailable slots.
- Keep `/availability/slots` backward compatible for existing patient and staff booking flows.
- Keep public patient booking deterministic and conflict-safe after schedule changes.
- Do not log session tokens, temporary passwords or real patient data in tests/docs.
- Update `docs/04-planning/mvp-release-readiness.md` and this plan whenever task status, branch, verification or deployment status changes.

---

## File Structure

- `apps/api/src/scheduling/scheduling.dto.ts`: add optional `includeUnavailable` query parsing and exported availability reason types if needed.
- `apps/api/src/scheduling/scheduling.service.ts`: return available-only slots by default; when `includeUnavailable=true` and `doctorId` is present, include unavailable slot records with backend-derived reason codes.
- `apps/api/src/scheduling/scheduling.controller.ts`: keep existing route; no new route unless `includeUnavailable` cannot stay readable.
- `apps/api/test/scheduling.e2e-spec.ts`: cover availability explanation for blocked, leave and appointment-conflict slots.
- `apps/api/src/openapi-contract.spec.ts`: assert updated OpenAPI contract for optional availability explanation.
- `docs/03-architecture/api-contract.md`: document the backward-compatible availability explanation query and response.
- `docs/03-architecture/openapi.json`: update machine-readable contract.
- `apps/web/src/lib/api/scheduling.ts`: create typed API client for doctor schedules and availability explanation.
- `apps/web/src/features/scheduling/schedulingService.ts`: create mock/API service boundary for schedule CRUD and availability explanation.
- `apps/web/src/features/admin/AdminSchedules.tsx`: admin schedule management screen.
- `apps/web/src/features/operations/CreateAppointmentPage.tsx`: use backend availability slots in API mode and render explanation for unavailable choices.
- `apps/web/src/app/routes.tsx`: add `/app/admin/schedules`.
- `apps/web/src/components/StatusBadge.tsx`: add schedule type/status presentation only if existing badge cannot cover it cleanly.
- `apps/web/src/features/operations/operations.test.tsx`: extend unit coverage for unavailable explanation and staff booking.
- `apps/web/e2e/api-careflow.spec.ts`: add API-mode schedule-management-to-booking regression.
- `docs/02-product/workflows.md`: add schedule management and availability explanation workflows.
- `docs/00-project/documentation-map.md`: link this plan.
- `docs/05-history/changelog.md`, `docs/05-history/release-notes.md`, `docs/06-testing/acceptance-checklist.md`: record implementation and verification evidence as tasks complete.

## Task 1: Availability Explanation Contract

**Files:**
- Modify: `apps/api/src/scheduling/scheduling.dto.ts`
- Modify: `apps/api/src/scheduling/scheduling.service.ts`
- Modify: `apps/api/test/scheduling.e2e-spec.ts`
- Modify: `docs/03-architecture/api-contract.md`
- Modify: `docs/03-architecture/openapi.json`
- Modify: `apps/api/src/openapi-contract.spec.ts`

**Interfaces:**
- Consumes: existing `GET /api/v1/availability/slots?serviceId=&date=&doctorId=`.
- Produces: optional query `includeUnavailable=true`; response item shape remains available-slot compatible and may include `availabilityStatus`, `reasonCode`, `reasonLabel` for explanation mode.

- [ ] **Step 1: Write failing API E2E for blocked explanation**

Add a test that creates an admin session, creates a blocked schedule for `doctor-1` on `2026-08-25`, then requests:

```text
GET /api/v1/availability/slots?serviceId=service-general&date=2026-08-25&doctorId=doctor-1&pageSize=50&includeUnavailable=true
```

Expected RED: response currently excludes unavailable slots and does not expose `reasonCode`.

- [ ] **Step 2: Write failing API E2E for appointment conflict explanation**

Seed or create an active appointment for `doctor-1` and assert the matching explained slot has:

```json
{
  "availabilityStatus": "unavailable",
  "reasonCode": "appointment_conflict"
}
```

- [ ] **Step 3: Implement backward-compatible DTO parsing**

Add `includeUnavailable: z.coerce.boolean().optional()` to `availabilityQuerySchema`. Reject explanation mode without `doctorId` with `400 VALIDATION_ERROR` so any-doctor mode does not invent ambiguous reasons.

- [ ] **Step 4: Implement backend explanation mode**

Keep default behavior unchanged. For explanation mode:

- Build a deterministic 30-minute grid from the selected doctor's active working schedules for the date.
- Mark slots inside active `blocked` schedules as `blocked`.
- Mark slots inside active `leave` schedules as `leave`.
- Mark slots overlapping active appointments as `appointment_conflict`.
- Mark remaining available slots as `available`.
- Return stable labels in Vietnamese: `Còn trống`, `Bác sĩ bị chặn lịch`, `Bác sĩ nghỉ phép`, `Bác sĩ đã có lịch hẹn`.

- [ ] **Step 5: Update OpenAPI and contract docs**

Document `includeUnavailable`, `availabilityStatus`, `reasonCode` and `reasonLabel`. Existing available-only examples must remain valid.

- [ ] **Step 6: Verify Task 1**

Run:

```bash
cd apps/api
DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run test:e2e -- --runInBand scheduling.e2e-spec.ts
npm test -- --runInBand src/openapi-contract.spec.ts
npm run typecheck
npm run lint
```

Expected: targeted E2E and contract tests pass.

## Task 2: Web Scheduling Service Boundary

**Files:**
- Create: `apps/web/src/lib/api/scheduling.ts`
- Create: `apps/web/src/features/scheduling/schedulingService.ts`
- Test: `apps/web/src/features/operations/operations.test.tsx`

**Interfaces:**
- Consumes: API endpoint shapes from Task 1.
- Produces: `schedulingQueryOptions.schedules(filters)`, `schedulingQueryOptions.availability(filters)`, `schedulingService.createSchedule(input)`, `updateSchedule(id, input)`, `deactivateSchedule(id)`.

- [ ] **Step 1: Write failing unit test for API-mode availability explanation**

In `operations.test.tsx`, mock the scheduling service or API fetcher and assert unavailable slots render their `reasonLabel` when API mode provides them.

- [ ] **Step 2: Implement typed API client**

Create `apps/web/src/lib/api/scheduling.ts` with typed request/response models for schedule list, create, update, deactivate and availability explanation.

- [ ] **Step 3: Implement service boundary**

Create `apps/web/src/features/scheduling/schedulingService.ts` that supports both mock and API modes. Mock mode may derive availability from existing `mockStore.doctorSchedules` and `mockStore.appointments`; API mode must call backend.

- [ ] **Step 4: Verify Task 2**

Run:

```bash
cd apps/web
npm test -- --run operations.test.tsx
npm run typecheck
npm run lint
```

Expected: operations unit tests and static checks pass.

## Task 3: Admin Schedule Management UI

**Files:**
- Create: `apps/web/src/features/admin/AdminSchedules.tsx`
- Modify: `apps/web/src/app/routes.tsx`
- Modify: `apps/web/src/components/navigation.ts`
- Test: `apps/web/src/features/admin/admin.test.tsx` or nearest existing admin test file

**Interfaces:**
- Consumes: `schedulingQueryOptions.schedules`, `schedulingService.createSchedule`, `updateSchedule`, `deactivateSchedule`.
- Produces: route `/app/admin/schedules`.

- [ ] **Step 1: Write failing UI test**

Assert admin can open schedule management, filter by doctor/date range, create a blocked interval, and see it in the list.

- [ ] **Step 2: Build schedule list and filters**

Use existing form/table/card conventions. Include doctor, type, status, day of week, start/end time, effective range and actions.

- [ ] **Step 3: Build create/update/deactivate controls**

Use controlled form inputs, `ClinicDateField`, select menus for doctor/day/type, and icon buttons where existing UI patterns support them. Show API errors with existing alert styling.

- [ ] **Step 4: Verify Task 3**

Run:

```bash
cd apps/web
npm test -- --run admin
npm run typecheck
npm run lint
```

Expected: targeted admin tests and static checks pass.

## Task 4: Operations Availability Explanation UI

**Files:**
- Modify: `apps/web/src/features/operations/CreateAppointmentPage.tsx`
- Modify: `apps/web/src/features/operations/operations.test.tsx`

**Interfaces:**
- Consumes: `schedulingQueryOptions.availability({ serviceId, doctorId, date, includeUnavailable: true })`.
- Produces: staff booking time selection with available/unavailable explanation in API mode.

- [ ] **Step 1: Write failing operations test**

Assert that when service, doctor and date are selected, unavailable time options are visible but disabled with a readable reason.

- [ ] **Step 2: Replace fixed API-mode time list**

In API mode, use backend availability explanation. Keep mock mode behavior stable for existing tests.

- [ ] **Step 3: Preserve booking behavior**

Only enabled available slots can submit. Submit continues to call `appointmentService.createStaffAppointment`; backend remains final conflict authority.

- [ ] **Step 4: Verify Task 4**

Run:

```bash
cd apps/web
npm test -- --run operations.test.tsx
npm run typecheck
npm run lint
```

Expected: operations tests and static checks pass.

## Task 5: API-Mode Browser Regression

**Files:**
- Modify: `apps/web/e2e/api-careflow.spec.ts`
- Modify: `docs/06-testing/acceptance-checklist.md`

**Interfaces:**
- Consumes: completed Task 1-4 behavior.
- Produces: browser-level proof that schedule management affects booking availability.

- [ ] **Step 1: Write failing Playwright API-mode test**

Login as admin, create a blocked interval for `doctor-1`, navigate to operations create appointment, select matching service/doctor/date, and assert the blocked time is disabled with its reason.

- [ ] **Step 2: Run RED**

Run:

```bash
cd apps/web
DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run e2e:api
```

Expected: fail before UI/API implementation.

- [ ] **Step 3: Run GREEN after implementation**

Run the same command after Tasks 1-4 are complete.

Expected: API-mode Playwright passes.

## Task 6: Documentation And Release Evidence

**Files:**
- Modify: `docs/04-planning/scheduling-operations-plan.md`
- Modify: `docs/04-planning/mvp-release-readiness.md`
- Modify: `docs/04-planning/careflow-v1-delivery-roadmap.md`
- Modify: `docs/05-history/changelog.md`
- Modify: `docs/05-history/release-notes.md`
- Modify: `docs/06-testing/acceptance-checklist.md`

**Interfaces:**
- Consumes: verification outputs from Tasks 1-5.
- Produces: updated project evidence and next-step status.

- [ ] **Step 1: Record implementation status**

Update this plan after each completed task with commit SHA, verification commands and any deferred constraints.

- [ ] **Step 2: Run final local verification**

Run:

```bash
cd apps/api
npm run typecheck
npm run lint
npm test -- --runInBand
DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run test:e2e -- --runInBand
npm run build
npm audit --audit-level=high

cd ../web
npm test -- --run
npm run typecheck
npm run lint
npm run build
npm run e2e
DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run e2e:api
```

- [ ] **Step 3: Record docs evidence**

Update readiness, roadmap, release notes, changelog and acceptance checklist with exact command results and known constraints.

- [ ] **Step 4: Prepare merge/deploy gate**

Do not push or deploy without explicit user approval. After approval, merge to `main`, push, wait for GitHub Actions/Render, run production smoke, and update docs again.

## Self-Review

- Spec coverage: roadmap Phase 3 goals are covered by Tasks 1, 3, 4 and 5; docs requirements are covered by Task 6.
- Placeholder scan: no unresolved marker or blank task step is intentionally left in this plan.
- Type consistency: plan uses one scheduling service boundary and one backward-compatible availability query shape across API, Web and tests.
- Scope ruling: API extension is limited to availability explanation because existing schedule CRUD already exists; no recurrence engine or multi-branch scheduling is included.
