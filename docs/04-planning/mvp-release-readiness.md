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

- API gate: pass trên configured host PostgreSQL; Docker Compose access vẫn là setup limitation, xem mục `API Verification Gate Sau Merge (Task 2)`.
- Chưa chạy lại Web gate sau merge.

## Bước Tiếp Theo Được Khuyến Nghị

1. Chạy Web verification gate sau merge.
2. Cập nhật acceptance checklist, changelog và release notes bằng kết quả thật.
3. Chỉ push/deploy nếu approval của người dùng bao gồm push/deploy hoặc người dùng xác nhận riêng.

Khuyến nghị: hoàn tất MVP release candidate trước khi mở thêm feature mới như schedule management UI, password reset hoặc user administration.
