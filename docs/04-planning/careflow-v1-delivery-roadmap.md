# CareFlow V1 Delivery Roadmap

## Document Control

| Trường | Giá trị |
| --- | --- |
| Trạng thái | `approved-direction` |
| Đối tượng đọc chính | Người dùng, senior engineer, agent điều phối và subagent |
| Cập nhật lần cuối | 2026-08-27 |
| Nguồn | `docs/00-project/scope.md`, `docs/01-requirements/mvp-requirements.md`, `docs/04-planning/mvp-release-readiness.md`, `docs/04-planning/backend-next-steps.md` |

## Mục Đích

Tài liệu này định nghĩa đường đi từ trạng thái frontend/backend baseline tới CareFlow v1. Đây là roadmap cấp dự án, dùng để duyệt hướng triển khai trước khi viết hoặc chạy các implementation plan chi tiết cho từng workstream.

Trạng thái duyệt: người dùng đã duyệt hướng tổng thể và yêu cầu triển khai theo kế hoạch. Approval này chốt thứ tự phase và phạm vi v1; push/deploy vẫn cần gate riêng khi đến bước external side effect.

## Định Nghĩa Kết Quả Cuối Cùng Cho V1

CareFlow v1 được xem là hoàn tất khi có thể demo và kiểm chứng end-to-end trên hạ tầng miễn phí đã chốt:

- Frontend React/Vite có các workspace patient, doctor, operations và admin hoạt động với API thật.
- Backend NestJS/Prisma/PostgreSQL là source of truth cho auth, appointments, scheduling, catalog, audit và notifications.
- Authorization, ownership và role boundaries có regression tests.
- Admin có thể quản lý cấu hình vận hành cần thiết cho MVP clinic booking flow.
- User/account lifecycle đủ dùng cho demo production-like: đăng nhập bằng password hash, session expiry/revocation, đổi password và account state cơ bản.
- Scheduling đủ thực tế cho single-clinic demo: doctor schedules, blocked/leave intervals, availability explanation và conflict protection.
- Render Free Web Service + Neon Free Postgres có deploy path rõ, health/login/booking smoke verification và runbook.
- Docs, release notes, acceptance checklist và test strategy phản ánh đúng trạng thái triển khai.

## Ngoài Phạm Vi V1

Các hạng mục sau không nằm trong CareFlow v1 vì kéo theo compliance, domain depth hoặc chi phí vận hành lớn hơn:

- Electronic health record đầy đủ.
- Prescriptions.
- Insurance.
- Billing hoặc real payment.
- Telemedicine.
- External SMS/email notification provider.
- Multi-branch clinic management.
- Jurisdiction-specific compliance certification.
- Production SSO hoặc enterprise identity provider.

## Nguyên Tắc Triển Khai

- Documentation-first: mỗi workstream phải có plan/status trong `docs/04-planning/` trước khi sửa mã nguồn.
- Subagent-driven: mỗi workstream chia thành package có scope, file boundary, acceptance criteria và verification command rõ.
- Verification-first reporting: không báo hoàn tất nếu chưa chạy command thật và cập nhật docs.
- Small release slices: ưu tiên các lát có thể verify end-to-end thay vì mở nhiều feature song song.
- No speculative infrastructure: giữ Render Free + Neon Free cho đến khi có nhu cầu vượt giới hạn miễn phí.
- Vietnamese-first docs: tài liệu định hướng, kế hoạch và trạng thái cho người dùng viết bằng tiếng Việt; technical terms giữ tiếng Anh khi rõ hơn.

## Phase 1: MVP Release Candidate

Trạng thái: hoàn thành. Release candidate đã push lên `main`, API/Web gates pass, production Render health/login smoke pass sau manual deploy latest commit.

Plan chính: `docs/04-planning/mvp-release-completion-plan.md`.

Mục tiêu:

- Merge local `authorization-hardening` vào `main`.
- Chạy full API/Web verification sau merge.
- Đồng bộ release readiness, acceptance checklist, changelog và release notes.
- Push/deploy nếu người dùng duyệt push/deploy.

Exit criteria:

- `main` chứa authorization hardening.
- API gate xanh: Prisma generate, migrations, seed, typecheck, lint, unit, E2E, build, audit.
- Web gate xanh: unit, typecheck, lint, build, mock Playwright, API-mode Playwright.
- Docs ghi đúng commit, verification và deployment status.

## Phase 2: Account Administration Foundation

Trạng thái: plan đã soạn, chờ người dùng duyệt trước khi triển khai code.

Mục tiêu:

- Bổ sung admin user-management slice tối thiểu cho v1.
- Cho phép admin xem user list, đổi trạng thái active/locked và reset password theo quy trình demo-safe.
- Cho phép người dùng đổi password sau khi đăng nhập.
- Ghi audit events cho account lifecycle actions có rủi ro.

