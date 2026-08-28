# Mức Độ Sẵn Sàng MVP Release

## Document Control

| Trường | Giá trị |
| --- | --- |
| Trạng thái | `active` |
| Đối tượng đọc chính | Người dùng, senior engineer và agent tiếp tục triển khai |
| Cập nhật lần cuối | 2026-08-28 |
| Nguồn | `docs/04-planning/backend-next-steps.md`, `docs/superpowers/plans/2026-08-27-authorization-hardening.md`, trạng thái git của release candidate |

## Mục Đích

Tài liệu này là bảng tổng quan bằng tiếng Việt để theo dõi mức độ sẵn sàng của MVP release, workstream nào đã hoàn thành, workstream nào đang chờ tích hợp và bước nào nên làm tiếp sau khi kế hoạch được duyệt. Khi triển khai thêm mã nguồn, agent phải cập nhật tài liệu này hoặc plan liên quan trong `docs/04-planning/` trước khi báo cáo tiến độ.

## Quy Tắc Theo Dõi Release

- Mọi bước triển khai mã nguồn phải có plan hoặc status trong `docs/04-planning/`.
- Nếu agent dùng plan hỗ trợ trong `docs/superpowers/plans/`, phải có bản tổng quan tiến độ bằng tiếng Việt trong `docs/04-planning/`.
- Báo cáo tiến độ phải dẫn chứng bằng tài liệu, branch/commit và verification đã chạy.
- Khi task hoàn thành, checklist/status trong docs phải được cập nhật cùng change.
- Không bắt đầu workstream tiếp theo nếu docs chưa phản ánh đúng trạng thái release mới nhất.

## Trạng Thái Release

| Hạng mục | Trạng thái | Dẫn chứng |
| --- | --- | --- |
| Frontend MVP | Hoàn thành baseline | `docs/04-planning/frontend-implementation-plan.md`, `docs/02-product/frontend-mvp-spec.md` |
| Frontend polish automated scope | Hoàn thành baseline | `docs/04-planning/frontend-polish-plan.md`, `docs/06-testing/acceptance-checklist.md` |
| API contract v1 | Hoàn thành baseline | `docs/03-architecture/api-contract.md`, `docs/03-architecture/openapi.json` |
| Backend MVP | Hoàn thành baseline | `docs/04-planning/backend-implementation-plan.md`, `apps/api/README.md` |
| Frontend API integration | Đã merge vào `main` | `docs/04-planning/frontend-api-integration-plan.md`, `docs/04-planning/backend-next-steps.md` |
| Render single-service deployment path | Hoàn thành baseline | `render.yaml`, `docs/04-planning/render-deployment-plan.md`, `docs/04-planning/backend-next-steps.md` |
| Auth/session hardening | Hoàn thành baseline trên `main` | `docs/04-planning/backend-next-steps.md`, commit history trên `main` |
| Authorization matrix hardening | Đã tích hợp vào `main` và đã qua regression verification sau merge | `docs/superpowers/plans/2026-08-27-authorization-hardening.md`, commit `e6ed2c18`, merge commit `7d5a5194`, API E2E 71/71 |
| Phase 2 Account Administration | Đã deploy complete trên Render tại `a52072e1`, bao gồm runtime merge `32464b3d` | Patient registration, password change/session revocation, admin account list/lock/unlock/reset/deactivate; production smoke pass |
| MVP Release Completion | Đã push/deploy release candidate; CI pass; Render health/login smoke pass sau manual deploy latest commit | `docs/04-planning/mvp-release-completion-plan.md`, API/Web gates, GitHub Actions và Render smoke |
| CareFlow V1 Delivery Roadmap | Đã được người dùng duyệt hướng tổng thể để triển khai theo thứ tự phase | `docs/04-planning/careflow-v1-delivery-roadmap.md` |
| CareFlow V1 Subagent Execution | Đã được người dùng duyệt execution map để điều phối các package v1 | `docs/04-planning/careflow-v1-subagent-execution-plan.md` |
| Phase 3 Scheduling Operations | Local implementation and verification complete on branch `scheduling-operations`; awaiting final review and user-approved merge/deploy gate | `docs/04-planning/scheduling-operations-plan.md`; API unit `42/42`, API E2E `98/98`, Web unit `145/145`, mock Playwright `9/9`, API-mode Playwright `9/9` |

## Trạng Thái Branch Hiện Tại

