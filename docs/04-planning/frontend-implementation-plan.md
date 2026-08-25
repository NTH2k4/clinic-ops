# Frontend MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây `apps/web` thành frontend-first MVP của CareFlow với mock auth, role-based navigation, booking flow, doctor workspace, operations workspace, admin views, audit/notifications và responsive UI theo design system.

**Architecture:** Frontend dùng React + Vite + TypeScript, chia theo feature modules và đặt toàn bộ `mock data` sau service boundary để sau này thay bằng API client. State mutation trong prototype đi qua mock service layer, không import fixture trực tiếp từ UI khi action cần thay đổi dữ liệu. UI dùng shared components bám `frontend-design-system.md`, ưu tiên operational layout, text+icon cho status, responsive list/timeline trên mobile và không dùng theme switcher trong MVP.

**Tech Stack:** React, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query, React Hook Form, Zod, lucide-react, Vitest, React Testing Library, Playwright.

**Spec:** `docs/02-product/frontend-mvp-spec.md`, `docs/03-architecture/frontend-design-system.md`, `docs/03-architecture/frontend-architecture.md`, `docs/03-architecture/data-model.md`, `docs/06-testing/acceptance-checklist.md`

## Global Constraints

- Tài liệu và UI copy hướng dự án dùng tiếng Việt theo mặc định; giữ tiếng Anh cho thuật ngữ chuyên ngành khi rõ nghĩa hơn.
- Frontend MVP là prototype dùng `mock data`; không triển khai backend thật, real authentication, payment, insurance, telemedicine, prescription hoặc full medical record.
- Patient-created appointment mặc định là `requested`; staff-created appointment mặc định là `confirmed`.
- Patient được chọn doctor cụ thể hoặc `any available doctor`; UI booking ưu tiên `any available doctor`.
- Receptionist và nurse dùng chung operations workspace.
- Theme switcher không nằm trong frontend MVP; chỉ triển khai một light theme chuyên nghiệp.
- Không lưu password trong localStorage, sessionStorage, IndexedDB hoặc persisted mock state.
- Appointment active statuses gồm `requested`, `confirmed`, `checked_in`, `in_progress`; các status này chiếm slot lịch của doctor.
- `completed`, `cancelled`, `no_show` không chiếm slot lịch.
- Một doctor không được có hai appointments active trùng thời gian.
- Status phải hiển thị bằng text và màu/icon, không chỉ dùng màu.
- Mọi list/form quan trọng cần loading, empty, error, filter-empty, success và disabled state khi phù hợp.
- Mobile không được có page-level horizontal overflow ở 360px, 768px, 1280px và 1440px.
- Verification tối thiểu khi hoàn thành: `npm test -- --run`, `npm run typecheck`, `npm run lint`, `npm run build`; nếu có Playwright thì chạy thêm `npm run e2e`.

---

## File Structure

```text
apps/web/
  README.md
  index.html
  package.json
  postcss.config.js
  tailwind.config.ts
  tsconfig.json
  tsconfig.node.json
  vite.config.ts
  src/
    main.tsx
    index.css
    app/
      App.tsx
      App.test.tsx
      providers.tsx
      routes.tsx
    components/
      AppShell.tsx
      AppointmentCard.tsx
      AppointmentTimeline.tsx
      ConfirmDialog.tsx
      DataTable.tsx
      DetailDrawer.tsx
      EmptyState.tsx
      ErrorState.tsx
      FilterBar.tsx
      FormField.tsx
      LoadingState.tsx
      MetricCard.tsx
      PageHeader.tsx
      RoleSwitcher.tsx
      SegmentedControl.tsx
      SidebarNav.tsx
      StatusBadge.tsx
      TopBar.tsx
      components.test.tsx
    features/
      admin/
        AdminDashboard.tsx
        AdminDoctors.tsx
        AdminServices.tsx
        AdminSpecialties.tsx
        AdminStaff.tsx
        AuditLog.tsx
        admin.test.tsx
      appointments/
        appointmentRules.ts
        appointmentRules.test.ts
        appointmentService.ts
        appointmentService.test.ts
        appointmentTypes.ts
      auth/
        AuthProvider.tsx
        LoginPage.tsx
        auth.test.tsx
      doctors/
        DoctorDashboard.tsx
        DoctorDaySchedule.tsx
        DoctorWeekSchedule.tsx
        doctor.test.tsx
      operations/
        CreateAppointmentPage.tsx
        OperationsCalendar.tsx
        OperationsDashboard.tsx
        QueuePage.tsx
        operations.test.tsx
      patients/
        BookAppointmentPage.tsx
        MyAppointmentsPage.tsx
        PatientHome.tsx
        ServicesPage.tsx
        patient.test.tsx
    lib/
      dateTime.ts
      format.ts
      ids.ts
      queryClient.ts
    mocks/
      fixtures.ts
      mockStore.ts
    routes/
      RequireAuth.tsx
      RoleHomeRedirect.tsx
    test/
      setupTests.ts
      render.tsx
    types/
      models.ts
  e2e/
    careflow.spec.ts
```

