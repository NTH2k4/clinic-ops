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
- [x] API verification đầy đủ: typecheck, lint, build và high-severity audit pass; unit `7/7` suites, `41/41` tests; E2E `10/10` suites, `93/93` tests.
- [x] Web verification đầy đủ: unit `16/16` files, `141/141` tests; typecheck, lint và build pass; mock Playwright `9/9`; API-mode Playwright `8/8`.
- [x] Không ghi session token, temporary password hoặc dữ liệu patient thật vào test output hay tài liệu. Vite vẫn cảnh báo không blocking: bundle JavaScript `634.62 kB` vượt ngưỡng `500 kB`.
- [x] Final local rerun on 2026-08-28 for commit `54b9818d` confirms OpenAPI JSON parse, diff hygiene and API-mode teardown cleanup with `0` generated `@example.test` users remaining.
- [x] Final review fix round 2 targeted regression: hosted startup preserves an existing stale/locked demo user while creating a missing user; registration/change reject a 72-byte-prefix collision input; password reuse returns stable `400` validation; OpenAPI asserts login/logout `201`. GREEN: API E2E `2/2` suites `21/21` tests, unit/contract `2/2` suites `12/12` tests, typecheck/lint/build/audit pass.
- [x] Final review fix round 3 targeted regression: a login password longer than 72 UTF-8 bytes is rejected with `401 UNAUTHENTICATED` even when its first 72 bytes match the stored bcrypt hash. GREEN: auth E2E `1/1` suite `21/21` tests, OpenAPI contract `1/1` suite `9/9` tests, typecheck and lint pass. Coordinator rerun confirmed full API E2E `10/10` suites `93/93` tests.
- [x] Scoped re-review for final review fix round 3 passed with the login bcrypt boundary finding addressed and no new breakage in the fix diff.
- [x] Phase 2 final review and merge/push to `main` completed at `32464b3d`.
- [x] Phase 2 production CI/Render smoke passed on deployed head `a52072e1a36166a14b0e29b912032377dad1995b`, which includes runtime merge `32464b3d`. GitHub Actions: API CI, Web CI and Web Pages pass for `32464b3d`; Render Deployment pass for `a52072e1`. Production smoke covered health, admin login, patient registration/access, password change/session revocation, admin user list, lock/unlock, reset-password, temporary-password login, deactivate and deactivated-login rejection. Deferred minor: Admin Accounts pagination has no page upper bound.

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

## Phase 3 Scheduling Operations Task 5 (2026-08-28)

- [x] API-mode browser regression covers schedule management affecting booking availability. Test logs in as admin, visits `/app/admin/schedules`, creates a `doctor-4` blocked schedule for `2026-08-26 11:30-12:00` through the authenticated API, then logs in as receptionist and verifies operations appointment creation shows `11:30 - Bác sĩ bị chặn lịch` as a disabled time option.
- [x] Targeted GREEN: `cd apps/web && DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run e2e:api -- --grep "schedule management"` pass: 1/1 browser test.
- [x] Full API-mode GREEN: `cd apps/web && DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run e2e:api` pass: 9/9 browser tests. Teardown reseeded the local API database after the suite.
- [x] RED note: initial targeted run failed on the disabled-option assertion while the failure log showed `<option disabled value="11:30">11:30 - Bác sĩ bị chặn lịch</option>`; the test assertion was corrected to verify the `disabled` attribute directly.

## Phase 3 Scheduling Operations Final Local Gate (2026-08-28)

- [x] API static/unit gate. `cd apps/api && npm run typecheck && npm run lint && npm test -- --runInBand` pass: unit `7/7` suites, `42/42` tests.
- [x] API database/browser-support gate. `DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run test:e2e -- --runInBand` pass: E2E `10/10` suites, `98/98` tests.
- [x] API build/security gate. `npm run build && npm audit --audit-level=high` pass; audit reported `found 0 vulnerabilities`.
- [x] Web unit/static/build gate. `cd apps/web && npm test -- --run && npm run typecheck && npm run lint && npm run build` pass: unit `16/16` files, `145/145` tests. Vite emitted the existing non-blocking chunk-size warning for a `649.04 kB` JS chunk over `500 kB`.
- [x] Web browser gates. `npm run e2e` pass: mock-mode Playwright `9/9`; `DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run e2e:api` pass: API-mode Playwright `9/9`.
- [x] Non-blocking logs reviewed. API E2E intentionally logs internal-error/audit rollback cases; Playwright logs `NO_COLOR` ignored under `FORCE_COLOR`. These did not fail commands.

## Phase 3 Scheduling Operations Deployment Gate (2026-08-28)

- [x] Merge and push completed. Phase 3 merged to `main` at `49a4ff2a`; push to `origin/main` succeeded.
- [x] CI/deploy completed for `49a4ff2a`. GitHub Actions API CI, Web CI, Web Pages and Render Deployment all completed successfully.
- [x] Render health smoke passed for `49a4ff2a6789d2677ea2fdc431d9f877cdbfd01e`.
- [x] Render admin login smoke passed with `admin@careflow.local`; response returned `currentUser.role=admin` and a session token. Token was not logged in docs.
- [x] Scheduling production data smoke passed after manual Render deploy of latest `main` at `f6697049`. `/services?pageSize=1` total `8`; `/doctors?pageSize=1` total `5`; `/specialties?pageSize=1` total `3`; `/doctor-schedules?doctorId=doctor-4&from=2026-08-26&to=2026-08-26&pageSize=5` total `1`; availability explanation mode returned `5` slots with `availabilityStatus`.
- [x] Remediation committed at `58d9ca0e fix(api): repair hosted demo scheduling baseline`. Hosted startup now idempotently creates missing demo specialties, services, staff, doctors and doctor schedules without resetting user/patient data.
- [x] Remediation verification passed locally: RED targeted unit failed before implementation; GREEN targeted unit `4/4`; API typecheck/lint/build/audit pass; API unit `7/7` suites `43/43`; API E2E `10/10` suites `98/98`; local Prisma repair smoke after two runs reported `8` services, `5` doctors, `50` schedules.
- [x] Remediation push/CI completed. Latest `main` is `9b8e9799`; API CI and Web CI passed. Render Deployment failed because production health still returned `49a4ff2a`, matching the known Render auto-deploy disconnect.
- [x] Final production health/login smoke passed after manual deploy. Health returned `f66970492103620d021a9bd9041374b9e656d684`; admin login returned `currentUser.role=admin` and session token. Token was not logged in docs.
