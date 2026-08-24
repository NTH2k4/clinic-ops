# Change Requests

Theo dõi mọi thay đổi scope hoặc requirements tại đây trước khi implementation.

| ID | Ngày | Yêu Cầu | Trạng Thái | Ghi Chú Quyết Định |
| --- | --- | --- | --- | --- |
| CR-001 | 2026-08-24 | Khởi tạo cấu trúc dự án theo hướng documentation-first cho CareFlow. | approved | Định hướng ban đầu đã được user duyệt. |
| CR-002 | 2026-08-24 | Dùng tiếng Việt theo mặc định cho tài liệu hướng dự án vì CareFlow hướng đến người dùng Việt Nam; giữ thuật ngữ kỹ thuật và thuật ngữ chuyên ngành bằng tiếng Anh khi rõ nghĩa hơn. | approved | Đã thêm thành yêu cầu về tài liệu và giao tiếp sản phẩm. |
| CR-003 | 2026-08-24 | Chuyển các tài liệu hiện có sang tiếng Việt, giữ lại thuật ngữ tiếng Anh chuyên ngành khi cần. | approved | Chuẩn hóa tài liệu hiện có theo policy ngôn ngữ đã duyệt. |
| CR-004 | 2026-08-24 | Mở rộng `data-model.md` từ bản nháp sơ sài thành conceptual data model đủ dùng cho frontend-first MVP. | approved | Làm rõ entity, relationship, enum, business rules và mock data guidance trước khi viết frontend MVP spec. |
| CR-005 | 2026-08-24 | Bổ sung auth/security model vào `data-model.md` và thêm documentation map để đối chiếu CareFlow với bộ tài liệu mẫu. | approved | Làm rõ password chỉ tồn tại trong request, backend lưu `passwordHash`, đồng thời ghi lại các gap tài liệu còn thiếu so với mẫu. |
| CR-006 | 2026-08-24 | Bổ sung quy chuẩn viết tài liệu chuyên nghiệp vì docs được dùng bởi cả người và agent. | approved | Thêm `documentation-standards.md` để định nghĩa chất lượng docs, cách viết cho agent, change control và definition of ready/done. |