Ranh giới:

- Không thêm self-service email reset vì chưa có external email provider.
- Không thêm SSO.
- Không lưu password plain text ở frontend, logs hoặc database.

Tài liệu cần có trước khi triển khai:

- `docs/04-planning/account-administration-plan.md`.
- Cập nhật `docs/03-architecture/security-notes.md`.
- Cập nhật `docs/03-architecture/api-contract.md` và `docs/03-architecture/openapi.json` trong task implementation khi endpoint mới được thêm vào code.

Exit criteria:

- Admin account actions có API tests và UI smoke coverage.
- Password change/reset không làm lộ token hoặc password.
- Locked/inactive behavior nhất quán giữa login, session guard và admin UI.

## Phase 3: Scheduling Operations UI

Trạng thái: chưa bắt đầu.

Mục tiêu:

- Đưa backend doctor schedule APIs vào admin/operations UI.
- Cho phép admin hoặc operations staff quản lý working slots, blocked intervals và leave periods.
- Hiển thị lý do slot không khả dụng để staff hiểu và xử lý khi booking.

Ranh giới:

- Không thêm multi-branch scheduling.
- Không thêm recurring rule engine phức tạp ngoài nhu cầu single-clinic demo.
- Không thêm timezone tùy biến theo từng clinic trước khi có yêu cầu vận hành thật.

Tài liệu cần có trước khi triển khai:

- `docs/04-planning/scheduling-operations-plan.md`.
- Cập nhật `docs/02-product/workflows.md`.
- Cập nhật `docs/03-architecture/api-contract.md` và `docs/03-architecture/openapi.json` nếu endpoint thay đổi.

Exit criteria:

- Admin/operations UI có thể tạo, sửa, deactivate schedule và blocked interval.
- Availability UI giải thích slot unavailable theo dữ liệu backend.
- Booking vẫn deterministic và conflict-safe qua API-mode Playwright.

## Phase 4: Production Demo Operations

Trạng thái: baseline đã có, cần xác nhận sau khi MVP release candidate được push/deploy.

Mục tiêu:

- Hoàn thiện runbook vận hành cho Render Free + Neon Free.
- Ghi rõ quy trình deploy, rollback, seed guard, migration và health smoke.
- Thêm deployed smoke checklist cho health, login và booking path.

Ranh giới:

- Không chuyển hạ tầng trả phí.
- Không thêm monitoring SaaS nếu chưa có ngân sách hoặc nhu cầu rõ.
- Không dùng demo environment cho dữ liệu thật.

Tài liệu cần có trước khi triển khai:

- `docs/04-planning/production-demo-operations-plan.md`.
- Cập nhật `docs/03-architecture/backend-runbook.md`.
- Cập nhật `docs/04-planning/render-deployment-plan.md`.

Exit criteria:

- Người mới có thể deploy lại từ docs.
- Render health trả đúng commit sau deploy.
- Login smoke và booking smoke có command/expected result rõ.
- Known free-tier constraints được ghi trong release notes.

## Phase 5: V1 Documentation And Acceptance Closure

Trạng thái: chưa bắt đầu.

Mục tiêu:

- Đóng gói tài liệu v1 thành bộ review rõ ràng.
- Đồng bộ requirements, user stories, API contract, architecture, testing, release notes và changelog.
- Tạo acceptance checklist cuối cùng cho người dùng duyệt v1.

Ranh giới:

- Không viết SRS dài nếu scope v1 vẫn đủ rõ bằng docs hiện có.
- Không tạo diagram chỉ để trang trí; diagram chỉ thêm khi giúp review dễ hơn.

Tài liệu cần có trước khi triển khai:

- `docs/04-planning/v1-documentation-closure-plan.md`.
- Cập nhật `docs/06-testing/acceptance-checklist.md`.
- Cập nhật `docs/05-history/release-notes.md`.

Exit criteria:

- Mỗi v1 requirement có link tới implementation/test/docs tương ứng.
- Release notes nêu rõ scope, constraints, demo credentials và verification status.
- Người dùng có checklist duyệt v1 không cần đọc lại chat history.

## Thứ Tự Ưu Tiên

1. Phase 1: MVP Release Candidate.
2. Phase 2: Account Administration Foundation.
3. Phase 3: Scheduling Operations UI.
4. Phase 4: Production Demo Operations.
5. Phase 5: V1 Documentation And Acceptance Closure.

Không bắt đầu triển khai code Phase 2 trước khi `docs/04-planning/account-administration-plan.md` được người dùng duyệt, vì phase này thay đổi auth/account lifecycle và API contract.

## Cách Duyệt Roadmap

Khi người dùng duyệt tài liệu này, approval chỉ áp dụng cho hướng tổng thể và thứ tự phase. Mỗi phase vẫn cần implementation plan riêng trong `docs/04-planning/` trước khi sửa mã nguồn.
