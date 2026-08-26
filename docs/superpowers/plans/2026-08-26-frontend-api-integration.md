# Frontend API Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a guarded API data mode to `apps/web` and migrate CareFlow frontend workflows from mock services to the NestJS `/api/v1` backend without breaking the existing mock prototype.

**Architecture:** Keep `VITE_DATA_SOURCE=mock` as the default until the API mode has full regression coverage. Add a small API client layer under `apps/web/src/lib/api/`, then route existing providers/services through mock-or-API adapters so components do not call `fetch` directly. Backend remains the source of truth for auth, authorization, appointment conflicts, status transitions, audit logs, and notifications.

**Tech Stack:** React + Vite + TypeScript, TanStack Query, Vitest + Testing Library, Playwright, NestJS API at `/api/v1`.

**Spec:** `docs/04-planning/frontend-api-integration-plan.md`

## Global Constraints

- `VITE_DATA_SOURCE=mock` is the default and must keep existing fixtures, `mockStore`, demo role switching, and current scripts working.
- `VITE_DATA_SOURCE=api` selects API services for migrated workflows; do not mix mock reads with API mutations inside one workflow.
- `VITE_API_BASE_URL=/api/v1` is used only in API mode.
- No route-level UI or TanStack Query consumer boundaries should be rewritten unless needed to swap the data boundary.
- Components and route files must not call `fetch` directly; API calls live in `apps/web/src/lib/api/` or feature service adapters.
- API success envelopes are `{ data, meta }`; API error envelopes are `{ error, meta }`.
- `ApiClientError` must preserve `code`, `message`, `fields`, and `requestId`.
- `401 UNAUTHENTICATED` clears session and TanStack Query cache; `403 FORBIDDEN` must not retry.
- API mode must not store bearer tokens in `localStorage`, `sessionStorage`, or `IndexedDB`.
- Date-only values remain `yyyy-MM-dd`; datetimes remain ISO 8601 with timezone.
- Frontend must not compute appointment `endAt`, status transitions, audit events, or conflict decisions in API mode.
- Mock Playwright smoke tests must remain green while API-mode tests are added separately.

---

### Task 1: API Foundation And Data Mode Switch

**Files:**
- Create: `apps/web/src/lib/dataSource.ts`
- Create: `apps/web/src/lib/api/types.ts`
- Create: `apps/web/src/lib/api/errors.ts`
- Create: `apps/web/src/lib/api/http.ts`
- Create: `apps/web/src/lib/api/auth.ts`
- Create: `apps/web/src/lib/api/api.test.ts`
- Modify: `apps/web/src/vite-env.d.ts`

**Interfaces:**
- Produces: `dataSource`, `isApiMode`, `apiBaseUrl`, `ApiClientError`, `apiRequest<T>()`, `createApiHttpClient()`, `authApi.login()`, `authApi.logout()`, `authApi.me()`.
- Consumes: backend auth endpoints `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`.

- [ ] **Step 1: Write RED tests for data-source defaults and API env parsing**

  Add tests in `apps/web/src/lib/api/api.test.ts`:

  ```ts
  import { describe, expect, it, vi } from "vitest";

  describe("API data source config", () => {
    it("defaults to mock mode and /api/v1 base URL", async () => {
      vi.resetModules();
      vi.stubEnv("VITE_DATA_SOURCE", undefined);
      vi.stubEnv("VITE_API_BASE_URL", undefined);

      const config = await import("../dataSource");

      expect(config.dataSource).toBe("mock");
      expect(config.isApiMode).toBe(false);
      expect(config.apiBaseUrl).toBe("/api/v1");
    });

    it("enables API mode only for the api data source value", async () => {
      vi.resetModules();
      vi.stubEnv("VITE_DATA_SOURCE", "api");
      vi.stubEnv("VITE_API_BASE_URL", "https://api.example.test/api/v1");

      const config = await import("../dataSource");

      expect(config.dataSource).toBe("api");
      expect(config.isApiMode).toBe(true);
      expect(config.apiBaseUrl).toBe("https://api.example.test/api/v1");
    });
  });
  ```

- [ ] **Step 2: Write RED tests for envelope parsing, auth header, and errors**

  In the same test file, add tests that create a fake fetch function and call `createApiHttpClient({ baseUrl: "/api/v1", getToken: () => "token-1", onUnauthenticated })`. Assert:
  - a `GET /auth/me` success returns `body.data`
  - request headers include `Authorization: Bearer token-1`
  - a `400` error envelope throws `ApiClientError` with `code`, `message`, `fields`, `requestId`
  - a `401 UNAUTHENTICATED` error calls `onUnauthenticated`

