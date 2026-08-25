# Changelog

## 2026-08-25

- Triển khai bước đầu P1 App Shell/Navigation polish: thêm nút thu gọn/mở rộng desktop sidebar, giữ navigation accessible khi thu gọn và làm active navigation nổi bật hơn.
- Cập nhật frontend polish plan và triển khai điều hướng lịch ngày/tuần cho Doctor Workspace: nút ngày/tuần trước-sau, nút hôm nay/tuần hiện tại, nhãn số tuần ISO và khoảng ngày theo định dạng `ngày/tháng/năm`.
- Xác nhận deploy GitHub Pages trả HTTP 200 và GitHub Actions `Web CI`/`Web Pages` đều thành công ở commit `caa64b3779939ba6b59ad730b6d620e7df7fef08`; thêm frontend polish plan cho phase UI/UX tiếp theo.
- Hoàn thành frontend MVP tasks 6-10: patient portal, doctor workspace, operations workspace, admin/audit/notifications, README và browser-level smoke verification.
- Bổ sung Playwright smoke tests cho booking patient ở mobile 360px, doctor start/complete và operations check-in ở desktop; README ghi rõ responsive QA và verification commands.
- Chốt các open questions trong frontend MVP spec: appointment status mặc định, doctor selection, staff workspace và theme switcher.
- Bổ sung frontend design system baseline: design principles, tokens, layout, component rules, accessibility và responsive behavior.
- Củng cố yêu cầu tài liệu viết bằng tiếng Việt và rà soát các nhãn/câu tiếng Anh không cần thiết trong docs.
- Viết frontend implementation plan chi tiết cho `apps/web`, gồm scaffold, mock services, routing, patient/doctor/operations/admin modules và verification.

## 2026-08-24

- Tạo project skeleton theo hướng documentation-first cho CareFlow.
- Định nghĩa hướng MVP ban đầu, scope, roles, workflows, architecture notes và planning placeholders.
- Chuẩn hóa tên sản phẩm thành `CareFlow - Đặt lịch khám online`.
- Bổ sung policy dùng tiếng Việt cho tài liệu hướng dự án, giữ thuật ngữ chuyên ngành tiếng Anh khi cần.
- Chuyển tài liệu hiện có sang tiếng Việt theo policy đã duyệt.
- Mở rộng conceptual data model cho frontend-first MVP, bao gồm entities, relationships, enums, business rules và mock data guidance.
- Bổ sung auth/security model vào data model và thêm documentation map để đối chiếu với bộ tài liệu mẫu.
- Bổ sung documentation standards để docs đủ chuyên nghiệp cho cả human contributors và agent contributors.
- Viết frontend MVP spec cho giai đoạn frontend-first, bao gồm personas, screen specs, workflows, mock data, priority và acceptance criteria.
