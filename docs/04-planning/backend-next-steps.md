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

Status: in progress; durable bearer sessions, expiry, logout revocation, bcrypt password verification and inactive/locked account login coverage are implemented.

Goal: replace MVP demo auth with deployable auth behavior.

Recommended actions:

1. Keep server-side persisted bearer sessions unless a later product/security decision chooses signed tokens.
2. Add account lockout and password reset requirements if production login is in scope.
3. Add password rotation/change-password flows when real user administration is added.
4. Add a cleanup job or operational task for expired/revoked sessions if session volume becomes meaningful.

Acceptance criteria:

- Restarting the API does not silently invalidate unexpired, unrevoked sessions.
- Tokens/sessions expire and can be revoked.
- Passwords are verified from stored hashes; demo users still share the seeded `careflow-demo` password until real user administration exists.

## Workstream 4: Backend Deployment Readiness

Status: in progress through `render.yaml`, single-service static serving, and GitHub Deployment registration.

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

Goal: make audit and data handling safer for real clinic operations.

Recommended actions:

1. Define which entities require audit on create/update/deactivate.
2. Add audit coverage for important catalog and patient changes if not already covered at the desired depth.
3. Define retention expectations for audit events and notifications.
4. Define which patient fields are sensitive in logs and exports.
5. Add tests for patient projection rules and staff-only fields.

Acceptance criteria:

- Audit policy states what is covered and what is intentionally excluded.
- Patient-facing APIs do not expose staff-only notes.
- Sensitive patient data is not logged by default.

## Workstream 7: Appointment Scheduling Depth

Goal: support more realistic clinic scheduling once MVP flows are stable.

Recommended actions:

1. Decide whether schedule management endpoints are in scope for admin/operations.
2. Add schedule create/update/deactivate flows if needed.
3. Add support for blocked/leave intervals from the UI.
4. Define timezone behavior for all user-facing date displays.
5. Expand E2E tests for cross-day, unavailable doctor and automatic doctor selection cases.

Acceptance criteria:

- Operations staff can understand why a slot is unavailable.
- Scheduling remains deterministic under concurrent booking attempts.
- Timezone rules are documented and tested.

## Workstream 8: Documentation Language Migration

Goal: align the documentation set with the English-first policy without creating a noisy bulk rewrite.

Recommended actions:

1. Keep new agent/subagent plans, architecture references, review handoffs and verification docs in English.
2. When an existing Vietnamese document is materially revised, translate that whole document to English in the same change.
3. Prioritize documents that agents read during implementation: implementation plans, API contract, architecture references, testing strategy and acceptance checklists.
4. Keep user-facing Vietnamese product copy documented where the application itself displays Vietnamese text.
5. Record each translated document in `docs/05-history/changelog.md`.

Acceptance criteria:

- Agent execution documents are no longer extended in Vietnamese.
- Mixed-language drift decreases over time.
- Product copy remains intentional and traceable.

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
| Deployment               | Smoke test against deployed health and auth endpoints.                                                            |
| Observability            | Manual log correlation using one failing and one successful request.                                              |
| Audit/data governance    | E2E tests for audit writes and projection boundaries.                                                             |
| Scheduling depth         | E2E tests for conflict, blocked, leave, cross-day and concurrent booking cases.                                   |
| Documentation migration  | Link check, placeholder scan and reviewer pass for translated documents.                                          |

## Open Decisions

- API hosting provider.
- PostgreSQL hosting provider.
- Production password, account lockout and password reset strategy.
- Whether OpenAPI should remain manually checked in or move to code generation after the API surface grows.
- Whether schedule management belongs in the next product slice or a later operations slice.
