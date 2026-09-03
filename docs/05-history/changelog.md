# Changelog

## 2026-09-03

- Chỉnh public homepage để bám sát file preview HTML đã duyệt: sticky nav nền trắng, hero ảnh full-bleed, trust strip `15 phút`/`8 chuyên khoa`/`24/7`, card chuyên khoa, card bác sĩ có ảnh, quy trình đặt lịch và booking form mô phỏng dẫn tiếp tới luồng đăng ký.

## 2026-09-02

- Triển khai public homepage tại route `/`: thêm hero ảnh, chuyên khoa nổi bật, bác sĩ tiêu biểu, quy trình đặt lịch, CTA tới `/register` và `/login`; giữ authenticated workspace ở `/app/*` và login riêng tại `/login`.
- Bổ sung bộ tài liệu enterprise-lite trước khi dọn dẹp docs cũ: stakeholder/approval matrix, AI agent delivery workflow, BRD, PRD, SRS, sequence diagrams, database ERD, test-case traceability, agent lessons learned và plan triển khai tài liệu.
- Cập nhật documentation map/change request để ghi rõ các tài liệu mới là source-of-truth bổ sung; chưa xóa hoặc archive planning docs cũ trong lượt này.

## 2026-08-31

- Cải thiện trang `Tài khoản của tôi`: ẩn trường kỹ thuật `Hồ sơ liên kết`, thêm chế độ `Sửa thông tin` có xác nhận/hủy cho họ tên và email, và thêm `PATCH /auth/profile` để cập nhật thông tin tài khoản hiện tại trong API mode.
- Đổi mật khẩu trên account page chỉ hiển thị form sau khi nhấn nút, bổ sung trường nhập lại mật khẩu mới và validation tức thời theo cùng policy với đăng ký tài khoản.
- Đổi nhãn hiển thị vai trò `patient` trong UI từ `Bệnh nhân` sang `Người dùng` ở login, role switcher, top bar, account page, admin account role label và patient home; các nhãn hồ sơ/nghiệp vụ khám vẫn dùng `bệnh nhân`.
- Cho phép đặt lịch trong ngày nếu slot còn cách giờ hiện tại ít nhất 30 phút, đồng thời chặn slot đã qua/quá sát ở cả frontend và backend; availability explanation bổ sung reason `too_soon`.
- Thêm trang dùng chung `Tài khoản của tôi` cho mọi vai trò, gộp đổi mật khẩu vào cùng màn account; chuyển nút đăng xuất xuống cuối sidebar/mobile nav và giữ xác nhận bằng modal giữa màn hình.
- Bổ sung skeleton/shimmer loading state cho các màn dữ liệu chính: dịch vụ/đặt lịch patient, lịch của tôi, hàng đợi operations, calendar operations và khung giờ khả dụng API mode.

## 2026-08-29