Responsibilities:

- `types/models.ts`: shared domain types matching `data-model.md`.
- `mocks/fixtures.ts`: initial static dataset only.
- `mocks/mockStore.ts`: mutable in-memory prototype store.
- `features/appointments/appointmentRules.ts`: pure status, conflict, slot and permission helpers.
- `features/appointments/appointmentService.ts`: async mock API facade used by UI and TanStack Query.
- `components/*`: shared UI primitives and operational components.
- `features/<feature>/*`: route-level screens and feature-specific composition.
- `app/routes.tsx`: all routes from `frontend-mvp-spec.md`.
- `e2e/careflow.spec.ts`: desktop/mobile smoke flow checks.

---

### Task 1: Scaffold `apps/web` Foundation

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/index.html`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/tsconfig.node.json`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/postcss.config.js`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/index.css`
- Create: `apps/web/src/app/App.tsx`
- Create: `apps/web/src/app/App.test.tsx`
- Create: `apps/web/src/test/setupTests.ts`
- Create: `apps/web/src/test/render.tsx`

**Interfaces:**
- Produces: runnable Vite app at `apps/web`, test setup with Vitest and React Testing Library.
- Later tasks consume: `renderWithProviders(ui: React.ReactElement)` from `src/test/render.tsx`.

- [ ] **Step 1: Create package and config files**

`apps/web/package.json` scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "typecheck": "tsc -b --pretty false",
    "test": "vitest",
    "e2e": "playwright test"
  }
}
```

Dependencies:

```text
@vitejs/plugin-react
vite
typescript
react
react-dom
react-router-dom
@tanstack/react-query
react-hook-form
@hookform/resolvers
zod
lucide-react
tailwindcss
postcss
autoprefixer
vitest
@testing-library/react
@testing-library/user-event
@testing-library/jest-dom
jsdom
eslint
typescript-eslint
eslint-plugin-react-hooks
eslint-plugin-react-refresh
playwright
```

- [ ] **Step 2: Write smoke test**

`apps/web/src/app/App.test.tsx`:

```tsx
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";
import { renderWithProviders } from "../test/render";

