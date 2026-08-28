# CareFlow V1 Acceptance Package

## Document Control

| Field | Value |
| --- | --- |
| Status | `ready-for-user-review` |
| Audience | Product owner and final reviewer |
| Last updated | 2026-08-28 |
| Traceability | `docs/01-requirements/v1-traceability-matrix.md` |

## Release Scope

CareFlow v1 is a Render-hosted clinic operations demo with React/Vite frontend, NestJS API, Prisma/PostgreSQL data model and Neon database. It covers authentication, patient booking, receptionist operations, doctor workflow, admin catalog/account/schedule management, audit visibility, production smoke testing and operations runbooks.

## Demo Access

| Item | Value |
| --- | --- |
| Production URL | `https://clinic-ops.onrender.com` |
| Demo password | `careflow-demo` |
| Hosted infrastructure | Render Free Web Service + Neon PostgreSQL |
| Deployed smoke commit | `05ebf87b00399bbdc677a3668fa107152d10620e` |
| Initial Phase 5 docs package commit | `8157b224f81e7910f0f404d7711d9e60f17ef404` |

Do not enter real patient data in this environment.

Seeded demo accounts:

| Role | Email | Password |
| --- | --- | --- |
| Patient | `patient@careflow.local` | `careflow-demo` |
| Doctor | `minh.nguyen@careflow.local` | `careflow-demo` |
| Receptionist | `reception@careflow.local` | `careflow-demo` |
| Nurse | `nurse@careflow.local` | `careflow-demo` |
| Admin | `admin@careflow.local` | `careflow-demo` |

## Verification Evidence

| Gate | Evidence |
| --- | --- |
| Phase 2 Account Administration | API typecheck/lint/unit/E2E/build/audit pass; Web unit/typecheck/lint/build/mock Playwright/API-mode Playwright pass; production account smoke pass on Render at `a52072e1`. |
| Phase 3 Scheduling Operations | API unit `43/43`, API E2E `98/98`, Web unit `145/145`, mock Playwright `9/9`, API-mode Playwright `9/9`; production catalog/scheduling smoke pass after remediation at `f6697049`. |
| Phase 4 Production Demo Operations | `scripts/production-smoke.mjs` added and tested; workflow supports optional `RENDER_DEPLOY_HOOK_URL`; deploy hook automation verified with successful API/Web/Render workflows at `05ebf87b`; production smoke pass at `05ebf87b00399bbdc677a3668fa107152d10620e`. |
| Final docs closure | `git diff --check` pass; placeholder scan reviewed; traceability and acceptance docs created. |

Production smoke command:

```bash
RENDER_EXTERNAL_URL=https://clinic-ops.onrender.com \
EXPECTED_RENDER_COMMIT=05ebf87b00399bbdc677a3668fa107152d10620e \
node scripts/production-smoke.mjs
```

Observed smoke result: health commit matched `05ebf87b00399bbdc677a3668fa107152d10620e`, admin login returned role `admin`, services total `8`, doctors total `5`, specialties total `3`, doctor-4 schedule total `1`, and availability explanation returned `5` slots with first status `available`. Session token was not logged.

## User Acceptance Checklist

- [ ] I can open `https://clinic-ops.onrender.com`.
- [ ] I can sign in with `admin@careflow.local` / `careflow-demo`.
- [ ] I can review dashboard, doctors, services, specialties and admin account controls.
- [ ] I can register a patient account and access the patient workspace.
- [ ] I can create or review appointment booking flows without using real patient data.
- [ ] I can review doctor schedule and operations appointment flow behavior.
- [ ] I can find deployment and recovery instructions in `docs/03-architecture/backend-runbook.md` and `docs/04-planning/render-deployment-plan.md`.
- [ ] I accept the known constraints for v1 demo use.

## Known Constraints

- Render Free can cold start after idle time.
- GitHub Actions deploy hook automation is verified for runtime/deployment-path commits. Docs-only commits do not trigger that workflow by default because of path filters.
- Neon Free tier limits storage and compute.
- GitHub Pages remains a mock/demo surface; Render is the production full-stack target.
- Demo data is synthetic and not suitable for real patient operations.
- Admin Accounts pagination page upper-bound remains deferred as a minor follow-up.

## Acceptance Result

This package is ready for product-owner review. If acceptance feedback changes scope, update `docs/01-requirements/v1-traceability-matrix.md`, this package, release notes and readiness docs in the same follow-up change.
