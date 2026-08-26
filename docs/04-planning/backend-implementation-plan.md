# Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `apps/api` as the real CareFlow backend that implements `docs/03-architecture/api-contract.md` and can later replace frontend mock services.

**Architecture:** Backend uses NestJS modules by domain: auth, users, patients, doctors, specialties, services, schedules, appointments, audit events and notifications. Prisma owns PostgreSQL schema, migrations and transactional appointment conflict checks. Controllers return the API envelope from `api-contract.md`; services own business rules; guards own authentication and role authorization.

**Tech Stack:** Node.js 22+, NestJS, TypeScript, Prisma, PostgreSQL, Zod DTO validation, Jest/Supertest, Docker Compose for local PostgreSQL.

**Spec:** `docs/03-architecture/api-contract.md`, `docs/03-architecture/data-model.md`, `docs/02-product/appointment-states.md`, `docs/02-product/frontend-mvp-spec.md`

## Global Constraints

- Base path is `/api/v1`.
- Date-only field uses ISO `yyyy-MM-dd`.
- Datetime field uses ISO 8601 with timezone.
- Backend is source of truth for auth, authorization, appointment conflict, status transitions and audit log.
- Patient-created appointment defaults to `requested`.
- Staff-created appointment defaults to `confirmed`.
- Admin delete uses deactivate/soft delete by default.
- Do not add payment, insurance, prescription, telemedicine or external notification providers in API v1.
- Keep frontend mock data until Phase 4 integration; do not break `apps/web` scripts during backend scaffold.

---

## File Structure

Create:

- `apps/api/package.json`: backend scripts and dependencies.
- `apps/api/tsconfig.json`: API TypeScript config.
- `apps/api/src/main.ts`: Nest bootstrap with `/api/v1` prefix.
- `apps/api/src/app.module.ts`: root module wiring.
- `apps/api/src/common/api-response.ts`: success envelope helpers.
- `apps/api/src/common/api-error.ts`: typed API errors and exception filter.
- `apps/api/src/common/roles.ts`: role enum and role guard metadata.
- `apps/api/src/prisma/prisma.module.ts`: Prisma provider module.
- `apps/api/src/prisma/prisma.service.ts`: Prisma service lifecycle.
- `apps/api/prisma/schema.prisma`: PostgreSQL schema.
- `apps/api/prisma/seed.ts`: deterministic seed based on frontend mock dataset.
- `apps/api/src/auth/*`: login/logout/current user module.
- `apps/api/src/catalog/*`: doctors, specialties and services read/manage modules.
- `apps/api/src/patients/*`: patient profile module.
- `apps/api/src/schedules/*`: doctor schedule and availability modules.
- `apps/api/src/appointments/*`: appointment rules, conflict engine, status transitions and endpoints.
- `apps/api/src/audit/*`: audit event module.
- `apps/api/src/notifications/*`: notification module.
- `apps/api/test/*`: Jest/Supertest integration tests.
- `docker-compose.yml`: local PostgreSQL service.

Modify:

- `.github/workflows/web-ci.yml`: keep existing web checks; do not add backend checks until `apps/api` has scripts.
- `README.md`: add backend local commands after backend scaffold lands.
- `docs/05-history/changelog.md`: record each backend package.

## Task 1: Backend Scaffold

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/app.module.ts`
- Create: `apps/api/src/health/health.controller.ts`
- Create: `apps/api/test/health.e2e-spec.ts`
- Create: `docker-compose.yml`

**Interfaces:**
- Consumes: `/api/v1` base path from API contract.
- Produces: `GET /api/v1/health` returning `{ data: { status: "ok" }, meta: { requestId } }`.

- [ ] **Step 1: Create backend package scripts**

Create `apps/api/package.json`:

```json
{
  "name": "@careflow/api",
  "private": true,
  "version": "0.0.0",
  "type": "commonjs",
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/main.js",
    "lint": "eslint \"src/**/*.ts\" \"test/**/*.ts\"",
    "typecheck": "tsc --noEmit",
    "test": "jest",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@nestjs/common": "^11.2.3",
    "@nestjs/core": "^11.2.3",
    "@nestjs/platform-express": "^11.2.3",
    "@prisma/client": "6.12.0",
    "bcryptjs": "^2.4.3",
    "cookie-parser": "^1.4.7",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.2",
    "zod": "^4.4.3"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.24",
    "@nestjs/testing": "^11.2.3",
    "@types/cookie-parser": "^1.4.10",
    "@types/express": "^5.0.6",
    "@types/jest": "^30.0.0",
    "@types/node": "^22.20.1",
    "@types/supertest": "^7.2.1",
    "eslint": "^10.9.1",
    "jest": "^30.4.2",
    "prisma": "6.12.0",
    "supertest": "^7.2.2",
    "ts-jest": "^29.4.12",
    "tsx": "^4.23.12",
    "typescript": "^5.9.2"
  }
}
```

- [ ] **Step 2: Write health e2e test**

Create `apps/api/test/health.e2e-spec.ts`:

```ts
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";