- Chốt quy tắc lịch làm việc bác sĩ cho v1 theo tuần: `working` schedule active là mặc định có đi làm, recurrence hàng tháng để sau; Operations Calendar hiển thị danh sách bác sĩ làm việc trong ngày và admin/backend chặn tạo lịch nghỉ phép dưới 7 ngày trước ngày làm việc.
- Bổ sung luồng xác nhận lịch tương lai trong Operations UI: Queue có bộ lọc ngày `Ngày hàng đợi`, Calendar có cột thao tác để xác nhận appointment `requested`, và check-in chỉ hiển thị trong đúng ngày khám; lịch tương lai/quá ngày hiển thị lý do không thể check-in.
- Sửa nguồn ngày vận hành trên frontend: Operations, Doctor, Admin và booking forms không còn dùng mốc hard-code `2026-08-25`/`2026-08-26`, thay bằng ngày phòng khám theo timezone `Asia/Ho_Chi_Minh`.
- Hoàn thiện luồng trạng thái đặt lịch trong Operations UI: thêm lane `Chờ xác nhận` cho appointment `requested`, cho receptionist/nurse/admin xác nhận sang `confirmed`, hiển thị feedback cập nhật trạng thái, bổ sung filter `Chờ xác nhận` trong Operations Calendar và cập nhật dashboard để tính cả yêu cầu mới.
- Mở rộng admin catalog UI cho services, specialties và doctors từ form draft-only sang create/update/deactivate qua backend API thật; UI vẫn dùng soft deactivate để giữ lịch sử lịch hẹn/audit.
- Bổ sung `actorDisplayName` và `entityDisplayName` cho audit event list/detail API, frontend Audit Log hiển thị tên đối tượng/người thao tác kèm raw ID phụ để quản trị dễ kiểm soát.
- Loại bỏ copy user-facing còn sót về demo/draft trong mock login, role switcher, dashboard và quản trị bác sĩ; tài khoản demo và test credentials vẫn giữ để phục vụ kiểm thử.
- Việt hóa backend seeded services/specialties cho API mode và hosted demo repair: patient-facing catalog dùng `Khám tổng quát`, `Tái khám`, `Khám tim mạch`, `Điện tâm đồ`, `Khám nhi`, `Tư vấn tiêm chủng` thay vì các label tiếng Anh cũ. Hosted startup repair dùng upsert cho known demo catalog rows để production records đã tồn tại được cập nhật sau deploy.
- Bổ sung regression coverage cho API catalog E2E và production smoke script để bắt trường hợp service catalog vẫn trả `General Consultation` cho patient/admin smoke.

## 2026-08-28

