# Ghi Chú Phát Hành

## 2026-08-28 Tinh Chỉnh UX Auth Và Shell V1

- Việt hóa thêm UI shell và các luồng gần auth cho điều hướng, nhãn vai trò, quản trị tài khoản, lịch làm việc, metric bác sĩ, đặt lịch của nhân sự và thao tác mở đối tượng từ thông báo.
- Thêm xác nhận đăng xuất trong TopBar: bấm `Đăng xuất` mở `Xác nhận đăng xuất`; session chỉ bị xóa sau khi xác nhận `Đăng xuất khỏi hệ thống`.
- Cập nhật notification popover để đóng khi người dùng nhấn ra ngoài popover, đồng thời vẫn giữ nút đóng và reference navigation hiện có.
- Ghi lại interaction/copy rule trong frontend design system. Audit/action id kỹ thuật và dữ liệu seed/backend có thể vẫn hiển thị nguyên văn khi đó là nội dung record, không phải UI chrome.

## 2026-08-28 V1 Documentation And Acceptance Closure

- Added `docs/04-planning/v1-documentation-closure-plan.md` to define the docs-only Phase 5 package and verification steps.
- Added `docs/01-requirements/v1-traceability-matrix.md`, mapping v1 auth, patient, operations, doctor, admin, scheduling, audit and deployment requirements to product docs, architecture/API docs, implementation plans and verification evidence.
- Added `docs/06-testing/v1-acceptance-package.md`, giving the product owner a final review checklist with production URL, demo credentials, deployed smoke commit, verification evidence and known constraints.
- Updated documentation map, readiness, acceptance checklist and changelog so CareFlow v1 can be reviewed without chat history. Runtime code and infrastructure were not changed in this phase.

## 2026-08-28 Phase 4 Production Demo Operations

- Phase 4 implementation was merged/pushed to `main` at `f9902abc` after plan approval. Scope covers read-only production smoke automation, optional Render deploy hook trigger, runbook/deployment documentation and final production operations closure.
- Added `scripts/production-smoke.mjs` to verify Render health commit, admin login, catalog totals, doctor schedules and availability explanation mode without logging session tokens. The script revokes its temporary smoke session with `/auth/logout` during cleanup.
- Updated `Render Deployment` workflow to optionally POST `secrets.RENDER_DEPLOY_HOOK_URL` before polling health. If the secret is absent, workflow behavior remains deployment registration plus health wait.
- Updated operations docs with manual deploy fallback, failed health wait triage, demo baseline repair guidance and rollback documentation. Render Free and Neon Free remain the deployment target.
- GitHub Actions for `f9902abc`: API CI and Web CI passed. Render Deployment failed before manual deploy because production health still returned `f66970492103620d021a9bd9041374b9e656d684`, matching the known auto-deploy disconnect when deploy hook triggering is absent or not verified.
- Manual Render deploy latest `main` closed Phase 4 at `ca0fe5052e63e8a76e58ec34a2782f5e6c7ecaf2`. Production smoke passed: health commit matched `ca0fe5052e63e8a76e58ec34a2782f5e6c7ecaf2`, admin login returned role `admin`, catalog totals were services `8`, doctors `5`, specialties `3`, doctor-4 schedule total was `1`, and availability explanation returned `5` slots with first status `available`. Session token was not logged.
- After `RENDER_DEPLOY_HOOK_URL` was configured, deploy hook automation was verified with two pushed `render.yaml` commits. `ac78a21d` and `05ebf87b` both completed API CI, Web CI and Render Deployment successfully, and production smoke passed at `05ebf87b00399bbdc677a3668fa107152d10620e`.

## 2026-08-28 Phase 3 Scheduling Operations Deployment Remediation

- Phase 3 Scheduling Operations is deployed complete on Render at `f66970492103620d021a9bd9041374b9e656d684`, including runtime remediation commit `58d9ca0e`.
- Phase 3 Scheduling Operations was merged and pushed to `main` at `49a4ff2a`; GitHub Actions API CI, Web CI, Web Pages and Render Deployment completed successfully for that commit. Render health returned `49a4ff2a6789d2677ea2fdc431d9f877cdbfd01e`, and admin login smoke passed.
- Production scheduling smoke found a data bootstrap blocker, not a runtime deployment failure: the hosted database had no baseline specialties, services, doctors, doctor schedules or appointments, so `/availability/slots?serviceId=service-general...` returned `404 service was not found`.
- Remediation commit `58d9ca0e fix(api): repair hosted demo scheduling baseline` extends hosted startup repair in `SERVE_WEB_APP=true` mode. It creates missing demo specialties, services, staff, doctors and doctor schedules idempotently with duplicate-safe writes and does not reset or delete user/patient data.
- Local remediation verification passed: targeted unit RED/GREEN, API typecheck/lint/build/audit, API unit `7/7` suites `43/43`, API E2E `10/10` suites `98/98`, and local Prisma repair smoke confirmed repeated startup repair leaves `8` services, `5` doctors and `50` schedules.
- Deployment status: remediation was pushed on `main` at `9b8e9799`, API CI and Web CI passed, but Render Deployment failed because production continued serving `49a4ff2a` instead of `9b8e9799`. Manual Render deploy of latest `main` then succeeded at `f6697049`. Production smoke passed health, admin login, catalog totals and scheduling availability explanation mode.

## 2026-08-28 Phase 3 Scheduling Operations Local Candidate