describe("HealthController", () => {
  it("returns the API success envelope", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1");
    await app.init();

    await request(app.getHttpServer())
      .get("/api/v1/health")
      .expect(200)
      .expect((response) => {
        expect(response.body.data).toEqual({ status: "ok" });
        expect(response.body.meta.requestId).toEqual(expect.any(String));
      });

    await app.close();
  });
});
```

- [ ] **Step 3: Run health test before implementation**

Run:

```bash
cd apps/api
npm test -- --runInBand test/health.e2e-spec.ts
```

Expected: FAIL because `AppModule` and `HealthController` do not exist.

- [ ] **Step 4: Implement bootstrap and health endpoint**

Create `apps/api/src/common/api-response.ts`:

```ts
import { randomUUID } from "node:crypto";

export function successEnvelope<T>(data: T) {
  return {
    data,
    meta: {
      requestId: randomUUID(),
    },
  };
}
```

Create `apps/api/src/health/health.controller.ts`:

```ts
import { Controller, Get } from "@nestjs/common";
import { successEnvelope } from "../common/api-response";

@Controller("health")
export class HealthController {
  @Get()
  health() {
    return successEnvelope({ status: "ok" });
  }
}
```

Create `apps/api/src/app.module.ts`:

```ts
import { Module } from "@nestjs/common";
import { HealthController } from "./health/health.controller";

@Module({
  controllers: [HealthController],
})
export class AppModule {}
```

Create `apps/api/src/main.ts`:

```ts
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api/v1");
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}

void bootstrap();
```

- [ ] **Step 5: Verify scaffold**

Run:

```bash
cd apps/api
npm test -- --runInBand test/health.e2e-spec.ts
npm run typecheck
npm run build
```

Expected: all commands pass.

- [ ] **Step 6: Commit scaffold**

Run:

```bash
git add apps/api docker-compose.yml
git commit -m "feat(api): scaffold nest backend"
```

## Task 2: Database Schema And Seed

**Files:**
- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/seed.ts`
- Create: `apps/api/src/prisma/prisma.module.ts`
- Create: `apps/api/src/prisma/prisma.service.ts`
- Create: `apps/api/test/database.e2e-spec.ts`

**Interfaces:**
- Consumes: entity definitions from `docs/03-architecture/data-model.md`.
- Produces: Prisma models for users, patients, staff, doctors, specialties, services, doctor schedules, appointments, status history, audit events and notifications.

- [ ] **Step 1: Write database smoke test**

Create `apps/api/test/database.e2e-spec.ts`:

```ts
import { PrismaClient } from "@prisma/client";

describe("Database schema", () => {
  const prisma = new PrismaClient();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("stores a seeded active doctor with specialty and services", async () => {
    const doctor = await prisma.doctor.findFirst({
      include: { specialty: true, services: true },
      where: { status: "active" },
    });

    expect(doctor?.specialty.name).toEqual(expect.any(String));
    expect(doctor?.services.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run database test before schema**

Run:

```bash
cd apps/api
npm test -- --runInBand test/database.e2e-spec.ts
```

Expected: FAIL because Prisma schema is not generated.

- [ ] **Step 3: Create Prisma schema**

Define enums:

```prisma
enum UserRole {
  patient
  doctor
  receptionist
  nurse
  admin
}