- Root worktree `clinic-ops` đang ở `main`; Phase 2 Account Administration đã push lên `origin/main` tại merge commit `32464b3d` và docs deployment evidence commit `a52072e1`.
- Worktree triển khai authorization hardening nằm tại `.worktrees/authorization-hardening`.
- Branch triển khai: `authorization-hardening`.
- Commit triển khai authorization hardening: `e6ed2c18 fix(api): harden authorization boundaries`.
- Commit docs/workflow mới nhất trên branch: `8c41ecb9 docs: document progress tracking workflow`.
- Merge commit local trên `main`: `7d5a5194 merge: authorization hardening`.
- Trạng thái tích hợp: đã merge vào `main`; API và Web full verification sau merge đều pass; push `origin/main` đã thực hiện.

## API Verification Gate Sau Merge (Task 2)

Trạng thái: **pass** đối với API gate sau merge, dùng PostgreSQL host local tại configured target `postgresql://careflow:careflow@localhost:5432/careflow`. Docker Compose vẫn không khả dụng cho user hiện tại, nhưng database target đã reachable và database-dependent commands đã chạy thành công.

| Command | Kết quả | Chi tiết |
| --- | --- | --- |
| `docker compose up -d postgres` | Fail (setup limitation) | Docker daemon socket không cho phép user hiện tại kết nối: `permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock`. PostgreSQL host local tại configured target vẫn reachable, nên failure này không block database gate. |
| `pg_isready -h localhost -p 5432 -U careflow -d careflow` | Pass | `localhost:5432 - accepting connections`. |
| `cd apps/api && npm run prisma:generate` | Pass | Prisma Client v6.12.0 generated successfully. |
| `DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npx prisma migrate deploy` | Pass | 3 migrations found; `No pending migrations to apply.` |
| `DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run prisma:seed` | Pass | `tsx prisma/seed.ts` exited 0. |
| `npm run typecheck` | Pass | `tsc --noEmit` exited 0. |
| `npm run lint` | Pass | ESLint exited 0. |
| `npm test -- --runInBand` | Pass | 6/6 test suites and 37/37 tests passed. |
| `DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run test:e2e -- --runInBand` | Pass | 8/8 test suites and 71/71 tests passed. |
| `npm run build` | Pass | `nest build` exited 0. |
| `npm audit --audit-level=high` | Pass | `found 0 vulnerabilities`. |

API verification sau merge đạt đầy đủ trên configured host PostgreSQL target. Docker Compose access là setup limitation còn lại, không phải release-gate blocker khi endpoint đã được kiểm tra và các commands database-dependent pass.

## Phase 2 Account Administration Verification (Task 7)

Trạng thái: **deployed complete**. Task 7 commit: `848cafa23ba99f169450f8de0fa7fbaa81d37582`; runtime merge commit: `32464b3d`; deployed head: `a52072e1a36166a14b0e29b912032377dad1995b`. Tasks 1-6 cung cấp public patient registration, password change với session revocation, admin user list/status/reset APIs và frontend auth/admin workspace. Task 7 bổ sung browser regression cho registration vào patient booking workspace, password change bắt buộc re-login và admin lock/unlock account action. Test tạo email/số điện thoại duy nhất; API-mode teardown reset database về seeded baseline sau suite; không ghi session token, mật khẩu hoặc temporary password vào output/tài liệu.

| Command | Kết quả | Chi tiết |
| --- | --- | --- |
| `cd apps/api && npm run typecheck` | Pass | `tsc --noEmit` exited 0. |
| `cd apps/api && npm run lint` | Pass | ESLint exited 0. |
| `cd apps/api && npm test -- --runInBand` | Pass | `7/7` suites, `41/41` tests. |
| `cd apps/api && DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run test:e2e -- --runInBand` | Pass | `10/10` suites, `93/93` tests. |
| `cd apps/api && npm run build` | Pass | `nest build` exited 0. |
| `cd apps/api && npm audit --audit-level=high` | Pass | `found 0 vulnerabilities`. |
| `cd apps/web && npm test -- --run` | Pass | `16/16` files, `141/141` tests. |
| `cd apps/web && npm run typecheck` | Pass | `tsc -b --pretty false` exited 0. |
| `cd apps/web && npm run lint` | Pass | ESLint exited 0. |
| `cd apps/web && npm run build` | Pass | Build exited 0; Vite cảnh báo không blocking bundle `634.62 kB` vượt `500 kB`. |
| `cd apps/web && npm run e2e` | Pass | Mock-mode Playwright `9/9`. |
| `cd apps/web && DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run e2e:api` | Pass | API-mode Playwright `8/8`, bao gồm Phase 2 auth/account smoke. |

