# Backend Next Steps Plan

## Document Control

| Field            | Value                                                                                                                  |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Status           | Active baseline                                                                                                        |
| Primary audience | AI agents, subagents and senior engineers planning backend work                                                        |
| Last updated     | 2026-08-27                                                                                                             |
| Inputs           | Implemented backend on `main`, merged frontend API integration, backend architecture docs, checked-in OpenAPI baseline |

## Purpose

This plan defines the next backend-facing work after the MVP API implementation. It is written in English because agent and subagent execution plans should optimize for reliable task execution.

## Current Baseline

The backend on `main` has:

- NestJS API under `apps/api`.
- Prisma/PostgreSQL schema and initial migration.
- Deterministic local/test seed data.
- Persisted bearer demo auth sessions with expiry and logout revocation.
- Catalog, patients, scheduling, appointments, audit and notifications modules.
- Appointment conflict checks and status transition enforcement.
- API CI with typecheck, lint, unit tests, E2E tests, build and dependency audit.
- Frontend API integration merged into `main` with mock mode remaining the default local runtime data source.
- Checked-in OpenAPI baseline at `docs/03-architecture/openapi.json`, validated by `apps/api/src/openapi-contract.spec.ts` in API CI.
- Free deployment target selected: one Render Free Web Service serving both React and NestJS, with Neon Free Postgres as the external database.

The next backend-facing work should start from deployment/auth/observability decisions instead of redoing the completed backend MVP or frontend integration work.

## Workstream 1: Integrate Frontend API Branch

Status: completed on `main`.

Goal: move the verified frontend API integration into the main development line.

Recommended actions:

1. Inspect the `frontend-api-integration` branch status and compare it with `main`.
2. Decide whether to merge locally or open a pull request.
3. Re-run the frontend mock-mode and API-mode verification gates after integration.
4. Keep `VITE_DATA_SOURCE=mock` as the default until production API hosting and CORS are configured.
5. Record the integration decision in `docs/05-history/decision-log.md`.

Acceptance criteria:

- Frontend still passes unit, typecheck, lint and build.
- Mock-mode Playwright remains green.
- API-mode Playwright remains green against seeded local backend.
- No frontend route regresses role-based access or appointment workflow controls.

## Workstream 2: Publish A Machine-Readable API Spec

Status: baseline implemented with a checked-in OpenAPI JSON document.

Goal: reduce drift between backend, frontend and agent tasks.

Recommended actions:

1. Maintain `docs/03-architecture/openapi.json` as the checked-in OpenAPI contract.
2. Keep auth, catalog, patients, scheduling, appointments, audit and notifications covered.
3. Keep success/error envelopes and pagination metadata in shared schemas.
4. Keep `apps/api/src/openapi-contract.spec.ts` in API CI as the baseline drift check; `.github/workflows/api-ci.yml` must continue to trigger on `docs/03-architecture/openapi.json`.
5. Update `docs/03-architecture/api-contract.md` when the machine-readable contract moves or changes ownership.

Acceptance criteria:

- API consumers can discover endpoint paths, methods, schemas and error shapes without reading source code.
- The spec documents bearer auth.
- The spec includes appointment status transition endpoints.

## Workstream 3: Production Auth And Session Hardening

Status: baseline implemented for durable bearer sessions, expiry, logout revocation, bcrypt password verification, inactive/locked account coverage and authorization regression coverage. The next slice is account lifecycle UX/API: patient registration, authenticated password change, admin reset and admin lock/unlock.

Goal: complete the remaining production-login requirements without reopening the verified session or authorization baseline.

Recommended actions:

1. Keep server-side persisted bearer sessions unless a later product/security decision chooses signed tokens.
2. Add public patient registration without allowing public staff, doctor or admin registration.
3. Add authenticated password change and admin demo-safe reset without storing plaintext passwords.
4. Keep route-level role gates covered by focused E2E authorization tests before adding new admin or patient-facing endpoints.

Acceptance criteria:

- Restarting the API does not silently invalidate unexpired, unrevoked sessions.
- Tokens/sessions expire and can be revoked.
- Passwords are verified from stored hashes; demo users still share the seeded `careflow-demo` password until real user administration exists.

## Workstream 4: Backend Deployment Readiness

Status: baseline implemented through `render.yaml`, single-service static serving, Neon database configuration guidance and GitHub Deployment registration.

Goal: make the API deployable outside local development.

Recommended actions:

1. Use Render Free Web Service for the combined frontend/backend app.
2. Use Neon Free Postgres for `DATABASE_URL`.
3. Keep browser API calls same-origin with `VITE_API_BASE_URL=/api/v1`, so CORS is not required for the Render app.
4. Use `/api/v1/health` for Render health checks and GitHub Deployment verification.
5. Run Prisma migrations through the Render `buildCommand` because Free Web Services do not support pre-deploy commands.
6. Seed demo data once through Render `initialDeployHook`.

Acceptance criteria:

- A new engineer can deploy the API from documented steps.
- Environment variables are listed with required/optional status.
- CORS allows the configured frontend origin and rejects unexpected browser origins.
- Database migration steps are explicit.

## Workstream 5: Observability And Operations

Status: baseline implemented; request ID propagation, request completion logs, structured exception logs, appointment workflow logs and baseline backend runbook are implemented.

Goal: make backend failures diagnosable after deployment.

Recommended actions:

1. Expand runbooks once Render deployment has real incident examples.
2. Decide whether logs should remain plain JSON payloads through Nest `Logger` or move to a dedicated structured logger.

Acceptance criteria:

- Logs can correlate one client-visible `requestId` with backend events.
- Internal errors produce useful server logs while preserving the public error envelope.
- Runbooks point to concrete commands and expected outputs.

## Workstream 6: Data Governance And Audit Expansion

Status: baseline implemented; patient create/update audit events, patient owner projection for staff-only notes, sensitive log rules and audit/data governance policy are implemented.

Goal: make audit and data handling safer for real clinic operations.

Recommended actions:

1. Define jurisdiction-specific audit and notification retention before real clinic use.
2. Decide whether authentication events should be written to `AuditEvent` once lockout and password reset flows exist.
3. Add export/deletion policy only after the product decides its target jurisdiction and compliance model.

Acceptance criteria:

- Audit policy states what is covered and what is intentionally excluded.
- Patient-facing APIs do not expose staff-only notes.
- Sensitive patient data is not logged by default.

## Workstream 6A: Authorization Matrix Hardening

Status: integrated on `main`; current API modules passed focused authorization regression coverage after the local merge.

Goal: keep role and ownership access rules explicit as the endpoint surface grows.

Recommended actions:

1. Keep `RolesGuard` wired at controller class level for controllers that use `@Roles(...)`, so method-level role metadata cannot be missed by future edits.
2. Add E2E regression coverage when adding role-specific endpoints, especially patient-owner, doctor-owner and admin-only boundaries.
3. Keep `/users` administration as a separate admin-management slice instead of expanding it inside auth/session hardening.

Acceptance criteria:

- Non-owner patient and doctor actions return `403 FORBIDDEN`.
- Patient-facing availability remains limited to patient, receptionist, nurse and admin roles.
- Planned but unimplemented admin surfaces are clearly marked in docs.

## Workstream 7: Appointment Scheduling Depth

Status: baseline implemented; admin schedule create/update/deactivate endpoints, blocked schedule availability behavior and scheduling API contract coverage are implemented.

Goal: support more realistic clinic scheduling once MVP flows are stable.

Recommended actions:

1. Keep blocked/leave interval controls and schedule management UI as a later product slice.
2. Expand E2E tests for cross-day, unavailable doctor and automatic doctor selection cases.
3. Add richer unavailable-slot explanations if operations staff need diagnostics inside the product UI.

Acceptance criteria:

- Operations staff can understand why a slot is unavailable.
- Scheduling remains deterministic under concurrent booking attempts.
- Timezone rules are documented and tested.

## Workstream 8: Documentation Language Alignment

Status: in progress; user-facing planning/status docs are Vietnamese-first, while agent-only execution references may use English when that improves tool reliability.

Goal: keep documentation readable for the Vietnamese project owner while preserving precise technical instructions for agent/subagent execution.

Recommended actions:

1. Keep user-facing roadmap, planning status, release readiness and approval documents in Vietnamese.
2. Keep exact commands, API names, file paths, framework names and technical terms in English where translation would reduce clarity.
3. Allow agent-only implementation references to use English when required by subagent workflow, but maintain Vietnamese summary/status in `docs/04-planning/`.
4. Do not perform noisy bulk translation. Update language only when a document is materially revised for real project work.
5. Record material language-policy or documentation-structure changes in `docs/05-history/changelog.md`.

Acceptance criteria:

- Project owner can understand roadmap, progress and approval gates from Vietnamese docs.
- Agent execution remains precise enough to run task-by-task without chat history.
- Mixed-language areas are intentional and explained, not accidental drift.

## Recommended Execution Order

1. Create the Render Blueprint service and set the Neon `DATABASE_URL`.
2. Set GitHub repository variable `RENDER_EXTERNAL_URL` after Render assigns the service URL.
3. Verify deployed health, login and booking smoke paths.
4. Harden auth/session behavior for the chosen deployment model.
5. Add observability and operational runbooks.
6. Expand audit/data governance.
7. Deepen scheduling management only after the integrated product flow is stable.
8. Translate existing high-value docs opportunistically when they are materially revised.

## Verification Matrix

| Workstream               | Minimum verification                                                                                              |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Frontend API integration | Web unit, typecheck, lint, build, mock Playwright and API-mode Playwright.                                        |
| API spec                 | `npm test -- --runInBand src/openapi-contract.spec.ts` plus focused contract review against controllers and DTOs. |
| Auth hardening           | Unit and E2E auth tests for login, restart persistence, logout revocation, expiry and locked/inactive users.       |
| Authorization hardening  | Focused E2E tests for admin-only, patient-owner, doctor-owner and role-excluded endpoint boundaries.               |
| Deployment               | Smoke test against deployed health and auth endpoints.                                                            |
| Observability            | Manual log correlation using one failing and one successful request.                                              |
| Audit/data governance    | E2E tests for audit writes and projection boundaries.                                                             |
| Scheduling depth         | E2E tests for conflict, blocked, leave, cross-day and concurrent booking cases.                                   |
| Documentation alignment  | Link check, placeholder scan and reviewer pass for materially revised documents.                                  |

## Open Decisions

- Account lifecycle UI and API details for patient registration, password change, admin reset and lock/unlock.
- Whether OpenAPI should remain manually checked in or move to code generation after the API surface grows.
- Whether schedule management UI belongs in the next product slice or a later operations slice.