- Chuẩn hóa README và documentation map sau nghiệm thu v1 theo hướng production-first/source-of-truth: thêm Render URL, demo account, local setup, verification gates, mock/API runtime modes và ghi rõ planning docs cũ được giữ làm implementation records.
- Ghi nhận CareFlow v1 đã được product owner chấp nhận sau khi review acceptance package và production behavior tại commit `673ffe52b12033eecc3fa9927ebebf906ab0d016`; cập nhật acceptance package, traceability matrix, readiness, documentation map, release notes và acceptance checklist.
- Bổ sung tài khoản test thủ công dễ nhớ cho từng tác nhân (`admin@test.com`, `doctor@test.com`, `receptionist@test.com`, `nurse@test.com`, `patient@test.com`) với mật khẩu theo tên actor; mở rộng full seed và hosted startup repair để có tối thiểu 10 bệnh nhân, 10 lịch hẹn, 10 thông báo và 10 lịch làm việc cho bác sĩ test mà không reset account đã tồn tại. Demo data được phép giữ tiếng Anh vì chỉ phục vụ test/dev.
- Việt hóa nhãn hiển thị cho audit entity/action trong Audit Log và Detail Drawer; raw audit id vẫn được giữ trong API/filter value để không đổi contract.
- Việt hóa thêm UI shell và các luồng gần auth theo hướng tiếng Việt trước, thêm xác nhận trước khi xóa session lúc đăng xuất, cho popover thông báo đóng khi nhấn ra ngoài và ghi lại quy tắc tương tác trong frontend design system.
- Prepared Phase 5 V1 Documentation And Acceptance Closure: added `v1-documentation-closure-plan.md`, `v1-traceability-matrix.md` and `v1-acceptance-package.md`; updated documentation map, readiness, acceptance checklist and release notes for final user acceptance review.
- Verified Render deploy hook automation after setup: pushed `ac78a21d` and cleanup `05ebf87b`; API CI, Web CI and Render Deployment succeeded for both, and production smoke passed for `05ebf87b00399bbdc677a3668fa107152d10620e`.
- Implemented Phase 4 Production Demo Operations Tasks 1-3 on branch `production-demo-operations`: added read-only `scripts/production-smoke.mjs`, optional `RENDER_DEPLOY_HOOK_URL` workflow trigger and production runbook/deployment documentation updates.
- Merged and pushed Phase 4 Production Demo Operations to `main` at `f9902abc`; API CI and Web CI passed. Render Deployment failed because production still served `f6697049`, so manual Render deploy of latest `main` was used for closure.
- Closed Phase 4 Production Demo Operations after manual Render deploy latest `main` at `ca0fe5052e63e8a76e58ec34a2782f5e6c7ecaf2`; production smoke passed health, admin login, catalog totals, doctor schedule and availability explanation checks without logging the session token.
- Merged and pushed Phase 3 Scheduling Operations to `main` at `49a4ff2a`; GitHub Actions and Render Deployment passed, and Render health/admin login smoke passed. Scheduling production smoke found missing hosted demo baseline data; remediation was later manually deployed on Render at `f6697049`, and health/admin login/catalog/scheduling smoke passed.
- Added hosted demo scheduling baseline repair at `58d9ca0e`: startup repair in `SERVE_WEB_APP=true` creates missing specialties, services, staff, doctors and doctor schedules idempotently without resetting users or patients. Local RED/GREEN, API unit `43/43`, API E2E `98/98`, typecheck/lint/build/audit and local Prisma repair smoke passed.
- Pushed remediation on `main` at `9b8e9799`; API CI and Web CI passed, but Render Deployment failed because production still served `49a4ff2a`, matching the known Render auto-deploy disconnect. Manual Render deploy of latest `main` closed the gate at `f6697049`.
- Created Phase 4 Production Demo Operations plan at `docs/04-planning/production-demo-operations-plan.md` after Phase 3 deployed complete. The plan covers a read-only production smoke script, optional Render deploy hook support, runbook/deployment docs and final production operations closure.
- Completed Phase 3 Scheduling Operations local implementation and verification on branch `scheduling-operations`: backend availability explanation, frontend scheduling service boundary, admin schedule management UI, operations unavailable-slot reason UI and API-mode browser regression are implemented. Final local gate passed API unit `42/42`, API E2E `98/98`, Web unit `145/145`, mock Playwright `9/9`, API-mode Playwright `9/9`, API/Web typecheck/lint/build and API high-severity audit.
- Fixed Phase 3 review findings before closure: `includeUnavailable=false` now preserves available-only mode, mock availability explanation now rejects missing `doctorId` like the backend, API availability timestamps are formatted in `Asia/Ho_Chi_Minh`, and stale admin mobile-nav count coverage now derives from `navigationForRole("admin")`.
- Started Phase 3 Scheduling Operations on branch `scheduling-operations`: added `docs/04-planning/scheduling-operations-plan.md`, documented planned availability explanation mode, and updated workflows/readiness/documentation map before code.
- Closed Phase 2 Account Administration as deployed complete after manual Render deploy and GitHub Actions verification. Production health serves `a52072e1a36166a14b0e29b912032377dad1995b`, which includes runtime merge `32464b3d`; production smoke passed health, admin login, patient registration/access, password change/session revocation, admin user list, lock/unlock, reset-password, temporary-password login, deactivate and deactivated-login rejection. The generated `@example.test` smoke user was deactivated at the end of the flow.
- Merged and pushed Phase 2 Account Administration to `main` at merge commit `32464b3d` after post-merge local API/Web verification passed.
- Final review fix round 3: login now rejects passwords over bcrypt's 72-byte UTF-8 input limit before comparison, preserving the established generic `401 UNAUTHENTICATED` response. Added an E2E prefix-collision regression using a stored 72-byte password hash; targeted auth E2E passed `1/1` suite `21/21` tests, OpenAPI contract `1/1` suite `9/9` tests, typecheck, and lint. Coordinator rerun confirmed full API E2E `10/10` suites `93/93` tests.
- Scoped re-review for final review fix round 3 passed: the login bcrypt boundary finding is addressed and no new breakage was found in the fix diff.
- Final review fix round 2 on `account-administration`: hosted startup and the demo-auth utility now create only missing demo users, while Render no longer runs demo-auth seeding in `startCommand`; existing password hashes, roles, locked/inactive states, and lifecycle actions are preserved.
- Added bcrypt-safe password validation for registration and password change (maximum 72 UTF-8 bytes), rejected password reuse with a stable non-secret validation response, and corrected OpenAPI login/logout success responses to `201`.
- Recorded targeted RED/GREEN evidence: E2E `2/2` suites `21/21` tests, unit/contract `2/2` suites `12/12` tests; API typecheck, lint, build, and high-severity audit passed. Admin Accounts pagination page upper-bound remains deferred.

