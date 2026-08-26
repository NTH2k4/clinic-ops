# API Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn thiện Phase 2 API Contract để backend thật có thể thay thế frontend mock services mà không đổi lớn UI workflow.

**Architecture:** Contract nằm ở `docs/03-architecture/api-contract.md` và bám theo frontend service boundary hiện tại. Backend sẽ là source of truth cho auth, authorization, appointment conflict, status transitions, audit events và admin soft-deactivation. Frontend tiếp tục dùng ISO date/datetime nội bộ và chỉ thay mock service implementation bằng API client ở phase integration.

**Tech Stack:** Contract-first planning, HTTP JSON API, ISO 8601 datetime, REST-style resources, future backend stack sẽ được chốt trong backend implementation plan.

**Spec:** `docs/03-architecture/api-contract.md`, `docs/02-product/frontend-mvp-spec.md`, `docs/03-architecture/data-model.md`

## Global Constraints

- Không tích hợp backend thật trong phase API contract.
- Không thêm authentication thật vào frontend trong phase này.
- Không đổi frontend workflow lớn khi chỉ đang chốt API contract.
- Admin delete mặc định là soft delete hoặc deactivate để giữ appointment history và audit history.
- Backend sau này là source of truth cho appointment conflict, ownership, authorization và audit log.
- Date-only field dùng ISO `yyyy-MM-dd`; datetime field dùng ISO 8601 có timezone.

---

## File Structure

- `docs/03-architecture/api-contract.md`: nguồn sự thật cho API v1 conventions, endpoints, schemas, business rules và phase boundaries.
- `docs/04-planning/api-contract-plan.md`: kế hoạch triển khai Phase 2 contract và chuẩn bị Phase 3 backend.
- `docs/00-project/documentation-map.md`: cập nhật vị trí contract trong hệ thống tài liệu.
- `docs/05-history/changelog.md`: ghi lịch sử thay đổi contract.
- `docs/05-history/decision-log.md`: ghi quyết định backend stack khi bắt đầu Phase 3.
- `apps/web/src/features/appointments/appointmentService.ts`: frontend boundary sẽ được map sang API client trong Phase 4, không sửa trong plan này.
- `apps/web/src/mocks/mockStore.ts`: giữ làm test fixtures/reference cho backend seed trong phase sau.

## Task 1: Contract Conventions

**Files:**
- Modify: `docs/03-architecture/api-contract.md`
- Modify: `docs/00-project/documentation-map.md`
- Modify: `docs/05-history/changelog.md`

**Interfaces:**
- Consumes: frontend MVP workflow và data model.
- Produces: API base path, success envelope, error envelope, pagination và common error codes.

- [ ] **Step 1: Confirm contract conventions**

Read:

```bash
sed -n '1,120p' docs/03-architecture/api-contract.md
```

Expected: file defines `/api/v1`, success envelope, list pagination, error envelope and common error codes.

- [ ] **Step 2: Scan for placeholders**

Run:

```bash
rg -n "T[B]D|T[O]DO|PLACEH[O]LDER|fill[ ]in|implement[ ]later" docs/03-architecture/api-contract.md
```

Expected: no output.

- [ ] **Step 3: Commit conventions if changed**

Run:

```bash
git add docs/03-architecture/api-contract.md docs/00-project/documentation-map.md docs/05-history/changelog.md
git commit -m "docs: define api contract conventions"
```

## Task 2: Auth And Catalog Contracts

**Files:**
- Modify: `docs/03-architecture/api-contract.md`
- Modify: `docs/04-planning/api-contract-plan.md`

**Interfaces:**
- Consumes: `User`, `Patient`, `Doctor`, `Specialty`, `Service`, `Staff` from `docs/03-architecture/data-model.md`.
- Produces: endpoint tables for auth, users, patients, doctors, specialties and services.

- [ ] **Step 1: Verify auth endpoint coverage**

Run:

```bash
rg -n "/auth/login|/auth/logout|/auth/me" docs/03-architecture/api-contract.md
```

Expected: all three endpoints are present.

- [ ] **Step 2: Verify catalog endpoint coverage**

Run:

```bash
rg -n "/patients|/doctors|/specialties|/services|/users" docs/03-architecture/api-contract.md
```

Expected: each catalog resource has list/detail or management endpoints appropriate to its role.

- [ ] **Step 3: Check admin deactivate language**

Run:

```bash
rg -n "deactivate|soft delete|Vô hiệu hóa" docs/03-architecture/api-contract.md
```

Expected: admin destructive actions use deactivate/soft delete language instead of hard delete.

## Task 3: Appointment And Scheduling Contracts

**Files:**
- Modify: `docs/03-architecture/api-contract.md`

**Interfaces:**
- Consumes: appointment status rules from `docs/02-product/appointment-states.md`.
- Produces: appointment create/list/update/status endpoints, availability endpoint and allowed transition table.

- [ ] **Step 1: Verify availability endpoint**

Run:

```bash
rg -n "/availability/slots|any available doctor|doctorId" docs/03-architecture/api-contract.md
```

Expected: availability supports service/date and optional doctor selection.

- [ ] **Step 2: Verify appointment endpoints**

Run:

```bash
rg -n "/appointments|check-in|complete|no-show|cancel" docs/03-architecture/api-contract.md
```

Expected: appointment list, detail, create, edit, cancel and status transition endpoints are present.

- [ ] **Step 3: Verify transition table**

Run:

```bash
rg -n "requested|confirmed|checked_in|in_progress|completed|cancelled|no_show" docs/03-architecture/api-contract.md
```

Expected: status transitions and terminal statuses are explicit.

## Task 4: Audit And Notification Contracts

**Files:**
- Modify: `docs/03-architecture/api-contract.md`

**Interfaces:**
- Consumes: admin audit and notification frontend routes.
- Produces: audit filters, notification read endpoints and reference navigation contract.

- [ ] **Step 1: Verify audit endpoint coverage**

Run:

```bash
rg -n "/audit-events|entityType|actorUserId|appointment created|admin create" docs/03-architecture/api-contract.md
```

Expected: audit list/detail filters and audit-generating actions are documented.

- [ ] **Step 2: Verify notification endpoint coverage**

Run:

```bash
rg -n "/notifications|read-all|referenceType|referenceId" docs/03-architecture/api-contract.md
```

Expected: notification list/read endpoints and reference fields are documented.

## Task 5: Backend Planning Handoff

**Files:**
- Create: `docs/04-planning/backend-implementation-plan.md`
- Modify: `docs/05-history/decision-log.md`
- Modify: `docs/05-history/changelog.md`

**Interfaces:**
- Consumes: `docs/03-architecture/api-contract.md`.
- Produces: backend implementation plan with stack decision, package order, tests and CI commands.

- [ ] **Step 1: Choose backend stack as a recorded decision**

Recommended decision:

```markdown
### DEC-009: Backend Stack

Quyết định: Dùng Node.js + NestJS + PostgreSQL cho backend CareFlow.

Lý do: NestJS phù hợp API contract-first, guard/interceptor/DTO validation, module boundaries theo domain và TypeScript shared mental model với frontend. PostgreSQL phù hợp relational data như appointments, schedules, audit events và transactional conflict validation.
```

- [ ] **Step 2: Write backend implementation plan**

Create `docs/04-planning/backend-implementation-plan.md` with packages:

- Backend scaffold and CI.
- Database schema and migrations.
- Auth/session and RBAC guards.
- Catalog resources.
- Appointment conflict engine.
- Appointment status transitions.
- Audit events and notifications.
- Frontend API client integration.

- [ ] **Step 3: Verify docs**

Run:

```bash
rg -n "T[B]D|T[O]DO|PLACEH[O]LDER|fill[ ]in|implement[ ]later" docs/04-planning/backend-implementation-plan.md docs/05-history/decision-log.md docs/05-history/changelog.md
git diff --check
```

Expected: no placeholder output and no whitespace errors.

- [ ] **Step 4: Commit backend planning handoff**

Run:

```bash
git add docs/04-planning/backend-implementation-plan.md docs/05-history/decision-log.md docs/05-history/changelog.md
git commit -m "docs: add backend implementation plan"
```

## Verification For This Plan

Run from repository root:

```bash
rg -n "T[B]D|T[O]DO|PLACEH[O]LDER|fill[ ]in|implement[ ]later" docs/03-architecture/api-contract.md docs/04-planning/api-contract-plan.md
git diff --check
```

Expected:

- Placeholder scan has no output.
- `git diff --check` has no output.

## Execution Recommendation

Use this order:

1. Finish and review API contract docs.
2. Ask the product owner to approve the backend stack decision.
3. Write `backend-implementation-plan.md`.
4. Execute backend implementation task-by-task with subagent-driven development.
