# Account Booking Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve CareFlow v1 booking, logout, account management and loading feedback without adding paid infrastructure or broad backend account editing.

**Architecture:** Keep API contracts conservative. Add a shared same-day booking guard used by patient and operations booking, backed by server-side appointment validation. Replace the standalone password page with a shared account page that reads current auth state and keeps password change in one place. Add reusable shimmer primitives and apply them to high-traffic data panels.

**Tech Stack:** React, React Router, TanStack Query, Vitest, Playwright, NestJS, Prisma, PostgreSQL.

**Spec:** Approved in chat on 2026-08-31: allow same-day booking only for slots at least 30 minutes in the future, move logout to the lower-left sidebar area with centered confirmation, add shared current-account management with password change, and add shimmer loading states.

## Global Constraints

- User-facing product copy must remain Vietnamese-first.
- No paid services or new external dependencies.
- Do not implement monthly doctor scheduling recurrence in this plan.
- Route `/app/account/security` should continue to work by redirecting to `/app/account`.
- Backend must enforce time cutoff; frontend-only validation is not sufficient.

---

### Task 1: Same-Day Booking Guard

**Files:**
- Modify: `apps/web/src/lib/dateTime.ts`
- Modify: `apps/web/src/features/appointments/appointmentAvailability.ts`
- Modify: `apps/web/src/features/patients/BookAppointmentPage.tsx`
- Modify: `apps/web/src/features/operations/CreateAppointmentPage.tsx`
- Modify: `apps/api/src/appointments/appointment-conflicts.service.ts`
- Test: `apps/web/src/features/patients/patient.test.tsx`
- Test: `apps/web/src/features/operations/operations.test.tsx`
- Test: `apps/api/test/appointment-conflicts.e2e-spec.ts`

**Interfaces:**
- Produces: `isAtLeastMinutesFromClinicNow(date: string, time: string, minutes: number, now?: Date): boolean`
- Consumes: existing `appointmentStart(date, time)` and backend `assertSlotAvailable`.

- [x] Write frontend tests showing same-day slots before `now + 30 minutes` are disabled and later slots are enabled.
- [x] Write backend E2E test showing appointment creation rejects a slot less than 30 minutes from clinic now.
- [x] Implement the shared frontend date/time guard using `Asia/Ho_Chi_Minh`.
- [x] Apply the guard to patient booking and operations appointment creation.
- [x] Implement backend guard in appointment conflict validation.
- [x] Run focused tests.

### Task 2: Account Page And Logout Placement

**Files:**
- Create: `apps/web/src/features/auth/AccountPage.tsx`
- Modify: `apps/web/src/features/auth/ChangePasswordPage.tsx`
- Modify: `apps/web/src/app/routes.tsx`
- Modify: `apps/web/src/components/navigation.ts`
- Modify: `apps/web/src/components/SidebarNav.tsx`
- Modify: `apps/web/src/components/TopBar.tsx`
- Test: `apps/web/src/features/auth/auth.test.tsx`
- Test: `apps/web/src/components/components.test.tsx`

**Interfaces:**
- Produces: shared `/app/account` route for all authenticated roles.
- Consumes: `useAuth().user`, `useAuth().linkedProfile`, `useAuth().changePassword`, `ConfirmDialog`.

- [x] Write tests showing every role has `Tài khoản của tôi` navigation.
- [x] Write tests showing `/app/account` renders current user info and password-change fields.
- [x] Write tests showing logout trigger is in the sidebar/mobile nav area and opens the centered confirmation dialog.
- [x] Implement `AccountPage`.
- [x] Redirect `ChangePasswordPage` to `/app/account`.
- [x] Move logout state/handler into sidebar-compatible components while preserving API logout behavior.
- [x] Run focused tests.

### Task 3: Shimmer Loading States

**Files:**
- Modify: `apps/web/src/components/LoadingState.tsx`
- Modify: `apps/web/src/features/patients/BookAppointmentPage.tsx`
- Modify: `apps/web/src/features/patients/MyAppointmentsPage.tsx`
- Modify: `apps/web/src/features/operations/QueuePage.tsx`
- Modify: `apps/web/src/features/operations/OperationsCalendar.tsx`
- Modify: `apps/web/src/features/operations/CreateAppointmentPage.tsx`
- Modify: `apps/web/src/features/admin/AdminAccounts.tsx`
- Modify: `apps/web/src/features/admin/AdminSchedules.tsx`
- Test: focused web feature tests that already cover these screens.

**Interfaces:**
- Produces: `ShimmerBlock`, `ShimmerList`, and `LoadingState` variants from the existing loading component module.

- [x] Add reusable shimmer primitives with stable dimensions.
- [x] Apply shimmer to selected high-traffic screens during `isLoading`.
- [x] Keep table/list layout stable while loading.
- [x] Run focused web tests.

### Task 4: Documentation And Verification

**Files:**
- Modify: `docs/03-architecture/api-contract.md`
- Modify: `docs/03-architecture/frontend-design-system.md`
- Modify: `docs/05-history/changelog.md`

- [x] Document same-day booking cutoff and account page route.
- [x] Document shimmer usage in the frontend design system.
- [ ] Run web unit, API E2E, typecheck, lint, build and `git diff --check`.
- [ ] Commit and push to `main`.
- [ ] Verify GitHub Actions, Render health commit and production smoke.