Production smoke trên Render đã pass cho deployed head `a52072e1`, bao gồm runtime merge `32464b3d`: health commit check, admin login, patient registration, patient `/auth/me`, password change với old-session revocation, old password rejection, new password login, admin user list, lock/unlock, reset password, temporary-password login, deactivate và deactivated-login rejection. Smoke user `prod-smoke-1787884654973-61f9ed61ee5d5@example.test` đã được deactivate ở cuối flow.

Pre-round-3 verification rerun on 2026-08-28 confirmed local commit `10537ed9 fix(api): preserve account lifecycle on startup`: API typecheck/lint/unit/build/audit, API E2E `10/10` suites `92/92` tests, Web unit `16/16` files `141/141` tests, Web typecheck/lint/build, mock Playwright `9/9`, API-mode Playwright `8/8`, `jq empty docs/03-architecture/openapi.json`, `git diff --check`, and generated test user count `0` after API-mode teardown.

Final review fix round 2 on 2026-08-28: routine hosted startup now creates missing demo users only, so existing password changes and locked/deactivated states persist; password registration/change validation rejects inputs over bcrypt's 72-byte UTF-8 limit and rejects reuse; OpenAPI now declares `201` for login/logout. RED targeted E2E covered the prior lifecycle reset, overlong 72-byte-prefix collision, and password reuse; targeted GREEN passed API E2E `2/2` suites `21/21` tests and unit/contract `2/2` suites `12/12` tests. API typecheck, lint, build, and high-severity audit also passed. This was superseded by final review fix round 3, merge and production deploy.

Final review fix round 3 on 2026-08-28: login now rejects passwords over bcrypt's 72-byte UTF-8 limit with the existing generic `401 UNAUTHENTICATED` response before bcrypt comparison. RED reproduced a `201` login for a password whose first 72 bytes matched the stored hash; targeted GREEN passed `auth.e2e-spec.ts` `1/1` suite `21/21` tests, OpenAPI contract `1/1` suite `9/9` tests, API typecheck, and lint. Coordinator rerun confirmed API unit `7/7` suites `41/41` tests, API build/audit pass, and full API E2E `10/10` suites `93/93` tests. Scoped re-review marked the login finding addressed with no new breakage in the fix diff.

## Web Verification Gate Sau Merge (Task 3)

Trạng thái: **pass** cho toàn bộ Web gate sau merge. API-mode Playwright dùng đúng configured host PostgreSQL target `postgresql://careflow:careflow@localhost:5432/careflow`.

| Command | Kết quả | Chi tiết |
| --- | --- | --- |
| `cd apps/web && npm ci` | Pass | Cài 360 packages; audit báo `found 0 vulnerabilities`. |
| `cd apps/web && npm ci --prefix ../api` | Pass | Cài 674 packages cho API-mode runner; audit báo `found 0 vulnerabilities`. |
| `cd apps/web && npm test -- --run` | Pass | Vitest: 16/16 test files và 130/130 tests passed. |
| `cd apps/web && npm run typecheck` | Pass | `tsc -b --pretty false` exited 0. |
| `cd apps/web && npm run lint` | Pass | `eslint .` exited 0. |
| `cd apps/web && npm run build` | Pass | TypeScript và Vite production build exited 0; Vite chỉ cảnh báo non-blocking về chunk JS 627.25 kB lớn hơn 500 kB. |
| `cd apps/web && npm run e2e` | Pass | Mock-mode Playwright: 9/9 browser tests passed. |
| `cd apps/web && DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run e2e:api` | Pass | API-mode Playwright: 5/5 browser tests passed. |

Không có failure command hoặc actionable error trong Web gate. Các warning `NO_COLOR` của Node trong Playwright và chunk-size warning của Vite không làm command thất bại.

## Push Và Deployment Gate (Task 5)

Trạng thái: **Phase 2 deployed complete**. Push `main` đã được thực hiện sau approval của người dùng. Production `https://clinic-ops.onrender.com` đang serve commit `a52072e1a36166a14b0e29b912032377dad1995b`, bao gồm runtime merge `32464b3d`.