## 2026-08-27

- Hoàn thiện Phase 2 Account Administration verification: bổ sung Playwright API-mode cho patient registration vào booking workspace, password change bắt buộc đăng nhập lại và admin lock/unlock account smoke; dữ liệu patient dùng email/số điện thoại sinh duy nhất, API-mode teardown reset DB về seeded baseline sau suite, không ghi session token hay mật khẩu vào test/docs. Full API gate pass (`7/7` unit suites, `41/41` tests; `10/10` E2E suites, `93/93` tests); full Web gate pass (`16/16` files, `141/141` tests; mock Playwright `9/9`; API-mode Playwright `8/8`).
- Rerun final local verification cho Phase 2 commit `54b9818d` sau account lifecycle race hardening: API/Web gates pass, OpenAPI JSON parse pass, `git diff --check` pass và API-mode teardown để lại `0` generated `@example.test` users.
- Hardened account administration review findings: password change dùng conditional update theo password hash và account active status, account status transitions chặn reactivation từ inactive, lifecycle mutation/audit nằm trong cùng transaction, user id params dùng Zod validation và Accounts UI hiển thị lỗi status action.
- Ghi nhận Render manual deploy latest commit `91fd347f` và production health/login smoke pass sau API-startup demo auth repair.
- Đưa demo auth repair vào API startup hosted-demo mode (`SERVE_WEB_APP=true`) để production runtime tự upsert demo login users/password hashes khi Render service start command chưa được sync từ blueprint.
- Thêm `prisma:seed:demo-auth` và gọi trong Render `startCommand` trước khi start API để repair demo login users/password hashes idempotently trên runtime database; bug này được phát hiện khi Render health pass nhưng login smoke trả `401`.
- Cập nhật `frontend-api-integration-plan.md` để phản ánh baseline sau merge: backend bearer sessions đã persisted trong PostgreSQL, API integration v1 flows đã hoàn thành, mock mode vẫn là default local runtime và các slice còn lại là user administration/scheduling operations UI.
- Đồng bộ tài liệu release candidate local: authorization hardening đã tích hợp vào `main` qua `7d5a5194`; API gate pass (6/6 suites, 37/37 unit tests; 8/8 suites, 71/71 E2E tests); Web gate pass (16/16 files, 130/130 tests; mock Playwright 9/9; API-mode Playwright 5/5). Chưa push/deploy.
- Thêm `careflow-v1-delivery-roadmap.md` và `careflow-v1-subagent-execution-plan.md` để định nghĩa đích CareFlow v1, thứ tự phase, subagent packages, verification gates và các hạng mục ngoài phạm vi v1.
- Thêm `docs/04-planning/mvp-release-completion-plan.md` để người dùng duyệt một lượt trước khi triển khai subagent-driven: tích hợp authorization hardening, chạy full verification, đồng bộ docs/release notes và chuẩn bị deploy.
- Cập nhật quy chuẩn documentation-first: mọi bước triển khai mã nguồn phải có plan/status trong `docs/04-planning/`, báo cáo tiến độ phải dẫn chứng docs/branch/commit/verification và thêm tài liệu `mvp-release-readiness.md` bằng tiếng Việt.
- Hardened API authorization regression coverage for patient-owner, doctor-owner and role-excluded scheduling boundaries, and moved role guard wiring to controller class level for role-protected controllers.
- Marked `/users` administration as planned rather than implemented and fixed backend architecture drift around the checked-in OpenAPI baseline.
- Added persisted API bearer session hashes in PostgreSQL with 12-hour expiry, logout revocation, restart-persistence E2E coverage and auth/session documentation updates.
- Added bcrypt `User.passwordHash` login verification, seeded demo password hashes and inactive/locked account auth coverage.
- Added backend request ID propagation, structured request/error logging, appointment workflow action logs and a baseline backend operations runbook.
- Added patient create/update audit events, patient-owner projection protection for staff-only notes and a backend audit/data governance baseline.
- Added admin doctor schedule create/update/deactivate endpoints, blocked schedule availability coverage and scheduling OpenAPI contract entries.
- Translated `docs/03-architecture/security-notes.md` to English as part of the documentation language migration policy.
- Moved Render Free database migration from `preDeployCommand` into `buildCommand` because Render Free Web Services do not support pre-deploy commands.
- Added single-service Render deployment config for the React frontend plus NestJS API, GitHub Deployment registration for the Render URL, static web serving in the API, and Render/Neon deployment docs.
- Added a checked-in OpenAPI baseline at `docs/03-architecture/openapi.json` and API unit coverage to validate the documented v1 endpoint surface, bearer auth and shared response envelopes.

