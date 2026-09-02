# Ma Trận Stakeholder Và Duyệt Thay Đổi

## Document Control

| Trường | Giá trị |
| --- | --- |
| Trạng thái | `active` |
| Đối tượng đọc chính | Product owner, maintainer, implementation agent |
| Cập nhật lần cuối | 2026-09-02 |
| Phạm vi | Ai có quyền duyệt, ràng buộc dự án và checkpoint bắt buộc trước khi agent triển khai |

## Mục Đích

Tài liệu này định nghĩa người ra quyết định, phạm vi duyệt và ràng buộc vận hành cho CareFlow. Mục tiêu là để agent không tự ý mở scope, sửa production hoặc xử lý dữ liệu nhạy cảm khi chưa có xác nhận rõ.

## Stakeholder

| Vai trò | Trách nhiệm | Quyền duyệt |
| --- | --- | --- |
| Product Owner | Chốt mục tiêu sản phẩm, ưu tiên nghiệp vụ, nghiệm thu UI/flow | Duyệt scope, UX chính, release và production deploy |
| Technical Maintainer | Giữ kiến trúc, code quality, verification và deployment path | Duyệt thiết kế kỹ thuật, test gate và rollback plan |
| AI Coordinator | Đọc docs, lập plan, điều phối agent/subagent, tổng hợp kết quả | Được đề xuất và triển khai trong phạm vi đã duyệt; không tự duyệt production |
| Implementation Agent | Thực hiện task hẹp theo plan đã duyệt | Không có quyền mở scope hoặc bỏ qua verification |
| Reviewer Agent | Review diff, docs traceability, regression risk và test evidence | Được khuyến nghị sửa; quyết định cuối vẫn thuộc Product Owner/Technical Maintainer |

## Ràng Buộc Dự Án

- Hạ tầng ưu tiên không tốn phí: Render Free Web Service và Neon Free Postgres.
- Không đưa dữ liệu bệnh nhân thật, thông tin y tế nhạy cảm, session token, temporary password hoặc secret vào prompt, docs, logs hoặc test output.
- Không thêm dịch vụ trả phí, dependency lớn hoặc external provider nếu chưa có quyết định trong `docs/05-history/decision-log.md`.
- Không deploy production nếu chưa có xác nhận bằng văn bản của người dùng.
- Không sửa hoặc xóa tài liệu lịch sử triển khai nếu chưa có plan dọn dẹp riêng.
- Yêu cầu mới phải đi qua `docs/01-requirements/change-requests.md` trước khi implementation.

## Checkpoint Bắt Buộc

| Loại thay đổi | Agent phải dừng để xin duyệt? | Ghi chú |
| --- | --- | --- |
| Thay đổi scope sản phẩm | Có | Ghi change request trước khi sửa code |
| Thêm/sửa endpoint API | Có | Cập nhật API contract/OpenAPI trước hoặc cùng implementation |
| Thay đổi schema/migration | Có | Cần nêu rủi ro dữ liệu và rollback |
| Thay đổi auth/security/RBAC | Có | Cần security note và test evidence |
| Thay đổi UI workflow chính | Có | Cần preview/spec hoặc acceptance criteria |
| Commit/push lên `main` | Có | Chỉ sau verification và approval |
| Deploy production | Có | Chỉ sau smoke plan và rollback/fallback |
| Chỉnh copy nhỏ hoặc docs không đổi scope | Không bắt buộc | Agent vẫn phải báo diff và verification |

## Ngân Sách Và Ưu Tiên

- Ưu tiên hoàn thành theo slice nhỏ, review được, có bằng chứng test.
- Nếu task vượt khả năng hoàn thành trong một phiên, agent phải chia thành plan có checkpoint.
- Nếu token/context gần đầy, agent phải tạo handoff ghi rõ trạng thái, file đã sửa, verification đã chạy và bước tiếp theo.

## Definition Of Ready Cho Agent

Một task đủ sẵn sàng giao cho agent khi có:

- Mục tiêu cụ thể.
- File hoặc module dự kiến thay đổi.
- Tài liệu nguồn liên quan.
- Ràng buộc không được vi phạm.
- Acceptance criteria hoặc test case.
- Verification command.
- Quyết định rõ về commit/push/deploy.
