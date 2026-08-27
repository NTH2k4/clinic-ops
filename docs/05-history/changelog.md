# Changelog

## 2026-08-27

- Thêm `docs/04-planning/mvp-release-completion-plan.md` để người dùng duyệt một lượt trước khi triển khai subagent-driven: tích hợp authorization hardening, chạy full verification, đồng bộ docs/release notes và chuẩn bị deploy.
- Cập nhật quy chuẩn documentation-first: mọi bước triển khai mã nguồn phải có plan/status trong `docs/04-planning/`, báo cáo tiến độ phải dẫn chứng docs/branch/commit/verification và thêm tài liệu tổng quan `current-progress-and-next-steps.md` bằng tiếng Việt.
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