- Phase 3 Scheduling Operations was locally completed on branch `scheduling-operations` before merge. Scope includes backend availability explanation, frontend scheduling service boundary, admin `/app/admin/schedules`, operations booking unavailable-slot explanations and API-mode browser regression.
- Admin users can manage doctor schedules, including working/blocked/leave entries, filters, update and deactivate controls. Operations booking in API mode now reads backend availability explanation and shows unavailable choices such as `11:30 - Bác sĩ bị chặn lịch` as disabled options.
- Final local verification passed: API unit `7/7` suites `42/42` tests, API E2E `10/10` suites `98/98` tests, API build and high-severity audit (`found 0 vulnerabilities`), Web unit `16/16` files `145/145` tests, Web typecheck/lint/build, mock Playwright `9/9` and API-mode Playwright `9/9`.
- Known non-blocking warnings: Vite reports a `649.04 kB` JS chunk over the `500 kB` warning threshold; Playwright logs `NO_COLOR` ignored under `FORCE_COLOR`; API E2E logs expected internal-error/audit rollback cases.
- Deployment status: this local-candidate note was superseded by the deployment-remediation entry above after Phase 3 was merged, pushed and deployed at `49a4ff2a`.

## 2026-08-27 MVP Release Candidate

- Phase 2 Account Administration is deployed complete on Render at `a52072e1a36166a14b0e29b912032377dad1995b`, which includes runtime merge `32464b3d`. GitHub Actions passed API CI, Web CI and Web Pages for `32464b3d`; Render Deployment passed for `a52072e1`. Production smoke passed for health, admin login, patient registration/access, password change/session revocation, admin list, lock/unlock, reset-password, temporary-password login, deactivate and deactivated-login rejection. The generated smoke user used an `@example.test` address and was deactivated at the end of the flow.
- Final review fix round 3 is locally verified, scoped re-review passed, and Phase 2 Account Administration has been merged/pushed to `main` at `32464b3d`. Hosted startup creates missing demo users only, login/registration/password change reject bcrypt-unsafe inputs over 72 UTF-8 bytes, password change rejects reuse, and the OpenAPI login/logout success responses match the runtime `201` status. The new login prefix-collision regression passes in the targeted auth E2E suite (`21/21`); coordinator rerun confirmed full API E2E `10/10` suites `93/93` tests.
- Phase 2 Account Administration đã hoàn thành local verification: public registration chỉ tạo patient, password change xoá session và yêu cầu đăng nhập lại, admin account workspace có smoke coverage cho lock/unlock. API-mode Playwright hiện pass `8/8`, gồm ba regression mới với email/số điện thoại sinh duy nhất và teardown reset DB về seeded baseline sau suite; không ghi session token, password hay temporary password vào output/tài liệu.
- Full verification sau final review fix round 3 pass: API typecheck/lint/build/audit, unit `7/7` suites `41/41` tests và E2E `10/10` suites `93/93` tests; Web unit `16/16` files `141/141` tests, typecheck/lint/build, mock Playwright `9/9` và API-mode Playwright `8/8`. Vite chỉ có cảnh báo bundle `634.62 kB` vượt ngưỡng `500 kB`, không làm build fail.
- Final local rerun on 2026-08-28 for commit `54b9818d` also confirmed OpenAPI JSON parse, `git diff --check`, and API-mode teardown cleanup with `0` generated `@example.test` users remaining.
- Full-stack MVP baseline gồm React/Vite frontend, NestJS/Prisma/PostgreSQL API, appointment workflow, audit/notifications, checked-in OpenAPI contract và single-service Render deployment path.
- Auth/session hardening đã có persisted bearer sessions, expiry, logout revocation, bcrypt password verification và inactive/locked account coverage. Authorization matrix hardening đã tích hợp vào `main` qua merge commit `7d5a5194`, với E2E regression cho patient-owner, doctor-owner và role-excluded scheduling boundaries.
- Local verification sau merge đều pass: API unit 6/6 suites, 37/37 tests; API E2E 8/8 suites, 71/71 tests; Web unit 16/16 files, 130/130 tests; mock Playwright 9/9; API-mode Playwright 5/5.
- Deployed verification update: commit `91fd347f` đã được manual deploy lên Render sau khi API-startup demo auth repair ở commit `44b5b9cf` pass local verification. Render health trả đúng commit `91fd347fe479a174026a69f0e2b782316e39944d`; login smoke với demo admin trả user role `admin` và session token. Token không được ghi vào tài liệu.
- Known constraints: Docker Compose socket không khả dụng cho user hiện tại, nhưng configured host PostgreSQL target đã được xác minh; Render Free Web Service có thể cold start sau khi idle; Neon Free có giới hạn storage/compute; Render Free không hỗ trợ pre-deploy command nên migrations chạy trong `buildCommand`; Render auto-deploy vẫn cần theo dõi riêng vì manual deploy latest commit đã được dùng để đóng smoke gate.
- Demo safety: không dùng dữ liệu bệnh nhân thật trên môi trường demo.
- Earlier deployed demo-auth repair behavior has been superseded by the deployed Phase 2 build; hosted startup preserves existing demo password hashes, roles, and statuses on startup.

## 2026-08-26

- Thêm API-mode Playwright regression gate; mock mode vẫn là mặc định cho local development và demo cho đến khi API production hosting/CORS được cấu hình.
