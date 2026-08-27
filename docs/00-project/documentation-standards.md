# Quy Chuẩn Tài Liệu

CareFlow dùng tài liệu như contract chung giữa người triển khai, người review và agent. Mọi thay đổi quan trọng phải có dấu vết trong `docs` để không phụ thuộc vào lịch sử chat.

## Mục Tiêu

- Giúp người tham gia dự án hiểu rõ mục tiêu sản phẩm, phạm vi, workflow và quyết định kỹ thuật.
- Giúp agent/subagent có đủ context để triển khai đúng scope, đúng thứ tự và đúng tiêu chí kiểm chứng.
- Giữ requirements, decisions, plan, tiến độ, thay đổi và câu hỏi mở ở trạng thái traceable.
- Làm nền cho product spec, architecture, API contract, implementation plan, testing và release notes.

## Chính Sách Ngôn Ngữ

- Tài liệu dự án viết bằng tiếng Việt theo mặc định.
- Technical terms, framework names, API names, command, file path và thuật ngữ chuyên ngành phổ biến có thể giữ bằng tiếng Anh khi dịch sang tiếng Việt làm giảm độ rõ nghĩa.
- Tài liệu execution dành riêng cho agent/subagent có thể dùng tiếng Anh khi workflow/tooling yêu cầu, nhưng phải có một tài liệu tổng quan hoặc status bằng tiếng Việt trong `docs/04-planning/` để người dùng theo dõi.
- Không trộn ngôn ngữ để trang trí. Dùng tiếng Anh khi nó làm kỹ thuật rõ hơn; dùng tiếng Việt cho định hướng dự án, kế hoạch, tiến độ, quyết định và ghi chú bàn giao cho người dùng.
- Khi cập nhật đáng kể một tài liệu đang lệch chính sách ngôn ngữ, ưu tiên chỉnh phần liên quan sang tiếng Việt hoặc bổ sung bản tổng quan tiếng Việt thay vì mở rộng thêm nội dung khó theo dõi.

## Quy Tắc Ghi Nhận Tiến Độ

- Trước khi sửa mã nguồn, phải tạo hoặc cập nhật plan trong `docs/04-planning/`.
- Plan triển khai phải ghi rõ mục tiêu, phạm vi, file dự kiến sửa, task checklist, tiêu chí hoàn thành, verification commands và rủi ro còn lại.
- Khi hoàn thành một bước, phải cập nhật checklist hoặc status trong tài liệu liên quan trước khi báo cáo tiến độ.
- Khi một bước tạo commit, tài liệu tiến độ phải ghi branch/commit hoặc trạng thái local phù hợp.
- Khi người dùng hỏi đã triển khai đến đâu, câu trả lời phải dẫn chứng bằng đường dẫn tài liệu, trạng thái checklist, commit/branch và verification đã chạy.
- Các plan tạm trong `docs/superpowers/plans/` chỉ được xem là tài liệu hỗ trợ agent; trạng thái tổng quan cho người dùng vẫn phải nằm trong `docs/04-planning/`.

## Yêu Cầu Chất Lượng

Tài liệu quan trọng nên có:

- Mục đích.
- Phạm vi.
- Đối tượng đọc chính.
- Trạng thái hiện tại như `draft`, `approved`, `in progress`, `baseline` hoặc `completed`.
- Quyết định đã chốt.
- Câu hỏi mở khi còn điểm chưa rõ.
- Acceptance criteria hoặc verification notes nếu tài liệu dùng để triển khai.
- Liên kết tới tài liệu liên quan.

## Quy Tắc Viết Cho Agent

- Ghi rõ file, module hoặc scope được phép thay đổi khi tài liệu dùng để triển khai.
- Ghi rõ ràng buộc không được vi phạm.
- Tránh chỉ dẫn mơ hồ như "làm tốt hơn", "tối ưu" hoặc "xử lý edge case" nếu không có tiêu chí cụ thể.
- Với workflow, ghi actor, precondition, main flow, alternate flow và expected result.
- Với data model, ghi entity, field, relationship, enum và business rules.
- Với UI spec, ghi screen scope, state, empty/loading/error state, responsive behavior và acceptance criteria.
- Với implementation plan, dùng task boundary có thể review độc lập, exact file paths, concrete verification commands và checklist cập nhật được.

## Kiểm Soát Thay Đổi

- Yêu cầu mới hoặc thay đổi scope phải được ghi vào `docs/01-requirements/change-requests.md`.
- Quyết định kỹ thuật quan trọng phải được ghi vào `docs/05-history/decision-log.md`.
- Thay đổi đã hoàn thành phải được ghi vào `docs/05-history/changelog.md`.
- Nếu một thay đổi làm tài liệu khác stale, phải cập nhật tài liệu liên quan trong cùng change.

## Mức Độ Chi Tiết Theo Giai Đoạn

### Frontend-First Phase

Tài liệu phải đủ chi tiết cho:

- Role-based navigation.
- Screen list.
- Appointment workflows.
- Mock data.
- Frontend state.
- Design system.
- Acceptance criteria.
- Verification commands.

Detailed ERD và backend schema decisions được defer có chủ đích tới backend phase.

### Backend Phase

Tài liệu phải bao phủ:

- API contract.
- Backend architecture.
- Database schema.
- Security design.
- Error code convention.
- Transaction boundaries.
- Deployment và environment design.
- Agent-readable next-step plans.
- User-readable release readiness và next-step summary trong `docs/04-planning/`.

## Definition Of Ready For Implementation

Một work item chỉ nên chuyển sang implementation khi đã có:

- Scope rõ.
- Data model hoặc API boundary liên quan.
- User flow hoặc technical flow.
- Acceptance criteria.
- Ràng buộc không được vi phạm.
- Verification commands hoặc checklist.
- Plan/status document trong `docs/04-planning/`.

## Definition Of Done For Documentation

Một documentation change được xem là xong khi:

- Không còn placeholder text như `TODO`, `TBD` hoặc `FIXME`.
- Không mâu thuẫn với tài liệu liên quan.
- Đã ghi vào changelog hoặc change request log khi thay đổi scope, quy trình hoặc quyết định.
- Có commit message rõ khi được commit.
- Nếu repository đang đồng bộ với remote, được push sau review theo lựa chọn tích hợp đã chốt.
