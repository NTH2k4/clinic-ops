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
- [x] Render health/login smoke. Production `https://clinic-ops.onrender.com` trả health commit `91fd347fe479a174026a69f0e2b782316e39944d`; login smoke với `admin@careflow.local` và `careflow-demo` trả user role `admin` và session token. Token không được ghi vào tài liệu.

## Phase 2 Account Administration (2026-08-27)

- [x] Patient có thể đăng ký account mới và vào ngay patient workspace có quyền đặt lịch. Playwright API-mode dùng email và số điện thoại sinh duy nhất theo từng lần chạy để tránh va chạm dữ liệu; teardown reset DB về seeded baseline sau suite.
- [x] Patient có thể đổi mật khẩu; session hiện tại bị xoá, mật khẩu cũ bị từ chối và chỉ mật khẩu mới đăng nhập lại được.
- [x] Admin có thể tìm account patient mới tạo và smoke action lock/unlock qua `/users/:id/lock` và `/users/:id/unlock`. Test không gọi reset-password nên không đọc, log hoặc ghi temporary password.
- [x] API verification đầy đủ: typecheck, lint, build và high-severity audit pass; unit `7/7` suites, `41/41` tests; E2E `10/10` suites, `90/90` tests.
- [x] Web verification đầy đủ: unit `16/16` files, `141/141` tests; typecheck, lint và build pass; mock Playwright `9/9`; API-mode Playwright `8/8`.
- [x] Không ghi session token, temporary password hoặc dữ liệu patient thật vào test output hay tài liệu. Vite vẫn cảnh báo không blocking: bundle JavaScript `634.62 kB` vượt ngưỡng `500 kB`.
- [x] Final local rerun on 2026-08-28 for commit `54b9818d` confirms OpenAPI JSON parse, diff hygiene and API-mode teardown cleanup with `0` generated `@example.test` users remaining.

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
