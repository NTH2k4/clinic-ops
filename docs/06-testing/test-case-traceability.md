# Test Case Traceability

## Document Control

| Trường | Giá trị |
| --- | --- |
| Trạng thái | `baseline` |
| Đối tượng đọc chính | QA, product owner, implementation agent |
| Cập nhật lần cuối | 2026-09-02 |
| Phạm vi | Mapping từ requirement đến test/evidence cho CareFlow v1 |

## Mục Đích

Tài liệu này nối requirements với verification gates để agent không tự bịa test case và reviewer biết evidence nào chứng minh yêu cầu đã đạt.

## Traceability Matrix

| Requirement area | Source requirement | Verification evidence |
| --- | --- | --- |
| Auth/session | `SRS-AUTH-*`, `V1-AUTH` | API auth unit/E2E, OpenAPI contract test, Web auth tests, API-mode Playwright, production smoke login |
| Account profile/password | `SRS-AUTH-003`, `SRS-AUTH-007`, `SRS-AUTH-008` | Account/auth frontend tests, API auth E2E, Playwright API-mode password change regression |
| Patient booking | `SRS-APT-*`, `US-BOOK-001`, `V1-PATIENT` | API appointments E2E, Web booking tests, Playwright patient booking smoke |
| Operations queue/calendar | `SRS-APT-*`, `US-OPS-001`, `V1-OPS` | Operations component tests, mock Playwright, API-mode Playwright |
| Doctor workflow | `SRS-AUTHZ-004`, `US-DOCTOR-001`, `V1-DOCTOR` | API authorization E2E, doctor Playwright start/complete flow |
| Admin catalog/account | `SRS-CAT-*`, `SRS-USER-*`, `US-ADMIN-001` | API catalog/users E2E, admin frontend tests, production smoke catalog totals |
| Scheduling/availability | `SRS-SCHED-*`, `V1-SCHED` | Scheduling API E2E, admin schedule tests, API-mode availability explanation Playwright |
| Audit/privacy | `SRS-AUDIT-*`, `V1-AUDIT` | API audit E2E, audit UI tests, patient projection tests |
| Deployment | `SRS-DEPLOY-*`, `V1-DEPLOY` | GitHub Actions, Render Deployment workflow, `scripts/production-smoke.mjs`, acceptance checklist |

## Verification Gates

### Backend Gate

```bash
cd apps/api
npm run prisma:generate
DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npx prisma migrate deploy
DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run prisma:seed
npm run typecheck
npm run lint
npm test -- --runInBand
DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run test:e2e -- --runInBand
npm run build
npm audit --audit-level=high
```

### Frontend Gate

```bash
cd apps/web
npm test -- --run
npm run typecheck
npm run lint
npm run build
npm run e2e
DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run e2e:api
```

### Production Smoke

```bash
RENDER_EXTERNAL_URL=https://clinic-ops.onrender.com node scripts/production-smoke.mjs
```

## Acceptance Evidence Sources

- `docs/06-testing/acceptance-checklist.md`
- `docs/06-testing/v1-acceptance-package.md`
- `docs/01-requirements/v1-traceability-matrix.md`
- `docs/04-planning/mvp-release-readiness.md`
- `docs/05-history/release-notes.md`

## Rules For New Tests

- Every new feature must reference a requirement or change request.
- Regression tests should name the behavior that would break.
- API contract changes must update `docs/03-architecture/openapi.json`.
- Production smoke must not print tokens, temporary passwords or sensitive patient data.