- [ ] **Step 3: Run RED tests**

  Run: `npm test -- api.test.ts --run`

  Expected: fail because `dataSource`, `http`, `errors`, and `auth` modules do not exist yet.

- [ ] **Step 4: Implement data-source config**

  Create `apps/web/src/lib/dataSource.ts`:

  ```ts
  export type DataSource = "mock" | "api";

  const rawDataSource = import.meta.env.VITE_DATA_SOURCE;

  export const dataSource: DataSource = rawDataSource === "api" ? "api" : "mock";
  export const isApiMode = dataSource === "api";
  export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api/v1";
  ```

  Extend `apps/web/src/vite-env.d.ts`:

  ```ts
  interface ImportMetaEnv {
    readonly VITE_DATA_SOURCE?: "mock" | "api";
    readonly VITE_API_BASE_URL?: string;
  }
  ```

- [ ] **Step 5: Implement API error and envelope types**

  Create `types.ts` with `ApiMeta`, `ApiSuccess<T>`, `ApiErrorEnvelope`, `ApiListMeta`, and `ApiListResponse<T>`.

  Create `errors.ts`:

  ```ts
  export class ApiClientError extends Error {
    constructor(
      public readonly code: string,
      message: string,
      public readonly requestId?: string,
      public readonly fields?: Record<string, string[]>,
      public readonly status?: number,
    ) {
      super(message);
      this.name = "ApiClientError";
    }
  }
  ```

- [ ] **Step 6: Implement HTTP client**

  Create `http.ts` with:

  ```ts
  interface ApiHttpClientOptions {
    baseUrl: string;
    getToken: () => string | null;
    onUnauthenticated?: () => void;
    fetcher?: typeof fetch;
  }

  export function createApiHttpClient(options: ApiHttpClientOptions) {
    return {
      request<T>(path: string, init?: RequestInit): Promise<T> {
        // Build `${baseUrl}${path}`, add JSON headers, add Authorization when token exists,
        // parse JSON envelope, return `data`, throw ApiClientError for error envelopes.
      },
    };
  }
  ```

  The implementation must not retry requests.

- [ ] **Step 7: Implement auth API module**

  Create `auth.ts` with:

  ```ts
  import type { User, Patient, Doctor } from "../../types/models";

  export interface AuthSession {
    sessionToken: string;
    user: User;
    linkedProfile?: Patient | Doctor;
  }

  export interface AuthApi {
    login(input: { email: string; password: string }): Promise<AuthSession>;
    logout(): Promise<void>;
    me(): Promise<Omit<AuthSession, "sessionToken">>;
  }
  ```

  Export `createAuthApi(request)` so `AuthProvider` can inject the current token-aware client later.

- [ ] **Step 8: Run GREEN checks and commit**

  Run:
  - `npm test -- api.test.ts --run`
  - `npm run typecheck`
  - `npm run lint`
  - `npm test -- --run`

  Commit: `feat(web): add API client foundation`

### Task 2: API Auth Mode In AuthProvider And LoginPage

**Files:**
- Modify: `apps/web/src/features/auth/AuthProvider.tsx`
- Modify: `apps/web/src/features/auth/LoginPage.tsx`
- Modify: `apps/web/src/components/RoleSwitcher.tsx`
- Modify: `apps/web/src/features/auth/auth.test.tsx`
- Modify: `apps/web/src/test/render.tsx`

**Interfaces:**
- Consumes: `isApiMode`, `createApiHttpClient()`, `createAuthApi()`, `queryClient`.
- Produces: `AuthContextValue` with async `signIn`, async `signOut`, `switchRole` available only in mock mode, and optional `authError`.

- [ ] **Step 1: Write RED tests for mock mode preservation**

  In `auth.test.tsx`, assert current demo login and role switcher behavior still works when `VITE_DATA_SOURCE` is unset.

- [ ] **Step 2: Write RED tests for API mode auth**

  Mock `global.fetch` and set `VITE_DATA_SOURCE=api`. Assert:
  - LoginPage renders email/password fields instead of demo account buttons.
  - submitting patient credentials calls `POST /api/v1/auth/login`.
  - returned `sessionToken` is kept in provider state and not written to web storage.
  - `RoleSwitcher` is not rendered in API mode.
  - `signOut` calls `POST /api/v1/auth/logout` and clears `queryClient`.

- [ ] **Step 3: Run RED tests**

  Run: `npm test -- auth.test.tsx --run`

  Expected: API mode tests fail because AuthProvider and LoginPage are still mock-only.

- [ ] **Step 4: Implement API-aware AuthProvider**

  Keep mock behavior unchanged when `isApiMode` is false. In API mode:
  - hold `sessionToken` in React state only
  - create a token-aware API client
  - `signIn` accepts `{ email, password }`, calls `authApi.login`, stores `user` and token
  - `signOut` calls `authApi.logout`, clears token/user, and calls `queryClient.clear()`
  - `switchRole` is a no-op or throws a clear error in API mode, but no UI should call it
  - `onUnauthenticated` clears token/user/query cache

