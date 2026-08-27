# Account Administration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` for implementation. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn thiện auth/account lifecycle tối thiểu cho CareFlow v1 để người dùng có thể đăng ký patient account, đăng nhập, đổi mật khẩu và để admin quản lý trạng thái/reset tài khoản an toàn cho demo.

**Architecture:** Giữ `User` là auth identity và `AuthSession` là session store hiện có. Public registration chỉ tạo patient account; staff, doctor và admin accounts chỉ được tạo hoặc điều chỉnh qua admin-protected endpoints. Frontend API mode dùng backend làm source of truth; mock mode vẫn giữ demo role selection cho local prototype và regression.

**Tech Stack:** NestJS, Prisma, PostgreSQL, bcryptjs, Zod, React, Vite, TypeScript, TanStack Query, Playwright, GitHub Actions, Render Free Web Service.

**Spec:** `docs/04-planning/careflow-v1-delivery-roadmap.md`, `docs/04-planning/careflow-v1-subagent-execution-plan.md`, `docs/03-architecture/security-notes.md`, `docs/03-architecture/api-contract.md`.

## Global Constraints

- Không lưu plaintext password trong database, logs, frontend storage hoặc documentation.
- Public registration chỉ được tạo `patient`; không cho public tạo `doctor`, `receptionist`, `nurse` hoặc `admin`.
- Session token tiếp tục chỉ lưu trong memory ở frontend API mode.
- Admin reset password dùng demo-safe generated password response một lần trong response body; không ghi password vào audit metadata hoặc logs.
- Không thêm external email/SMS provider, SSO hoặc paid infrastructure trong Phase 2.
- Mọi endpoint mới phải có role gate, Zod validation và E2E coverage.
- Mọi thay đổi API contract phải cập nhật `docs/03-architecture/api-contract.md` và `docs/03-architecture/openapi.json` trong cùng task implementation.
- Tài liệu người dùng/status tiếp tục viết tiếng Việt; technical terms giữ tiếng Anh khi rõ hơn.

---

## File Structure

- `apps/api/src/auth/auth.controller.ts`: thêm `POST /auth/register`, `POST /auth/change-password`.
- `apps/api/src/auth/auth.service.ts`: thêm registration, password change, password hashing helper, session revocation sau password change nếu cần.
- `apps/api/src/auth/auth.dto.ts`: Zod schemas cho login hiện có, register và change password.
- `apps/api/src/users/users.module.ts`: module admin account lifecycle.
- `apps/api/src/users/users.controller.ts`: admin endpoints list/detail/create/reset/lock/unlock/deactivate.
- `apps/api/src/users/users.service.ts`: user query/update/reset logic, role constraints, audit calls.
- `apps/api/src/users/users.dto.ts`: Zod schemas cho admin user filters và mutation payloads.
- `apps/api/src/audit/audit.service.ts`: reuse `record` behavior cho account lifecycle events; chỉ mở rộng helper nếu cần để tránh duplicate metadata code.
- `apps/api/test/auth.e2e-spec.ts`: registration/password-change/session regression.
- `apps/api/test/users.e2e-spec.ts`: admin account lifecycle regression.
- `apps/web/src/lib/api/auth.ts`: thêm `register` và `changePassword`.
- `apps/web/src/lib/api/users.ts`: admin user API client.
- `apps/web/src/features/auth/RegisterPage.tsx`: patient registration UI.
- `apps/web/src/features/auth/ChangePasswordPage.tsx`: authenticated password change UI.
- `apps/web/src/features/admin/AdminAccounts.tsx`: admin account management UI.
- `apps/web/src/app/routes.tsx`: thêm `/register`, `/app/account/security`, `/app/admin/accounts`.
- `apps/web/src/features/auth/auth.test.tsx`: auth UI/API unit coverage.
- `apps/web/e2e/*.spec.ts`: Playwright coverage cho registration/login/password/admin account flow.
- `docs/03-architecture/api-contract.md`: ghi endpoint mới sau implementation.
- `docs/03-architecture/openapi.json`: machine-readable contract cho endpoint mới.
- `docs/03-architecture/security-notes.md`: cập nhật auth/account lifecycle security notes.
- `docs/06-testing/acceptance-checklist.md`: thêm acceptance evidence cho Phase 2.
- `docs/05-history/changelog.md`, `docs/05-history/release-notes.md`: ghi thay đổi và verification.

## Task 1: Public Patient Registration API

**Files:**
- Modify: `apps/api/src/auth/auth.controller.ts`
- Modify: `apps/api/src/auth/auth.service.ts`
- Create: `apps/api/src/auth/auth.dto.ts`
- Test: `apps/api/test/auth.e2e-spec.ts`

**Interfaces:**
- Consumes: `PrismaService`, `successEnvelope`, `ApiError`, `SessionGuard`.
- Produces: `AuthService.registerPatient(input): Promise<AuthLoginResult>`; later frontend task consumes `POST /api/v1/auth/register`.

- [ ] **Step 1: Write failing E2E tests**

Add tests that verify:

```ts
await request(server)
  .post("/api/v1/auth/register")
  .send({
    displayName: "Nguyen Patient",
    email: "new.patient@example.test",
    phone: "+84919990001",
    password: "careflow-demo-123",
  })
  .expect(201);

await request(server)
  .post("/api/v1/auth/register")
  .send({
    displayName: "Bad Role",
    email: "bad.role@example.test",
    phone: "+84919990002",
    password: "careflow-demo-123",
    role: "admin",
  })
  .expect(400);
```

Run: `DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run test:e2e -- --runInBand auth.e2e-spec.ts`

Expected: fail because `/auth/register` is not implemented.

- [ ] **Step 2: Implement DTO and endpoint**

Create strict Zod schema with `displayName`, `email`, `phone`, `password`; reject unknown fields so role injection fails.

- [ ] **Step 3: Implement patient account creation**

Inside one Prisma transaction:

- Create `User` with `role=patient`, `status=active`, bcrypt `passwordHash`.
- Create linked `Patient` with `userId`, `fullName`, `email`, `phone`, `status=active`.
- Create `AuthSession` and return the same response shape as login.

- [ ] **Step 4: Run targeted E2E and unit tests**

Run:

```bash
cd apps/api
DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run test:e2e -- --runInBand auth.e2e-spec.ts
npm test -- --runInBand
```

Expected: registration tests pass and existing auth/session tests remain pass.

## Task 2: Authenticated Password Change API

**Files:**
- Modify: `apps/api/src/auth/auth.controller.ts`
- Modify: `apps/api/src/auth/auth.service.ts`
- Modify: `apps/api/src/auth/auth.dto.ts`
- Test: `apps/api/test/auth.e2e-spec.ts`

**Interfaces:**
- Consumes: `SessionGuard` and authenticated request.
- Produces: `AuthService.changePassword(userId, input): Promise<void>`.

- [ ] **Step 1: Write failing E2E tests**

Add tests that verify:

- Current password is required.
- Wrong current password returns `401` or `400` with a stable public message.
- New password is bcrypt-hashed and old password no longer works.
- Existing bearer token is revoked after successful password change, then user can log in with the new password.

- [ ] **Step 2: Implement endpoint**

Add `POST /auth/change-password` guarded by `SessionGuard`.

Request shape:

```json
{
  "currentPassword": "careflow-demo",
  "newPassword": "careflow-demo-456"
}
```

- [ ] **Step 3: Implement service logic**

Verify current password with bcrypt, update `User.passwordHash`, revoke active sessions for that user and return `{}`.

- [ ] **Step 4: Verify**

Run:

```bash
cd apps/api
DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run test:e2e -- --runInBand auth.e2e-spec.ts
npm run typecheck
npm run lint
```

## Task 3: Admin Account Lifecycle API

**Files:**
- Create: `apps/api/src/users/users.module.ts`
- Create: `apps/api/src/users/users.controller.ts`
- Create: `apps/api/src/users/users.service.ts`
- Create: `apps/api/src/users/users.dto.ts`
- Modify: `apps/api/src/app.module.ts`
- Test: `apps/api/test/users.e2e-spec.ts`

**Interfaces:**
- Consumes: `RolesGuard`, `@Roles("admin")`, `PrismaService`, `AuditService`.
- Produces: admin endpoints under `/api/v1/users`.

- [ ] **Step 1: Write failing admin E2E tests**

Cover:

- Admin can list users with `role`, `status`, `q`.
- Non-admin receives `403`.
- Admin can lock and unlock a user.
- Locked user cannot log in and existing sessions stop authorizing requests.
- Admin reset returns a generated temporary password once and does not store plaintext.

- [ ] **Step 2: Implement list/detail endpoints**

Add:

- `GET /users`
- `GET /users/:id`

Return `id`, `displayName`, `email`, `phone`, `role`, `status`, `createdAt`, `updatedAt`, and linked profile summary. Never return `passwordHash`.

- [ ] **Step 3: Implement status actions**

Add:

- `POST /users/:id/lock`
- `POST /users/:id/unlock`
- `POST /users/:id/deactivate`

Reject self-lock/self-deactivate for the acting admin. Revoke active sessions when locking or deactivating a user.

- [ ] **Step 4: Implement admin reset password**

Add `POST /users/:id/reset-password`. Generate a temporary password using `crypto.randomBytes`, hash it with bcrypt, revoke existing sessions and return:

```json
{
  "temporaryPassword": "generated-value"
}
```

Do not include the temporary password in audit metadata.

- [ ] **Step 5: Verify**

Run:

```bash
cd apps/api
DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run test:e2e -- --runInBand users.e2e-spec.ts auth.e2e-spec.ts
npm test -- --runInBand
npm run typecheck
npm run lint
npm run build
npm audit --audit-level=high
```

## Task 4: API Contract And Security Docs

**Files:**
- Modify: `docs/03-architecture/api-contract.md`
- Modify: `docs/03-architecture/openapi.json`
- Modify: `docs/03-architecture/security-notes.md`
- Modify: `docs/03-architecture/backend-architecture.md`
- Test: `apps/api/src/openapi-contract.spec.ts`

