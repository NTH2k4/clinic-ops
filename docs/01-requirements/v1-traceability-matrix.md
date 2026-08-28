# CareFlow V1 Traceability Matrix

## Document Control

| Field | Value |
| --- | --- |
| Status | `accepted` |
| Audience | Product owner, senior engineer, implementation agent |
| Last updated | 2026-08-28 |
| Sources | `docs/01-requirements/mvp-requirements.md`, `docs/01-requirements/user-stories.md`, `docs/02-product/workflows.md`, `docs/04-planning/careflow-v1-delivery-roadmap.md` |

## Purpose

This matrix links CareFlow v1 requirements to product behavior, architecture/API references, implementation plans and verification evidence. It is intentionally lightweight; the existing requirements, workflow and architecture documents remain the source of detailed behavior.

## Requirement Trace

| ID | Requirement | Product / Workflow Reference | Architecture / API Reference | Implementation Reference | Verification Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `V1-AUTH` | Users can sign in, register as patients, keep backend-backed sessions, log out, change password and follow account lifecycle controls. | `docs/01-requirements/mvp-requirements.md`, `docs/01-requirements/user-stories.md` | `docs/03-architecture/security-notes.md`, `docs/03-architecture/api-contract.md`, `docs/03-architecture/openapi.json` | `docs/04-planning/account-administration-plan.md`, `docs/04-planning/frontend-api-integration-plan.md` | `docs/06-testing/acceptance-checklist.md` Phase 2; Render smoke on `a52072e1` and later production smoke on `ca0fe505` | Complete |
| `V1-PATIENT` | Patients can view services/specialties, request appointments, view appointment history and cancel eligible appointments. | `docs/02-product/frontend-mvp-spec.md`, `docs/02-product/workflows.md`, `docs/01-requirements/user-stories.md` | `docs/03-architecture/frontend-architecture.md`, `docs/03-architecture/api-contract.md` | `docs/04-planning/frontend-implementation-plan.md`, `docs/04-planning/frontend-api-integration-plan.md` | `docs/06-testing/acceptance-checklist.md` Frontend MVP, Phase 2 API-mode browser regression | Complete |
| `V1-OPS` | Receptionist or nurse users can create appointments for patients, check in arrivals, reschedule/cancel appointments and see operational queue states. | `docs/02-product/workflows.md`, `docs/02-product/appointment-states.md` | `docs/03-architecture/api-contract.md`, `docs/03-architecture/backend-architecture.md` | `docs/04-planning/frontend-implementation-plan.md`, `docs/04-planning/frontend-api-integration-plan.md` | `docs/06-testing/acceptance-checklist.md` MVP and Web API-mode gates | Complete |
| `V1-DOCTOR` | Doctors can review schedules, filter appointments, start visits, complete visits and add lightweight internal notes. | `docs/01-requirements/mvp-requirements.md`, `docs/01-requirements/user-stories.md`, `docs/02-product/appointment-states.md` | `docs/03-architecture/api-contract.md`, `docs/03-architecture/security-notes.md` | `docs/04-planning/frontend-implementation-plan.md`, `docs/04-planning/frontend-polish-plan.md` | `docs/06-testing/acceptance-checklist.md` Frontend MVP and API/Web verification gates | Complete |
| `V1-ADMIN` | Admins can manage doctors, specialties, services, account status/reset actions and dashboard metrics. | `docs/01-requirements/mvp-requirements.md`, `docs/01-requirements/user-stories.md` | `docs/03-architecture/api-contract.md`, `docs/03-architecture/backend-architecture.md`, `docs/03-architecture/security-notes.md` | `docs/04-planning/account-administration-plan.md`, `docs/04-planning/scheduling-operations-plan.md` | `docs/06-testing/acceptance-checklist.md` Phase 2 and Phase 3 gates | Complete |
| `V1-SCHED` | Admins can manage doctor working/blocked/leave schedule entries, and operations booking can explain unavailable slots from backend availability. | `docs/02-product/workflows.md`, `docs/02-product/screens.md` | `docs/03-architecture/api-contract.md`, `docs/03-architecture/openapi.json`, `docs/03-architecture/database-schema.md` | `docs/04-planning/scheduling-operations-plan.md` | `docs/06-testing/acceptance-checklist.md` Phase 3 local/deployment gates; production smoke on `f6697049` and `ca0fe505` | Complete |
| `V1-AUDIT` | Important appointment, patient and schedule changes produce audit events, and admin users can review audit history. | `docs/02-product/workflows.md`, `docs/03-architecture/audit-data-governance.md` | `docs/03-architecture/backend-architecture.md`, `docs/03-architecture/api-contract.md` | `docs/04-planning/backend-implementation-plan.md`, `docs/04-planning/backend-next-steps.md` | `docs/06-testing/acceptance-checklist.md` API E2E gates and release readiness evidence | Complete |
| `V1-DEPLOY` | A new operator can deploy, verify and recover the Render Free + Neon Free demo without chat history. | `docs/00-project/scope.md`, `docs/04-planning/careflow-v1-delivery-roadmap.md` | `docs/03-architecture/backend-runbook.md`, `docs/04-planning/render-deployment-plan.md` | `docs/04-planning/production-demo-operations-plan.md`, `scripts/production-smoke.mjs` | `docs/06-testing/acceptance-checklist.md` Phase 4; Render Deployment manual success on `ca0fe505`; production smoke pass | Complete |

## V1 Out Of Scope

- Full medical record management.
- Prescriptions, insurance, real payment and telemedicine.
- Real patient data on the demo environment.
- Paid hosting, paid monitoring or non-free infrastructure.
- Heavyweight SRS/diagram package beyond the lightweight docs already maintained for v1.

## Acceptance Result

CareFlow v1 was accepted by the product owner on 2026-08-28 after review of `docs/06-testing/v1-acceptance-package.md` and production verification at `673ffe52b12033eecc3fa9927ebebf906ab0d016`. Any requested follow-up changes should update this matrix, the acceptance package and the relevant source docs in the same commit.