describe("App", () => {
  it("renders the CareFlow sign-in entry point", () => {
    renderWithProviders(<App />);
    expect(screen.getByRole("heading", { name: /CareFlow/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Đăng nhập/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run smoke test before implementation**

Run:

```sh
cd apps/web
npm test -- --run src/app/App.test.tsx
```

Expected: FAIL because `App` and `renderWithProviders` are not implemented.

- [ ] **Step 4: Implement minimal app and test helper**

`App.tsx` renders a light shell with H1 `CareFlow` and a button `Đăng nhập`.

`render.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";

export function renderWithProviders(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}
```

- [ ] **Step 5: Run foundation verification**

Run:

```sh
cd apps/web
npm test -- --run src/app/App.test.tsx
npm run typecheck
npm run build
```

Expected: all commands pass.

- [ ] **Step 6: Commit**

```sh
git add apps/web
git commit -m "feat(web): scaffold frontend app"
```

### Task 2: Add Design Tokens And Shared UI Components

**Files:**
- Modify: `apps/web/tailwind.config.ts`
- Modify: `apps/web/src/index.css`
- Create: `apps/web/src/components/StatusBadge.tsx`
- Create: `apps/web/src/components/MetricCard.tsx`
- Create: `apps/web/src/components/EmptyState.tsx`
- Create: `apps/web/src/components/LoadingState.tsx`
- Create: `apps/web/src/components/ErrorState.tsx`
- Create: `apps/web/src/components/SegmentedControl.tsx`
- Create: `apps/web/src/components/components.test.tsx`

**Interfaces:**
- Produces:
  - `StatusBadge({ status }: { status: AppointmentStatus })`
  - `MetricCard({ label, value, helper }: { label: string; value: string | number; helper?: string })`
  - `EmptyState({ title, description, action }: EmptyStateProps)`
  - `LoadingState({ label }: { label: string })`
  - `ErrorState({ title, description }: { title: string; description: string })`
  - `SegmentedControl<T extends string>({ value, options, onChange }: SegmentedControlProps<T>)`
- Consumes: `AppointmentStatus` from Task 3 after that task exists; before Task 3, define temporary union in the component test and replace with shared type in Task 3.

- [ ] **Step 1: Write component tests**

`components.test.tsx` must assert:

```tsx
expect(screen.getByText("Chờ xác nhận")).toBeInTheDocument();
expect(screen.getByLabelText("Trạng thái: Chờ xác nhận")).toBeInTheDocument();
expect(screen.getByRole("button", { name: "Ngày" })).toHaveAttribute("aria-pressed", "true");
expect(screen.getByText("Không có dữ liệu")).toBeInTheDocument();
```

- [ ] **Step 2: Run component tests before implementation**

Run:

```sh
cd apps/web
npm test -- --run src/components/components.test.tsx
```

Expected: FAIL because components do not exist.

- [ ] **Step 3: Implement CSS variables and Tailwind tokens**

Map these exact design tokens:

```css
:root {
  --color-bg: #f7fafa;
  --color-surface: #ffffff;
  --color-surface-muted: #eef6f5;
  --color-border: #d7e3e1;
  --color-border-strong: #afc6c3;
  --color-text: #172326;
  --color-text-muted: #52666b;
  --color-primary: #0f766e;
  --color-primary-hover: #0b5f59;
  --color-accent: #2563eb;
  --color-danger: #b42318;
  --color-warning: #b54708;
  --color-success: #027a48;
  --color-info: #175cd3;
}
```

- [ ] **Step 4: Implement shared components**

`StatusBadge` labels:

```ts
const labels = {
  requested: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  checked_in: "Đã check-in",
  in_progress: "Đang khám",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
  no_show: "Không đến",
} as const;
```

Include icon + label and `aria-label={`Trạng thái: ${label}`}`.

- [ ] **Step 5: Run component verification**

Run:

```sh
cd apps/web
npm test -- --run src/components/components.test.tsx
npm run typecheck
```

Expected: pass.

- [ ] **Step 6: Commit**

```sh
git add apps/web
git commit -m "feat(web): add design tokens and shared components"
```

### Task 3: Define Domain Types, Mock Data And Appointment Rules

**Files:**
- Create: `apps/web/src/types/models.ts`
- Create: `apps/web/src/mocks/fixtures.ts`
- Create: `apps/web/src/lib/dateTime.ts`
- Create: `apps/web/src/lib/ids.ts`
- Create: `apps/web/src/features/appointments/appointmentTypes.ts`
- Create: `apps/web/src/features/appointments/appointmentRules.ts`
- Create: `apps/web/src/features/appointments/appointmentRules.test.ts`
- Modify: `apps/web/src/components/StatusBadge.tsx`

**Interfaces:**
- Produces:
  - `type UserRole = "patient" | "doctor" | "receptionist" | "nurse" | "admin"`
  - `type AppointmentStatus = "requested" | "confirmed" | "checked_in" | "in_progress" | "completed" | "cancelled" | "no_show"`
  - `ACTIVE_APPOINTMENT_STATUSES: AppointmentStatus[]`
  - `isActiveAppointmentStatus(status: AppointmentStatus): boolean`
  - `appointmentsOverlap(a: TimeRange, b: TimeRange): boolean`
  - `hasDoctorConflict(input: HasDoctorConflictInput): boolean`
  - `getValidNextStatuses(status: AppointmentStatus): AppointmentStatus[]`
- Consumes: component `StatusBadge` uses shared `AppointmentStatus`.

- [ ] **Step 1: Write appointment rule tests**

`appointmentRules.test.ts` must cover:

```ts
expect(appointmentsOverlap({ startAt: "2026-08-25T09:00:00+07:00", endAt: "2026-08-25T09:30:00+07:00" }, { startAt: "2026-08-25T09:15:00+07:00", endAt: "2026-08-25T09:45:00+07:00" })).toBe(true);
expect(appointmentsOverlap({ startAt: "2026-08-25T09:00:00+07:00", endAt: "2026-08-25T09:30:00+07:00" }, { startAt: "2026-08-25T09:30:00+07:00", endAt: "2026-08-25T10:00:00+07:00" })).toBe(false);
expect(isActiveAppointmentStatus("requested")).toBe(true);
expect(isActiveAppointmentStatus("completed")).toBe(false);
expect(getValidNextStatuses("checked_in")).toEqual(["in_progress", "cancelled"]);
```

- [ ] **Step 2: Run rule tests before implementation**

Run:

```sh
cd apps/web
npm test -- --run src/features/appointments/appointmentRules.test.ts
```

Expected: FAIL because rule helpers are missing.

- [ ] **Step 3: Implement models and rules**

Implement overlap with half-open intervals:

```ts
export function appointmentsOverlap(a: TimeRange, b: TimeRange) {
  return new Date(a.startAt).getTime() < new Date(b.endAt).getTime()
    && new Date(b.startAt).getTime() < new Date(a.endAt).getTime();
}
```

`hasDoctorConflict` must return true only when `doctorId` matches, status is active and ranges overlap.

- [ ] **Step 4: Add minimum mock dataset**

`fixtures.ts` must include:

- 4 users for patient, doctor, receptionist/nurse, admin.
- 8 patients.
- 5 doctors.
- 4 specialties.
- 8 services.
- 2 weeks of doctor schedules.
- At least 30 appointments covering all statuses and one deliberate doctor conflict fixture for tests.
- At least 20 audit events.
- At least 8 notifications.

- [ ] **Step 5: Run rule verification**

Run:

```sh
cd apps/web
npm test -- --run src/features/appointments/appointmentRules.test.ts src/components/components.test.tsx
npm run typecheck
```

Expected: pass.

- [ ] **Step 6: Commit**

```sh
git add apps/web
git commit -m "feat(web): add appointment domain model"
```

### Task 4: Implement Mock Store And Service Boundary

**Files:**
- Create: `apps/web/src/mocks/mockStore.ts`
- Create: `apps/web/src/features/appointments/appointmentService.ts`
- Create: `apps/web/src/features/appointments/appointmentService.test.ts`
- Create: `apps/web/src/lib/queryClient.ts`
- Modify: `apps/web/src/app/providers.tsx`

**Interfaces:**
- Produces:
  - `appointmentService.listAppointments(filters?: AppointmentFilters): Promise<Appointment[]>`
  - `appointmentService.createPatientAppointment(input: CreatePatientAppointmentInput): Promise<Appointment>`
  - `appointmentService.createStaffAppointment(input: CreateStaffAppointmentInput): Promise<Appointment>`
  - `appointmentService.updateAppointmentStatus(id: string, status: AppointmentStatus, actorUserId: string): Promise<Appointment>`
  - `appointmentService.rescheduleAppointment(id: string, input: RescheduleAppointmentInput): Promise<Appointment>`
  - `appointmentService.cancelAppointment(id: string, input: CancelAppointmentInput): Promise<Appointment>`
  - `mockStore.reset(): void`
- Consumes: rules from Task 3.

- [ ] **Step 1: Write service tests**

Tests must assert:

```ts
await expect(appointmentService.createPatientAppointment(validInput)).resolves.toMatchObject({ status: "requested" });
await expect(appointmentService.createStaffAppointment(validStaffInput)).resolves.toMatchObject({ status: "confirmed" });
await expect(appointmentService.createStaffAppointment(conflictingInput)).rejects.toMatchObject({ code: "APPOINTMENT_CONFLICT" });
await expect(appointmentService.updateAppointmentStatus(confirmedId, "checked_in", staffUserId)).resolves.toMatchObject({ status: "checked_in" });
await expect(appointmentService.updateAppointmentStatus(completedId, "in_progress", doctorUserId)).rejects.toMatchObject({ code: "INVALID_STATUS_TRANSITION" });
```

- [ ] **Step 2: Run service tests before implementation**

Run:

```sh
cd apps/web
npm test -- --run src/features/appointments/appointmentService.test.ts
```

Expected: FAIL because service is missing.

- [ ] **Step 3: Implement mock store**

Use in-memory arrays cloned from `fixtures.ts`. `reset()` restores the original fixtures for tests.

- [ ] **Step 4: Implement service functions**

Behavior:

- Patient create computes `endAt` from `Service.durationMinutes`, validates conflict and writes `appointment_created` audit event.
- Staff create computes `endAt`, validates conflict, sets status `confirmed` and writes `appointment_created`.
- Status update accepts only valid next statuses from `getValidNextStatuses`.
- Reschedule keeps same `id`, validates conflict against other active appointments for same doctor and writes audit metadata `{ oldStartAt, oldEndAt, newStartAt, newEndAt }`.
- Cancel sets `cancelledAt`, status `cancelled`, optional `cancellationReason` and audit event.

- [ ] **Step 5: Run service verification**

Run:

```sh
cd apps/web
npm test -- --run src/features/appointments/appointmentService.test.ts
npm run typecheck
```

Expected: pass.

- [ ] **Step 6: Commit**

```sh
git add apps/web
git commit -m "feat(web): add mock appointment service"
```

### Task 5: Implement Auth, Routing And App Shell

**Files:**
- Create: `apps/web/src/features/auth/AuthProvider.tsx`
- Create: `apps/web/src/features/auth/LoginPage.tsx`
- Create: `apps/web/src/features/auth/auth.test.tsx`
- Create: `apps/web/src/routes/RequireAuth.tsx`
- Create: `apps/web/src/routes/RoleHomeRedirect.tsx`
- Create: `apps/web/src/components/AppShell.tsx`
- Create: `apps/web/src/components/SidebarNav.tsx`
- Create: `apps/web/src/components/TopBar.tsx`
- Create: `apps/web/src/components/RoleSwitcher.tsx`
- Modify: `apps/web/src/app/routes.tsx`
- Modify: `apps/web/src/app/App.tsx`

**Interfaces:**
- Produces:
  - `useAuth(): { user: User | null; signIn(userId: string): void; signOut(): void; switchRole(role: UserRole): void }`
  - Protected route behavior redirecting anonymous users to `/login`.
  - Role home redirects to `/app/patient`, `/app/doctor`, `/app/operations`, `/app/admin`.

- [ ] **Step 1: Write auth/routing tests**

Tests must assert:

```tsx
expect(screen.getByRole("heading", { name: "Đăng nhập" })).toBeInTheDocument();
await user.click(screen.getByRole("button", { name: /Patient Demo/i }));
expect(screen.getByText("Trang chính patient")).toBeInTheDocument();
await user.selectOptions(screen.getByLabelText("Chuyển vai trò"), "doctor");
expect(screen.getByText("Doctor dashboard")).toBeInTheDocument();
```

- [ ] **Step 2: Run auth tests before implementation**

Run:

```sh
cd apps/web
npm test -- --run src/features/auth/auth.test.tsx
```

Expected: FAIL because auth and routes are missing.

- [ ] **Step 3: Implement mock auth**

Auth state stays in memory. Do not store password or credential fields. Role switcher is visually secondary and labelled as prototype behavior in accessible label, not noisy in-app copy.

- [ ] **Step 4: Implement routes**

Add all routes from `frontend-mvp-spec.md`. For route screens assigned to later tasks, render temporary route pages with exact headings matching future screens, for example `Doctor dashboard`, `Operations dashboard`, `Admin dashboard`; later tasks replace those route pages with full screen implementations.

- [ ] **Step 5: Run shell verification**

Run:

```sh
cd apps/web
npm test -- --run src/features/auth/auth.test.tsx src/app/App.test.tsx
npm run typecheck
```

Expected: pass.

- [ ] **Step 6: Commit**

```sh
git add apps/web
git commit -m "feat(web): add auth routing and app shell"
```

### Task 6: Implement Patient Portal

**Trạng thái:** Hoàn thành.

**Files:**
- Create: `apps/web/src/features/patients/PatientHome.tsx`
- Create: `apps/web/src/features/patients/ServicesPage.tsx`
- Create: `apps/web/src/features/patients/BookAppointmentPage.tsx`
- Create: `apps/web/src/features/patients/MyAppointmentsPage.tsx`
- Create: `apps/web/src/features/patients/patient.test.tsx`
- Modify: `apps/web/src/app/routes.tsx`

**Interfaces:**
- Consumes: `appointmentService`, auth user, shared components.
- Produces: patient home, service browse, booking flow, appointment list/detail entry points.

- [ ] **Step 1: Write patient tests**

Tests must cover:

```tsx
expect(screen.getByRole("heading", { name: "Trang chính patient" })).toBeInTheDocument();
expect(screen.getByRole("button", { name: "Đặt lịch" })).toBeInTheDocument();
await user.click(screen.getByRole("button", { name: /Tim mạch/i }));
expect(screen.getByText(/Khám tim mạch/i)).toBeInTheDocument();
await user.click(screen.getByLabelText("Any available doctor"));
await user.click(screen.getByRole("button", { name: /09:00/i }));
await user.type(screen.getByLabelText("Lý do khám"), "Đau ngực nhẹ khi vận động");
await user.click(screen.getByRole("button", { name: "Gửi yêu cầu" }));
expect(screen.getByText("Chờ xác nhận")).toBeInTheDocument();
```

- [ ] **Step 2: Run patient tests before implementation**

Run:

```sh
cd apps/web
npm test -- --run src/features/patients/patient.test.tsx
```

Expected: FAIL because patient screens are not implemented.

- [ ] **Step 3: Implement patient home and services**

Patient home shows next appointment, recent notifications and quick action. Services page filters by specialty and shows duration, price, short description and booking action.

- [ ] **Step 4: Implement booking flow**

Steps:

1. Service/specialty.
2. Doctor mode: `any available doctor` default or specific doctor.
3. Date and slot.
4. Reason.
5. Review.
6. Submit.

Conflict behavior: unavailable slots are disabled; conflicting submit shows error text `Slot này đã có appointment active`.

- [ ] **Step 5: Implement My Appointments**

Tabs: upcoming, past, cancelled. Cancel action appears only when status is not `completed`, `cancelled`, `no_show`.

- [ ] **Step 6: Run patient verification**

Run:

```sh
cd apps/web
npm test -- --run src/features/patients/patient.test.tsx src/features/appointments/appointmentService.test.ts
npm run typecheck
```

Expected: pass.

- [ ] **Step 7: Commit**

```sh
git add apps/web
git commit -m "feat(web): add patient portal"
```

### Task 7: Implement Doctor Workspace

**Trạng thái:** Hoàn thành.

**Files:**
- Create: `apps/web/src/features/doctors/DoctorDashboard.tsx`
- Create: `apps/web/src/features/doctors/DoctorDaySchedule.tsx`
- Create: `apps/web/src/features/doctors/DoctorWeekSchedule.tsx`
- Create: `apps/web/src/features/doctors/doctor.test.tsx`
- Create: `apps/web/src/components/AppointmentTimeline.tsx`
- Create: `apps/web/src/components/DetailDrawer.tsx`
- Modify: `apps/web/src/app/routes.tsx`

**Interfaces:**
- Consumes: `appointmentService.updateAppointmentStatus`, `AppointmentTimeline`, `StatusBadge`.
- Produces: doctor dashboard/day/week route views and appointment detail actions.

- [ ] **Step 1: Write doctor tests**

Tests must assert:

```tsx
expect(screen.getByText("Waiting")).toBeInTheDocument();
await user.click(screen.getByRole("button", { name: /Start appointment/i }));
expect(screen.getByText("Đang khám")).toBeInTheDocument();
await user.click(screen.getByRole("button", { name: /Complete appointment/i }));
expect(screen.getByText("Hoàn tất")).toBeInTheDocument();
```

- [ ] **Step 2: Run doctor tests before implementation**

Run:

```sh
cd apps/web
npm test -- --run src/features/doctors/doctor.test.tsx
```

Expected: FAIL because doctor workspace is not implemented.

- [ ] **Step 3: Implement doctor dashboard**

Show today count, waiting, checked-in, in-progress, completed, next appointment and sorted appointment list.

- [ ] **Step 4: Implement day/week schedule**

Day view uses compact timeline on mobile. Week view switches to day selector + list before horizontal overflow.

- [ ] **Step 5: Implement appointment detail drawer**

Show patient summary, doctor/service/time/status, reason, internal note, status history and audit events. Disable invalid actions.

- [ ] **Step 6: Run doctor verification**

Run:

```sh
cd apps/web
npm test -- --run src/features/doctors/doctor.test.tsx
npm run typecheck
```

Expected: pass.

- [ ] **Step 7: Commit**

```sh
git add apps/web
git commit -m "feat(web): add doctor workspace"
```

### Task 8: Implement Operations Workspace

**Trạng thái:** Hoàn thành.

**Files:**
- Create: `apps/web/src/features/operations/OperationsDashboard.tsx`
- Create: `apps/web/src/features/operations/QueuePage.tsx`
- Create: `apps/web/src/features/operations/CreateAppointmentPage.tsx`
- Create: `apps/web/src/features/operations/OperationsCalendar.tsx`
- Create: `apps/web/src/features/operations/operations.test.tsx`
- Create: `apps/web/src/components/ConfirmDialog.tsx`
- Modify: `apps/web/src/app/routes.tsx`

**Interfaces:**
- Consumes: `appointmentService.createStaffAppointment`, `updateAppointmentStatus`, `rescheduleAppointment`, `cancelAppointment`.
- Produces: operations dashboard, queue, calendar and staff create appointment flow.

- [ ] **Step 1: Write operations tests**

Tests must assert:

```tsx
await user.click(screen.getByRole("button", { name: "Check-in" }));
expect(screen.getByText("Đã check-in")).toBeInTheDocument();
await user.type(screen.getByLabelText("Tìm patient"), "Nguyễn");
expect(screen.getByText(/Nguyễn/i)).toBeInTheDocument();
await user.click(screen.getByRole("button", { name: "Tạo appointment" }));
expect(screen.getByText("Đã xác nhận")).toBeInTheDocument();
```

- [ ] **Step 2: Run operations tests before implementation**

Run:

```sh
cd apps/web
npm test -- --run src/features/operations/operations.test.tsx
```

Expected: FAIL because operations workspace is not implemented.

- [ ] **Step 3: Implement operations dashboard and queue**

Dashboard shows today counts, waiting queue, checked-in, in-progress, cancelled/no-show and quick action. Queue groups confirmed, checked_in, in_progress, completed and cancelled; invalid transitions are not rendered.

- [ ] **Step 4: Implement staff create appointment**

Flow: search patient, create patient if missing, choose service, doctor/date/time, submit. Staff-created appointment status is `confirmed`.

- [ ] **Step 5: Implement operations calendar**

Desktop uses table/calendar layout. Mobile uses compact day list/timeline. Filters: doctor, specialty, status.

- [ ] **Step 6: Run operations verification**

Run:

```sh
cd apps/web
npm test -- --run src/features/operations/operations.test.tsx src/features/appointments/appointmentService.test.ts
npm run typecheck
```

Expected: pass.

- [ ] **Step 7: Commit**

```sh
git add apps/web
git commit -m "feat(web): add operations workspace"
```

### Task 9: Implement Admin, Audit And Notifications

**Trạng thái:** Hoàn thành.

**Files:**
- Create: `apps/web/src/features/admin/AdminDashboard.tsx`
- Create: `apps/web/src/features/admin/AdminDoctors.tsx`
- Create: `apps/web/src/features/admin/AdminServices.tsx`
- Create: `apps/web/src/features/admin/AdminSpecialties.tsx`
- Create: `apps/web/src/features/admin/AdminStaff.tsx`
- Create: `apps/web/src/features/admin/AuditLog.tsx`
- Create: `apps/web/src/features/admin/admin.test.tsx`
- Modify: `apps/web/src/components/TopBar.tsx`
- Modify: `apps/web/src/app/routes.tsx`

**Interfaces:**
- Produces: admin routes, audit log filters and notifications panel in top bar.
- Consumes: mock store data and audit events emitted by appointment service.

- [ ] **Step 1: Write admin tests**

Tests must assert:

```tsx
expect(screen.getByText("Doctors active")).toBeInTheDocument();
expect(screen.getByRole("table", { name: "Doctors" })).toBeInTheDocument();
await user.selectOptions(screen.getByLabelText("Entity type"), "appointment");
expect(screen.getAllByText("appointment").length).toBeGreaterThan(0);
await user.click(screen.getByRole("button", { name: "Thông báo" }));
expect(screen.getByText(/appointment/i)).toBeInTheDocument();
```

- [ ] **Step 2: Run admin tests before implementation**

Run:

```sh
cd apps/web
npm test -- --run src/features/admin/admin.test.tsx
```

Expected: FAIL because admin screens are not implemented.

- [ ] **Step 3: Implement admin dashboard**

Metrics derive from mock data, not hardcoded constants: active doctors, active services, appointments today, cancellation rate, popular services, doctor workload summary. If chart data is insufficient, show `Summary unavailable`.

- [ ] **Step 4: Implement admin lists and forms**

Doctors, services, specialties and staff views show desktop tables and mobile cards. Forms validate required fields in UI state but stay mock-only.

- [ ] **Step 5: Implement audit log and notifications**

Audit log filters by entity type/action. Notifications show timestamp, title, message, reference action and unread indicator plus text weight.

- [ ] **Step 6: Run admin verification**

Run:

```sh
cd apps/web
npm test -- --run src/features/admin/admin.test.tsx
npm run typecheck
```

Expected: pass.

- [ ] **Step 7: Commit**

```sh
git add apps/web
git commit -m "feat(web): add admin audit and notifications"
```

### Task 10: Add Frontend README, E2E Smoke Tests And Responsive QA

**Trạng thái:** Hoàn thành. E2E cover patient booking ở mobile 360px, doctor start/complete và operations check-in ở desktop; README ghi responsive QA và verification commands.

**Files:**
- Create: `apps/web/README.md`
- Create: `apps/web/e2e/careflow.spec.ts`
- Create: `apps/web/playwright.config.ts`
- Modify: `apps/web/package.json`
- Modify: `docs/04-planning/subagent-work-packages.md`
- Modify: `docs/00-project/documentation-map.md`

**Interfaces:**
- Produces: browser-level smoke coverage and frontend README patterned after the frontend sample docs.
- Consumes: all routes from previous tasks.

- [ ] **Step 1: Write Playwright tests**

`careflow.spec.ts` must cover:

```ts
test("patient can request appointment on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/login");
  await page.getByRole("button", { name: /Patient Demo/i }).click();
  await page.getByRole("link", { name: "Đặt lịch" }).click();
  await page.getByLabel("Any available doctor").check();
  await page.getByRole("button", { name: /09:00/i }).click();
  await page.getByLabel("Lý do khám").fill("Đau đầu kéo dài");
  await page.getByRole("button", { name: "Gửi yêu cầu" }).click();
  await expect(page.getByText("Chờ xác nhận")).toBeVisible();
});
```

Also cover doctor start/complete and operations check-in on desktop.

- [ ] **Step 2: Run E2E before routes are complete**

Run:

```sh
cd apps/web
npm run e2e
```

Expected: pass after Tasks 1-9 are complete. If this fails because Playwright browsers are missing, run with system Chrome path `/usr/bin/google-chrome` in `playwright.config.ts`.

- [ ] **Step 3: Write frontend README**

README sections:

- CareFlow frontend summary.
- Requirements: Node.js 22+, npm or yarn, no backend needed for frontend-first prototype.
- Development commands.
- Mock API and future API replacement.
- Auth/session strategy: mock auth only, no password in persisted storage.
- Scripts.
- Architecture links to spec/design/implementation plan.
- Verification commands.

- [ ] **Step 4: Responsive manual check**

Run dev server:

```sh
cd apps/web
npm run dev -- --host 0.0.0.0
```

Check widths: 360, 768, 1280, 1440. Confirm no page-level horizontal overflow and no text overlap in buttons/cards/status badges.

- [ ] **Step 5: Run final frontend verification**

Run:

```sh
cd apps/web
npm test -- --run
npm run typecheck
npm run lint
npm run build
npm run e2e
```

Expected: all commands pass.

- [ ] **Step 6: Commit**

```sh
git add apps/web docs/04-planning/subagent-work-packages.md docs/00-project/documentation-map.md
git commit -m "test(web): add frontend verification and README"
```

---

## Self-Review Notes

- Spec coverage: Tasks 1-5 cover scaffold, app shell, routing, auth, data/state foundation. Tasks 6-9 cover patient, doctor, operations, admin, audit and notifications. Task 10 covers frontend README, responsive QA and verification.
- Conflict handling: Tasks 3-4 explicitly implement active-status doctor overlap checks and service-level rejection for create/reschedule.
- Design system coverage: Tasks 2, 5, 6, 7, 8, 9 and 10 require shared components, status text+icon, accessibility labels, responsive layout and no theme switcher.
- Test coverage: Each implementation task starts with failing tests, then implementation, then task-specific verification.
- Execution recommendation: use `superpowers:subagent-driven-development`, one task per fresh subagent with review after each task.