**Interfaces:**
- Consumes: implemented endpoints from Tasks 1-3.
- Produces: updated human and machine-readable API contract.

- [ ] **Step 1: Update markdown contract**

Add auth endpoints:

- `POST /auth/register`
- `POST /auth/change-password`

Update Users section from planned to implemented for:

- `GET /users`
- `GET /users/{id}`
- `POST /users/{id}/lock`
- `POST /users/{id}/unlock`
- `POST /users/{id}/deactivate`
- `POST /users/{id}/reset-password`

- [ ] **Step 2: Update OpenAPI**

Add paths and schemas for register, change password, user list/detail, status actions and reset password.

- [ ] **Step 3: Verify contract**

Run:

```bash
cd apps/api
npm test -- --runInBand src/openapi-contract.spec.ts
npm run typecheck
```

## Task 5: Frontend Auth Entry UI

**Files:**
- Modify: `apps/web/src/lib/api/auth.ts`
- Modify: `apps/web/src/features/auth/AuthProvider.tsx`
- Modify: `apps/web/src/features/auth/LoginPage.tsx`
- Create: `apps/web/src/features/auth/RegisterPage.tsx`
- Create: `apps/web/src/features/auth/ChangePasswordPage.tsx`
- Modify: `apps/web/src/app/routes.tsx`
- Test: `apps/web/src/features/auth/auth.test.tsx`

**Interfaces:**
- Consumes: `POST /auth/register`, `POST /auth/change-password`, existing auth context.
- Produces: public register route and authenticated security route.

- [ ] **Step 1: Write failing UI tests**

Cover:

- Login page links to registration.
- Registration form submits `displayName`, `email`, `phone`, `password`.
- Successful registration routes patient to `/app/patient`.
- Change password form requires current and new password and signs out after success.

- [ ] **Step 2: Implement API client and provider methods**

Add:

- `authApi.register(input)`
- `authApi.changePassword(input)`
- `register(input)` method in `AuthProvider`
- `changePassword(input)` method in `AuthProvider`

- [ ] **Step 3: Implement pages and routes**

Add:

- `/register`
- `/app/account/security`

Keep UI compact and operational. Do not add a marketing landing page.

- [ ] **Step 4: Verify web static gates**

Run:

```bash
cd apps/web
npm test -- --run
npm run typecheck
npm run lint
npm run build
```

## Task 6: Admin Accounts UI

**Files:**
- Create: `apps/web/src/lib/api/users.ts`
- Create: `apps/web/src/features/admin/AdminAccounts.tsx`
- Modify: `apps/web/src/components/SidebarNav.tsx`
- Modify: `apps/web/src/app/routes.tsx`
- Test: `apps/web/src/features/admin/admin.test.tsx`

**Interfaces:**
- Consumes: `/users` admin endpoints from Task 3.
- Produces: admin account management screen.

- [ ] **Step 1: Write failing UI tests**

Cover:

- Admin sees Accounts nav item.
- User table renders email, role and status.
- Lock/unlock action calls the correct endpoint.
- Reset password shows the temporary password once in a controlled result panel and does not persist it.

- [ ] **Step 2: Implement users API client**

Implement list, lock, unlock, deactivate and reset methods with bearer auth through `createSessionApiHttpClient`.

- [ ] **Step 3: Implement admin page**

Use a dense table with filters for role/status/search. Keep status actions explicit and avoid nested cards.

- [ ] **Step 4: Verify**

Run:

```bash
cd apps/web
npm test -- --run
npm run typecheck
npm run lint
```

## Task 7: End-To-End Verification And Release Docs

**Files:**
- Modify: `apps/web/e2e/*.spec.ts`
- Modify: `docs/06-testing/acceptance-checklist.md`
- Modify: `docs/05-history/changelog.md`
- Modify: `docs/05-history/release-notes.md`
- Modify: `docs/04-planning/mvp-release-readiness.md`

**Interfaces:**
- Consumes: all API and UI work from Tasks 1-6.
- Produces: documented verification evidence for Phase 2.

- [ ] **Step 1: Add Playwright API-mode auth flow**

Cover patient registration, login, booking access after registration, password change and admin account action smoke.

- [ ] **Step 2: Run full verification**

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

- [ ] **Step 3: Update docs with results**

Record exact command results, commit SHA and any known constraints. Do not mark Phase 2 complete until API, Web and docs verification pass.

## Review Gates

- Security review: no plaintext password leaks, no token persistence, no public privileged registration.
- API review: role gates, ownership behavior and audit metadata are explicit.
- Frontend review: registration and password flows are usable on mobile and desktop, with no hidden role escalation.
- Contract review: `api-contract.md` and `openapi.json` match implemented endpoints.
- Deployment review: production health/login/register smoke is run before Phase 2 is marked complete.

## Execution Choice

Recommended execution mode after user approval: **Subagent-Driven**.

Package split:

- API auth implementer: Tasks 1-2.
- Admin account API implementer: Task 3.
- Contract/docs implementer: Task 4.
- Frontend auth implementer: Task 5.
- Frontend admin implementer: Task 6.
- Verification/release implementer: Task 7.
