# Checklist Chấp Nhận

## Frontend MVP

- Patient có thể yêu cầu đặt appointment.
- Patient có thể xem appointment history.
- Receptionist có thể tạo appointment cho patient.
- Receptionist có thể check-in patient.
- Doctor có thể xem schedule hôm nay.
- Doctor có thể start và complete appointment.
- Admin có thể xem doctors, services và specialties.
- Dashboard phản ánh đúng appointment status counts.
- Audit log hiển thị các thay đổi appointment.
- UI hoạt động tốt trên desktop và mobile.

## Backend MVP

- Backend validate appointment status transitions.
- Backend reject schedule conflicts.
- Backend enforce role-based access.
- Backend ghi audit events cho các thay đổi appointment.
- Frontend có thể thay mock services bằng API calls thật.

## MVP Release Candidate

- [x] Authorization hardening được tích hợp vào `main`; patient-owner, doctor-owner và role-excluded scheduling boundaries được bao phủ bởi API E2E regression (71/71 API E2E tests pass).
- [x] API verification gate sau merge: Prisma generate, migrations, seed, typecheck, lint, unit tests (6/6 suites, 37/37 tests), E2E tests (8/8 suites, 71/71 tests), build và high-severity audit đều pass.
- [x] Web mock-mode gate sau merge: unit tests (16/16 files, 130/130 tests), typecheck, lint, build và mock Playwright (9/9) đều pass.
- [x] Web API-mode gate sau merge: API-mode Playwright (5/5) pass trên configured host PostgreSQL target.
- [x] Docs trong `docs/04-planning/` và release notes phản ánh branch, commit, verification, known constraints và demo safety.
- [ ] Render health/login smoke. Health pass trên `https://clinic-ops.onrender.com` cho commit `b782b730`; login smoke vẫn trả `401 UNAUTHENTICATED` sau build-time repair `4c39911a` và startCommand repair `b782b730`, nên đang triển khai API-startup demo auth repair trong hosted demo mode rồi sẽ chạy lại. Local bugfix verification pass: targeted demo auth repair unit 3/3, API unit 7/7 suites và 40/40 tests, full API E2E 9/9 suites và 72/72 tests.

## Task 2 API Verification (2026-08-27)

- [x] API verification gate sau merge. Pass trên configured host PostgreSQL `postgresql://careflow:careflow@localhost:5432/careflow`; `pg_isready` báo accepting connections. Docker Compose failure vẫn được ghi nhận là setup limitation: current user không có quyền truy cập `/var/run/docker.sock`.
- [x] Prisma generate, migrate deploy và deterministic seed. Generate pass; migration deployment báo 3 migrations và không có pending migration; deterministic seed pass.
- [x] API typecheck và lint. Cả hai pass.
- [x] API unit và E2E tests. Unit pass: 6/6 suites, 37/37 tests. E2E pass: 8/8 suites, 71/71 tests.
- [x] API build và `npm audit --audit-level=high`. Build pass; audit báo `found 0 vulnerabilities`.

## Task 3 Web Verification (2026-08-27)

- [x] Web và API runner dependencies. `cd apps/web && npm ci` pass (360 packages, `found 0 vulnerabilities`); `cd apps/web && npm ci --prefix ../api` pass (674 packages, `found 0 vulnerabilities`).
- [x] Web unit và static gates. `npm test -- --run` pass: 16/16 test files, 130/130 tests; `npm run typecheck` và `npm run lint` đều pass.
- [x] Web production build. `npm run build` pass; Vite chỉ báo non-blocking chunk-size warning cho bundle JS 627.25 kB vượt 500 kB.
- [x] Mock-mode Playwright. `npm run e2e` pass: 9/9 browser tests.
- [x] API-mode Playwright. `DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run e2e:api` pass: 5/5 browser tests.
- [x] Không có failed command hoặc actionable error trong Web gate. Warning `NO_COLOR` của Node trong Playwright không làm test suite thất bại.