## 2026-08-26

- Fixed GitHub Pages SPA routing by deriving `BrowserRouter` basename from the Vite base URL so navigation stays under `/clinic-ops`.
- Fixed the Web API-mode Playwright gate by scoping the patient appointments navigation selector, avoiding ambiguity with the refreshed patient-home CTA.
- Refreshed the web UI toward a more production-like clinic operations workspace: updated app shell, sidebar/topbar, login surface, dashboard header surfaces, metric card tones, appointment timeline cards and frontend design-system documentation.
- Added backend deployment-readiness runtime config for `PORT` and `CORS_ALLOWED_ORIGINS`, with API tests and environment documentation.
- Added backend as-built documentation in English: `docs/03-architecture/backend-architecture.md`, `docs/03-architecture/database-schema.md`, `apps/api/README.md` and `docs/04-planning/backend-next-steps.md`.
- Updated documentation standards to make English the default for new and materially revised docs, with agent/subagent plans explicitly written in English.
- Bổ sung Playwright API-mode regression gate cho login/booking conflict, operations check-in, doctor workflow, audit/notification navigation và RBAC redirect; mock e2e vẫn là mặc định, CI web khởi tạo PostgreSQL/API riêng cho gate này.
- Triển khai Backend Task 3 auth/RBAC foundation: thêm API error envelope/filter, auth login/logout/me, bearer session guard, role guard và e2e coverage cho `UNAUTHENTICATED`/`FORBIDDEN`.
- Triển khai Backend Task 2 database foundation: thêm Prisma schema, PrismaModule/PrismaService, seed demo deterministic, database smoke e2e test và initial migration cho PostgreSQL.
- Triển khai Backend Task 1 scaffold: tạo `apps/api` NestJS, health endpoint `/api/v1/health`, API envelope helper, Jest/Supertest tests, lint/typecheck/build config và local PostgreSQL compose.
- Chốt backend stack trong `decision-log.md` và thêm `backend-implementation-plan.md` cho Phase 3 backend theo Node.js/NestJS/Prisma/PostgreSQL.
- Bắt đầu Phase 2 API Contract: mở rộng `api-contract.md` thành contract v1 và thêm `api-contract-plan.md` để chuẩn bị backend implementation plan.
- Hoàn thiện P6 responsive/accessibility QA automated scope: Playwright smoke ở 360/768/1280/1440, kiểm tra page-level overflow và keyboard interactions cho role switcher/notification/drawer; đồng thời thu gọn TopBar notification label trên mobile để hết overflow 360px.
- Hoàn thiện P5 Admin Workspace polish ở automated scope: dashboard metric helpers, admin doctors form/list hierarchy và Audit log filter summary/reset.
- Căn lại `ClinicDateField` trong Operations Calendar filter row: label block layout, control cùng top/height với select và literal ngày gọn hơn.
- Cân lại chiều cao `ClinicDateField` về compact `h-10` để đồng bộ hơn với select/input/filter controls trong cùng hàng.

## 2026-08-25