- [ ] **Step 5: Implement API login UI**

  In mock mode, preserve the existing demo buttons and copy. In API mode, render email/password fields and submit button. Login errors should show the API message without exposing token values.

- [ ] **Step 6: Hide role switcher in API mode**

  In `RoleSwitcher.tsx`, return `null` when `isApiMode` is true.

- [ ] **Step 7: Run GREEN checks and commit**

  Run:
  - `npm test -- auth.test.tsx --run`
  - `npm run typecheck`
  - `npm run lint`
  - `npm test -- --run`

  Commit: `feat(web): add API auth mode`

### Task 3: Catalog API Adapters And Read Migration

**Files:**
- Create: `apps/web/src/lib/api/catalog.ts`
- Create: `apps/web/src/lib/api/mappers.ts`
- Create: `apps/web/src/features/catalog/catalogService.ts`
- Create: `apps/web/src/features/catalog/catalogService.test.ts`
- Modify: patient, operations, doctor, and admin pages that read `mockStore.services`, `mockStore.specialties`, or `mockStore.doctors`.

**Interfaces:**
- Produces: `catalogService.listServices()`, `listSpecialties()`, `listDoctors()` using mock mode or API mode behind the same methods.
- Consumes: backend `GET /services`, `GET /specialties`, `GET /doctors`.

- [ ] **Step 1: Write RED adapter tests**

  In `catalogService.test.ts`, assert mock mode returns active fixture services and API mode calls `/services`, `/specialties`, `/doctors` with bearer auth and maps `{ data, meta }` to existing `Service`, `Specialty`, `Doctor` models.

- [ ] **Step 2: Run RED tests**

  Run: `npm test -- catalogService.test.ts --run`

  Expected: fail because the service does not exist.

- [ ] **Step 3: Implement API catalog client and mappers**

  Implement `lib/api/catalog.ts` with list calls and query serialization for `status`, `q`, `specialtyId`, `serviceId`, `page`, `pageSize`. Implement mapper functions that preserve existing model field names.

- [ ] **Step 4: Implement feature catalog service**

  `catalogService` should choose mock or API mode once per call. Mock mode reads `mockStore`; API mode uses injected or default API clients.

- [ ] **Step 5: Replace direct catalog mock reads in UI**

  Migrate read-only catalog consumers to `useQuery` and `catalogService` without changing visual layout. Keep local filtering only for already-loaded mock data; API mode should pass filters to backend where available.

- [ ] **Step 6: Run GREEN checks and commit**

  Run:
  - `npm test -- catalogService.test.ts --run`
  - `npm test -- --run`
  - `npm run typecheck`
  - `npm run lint`

  Commit: `feat(web): integrate catalog API reads`

### Task 4: Patient And Appointment API Workflows

**Files:**
- Create: `apps/web/src/lib/api/patients.ts`
- Create: `apps/web/src/lib/api/appointments.ts`
- Modify: `apps/web/src/features/appointments/appointmentService.ts`
- Modify: `apps/web/src/features/appointments/appointmentService.test.ts`
- Modify: patient, doctor, and operations workflow pages using appointments or patients.

**Interfaces:**
- Consumes: backend patients and appointments endpoints, including list/detail/create/reschedule/cancel/confirm/check-in/start/complete/no-show.
- Produces: API-mode `appointmentService` methods with the existing UI-facing signatures where possible.

- [ ] **Step 1: Write RED appointment API service tests**

  Extend `appointmentService.test.ts` or add an API-specific describe block. Assert API mode:
  - patient creation calls `POST /appointments` without `endAt`
  - staff creation calls `POST /appointments` and renders returned `confirmed` status
  - conflict errors surface as `APPOINTMENT_CONFLICT`
  - status update maps `checked_in` to `/appointments/:id/check-in`, `in_progress` to `/start`, `completed` to `/complete`, `confirmed` to `/confirm`, `no_show` to `/no-show`
  - cancellation calls `/appointments/:id/cancel`
  - reschedule calls `PATCH /appointments/:id`

- [ ] **Step 2: Run RED tests**

  Run: `npm test -- appointmentService.test.ts --run`

  Expected: fail because API mode still uses mock implementation.

- [ ] **Step 3: Implement patients and appointments API modules**

  Add typed API functions for patient list/detail/create/update and appointment list/detail/create/update/cancel/status transitions. Do not compute `endAt` in API mode.

