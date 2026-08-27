# Authorization Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Harden role and ownership authorization for the CareFlow API and align the docs with the implemented backend surface.

**Architecture:** Keep `SessionGuard` as the authentication boundary and `RolesGuard` as the route-level role boundary. Move `RolesGuard` to controller class level where role metadata is used, so future `@Roles(...)` methods cannot accidentally omit the guard. Keep ownership checks close to domain logic for patient/doctor scoped reads and actions.

**Tech Stack:** NestJS 11, Prisma 6, PostgreSQL, Jest/Supertest E2E tests, Zod DTO validation, checked-in OpenAPI JSON.

**Spec:** `docs/03-architecture/api-contract.md`, `docs/03-architecture/backend-architecture.md`, `docs/04-planning/backend-next-steps.md`.

## Global Constraints

- Do not redesign authentication; persisted bearer sessions, bcrypt password hashes, expiry and logout revocation already exist.
- Do not implement `/users` admin management in this slice; document it as planned and not implemented.
- Preserve API envelope and error codes: `UNAUTHENTICATED`, `FORBIDDEN`, `VALIDATION_ERROR`, `NOT_FOUND`.
- Write failing tests before production code changes.
- Keep source changes scoped to authorization guard wiring, focused E2E coverage and docs drift cleanup.

## Execution Status

Implemented on branch `authorization-hardening`.

Verification completed:

- `npm run prisma:generate`
- `npm run typecheck`
- `npm run lint`
- `npm test -- --runInBand` (`37/37`)
- `DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run test:e2e -- --runInBand` (`71/71`)
- `npm run build`
- `npm audit --audit-level=high` (`0 vulnerabilities`)
- `npm run typecheck --prefix apps/web`
- `npm run lint --prefix apps/web`

---

### Task 1: Add Authorization Matrix Regression Tests

**Files:**
- Modify: `apps/api/test/catalog.e2e-spec.ts`
- Modify: `apps/api/test/appointments.e2e-spec.ts`
- Modify: `apps/api/test/scheduling.e2e-spec.ts`

**Interfaces:**
- Consumes: `POST /api/v1/auth/login` returning `sessionToken`.
- Produces: E2E coverage proving forbidden role and ownership cases return `403 FORBIDDEN`.

- [x] **Step 1: Write failing tests**

Add tests for:

```typescript
await request(server)
  .get("/api/v1/availability/slots?serviceId=service-general&date=2026-08-25")
  .set("Authorization", `Bearer ${doctorToken}`)
  .expect(403);
```

```typescript
await request(server)
  .get("/api/v1/patients/patient-1")
  .set("Authorization", `Bearer ${otherPatientToken}`)
  .expect(403);
```

```typescript
await request(server)
  .post("/api/v1/appointments/appointment-other-doctor/start")
  .set("Authorization", `Bearer ${doctorToken}`)
  .expect(403);
```

- [x] **Step 2: Run focused E2E tests to verify RED**

Run:

```bash
cd apps/api
DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run test:e2e -- --runInBand test/catalog.e2e-spec.ts test/appointments.e2e-spec.ts test/scheduling.e2e-spec.ts
```

Expected: at least one new test fails before production changes.

- [x] **Step 3: Keep tests focused**

If a test passes immediately, confirm it documents existing behavior and keep it as regression coverage only if it still protects a meaningful access boundary.

### Task 2: Harden Guard Wiring

**Files:**
- Modify: `apps/api/src/appointments/appointments.controller.ts`
- Modify: `apps/api/src/audit/audit.controller.ts`
- Modify: `apps/api/src/catalog/doctors.controller.ts`
- Modify: `apps/api/src/catalog/services.controller.ts`
- Modify: `apps/api/src/catalog/specialties.controller.ts`
- Modify: `apps/api/src/patients/patients.controller.ts`
- Modify: `apps/api/src/scheduling/scheduling.controller.ts`

**Interfaces:**
- Consumes: `@Roles(...)` metadata from `apps/api/src/common/roles.ts`.
- Produces: Controllers that run both `SessionGuard` and `RolesGuard` at class level where role metadata is present.

- [x] **Step 1: Move guard wiring to controller class level**

Use this pattern:

```typescript
@Controller("patients")
@UseGuards(SessionGuard, RolesGuard)
export class PatientsController {}
```

- [x] **Step 2: Remove redundant method-level `@UseGuards(RolesGuard)`**

Keep all `@Roles(...)` decorators in place.

- [x] **Step 3: Run focused tests**

Run:

```bash
cd apps/api
DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run test:e2e -- --runInBand test/auth.e2e-spec.ts test/catalog.e2e-spec.ts test/appointments.e2e-spec.ts test/scheduling.e2e-spec.ts
```

Expected: authorization tests pass.

### Task 3: Resolve Docs Drift

**Files:**
- Modify: `docs/03-architecture/api-contract.md`
- Modify: `docs/03-architecture/backend-architecture.md`
- Modify: `docs/04-planning/backend-next-steps.md`
- Modify: `docs/05-history/changelog.md`

**Interfaces:**
- Consumes: implemented source under `apps/api/src`.
- Produces: docs that distinguish implemented authorization hardening from planned `/users` administration.

- [x] **Step 1: Mark `/users` endpoints as planned**

In `api-contract.md`, keep the future contract but state that `/users` is not implemented in the current backend.

- [x] **Step 2: Fix OpenAPI known-limit drift**

Replace the stale statement in `backend-architecture.md` that says no machine-readable OpenAPI exists.

- [x] **Step 3: Update backend next steps**

Add authorization hardening as the current follow-up after auth/session hardening.

- [x] **Step 4: Add changelog entry**

Record the authorization hardening and docs drift cleanup.

### Task 4: Final Verification

**Files:**
- No source files; verification only.

**Interfaces:**
- Consumes: all changes from Tasks 1-3.
- Produces: evidence for commit readiness.

- [x] **Step 1: Run API verification**

```bash
cd apps/api
npm run prisma:generate
npm run typecheck
npm run lint
npm test -- --runInBand
DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run test:e2e -- --runInBand
npm run build
npm audit --audit-level=high
```

- [x] **Step 2: Run web static verification**

```bash
npm run typecheck --prefix apps/web
npm run lint --prefix apps/web
```

- [x] **Step 3: Inspect git diff**

```bash
git status --short
git diff --stat
```

- [x] **Step 4: Commit**

```bash
git add apps/api docs
git commit -m "fix(api): harden authorization boundaries"
```