- Sửa `ClinicDateField` segmented picker: ẩn chắc native date input nội bộ và cho phép sửa riêng ngày/tháng/năm bằng cách focus segment rồi gõ giá trị mới.
- Thay date field tự mask bằng segmented date picker locale `vi-VN`: hiển thị `dd/MM/yyyy`, sửa riêng ngày/tháng/năm, calendar popover tiếng Việt và giữ ISO `yyyy-MM-dd` ở state nội bộ.
- Bổ sung thao tác xóa nhanh từng active filter chip trong Operations Calendar, giữ nút reset toàn bộ.
- Hoàn thiện P4 Operations Workspace polish ở automated scope: queue lane descriptions, calendar filter summary/reset, staff create appointment sections và ConfirmDialog copy.
- Hoàn thiện P2 Patient Portal polish ở automated scope: làm rõ disabled slots, conflict/success state, appointment history tab counts và cancel feedback.
- Bắt đầu P2 Patient Portal polish: cải thiện service cards/specialty filter, thêm booking progress cue và hiển thị review thời gian theo định dạng `ngày/tháng/năm`.
- Hoàn thiện thêm P1 App Shell/Navigation polish: mobile bottom navigation sticky, scroll ngang ổn hơn cho role nhiều mục và active state đồng bộ với sidebar.
- Tiếp tục P1 App Shell/Navigation polish: tinh chỉnh TopBar notification panel với summary số thông báo/chưa đọc, nút đóng dialog, unread highlight và test reference navigation.
- Triển khai bước đầu P1 App Shell/Navigation polish: thêm nút thu gọn/mở rộng desktop sidebar, giữ navigation accessible khi thu gọn và làm active navigation nổi bật hơn.
- Cập nhật frontend polish plan và triển khai điều hướng lịch ngày/tuần cho Doctor Workspace: nút ngày/tuần trước-sau, nút hôm nay/tuần hiện tại, nhãn số tuần ISO và khoảng ngày theo định dạng `ngày/tháng/năm`.
- Xác nhận deploy GitHub Pages trả HTTP 200 và GitHub Actions `Web CI`/`Web Pages` đều thành công ở commit `caa64b3779939ba6b59ad730b6d620e7df7fef08`; thêm frontend polish plan cho phase UI/UX tiếp theo.
- Hoàn thành frontend MVP tasks 6-10: patient portal, doctor workspace, operations workspace, admin/audit/notifications, README và browser-level smoke verification.
- Bổ sung Playwright smoke tests cho booking patient ở mobile 360px, doctor start/complete và operations check-in ở desktop; README ghi rõ responsive QA và verification commands.
- Chốt các open questions trong frontend MVP spec: appointment status mặc định, doctor selection, staff workspace và theme switcher.
- Bổ sung frontend design system baseline: design principles, tokens, layout, component rules, accessibility và responsive behavior.
- Củng cố yêu cầu tài liệu viết bằng tiếng Việt và rà soát các nhãn/câu tiếng Anh không cần thiết trong docs.
- Viết frontend implementation plan chi tiết cho `apps/web`, gồm scaffold, mock services, routing, patient/doctor/operations/admin modules và verification.

## 2026-08-24

- Tạo project skeleton theo hướng documentation-first cho CareFlow.
- Định nghĩa hướng MVP ban đầu, scope, roles, workflows, architecture notes và planning placeholders.
- Chuẩn hóa tên sản phẩm thành `CareFlow - Đặt lịch khám online`.
- Bổ sung policy dùng tiếng Việt cho tài liệu hướng dự án, giữ thuật ngữ chuyên ngành tiếng Anh khi cần.
- Chuyển tài liệu hiện có sang tiếng Việt theo policy đã duyệt.
- Mở rộng conceptual data model cho frontend-first MVP, bao gồm entities, relationships, enums, business rules và mock data guidance.
- Bổ sung auth/security model vào data model và thêm documentation map để đối chiếu với bộ tài liệu mẫu.
- Bổ sung documentation standards để docs đủ chuyên nghiệp cho cả human contributors và agent contributors.
- Viết frontend MVP spec cho giai đoạn frontend-first, bao gồm personas, screen specs, workflows, mock data, priority và acceptance criteria.