- [ ] **Step 4: Refactor appointmentService to mode-aware adapter**

  Preserve all mock tests and mock behavior. In API mode, route all operations to backend and map `ApiClientError` into the existing `AppointmentServiceError` shape used by UI error handlers.

- [ ] **Step 5: Migrate workflow pages**

  Replace direct `mockStore.appointments` and `mockStore.patients` reads with query-backed services for patient portal, doctor schedules/dashboard, operations queue/calendar/create appointment, and detail drawer. Keep the rendered UI structure stable.

- [ ] **Step 6: Run GREEN checks and commit**

  Run:
  - `npm test -- appointmentService.test.ts --run`
  - `npm test -- patient.test.tsx operations.test.tsx doctor.test.tsx --run`
  - `npm run typecheck`
  - `npm run lint`
  - `npm test -- --run`

  Commit: `feat(web): integrate patient appointment APIs`

### Task 5: Notifications And Audit API Workflows

**Files:**
- Create: `apps/web/src/lib/api/notifications.ts`
- Create: `apps/web/src/lib/api/audit-events.ts`
- Create: `apps/web/src/features/notifications/notificationService.ts`
- Create: `apps/web/src/features/audit/auditService.ts`
- Modify: `apps/web/src/components/TopBar.tsx`
- Modify: `apps/web/src/components/DetailDrawer.tsx`
- Modify: `apps/web/src/features/admin/AuditLog.tsx`
- Modify: `apps/web/src/features/admin/admin.test.tsx`

**Interfaces:**
- Consumes: backend `GET /notifications`, `POST /notifications/:id/read`, `POST /notifications/read-all`, `GET /audit-events`, `GET /audit-events/:id`.
- Produces: query-backed notification and audit services for API mode while preserving mock mode behavior.

- [ ] **Step 1: Write RED tests for notifications and audit**

  Extend `admin.test.tsx` and component tests to assert API mode:
  - TopBar loads notifications for the signed-in user through `/notifications`
  - mark-read calls the backend and refetches unread count
  - AuditLog passes entity/action filters to `/audit-events`
  - DetailDrawer loads appointment audit events from API in API mode

- [ ] **Step 2: Run RED tests**

  Run: `npm test -- admin.test.tsx components.test.tsx --run`

  Expected: API mode tests fail because these paths still read `mockStore`.

- [ ] **Step 3: Implement notification and audit API modules**

  Add API modules with list, detail, mark-read, and mark-all-read calls. Preserve request IDs in thrown `ApiClientError`.

- [ ] **Step 4: Implement feature services and migrate UI**

  Use TanStack Query for TopBar notification state and AuditLog data. Preserve mock mode behavior and current layout.

- [ ] **Step 5: Run GREEN checks and commit**

  Run:
  - `npm test -- admin.test.tsx components.test.tsx --run`
  - `npm test -- --run`
  - `npm run typecheck`
  - `npm run lint`

  Commit: `feat(web): integrate notifications and audit APIs`

### Task 6: API-Mode Playwright And CI Gate

**Files:**
- Create: `apps/web/e2e/api-careflow.spec.ts`
- Modify: `apps/web/playwright.config.ts`
- Modify: `.github/workflows/api-ci.yml`
- Modify: `apps/web/README.md`
- Modify: `docs/05-history/changelog.md`
- Modify: `docs/05-history/release-notes.md`

**Interfaces:**
- Consumes: `VITE_DATA_SOURCE=api`, `VITE_API_BASE_URL`, seeded backend database.
- Produces: API-mode Playwright coverage alongside existing mock smoke tests.

- [ ] **Step 1: Write API-mode Playwright tests**

  Add tests covering:
  - patient login, appointment request, duplicate-slot conflict message
  - receptionist login, staff appointment create, confirmed appointment check-in
  - doctor login, start checked-in appointment, complete in-progress appointment
  - admin login, audit filtering, notification reference navigation
  - unauthorized route redirects and forbidden action does not mutate UI

- [ ] **Step 2: Configure API-mode Playwright server**

  Update Playwright config to support a separate command for API mode. It must start the API with test `DATABASE_URL`, migrate and seed before tests, and start Vite with `VITE_DATA_SOURCE=api`.

- [ ] **Step 3: Keep mock smoke as default**

  Existing `npm run e2e` must keep running mock mode. Add a separate script such as `npm run e2e:api` for API mode.

- [ ] **Step 4: Update CI and docs**

  Update CI to run both mock and API-mode gates. Document environment variables, local commands, and the fact that mock mode remains the default until production API hosting/CORS is configured.

- [ ] **Step 5: Run final GREEN checks and commit**

  Run:
  - `npm test -- --run`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `npm run e2e`
  - `DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run e2e:api`
  - from `apps/api`: `DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run test:e2e -- --runInBand`

  Commit: `ci(web): add API mode regression gate`
