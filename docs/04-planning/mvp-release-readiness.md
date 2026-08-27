# Mức Độ Sẵn Sàng MVP Release

## Document Control

| Trường | Giá trị |
| --- | --- |
| Trạng thái | `active` |
| Đối tượng đọc chính | Người dùng, senior engineer và agent tiếp tục triển khai |
| Cập nhật lần cuối | 2026-08-27 |
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
| Authorization matrix hardening | Đã merge local vào `main`, chờ full verification sau merge | `docs/superpowers/plans/2026-08-27-authorization-hardening.md`, commit `e6ed2c18`, merge commit `7d5a5194` |
| MVP Release Completion | Đang triển khai bằng subagent-driven development | `docs/04-planning/mvp-release-completion-plan.md` |
| CareFlow V1 Delivery Roadmap | Đã được người dùng duyệt hướng tổng thể để triển khai theo thứ tự phase | `docs/04-planning/careflow-v1-delivery-roadmap.md` |
| CareFlow V1 Subagent Execution | Đã được người dùng duyệt execution map để điều phối các package v1 | `docs/04-planning/careflow-v1-subagent-execution-plan.md` |

## Trạng Thái Branch Hiện Tại

- Root worktree `clinic-ops` đang ở `main`, ahead `origin/main` do merge local release candidate chưa push.
- Worktree triển khai authorization hardening nằm tại `.worktrees/authorization-hardening`.
- Branch triển khai: `authorization-hardening`.
- Commit triển khai authorization hardening: `e6ed2c18 fix(api): harden authorization boundaries`.
- Commit docs/workflow mới nhất trên branch: `8c41ecb9 docs: document progress tracking workflow`.
- Merge commit local trên `main`: `7d5a5194 merge: authorization hardening`.
- Trạng thái tích hợp: đã merge local vào `main`; chưa push và chưa chạy lại full verification sau merge.

## Workstream Đang Chờ Quyết Định

### Workstream 6A: Authorization Matrix Hardening

Trạng thái: đã triển khai xong baseline cho các module API hiện tại và đã merge local vào `main`.

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

- Chưa chạy lại API gate sau merge.
- Chưa chạy lại Web gate sau merge.

## Bước Tiếp Theo Được Khuyến Nghị

1. Chạy API verification gate sau merge.
2. Chạy Web verification gate sau merge.
3. Cập nhật acceptance checklist, changelog và release notes bằng kết quả thật.
4. Chỉ push/deploy nếu approval của người dùng bao gồm push/deploy hoặc người dùng xác nhận riêng.

Khuyến nghị: hoàn tất MVP release candidate trước khi mở thêm feature mới như schedule management UI, password reset hoặc user administration.
