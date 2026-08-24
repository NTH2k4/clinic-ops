# Quy Trình Dự Án

## Documentation First

Yêu cầu, product flow, quyết định kỹ thuật và thay đổi kế hoạch phải được ghi lại trước khi sửa code. Quy tắc này giữ implementation bám sát MVP đã duyệt.

Docs là contract chung cho cả human contributors và agent contributors. Vì vậy tài liệu phải đủ rõ để một người mới hoặc một agent có thể hiểu scope, quyết định, ràng buộc và acceptance criteria mà không cần đọc lại toàn bộ lịch sử chat.

Quy chuẩn viết docs nằm tại `docs/00-project/documentation-standards.md`.

## Documentation Language

CareFlow hướng đến người dùng Việt Nam, nên tài liệu hướng dự án sẽ dùng tiếng Việt theo mặc định. Technical terms, framework names, API names và thuật ngữ chuyên ngành phổ biến có thể giữ bằng tiếng Anh khi dịch sang tiếng Việt làm giảm độ rõ nghĩa.

Ví dụ các thuật ngữ có thể giữ bằng tiếng Anh:

- frontend
- backend
- API
- mock data
- user story
- dashboard
- audit log
- role-based access control

## Thứ Tự Làm Việc

1. Viết và duyệt MVP requirements.
2. Xây frontend prototype với `mock data`.
3. Định nghĩa API contract từ UI workflows đã được kiểm chứng.
4. Triển khai backend và database.
5. Tích hợp frontend với backend.
6. Verify, polish và chuẩn bị release notes.

## Kiểm Soát Thay Đổi

Dùng `docs/01-requirements/change-requests.md` cho mọi yêu cầu mới hoặc thay đổi scope. Một change request có thể ở trạng thái:

- `proposed`
- `approved`
- `rejected`
- `deferred`
- `implemented`

## Subagent Workflow

Công việc giao cho subagent phải được chia theo ranh giới sản phẩm hoặc kỹ thuật rõ ràng. Mỗi package cần có scope, file hoặc module dự kiến, dependencies, acceptance criteria và verification commands.