| Check | Kết quả | Chi tiết |
| --- | --- | --- |
| `git push origin main` | Pass | Release candidate và các fix deploy/auth đã push lên `main`; production smoke được xác minh tại `91fd347f`. |
| `git ls-remote origin refs/heads/main` | Pass | Tại thời điểm smoke, deployed commit là `91fd347fe479a174026a69f0e2b782316e39944d`; docs-only commits sau đó không thay đổi runtime behavior. |
| GitHub Actions API/Web | Pass | API CI và Web CI đều `completed/success` cho code fix `44b5b9cf`; docs-only commit `91fd347f` được manual deploy sau đó. |
| GitHub Deployment workflow | Stale run ignored | Workflow cho `44b5b9cf` fail vì sau manual deploy Render serve commit mới hơn `91fd347f`; production smoke được xác minh trực tiếp bằng health/login curl. |
| Render health smoke | Pass | `/api/v1/health` trả commit `91fd347fe479a174026a69f0e2b782316e39944d`. |
| Render login smoke | Pass | `POST /api/v1/auth/login` với `admin@careflow.local` và `careflow-demo` trả user role `admin` và session token. Token không được ghi vào docs. |
| Phase 2 GitHub Actions | Pass | API CI, Web CI và Web Pages pass cho runtime merge `32464b3d`; Render Deployment pass cho deployed head `a52072e1`. |
| Phase 2 Render health smoke | Pass | `/api/v1/health` trả commit `a52072e1a36166a14b0e29b912032377dad1995b`. |
| Phase 2 auth/account smoke | Pass | Admin login, patient registration/access, password change/session revocation, admin list, lock/unlock, reset-password, temporary-password login và deactivate đều pass. Smoke user `@example.test` đã deactivate. |

The historical deployed fix used startup demo-auth repair. Final review fix round 2 supersedes that behavior on `account-administration`: Render starts the API directly, and hosted startup creates only missing demo users without changing existing credentials, roles, or statuses.

Local verification cho fix:

- RED: `DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run test:e2e -- --runInBand demo-auth-seed.e2e-spec.ts` fail trước implementation vì thiếu `../prisma/demo-auth-seed`.
- GREEN targeted: cùng command pass `1/1` suite, `1/1` test sau khi thêm script.
- `DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run prisma:seed:demo-auth`: pass.
- API typecheck/lint/build/audit: pass; audit `found 0 vulnerabilities`.
- API unit: `6/6` suites, `37/37` tests pass.
- API E2E full sau test mới: `9/9` suites, `72/72` tests pass.
- API-startup repair fix `44b5b9cf`: targeted unit pass 3/3; API typecheck, lint, unit 7/7 suites 40/40 tests, build và full API E2E 9/9 suites 72/72 tests đều pass.

## Workstream Đang Chờ Quyết Định

### Workstream 6A: Authorization Matrix Hardening

Trạng thái: đã tích hợp vào `main` và regression verification sau merge đã pass cho các module API hiện tại.

Đã làm:

- Thêm regression E2E cho patient-owner boundary.
- Thêm regression E2E cho doctor-owner boundary.
- Thêm regression E2E cho role-excluded scheduling availability.
- Chuyển `RolesGuard` lên controller class level tại các controller có `@Roles(...)`.
- Làm rõ `/users` administration là planned/not implemented.
- Cập nhật backend architecture, backend next steps và changelog.

Verification đã chạy trong plan triển khai:

- API typecheck/lint.
- API unit tests `37/37`.
- API E2E tests `71/71`.
- API build.
- API audit `0 vulnerabilities`.
- Web typecheck/lint.
- `git diff --check`.

Trạng thái verification sau merge:

- API gate: pass trên configured host PostgreSQL; Docker Compose access vẫn là setup limitation, xem mục `API Verification Gate Sau Merge (Task 2)`.
- Web gate: pass; unit 130/130, mock-mode Playwright 9/9 và API-mode Playwright 5/5, xem mục `Web Verification Gate Sau Merge (Task 3)`.

## Bước Tiếp Theo Được Khuyến Nghị

1. Chạy final code review cho branch `scheduling-operations`.
2. Nếu review sạch hoặc findings đã xử lý, xin approval rõ của người dùng để merge vào `main`, push và deploy.
3. Sau deploy, smoke Render health/login và scheduling path, rồi cập nhật readiness/release notes lần cuối với deployed commit.

Khuyến nghị: hoàn tất merge/deploy gate cho Phase 3 trước khi mở Phase 4 Production Demo Operations.

Phase 3 implementation branch: `scheduling-operations`. Plan triển khai chính: `docs/04-planning/scheduling-operations-plan.md`.
