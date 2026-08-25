# Yêu Cầu Thay Đổi

Theo dõi mọi thay đổi scope hoặc requirements tại đây trước khi implementation.

| ID | Ngày | Yêu Cầu | Trạng Thái | Ghi Chú Quyết Định |
| --- | --- | --- | --- | --- |
| CR-001 | 2026-08-24 | Khởi tạo cấu trúc dự án theo hướng documentation-first cho CareFlow. | approved | Định hướng ban đầu đã được user duyệt. |
| CR-002 | 2026-08-24 | Dùng tiếng Việt theo mặc định cho tài liệu hướng dự án vì CareFlow hướng đến người dùng Việt Nam; giữ thuật ngữ kỹ thuật và thuật ngữ chuyên ngành bằng tiếng Anh khi rõ nghĩa hơn. | approved | Đã thêm thành yêu cầu về tài liệu và giao tiếp sản phẩm. |
| CR-003 | 2026-08-24 | Chuyển các tài liệu hiện có sang tiếng Việt, giữ lại thuật ngữ tiếng Anh chuyên ngành khi cần. | approved | Chuẩn hóa tài liệu hiện có theo policy ngôn ngữ đã duyệt. |
| CR-004 | 2026-08-24 | Mở rộng `data-model.md` từ bản nháp sơ sài thành conceptual data model đủ dùng cho frontend-first MVP. | approved | Làm rõ entity, relationship, enum, business rules và mock data guidance trước khi viết frontend MVP spec. |
| CR-005 | 2026-08-24 | Bổ sung auth/security model vào `data-model.md` và thêm documentation map để đối chiếu CareFlow với bộ tài liệu mẫu. | approved | Làm rõ password chỉ tồn tại trong request, backend lưu `passwordHash`, đồng thời ghi lại các gap tài liệu còn thiếu so với mẫu. |
| CR-006 | 2026-08-24 | Bổ sung quy chuẩn viết tài liệu chuyên nghiệp vì docs được dùng bởi cả người và agent. | approved | Thêm `documentation-standards.md` để định nghĩa chất lượng docs, cách viết cho agent, change control và definition of ready/done. |
| CR-007 | 2026-08-24 | Viết `frontend-mvp-spec.md` để chốt frontend-first MVP trước khi scaffold app. | approved | Spec mô tả personas, role navigation, routes, screen specs, workflows, mock data, UI states, MoSCoW priority và acceptance criteria. |
| CR-008 | 2026-08-25 | Chốt các open questions trong `frontend-mvp-spec.md`. | approved | Patient-created appointment dùng `requested`, staff-created appointment dùng `confirmed`, patient có thể chọn doctor hoặc any available doctor, receptionist/nurse gộp operations workspace, theme switcher để sau MVP. |
| CR-009 | 2026-08-25 | Củng cố yêu cầu tài liệu viết bằng tiếng Việt, ngoại trừ thuật ngữ chuyên ngành tiếng Anh khi cần, và rà soát docs còn dùng tiếng Anh không cần thiết. | approved | Cập nhật quy chuẩn ngôn ngữ và Việt hóa các nhãn/câu mô tả trong tài liệu hiện có. |
