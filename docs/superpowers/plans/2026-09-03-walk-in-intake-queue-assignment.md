# Walk-in Intake Queue Assignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a receptionist/nurse/admin walk-in intake flow that identifies patients by CCCD/BHYT or fallback demographics, creates missing patient profiles without login accounts, and assigns the walk-in to the active doctor/room with the lowest operational queue load.

**Architecture:** Keep online appointment booking unchanged and add a staff-only walk-in intake API surface. Reuse `Patient`, `Doctor`, `Service`, `DoctorSchedule`, `Appointment`, status history and audit tables, adding only patient identity fields and deterministic queue-assignment service logic. Frontend adds a focused operations page that quotes the assignment before creating a checked-in appointment.

**Tech Stack:** NestJS, Prisma, PostgreSQL/Neon, Zod, Jest/Supertest, React, React Router, TanStack Query, Vitest, Playwright.

**Spec:** Approved in chat on 2026-09-03: walk-in patients at the reception desk may have no account; CCCD and BHYT are business identifiers; under-14/no-document patients use name, birth date, address and guardian/contact data; assignment should prefer an empty room or the doctor/room with the lowest queue load; do not apply the patient online `now + 30 minutes` cutoff; if current time is within 5 minutes of a shift boundary, assign to the next shift unless the same doctor continues into that next shift.

## Global Constraints

- User-facing product copy must remain Vietnamese-first.
- No paid services, no external identity verification provider and no new infrastructure.
- Existing patient self-booking and staff scheduled appointment creation must keep the 30-minute lead-time rule.
- Walk-in intake is staff-only: receptionist, nurse and admin can quote/create; patient and doctor cannot.
- Full CCCD/BHYT values must not appear in list UI or audit metadata; use masked display values outside focused staff forms.
- Existing `homepage-preview.html` is an unrelated untracked preview file and must not be committed.

---

## Subagent Work Allocation

| Subagent | Scope | Primary Deliverable | Depends On |
| --- | --- | --- | --- |
| Subagent A | Patient identity schema/API | CCCD/BHYT fields, fallback demographics, search/masking | None |
| Subagent B | Walk-in queue assignment backend | Quote/create API, queue load, shift-boundary rules | A |
| Subagent C | Operations frontend | Walk-in intake page, service selection, quote confirmation | A, B API contract |
| Subagent D | Documentation and verification | API/docs updates, traceability, full test/build checks | A, B, C |