enum AppointmentStatus {
  requested
  confirmed
  checked_in
  in_progress
  completed
  cancelled
  no_show
}
```

Define relation models with `createdAt`, `updatedAt` and `status` fields. Appointment must include:

```prisma
model Appointment {
  id                 String   @id @default(uuid())
  patientId          String
  doctorId           String
  serviceId          String
  startAt            DateTime
  endAt              DateTime
  status             AppointmentStatus
  reason             String?
  internalNote       String?
  cancellationReason String?
  createdByUserId    String
  updatedByUserId    String?
  checkedInAt        DateTime?
  startedAt          DateTime?
  completedAt        DateTime?
  cancelledAt        DateTime?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  patient            Patient  @relation(fields: [patientId], references: [id])
  doctor             Doctor   @relation(fields: [doctorId], references: [id])
  service            Service  @relation(fields: [serviceId], references: [id])

  @@index([doctorId, startAt, endAt, status])
  @@index([patientId, startAt])
}
```

- [ ] **Step 4: Seed deterministic demo data**

Create `apps/api/prisma/seed.ts` to insert:

- 5 users across patient, doctor, receptionist, nurse and admin roles.
- 3 specialties.
- 5 doctors.
- 8 services.
- 2 weeks of doctor schedules.
- 30 appointments across all statuses.
- 20 audit events.
- 8 notifications.

- [ ] **Step 5: Verify schema and seed**

Run:

```bash
cd apps/api
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
npm test -- --runInBand test/database.e2e-spec.ts
```

Expected: Prisma client generates, migration applies and database smoke test passes.

- [ ] **Step 6: Commit database foundation**

Run:

```bash
git add apps/api/prisma apps/api/src/prisma apps/api/test/database.e2e-spec.ts
git commit -m "feat(api): add database schema"
```

## Task 3: API Errors, Auth And RBAC

**Files:**
- Create: `apps/api/src/common/api-error.ts`
- Create: `apps/api/src/common/api-exception.filter.ts`
- Create: `apps/api/src/common/roles.ts`
- Create: `apps/api/src/auth/auth.module.ts`
- Create: `apps/api/src/auth/auth.controller.ts`
- Create: `apps/api/src/auth/auth.service.ts`
- Create: `apps/api/src/auth/session.guard.ts`
- Create: `apps/api/test/auth.e2e-spec.ts`

**Interfaces:**
- Consumes: auth contract endpoints `/auth/login`, `/auth/logout`, `/auth/me`.
- Produces: authenticated request context with `currentUser`.

- [ ] **Step 1: Write auth e2e tests**

Create tests for:

- `POST /api/v1/auth/login` returns current user.
- `GET /api/v1/auth/me` rejects unauthenticated requests with `UNAUTHENTICATED`.
- receptionist cannot access admin-only endpoint with `FORBIDDEN`.

- [ ] **Step 2: Implement error envelope**

Create `ApiError`:

```ts
export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly fields: Record<string, string> = {},
  ) {
    super(message);
  }
}
```

- [ ] **Step 3: Implement role guard**

Create decorator and guard:

```ts
export const ROLES_KEY = "roles";
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

The guard must compare `request.currentUser.role` with metadata roles and throw `FORBIDDEN` on mismatch.

- [ ] **Step 4: Verify auth**

Run:

```bash
cd apps/api
npm test -- --runInBand test/auth.e2e-spec.ts
npm run typecheck
```

Expected: auth tests and typecheck pass.

- [ ] **Step 5: Commit auth foundation**

Run:

```bash
git add apps/api/src/common apps/api/src/auth apps/api/test/auth.e2e-spec.ts
git commit -m "feat(api): add auth and rbac"
```

## Task 4: Catalog And Admin Management Resources

**Files:**
- Create: `apps/api/src/catalog/catalog.module.ts`
- Create: `apps/api/src/catalog/doctors.controller.ts`
- Create: `apps/api/src/catalog/services.controller.ts`
- Create: `apps/api/src/catalog/specialties.controller.ts`
- Create: `apps/api/src/catalog/catalog.service.ts`
- Create: `apps/api/src/patients/patients.module.ts`
- Create: `apps/api/src/patients/patients.controller.ts`
- Create: `apps/api/src/patients/patients.service.ts`
- Create: `apps/api/test/catalog.e2e-spec.ts`

**Interfaces:**
- Consumes: catalog endpoints from `api-contract.md`.
- Produces: list/detail/create/update/deactivate behavior for patient, doctor, specialty and service resources.

- [ ] **Step 1: Write catalog tests**

Test cases:

- unauthenticated `GET /api/v1/services` returns `UNAUTHENTICATED`.
- authenticated patient can list active services.
- admin can create a service.
- admin can deactivate a service.
- deactivated service no longer appears in patient default list.

- [ ] **Step 2: Implement read filters**

Controllers must accept:

- `q`
- `status`
- `specialtyId`
- `serviceId`

Default public/authenticated catalog list excludes inactive resources unless requester is admin and passes `status`.

- [ ] **Step 3: Implement admin deactivate**

Deactivate endpoints set `status` to `inactive`, update `updatedAt` and create audit event with `admin_resource_deactivated`.

- [ ] **Step 4: Verify catalog**

Run:

```bash
cd apps/api
npm test -- --runInBand test/catalog.e2e-spec.ts
npm run typecheck
```

Expected: catalog tests and typecheck pass.

- [ ] **Step 5: Commit catalog resources**

Run:

```bash
git add apps/api/src/catalog apps/api/src/patients apps/api/test/catalog.e2e-spec.ts
git commit -m "feat(api): add catalog resources"
```

## Task 5: Appointment Conflict Engine

**Files:**
- Create: `apps/api/src/appointments/appointment-rules.ts`
- Create: `apps/api/src/appointments/appointment-conflicts.service.ts`
- Create: `apps/api/src/appointments/appointment-rules.spec.ts`
- Create: `apps/api/test/appointment-conflicts.e2e-spec.ts`

**Interfaces:**
- Consumes: appointment transition table and schedule rules from `api-contract.md`.
- Produces: pure rule helpers and Prisma transaction checks used by appointment endpoints.

- [ ] **Step 1: Write pure rule tests**

Create `apps/api/src/appointments/appointment-rules.spec.ts`:

```ts
import { canTransition } from "./appointment-rules";

describe("canTransition", () => {
  it("allows receptionist to check in a confirmed appointment", () => {
    expect(canTransition("confirmed", "checked_in", "receptionist")).toBe(true);
  });

  it("rejects editing terminal appointments", () => {
    expect(canTransition("completed", "cancelled", "admin")).toBe(false);
  });
});
```

- [ ] **Step 2: Implement transition map**

Create `canTransition(from, to, role)` using the exact table from `api-contract.md`.

- [ ] **Step 3: Write conflict e2e tests**

Test cases:

- reject appointment outside doctor working hours.
- reject overlap with active appointment.
- allow slot after cancelled appointment.
- assign any available doctor when `doctorId` is omitted.

- [ ] **Step 4: Implement conflict service**

`AppointmentConflictsService.assertSlotAvailable(input)` must:

- load doctor, service and schedules.
- calculate `endAt`.
- verify doctor/service active.
- verify schedule covers `[startAt, endAt)`.
- reject overlap with appointments whose status is `requested`, `confirmed`, `checked_in` or `in_progress`.

- [ ] **Step 5: Verify conflict engine**

Run:

```bash
cd apps/api
npm test -- --runInBand src/appointments/appointment-rules.spec.ts test/appointment-conflicts.e2e-spec.ts
```

Expected: pure rule tests and conflict e2e tests pass.

- [ ] **Step 6: Commit conflict engine**

Run:

```bash
git add apps/api/src/appointments apps/api/test/appointment-conflicts.e2e-spec.ts
git commit -m "feat(api): add appointment conflict engine"
```

## Task 6: Appointment Endpoints And Status Transitions

**Files:**
- Create: `apps/api/src/appointments/appointments.module.ts`
- Create: `apps/api/src/appointments/appointments.controller.ts`
- Create: `apps/api/src/appointments/appointments.service.ts`
- Create: `apps/api/test/appointments.e2e-spec.ts`

**Interfaces:**
- Consumes: `AppointmentConflictsService` and `canTransition`.
- Produces: `/appointments`, `/appointments/{id}/cancel`, `/check-in`, `/start`, `/complete`, `/no-show`.

- [ ] **Step 1: Write appointment endpoint tests**

Test cases:

- patient creates requested appointment.
- receptionist creates confirmed appointment.
- receptionist checks in confirmed appointment.
- doctor starts checked-in appointment.
- doctor completes in-progress appointment.
- patient cannot complete appointment.
- completed appointment cannot be rescheduled.

- [ ] **Step 2: Implement create endpoint**

`POST /api/v1/appointments` must:

- derive actor from current user.
- default status by actor role.
- run conflict check in a transaction.
- create status history.
- create audit event `appointment_created`.
- return appointment detail envelope.

- [ ] **Step 3: Implement status endpoints**

Each status endpoint must:

- verify actor role.
- call `canTransition`.
- update appointment timestamps.
- append status history.
- create audit event.
- return updated appointment detail.

- [ ] **Step 4: Verify appointments**

Run:

```bash
cd apps/api
npm test -- --runInBand test/appointments.e2e-spec.ts
npm run typecheck
```

Expected: appointment endpoint tests and typecheck pass.

- [ ] **Step 5: Commit appointments**

Run:

```bash
git add apps/api/src/appointments apps/api/test/appointments.e2e-spec.ts
git commit -m "feat(api): add appointment workflows"
```

## Task 7: Audit Events And Notifications

