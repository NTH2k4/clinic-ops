# Tiến Độ Hiện Tại Và Kế Hoạch Tiếp Theo

## Document Control

| Trường | Giá trị |
| --- | --- |
| Trạng thái | `active` |
| Đối tượng đọc chính | Người dùng, senior engineer và agent tiếp tục triển khai |
| Cập nhật lần cuối | 2026-08-27 |
| Nguồn | `docs/04-planning/backend-next-steps.md`, `docs/superpowers/plans/2026-08-27-authorization-hardening.md`, trạng thái git hiện tại |

## Mục Đích

Tài liệu này là bảng tổng quan bằng tiếng Việt để theo dõi dự án đang ở đâu, workstream nào đã hoàn thành, workstream nào đang chờ tích hợp và bước nào nên làm tiếp. Khi triển khai thêm mã nguồn, agent phải cập nhật tài liệu này hoặc plan liên quan trong `docs/04-planning/` trước khi báo cáo tiến độ.

## Quy Tắc Theo Dõi Từ Thời Điểm Này

- Mọi bước triển khai mã nguồn phải có plan hoặc status trong `docs/04-planning/`.
- Nếu agent dùng plan hỗ trợ trong `docs/superpowers/plans/`, phải có bản tổng quan tiến độ bằng tiếng Việt trong `docs/04-planning/`.
- Báo cáo tiến độ phải dẫn chứng bằng tài liệu, branch/commit và verification đã chạy.
- Khi task hoàn thành, checklist/status trong docs phải được cập nhật cùng change.
- Không bắt đầu workstream tiếp theo nếu docs hiện tại chưa phản ánh đúng trạng thái mới nhất.

## Tiến Độ Hiện Tại

| Hạng mục | Trạng thái | Dẫn chứng |
| --- | --- | --- |
| Frontend MVP | Hoàn thành baseline | `docs/04-planning/frontend-implementation-plan.md`, `docs/02-product/frontend-mvp-spec.md` |
| Frontend polish automated scope | Hoàn thành baseline | `docs/04-planning/frontend-polish-plan.md`, `docs/06-testing/acceptance-checklist.md` |
| API contract v1 | Hoàn thành baseline | `docs/03-architecture/api-contract.md`, `docs/03-architecture/openapi.json` |
| Backend MVP | Hoàn thành baseline | `docs/04-planning/backend-implementation-plan.md`, `apps/api/README.md` |
| Frontend API integration | Đã merge vào `main` | `docs/04-planning/frontend-api-integration-plan.md`, `docs/04-planning/backend-next-steps.md` |
| Render single-service deployment path | Hoàn thành baseline | `render.yaml`, `docs/04-planning/render-deployment-plan.md`, `docs/04-planning/backend-next-steps.md` |
| Auth/session hardening | Hoàn thành baseline trên `main` | `docs/04-planning/backend-next-steps.md`, commit history trên `main` |
| Authorization matrix hardening | Đã triển khai trên branch riêng, chờ quyết định tích hợp | `docs/superpowers/plans/2026-08-27-authorization-hardening.md`, branch `authorization-hardening`, commit `e6ed2c18` |
| MVP Release Completion | Đã có plan, chờ người dùng duyệt trước khi triển khai bằng subagent-driven | `docs/04-planning/mvp-release-completion-plan.md` |

## Trạng Thái Branch Hiện Tại

- Root worktree `clinic-ops` đang ở `main`, sạch và khớp `origin/main`.
- Worktree triển khai authorization hardening nằm tại `.worktrees/authorization-hardening`.
- Branch triển khai: `authorization-hardening`.
- Commit triển khai hiện tại: `e6ed2c18 fix(api): harden authorization boundaries`.
- Commit docs/workflow mới nhất trên branch: `8c41ecb9 docs: document progress tracking workflow`.
- Trạng thái tích hợp: chưa merge vào `main`, chưa push từ phiên hiện tại.

## Workstream Đang Chờ Quyết Định

### Workstream 6A: Authorization Matrix Hardening

Trạng thái: đã triển khai xong baseline cho các module API hiện tại, chờ người dùng chọn cách tích hợp.

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

Các lựa chọn tích hợp:

1. Merge local branch `authorization-hardening` vào `main`.
2. Push branch và tạo Pull Request.
3. Giữ branch như hiện tại để người dùng xử lý sau.

## Bước Tiếp Theo Được Khuyến Nghị

1. Người dùng review và duyệt `docs/04-planning/mvp-release-completion-plan.md`.
2. Sau khi được duyệt, execute plan bằng subagent-driven development trong phiên hiện tại.
3. Tích hợp `authorization-hardening`, chạy API/Web verification và cập nhật docs theo kết quả thật.
4. Chỉ push/deploy nếu approval của người dùng bao gồm push/deploy hoặc người dùng xác nhận riêng.

Khuyến nghị hiện tại: hoàn tất MVP release candidate trước khi mở thêm feature mới như schedule management UI, password reset hoặc user administration.
