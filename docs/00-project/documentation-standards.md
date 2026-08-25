# Quy Chuẩn Tài Liệu

Tài liệu CareFlow được viết cho cả người và agent đọc. Mỗi tài liệu phải đủ rõ để định hướng implementation, review và verification mà không phụ thuộc vào trí nhớ hội thoại.

## Mục Tiêu

- Giúp human contributors hiểu product intent, scope, workflow và quyết định kỹ thuật.
- Giúp agent contributors có context rõ để sửa đúng phạm vi, không đoán yêu cầu.
- Giữ lịch sử thay đổi, quyết định và open questions có thể truy vết.
- Làm nền cho frontend spec, implementation plan, API contract, backend design và testing.

## Ngôn Ngữ

- Tài liệu dự án phải dùng tiếng Việt theo mặc định vì CareFlow hướng đến người dùng Việt Nam.
- Chỉ giữ tiếng Anh khi đó là technical term, framework name, API name hoặc domain term phổ biến, ví dụ `frontend`, `backend`, `API`, `mock data`, `dashboard`, `audit log`, `role-based access control`.
- Các heading, nhãn bảng, mô tả nghiệp vụ và acceptance criteria nên viết bằng tiếng Việt nếu dịch không làm mất nghĩa.
- Không trộn tiếng Anh chỉ để trang trí. Nếu dùng tiếng Anh, thuật ngữ đó phải giúp rõ nghĩa hơn.

## Yêu Cầu Chất Lượng

Mỗi tài liệu quan trọng nên có:

- Mục đích tài liệu.
- Phạm vi áp dụng.
- Đối tượng đọc chính.
- Trạng thái hiện tại, ví dụ `draft`, `approved`, `baseline`.
- Quyết định đã chốt.
- Open questions nếu còn điểm chưa rõ.
- Acceptance criteria hoặc verification notes nếu tài liệu dùng để triển khai.
- Liên kết đến tài liệu liên quan.

## Quy Tắc Viết Cho Agent

- Nêu rõ file/module/scope nào được phép thay đổi khi tài liệu dùng cho implementation.
- Ghi rõ các ràng buộc không được vi phạm.
- Tránh câu mơ hồ như "làm đẹp hơn", "xử lý tốt hơn", "tối ưu hơn" nếu không có tiêu chí cụ thể.
- Với workflow, ghi actor, precondition, main flow, alternate flow và expected result.
- Với data model, ghi entity, field, relationship, enum và business rules.
- Với UI spec, ghi screen scope, state, empty/loading/error state, responsive behavior và acceptance criteria.

## Quy Tắc Kiểm Soát Thay Đổi

- Yêu cầu mới hoặc thay đổi scope phải được ghi vào `docs/01-requirements/change-requests.md`.
- Quyết định kỹ thuật quan trọng phải được ghi vào `docs/05-history/decision-log.md`.
- Thay đổi đã thực hiện phải được ghi vào `docs/05-history/changelog.md`.
- Nếu thay đổi làm tài liệu khác lỗi thời, phải cập nhật tài liệu liên quan trong cùng commit.

## Mức Độ Chi Tiết Theo Giai Đoạn

### Giai Đoạn Frontend-First

Tài liệu cần đủ rõ cho:

- Role-based navigation.
- Screen list.
- Appointment workflows.
- Mock data.
- Frontend state.
- Design system.
- Acceptance criteria.
- Verification commands.

Không cần chốt ERD/backend schema chi tiết ở giai đoạn này.

### Giai Đoạn Backend

Tài liệu cần bổ sung:

- SRS.
- API spec.
- Sequence spec.
- ERD/database schema.
- Security design.
- Error code convention.
- Transaction boundary.
- Deployment and environment design.

## Definition Of Ready Cho Implementation

Một phần việc chỉ nên chuyển sang implementation khi có đủ:

- Scope rõ.
- Data model hoặc API boundary liên quan.
- User flow hoặc technical flow.
- Acceptance criteria.
- Ràng buộc không được vi phạm.
- Verification commands hoặc checklist.

## Definition Of Done Cho Tài Liệu

Một thay đổi tài liệu được xem là xong khi:

- Không còn placeholder kiểu `TODO`, `TBD`, `FIXME`.
- Không mâu thuẫn với docs liên quan.
- Được ghi vào changelog hoặc change request nếu thay đổi scope/decision.
- Có commit riêng với message rõ.
- Nếu repo đã có remote, commit được push lên GitHub.