**Files:**
- Create: `apps/api/src/audit/audit.module.ts`
- Create: `apps/api/src/audit/audit.controller.ts`
- Create: `apps/api/src/audit/audit.service.ts`
- Create: `apps/api/src/notifications/notifications.module.ts`
- Create: `apps/api/src/notifications/notifications.controller.ts`
- Create: `apps/api/src/notifications/notifications.service.ts`
- Create: `apps/api/test/audit-notifications.e2e-spec.ts`

**Interfaces:**
- Consumes: audit-generating actions from appointment and admin services.
- Produces: admin audit filters and current-user notification endpoints.

- [ ] **Step 1: Write audit and notification tests**

Test cases:

- admin filters audit events by `entityType` and `action`.
- non-admin cannot list audit events.
- current user lists own notifications only.
- current user marks one notification as read.
- current user marks all notifications as read.

- [ ] **Step 2: Implement audit service**

`AuditService.record(input)` creates:

- `entityType`
- `entityId`
- `actorUserId`
- `action`
- `metadata`
- `timestamp`

- [ ] **Step 3: Implement notification service**

Notification list must filter by `recipientUserId = currentUser.id`. Mark-read endpoints must reject attempts to update another user's notification.

- [ ] **Step 4: Verify audit and notifications**

Run:

```bash
cd apps/api
npm test -- --runInBand test/audit-notifications.e2e-spec.ts
npm run typecheck
```

Expected: audit/notification tests and typecheck pass.

- [ ] **Step 5: Commit audit and notifications**

Run:

```bash
git add apps/api/src/audit apps/api/src/notifications apps/api/test/audit-notifications.e2e-spec.ts
git commit -m "feat(api): add audit and notifications"
```

## Task 8: CI, Docs And Frontend Integration Handoff

**Files:**
- Modify: `.github/workflows/web-ci.yml`
- Create: `.github/workflows/api-ci.yml`
- Modify: `README.md`
- Modify: `apps/web/README.md`
- Modify: `docs/04-planning/roadmap.md`
- Create: `docs/04-planning/frontend-api-integration-plan.md`

**Interfaces:**
- Consumes: all backend scripts.
- Produces: CI checks and frontend integration plan.

- [ ] **Step 1: Add API CI workflow**

Create `.github/workflows/api-ci.yml` with jobs:

```yaml
name: API CI

on:
  push:
    branches: [main]
    paths:
      - "apps/api/**"
      - ".github/workflows/api-ci.yml"
  pull_request:
    branches: [main]
    paths:
      - "apps/api/**"
      - ".github/workflows/api-ci.yml"

jobs:
  api:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: careflow
          POSTGRES_PASSWORD: careflow
          POSTGRES_DB: careflow_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: apps/api/package-lock.json
      - run: npm ci
        working-directory: apps/api
      - run: npm run prisma:generate
        working-directory: apps/api
      - run: npm run typecheck
        working-directory: apps/api
      - run: npm run lint
        working-directory: apps/api
      - run: npm test -- --runInBand
        working-directory: apps/api
      - run: npm run test:e2e -- --runInBand
        working-directory: apps/api
```

- [ ] **Step 2: Write frontend API integration plan**

Create `docs/04-planning/frontend-api-integration-plan.md` with:

- API client module structure.
- Auth session replacement.
- Query/mutation migration from mock service to API client.
- Playwright regression gates.
- Feature flag or environment switch for mock/API mode.

- [ ] **Step 3: Run final backend verification**

Run:

```bash
cd apps/api
npm run typecheck
npm run lint
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run build
cd ../..
git diff --check
```

Expected: all checks pass.

- [ ] **Step 4: Commit CI and docs**

Run:

```bash
git add .github/workflows/api-ci.yml README.md apps/web/README.md docs/04-planning/roadmap.md docs/04-planning/frontend-api-integration-plan.md
git commit -m "ci(api): add backend verification"
```

## Final Verification

Run from repository root after all backend tasks:

```bash
cd apps/api
npm run typecheck
npm run lint
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run build
cd ../web
npm test -- --run
npm run typecheck
npm run lint
npm run build
npm run e2e
cd ../..
git diff --check
```

Expected:

- API typecheck, lint, unit tests, e2e tests and build pass.
- Web unit tests, typecheck, lint, build and Playwright smoke pass.
- `git diff --check` has no output.

## Execution Recommendation

Use **Subagent-Driven** execution. Each task should run in an isolated branch/worktree, pass its local verification, receive review, then merge into `main` and push before the next task.