### Task 1: Patient Identity Data Contract

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/20260903000000_patient_identity/migration.sql`
- Modify: `apps/api/src/patients/patients.dto.ts`
- Modify: `apps/api/src/patients/patients.service.ts`
- Modify: `apps/api/test/database.e2e-spec.ts`
- Modify: `apps/api/test/patients.e2e-spec.ts`
- Modify: `apps/web/src/lib/api/patients.ts`
- Modify: `apps/web/src/types/models.ts`
- Modify: `apps/web/src/features/patients/patientService.ts`
- Modify: `apps/web/src/mocks/fixtures.ts`
- Modify: `apps/web/src/mocks/mockStore.ts`

**Interfaces:**
- Produces patient fields: `citizenIdNumber`, `healthInsuranceNumber`, `guardianName`, `guardianPhone`, `identityDocumentType`, `maskedCitizenIdNumber`, `maskedHealthInsuranceNumber`.
- Produces backend helper: `maskIdentityNumber(value: string | null | undefined): string | null`.
- Consumes existing `PatientsService.create`, `PatientsService.update`, and patient list/detail endpoints.

- [ ] **Step 1: Write failing API tests for identity creation and search**

  Add or extend API E2E coverage so this production change would fail if identity fields are ignored, full identifiers are leaked in list responses, or search does not match CCCD/BHYT.

  ```ts
  it("allows staff to create and find a patient by CCCD while masking list output", async () => {
    const session = await loginAs(app, "reception@careflow.local");
    const created = await request(app.getHttpServer())
      .post("/api/v1/patients")
      .set("Authorization", `Bearer ${session.token}`)
      .send({
        fullName: "Nguyen Van Walkin",
        phone: "+84930000111",
        citizenIdNumber: "079203000111",
        dateOfBirth: "1990-02-03",
        address: "12 Tran Hung Dao, Ho Chi Minh City"
      })
      .expect(201);

    expect(created.body.data.citizenIdNumber).toBe("079203000111");
    const listed = await request(app.getHttpServer())
      .get("/api/v1/patients?q=079203000111")
      .set("Authorization", `Bearer ${session.token}`)
      .expect(200);
    expect(listed.body.data[0]).toMatchObject({
      id: created.body.data.id,
      maskedCitizenIdNumber: "********0111"
    });
    expect(listed.body.data[0].citizenIdNumber).toBeUndefined();
  });
  ```

- [ ] **Step 2: Run focused API tests to verify RED**

  Run: `npm run test:e2e -- patients.e2e-spec.ts`

  Expected: FAIL because `citizenIdNumber` is rejected by strict DTO validation or not persisted.

- [ ] **Step 3: Add Prisma fields and migration**

  Add nullable unique identity columns to `Patient`:

  ```prisma
  citizenIdNumber        String? @unique
  healthInsuranceNumber  String? @unique
  guardianName           String?
  guardianPhone          String?
  identityDocumentType   String?
  ```

  Migration:

  ```sql
  ALTER TABLE "Patient" ADD COLUMN "citizenIdNumber" TEXT;
  ALTER TABLE "Patient" ADD COLUMN "healthInsuranceNumber" TEXT;
  ALTER TABLE "Patient" ADD COLUMN "guardianName" TEXT;
  ALTER TABLE "Patient" ADD COLUMN "guardianPhone" TEXT;
  ALTER TABLE "Patient" ADD COLUMN "identityDocumentType" TEXT;
  CREATE UNIQUE INDEX "Patient_citizenIdNumber_key" ON "Patient"("citizenIdNumber");
  CREATE UNIQUE INDEX "Patient_healthInsuranceNumber_key" ON "Patient"("healthInsuranceNumber");
  ```

- [ ] **Step 4: Implement DTO validation, persistence, masking and search**

  Extend create/update schemas with trimmed nullable identity fields. Search `q` across `fullName`, `phone`, `citizenIdNumber`, `healthInsuranceNumber`, `guardianName`, and `guardianPhone`. For list responses to staff, include masked fields and omit full CCCD/BHYT; detail responses may include full identifiers for authorized staff/patient owner.

- [ ] **Step 5: Update frontend types, API mapping and mock data**

  Add identity fields and masked fields to shared patient types. Update mock store search to match CCCD/BHYT/guardian contact and keep existing tests compatible.

- [ ] **Step 6: Run focused tests to verify GREEN**

  Run:

  ```bash
  cd apps/api && npm run test:e2e -- patients.e2e-spec.ts
  cd apps/web && npm test -- --run src/features/patients/patientService.test.ts
  ```

  Expected: PASS.

### Task 2: Walk-in Queue Assignment Backend

**Files:**
- Create: `apps/api/src/walk-in/walk-in.dto.ts`
- Create: `apps/api/src/walk-in/walk-in-assignment.service.ts`
- Create: `apps/api/src/walk-in/walk-in.controller.ts`
- Create: `apps/api/src/walk-in/walk-in.module.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/src/openapi-contract.spec.ts`
- Modify: `apps/api/test/appointments.e2e-spec.ts`
- Create: `apps/api/test/walk-in.e2e-spec.ts`
- Modify: `apps/api/prisma/seed.ts`

**Interfaces:**
- Produces `POST /api/v1/walk-in-intake/quote`.
- Produces `POST /api/v1/walk-in-intake`.
- Produces response shape:

  ```ts
  type WalkInAssignmentQuote = {
    patientMatch: "existing" | "new";
    patientId: string | null;
    doctorId: string;
    doctorName: string;
    room: string | null;
    serviceId: string;
    startAt: string;
    estimatedWaitMinutes: number;
    queueAhead: number;
    assignmentReason: "room_empty" | "lowest_queue" | "continued_shift" | "next_shift";
  };
  ```

- Consumes `PatientsService`, `AppointmentConflictsService` schedule checks by concept, Prisma appointments/schedules, and existing appointment status transitions.

- [ ] **Step 1: Write failing walk-in quote tests**

  Add tests that would fail if assignment chooses by doctor ID instead of queue load, if it applies the 30-minute online cutoff, or if it ignores the 5-minute shift-boundary rule.

  ```ts
  it("quotes the active doctor room with the smallest checked-in queue for a walk-in", async () => {
    process.env.CAREFLOW_SYSTEM_NOW = "2026-09-03T03:00:00.000Z";
    const session = await loginAs(app, "reception@careflow.local");
    const response = await request(app.getHttpServer())
      .post("/api/v1/walk-in-intake/quote")
      .set("Authorization", `Bearer ${session.token}`)
      .send({
        patient: { fullName: "Le Thi Walkin", phone: "+84930000222", citizenIdNumber: "079203000222" },
        serviceId: "service-general"
      })
      .expect(201);

    expect(response.body.data.assignmentReason).toMatch(/room_empty|lowest_queue/);
    expect(response.body.data.estimatedWaitMinutes).toBeGreaterThanOrEqual(0);
    expect(new Date(response.body.data.startAt).getTime()).toBeLessThan(new Date("2026-09-03T03:30:00.000Z").getTime());
  });
  ```

- [ ] **Step 2: Run focused walk-in tests to verify RED**

  Run: `npm run test:e2e -- walk-in.e2e-spec.ts`

  Expected: FAIL because the module and route do not exist.

- [ ] **Step 3: Implement DTOs and module wiring**

  DTO accepts `patientId` or `patient` payload, `serviceId`, optional `specialtyId`, optional `reason`, optional `internalNote`. Roles are receptionist, nurse and admin only.

- [ ] **Step 4: Implement deterministic assignment**

  For each active doctor who provides the service and is working now or in the next eligible shift:
  - Exclude blocked/leave schedules.
  - Compute queue load from active appointments: `checked_in` queue ahead, `in_progress` active room usage, and `confirmed` appointments already due.
  - Prefer `room_empty` when no `in_progress` and no queue ahead.
  - Otherwise prefer lowest `estimatedWaitMinutes`, then lowest `queueAhead`, then doctor full name, then doctor ID.
  - If current local time is within 5 minutes before a schedule end, skip that ending schedule unless the same doctor has a contiguous working schedule after it.

- [ ] **Step 5: Implement create transaction**

  In one serializable transaction:
  - Resolve existing patient by `patientId`, `citizenIdNumber`, `healthInsuranceNumber`, or exact fallback demographics when available.
  - Create patient if no match exists.
  - Recompute assignment inside the transaction.
  - Create appointment with `status = checked_in`, `startAt = now or next eligible shift start`, `endAt = startAt + service.durationMinutes`, `checkedInAt = now`, `source = operations`.
  - Create status history and audit event without full CCCD/BHYT in metadata.

- [ ] **Step 6: Run focused backend tests to verify GREEN**

  Run:

  ```bash
  cd apps/api && npm run test:e2e -- walk-in.e2e-spec.ts
  cd apps/api && npm run test:e2e -- appointments.e2e-spec.ts
  ```

  Expected: PASS.

### Task 3: Operations Frontend Walk-in Intake

**Files:**
- Create: `apps/web/src/features/operations/WalkInIntakePage.tsx`
- Create: `apps/web/src/features/operations/walkInService.ts`
- Modify: `apps/web/src/app/routes.tsx`
- Modify: `apps/web/src/components/navigation.ts`
- Modify: `apps/web/src/features/operations/operations.test.tsx`
- Modify: `apps/web/e2e/api-careflow.spec.ts`

**Interfaces:**
- Produces route `/app/operations/walk-in`.
- Produces `walkInService.quote(input)` and `walkInService.create(input)`.
- Consumes backend `/walk-in-intake/quote` and `/walk-in-intake`.

- [ ] **Step 1: Write failing frontend tests**

  Add tests proving the operations nav exposes `Tiếp nhận trực tiếp`, the page accepts CCCD/BHYT or fallback patient details, renders a quote, and creates a checked-in appointment.

  ```tsx
  it("lets operations staff quote and confirm a walk-in intake", async () => {
    renderWithProviders(<WalkInIntakePage />);
    await userEvent.type(screen.getByLabelText("CCCD"), "079203000333");
    await userEvent.type(screen.getByLabelText("Họ và tên"), "Tran Van Walkin");
    await userEvent.type(screen.getByLabelText("Số điện thoại"), "+84930000333");
    await userEvent.selectOptions(screen.getByLabelText("Dịch vụ khám"), "service-general");
    await userEvent.click(screen.getByRole("button", { name: "Tìm phòng phù hợp" }));
    expect(await screen.findByText(/Phòng/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Xếp vào hàng đợi" }));
    expect(await screen.findByText("Đã xếp bệnh nhân vào hàng đợi khám.")).toBeInTheDocument();
  });
  ```

- [ ] **Step 2: Run focused web tests to verify RED**

  Run: `npm test -- --run src/features/operations/operations.test.tsx`

  Expected: FAIL because the route/page/service do not exist.

- [ ] **Step 3: Implement API service and route**

  Add the route under operations navigation. Use existing form styling, `ShimmerBlock`, `StatusBadge`, and error patterns. Do not nest UI cards inside cards.

- [ ] **Step 4: Implement UX flow**

  Page sections:
  - Patient identity: CCCD, BHYT, full name, birth date, address, guardian/contact fields.
  - Service selection.
  - Quote panel: doctor, room, queue ahead, estimated wait, assignment reason.
  - Confirm action creates a checked-in appointment and invalidates appointment queries.

- [ ] **Step 5: Run focused tests to verify GREEN**

  Run:

  ```bash
  cd apps/web && npm test -- --run src/features/operations/operations.test.tsx
  cd apps/web && npm run e2e:api -- e2e/api-careflow.spec.ts
  ```

  Expected: PASS.

### Task 4: Documentation, Contract and Release Verification

**Files:**
- Modify: `docs/03-architecture/api-contract.md`
- Modify: `docs/03-architecture/data-model.md`
- Modify: `docs/02-product/workflows.md`
- Modify: `docs/06-testing/test-case-traceability.md`
- Modify: `docs/05-history/changelog.md`
- Modify: `docs/01-requirements/change-requests.md`

**Interfaces:**
- Consumes delivered backend/frontend behavior from Tasks 1-3.
- Produces documentation that matches implementation and records verification evidence.

- [ ] **Step 1: Document data model and API contract**

  Add patient identity fields, masked response behavior, walk-in quote/create endpoints, role gates, assignment reasons, and the 5-minute shift-boundary rule.

- [ ] **Step 2: Document product workflow and test traceability**

  Add walk-in intake workflow from CCCD/BHYT/fallback demographics through queue assignment and checked-in appointment creation.

- [ ] **Step 3: Run full verification**

  Run:

  ```bash
  cd apps/api && npm run typecheck && npm run lint && npm test && npm run test:e2e
  cd apps/web && npm run typecheck && npm run lint && npm test -- --run && npm run build && npm run e2e
  git diff --check
  ```

  Expected: all commands exit 0. Existing Vite chunk-size warnings are acceptable if unchanged.

- [ ] **Step 4: Commit and push implementation**

  Commit message: `feat: add walk-in intake queue assignment`

  Push to `main` only after full verification passes.

- [ ] **Step 5: Verify CI/CD and production**

  Confirm GitHub Actions workflows for the commit finish successfully. Confirm Render health returns the pushed commit SHA. Run production smoke for `/`, `/login`, and `/app/operations/walk-in` behind authenticated navigation.

## Plan Self-Review

- Spec coverage: CCCD/BHYT identity, under-14 fallback, no-account patients, queue-load assignment, direct checked-in intake, shift-boundary exception and docs/test updates are covered by Tasks 1-4.
- Placeholder scan: This plan contains no `TBD`, no `TODO`, and no unspecified "handle edge cases" steps.
- Type consistency: The walk-in quote response shape is defined once and consumed by backend/frontend tasks with matching property names.
