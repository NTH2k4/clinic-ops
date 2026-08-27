# Ghi Chú Security

## Vị Trí MVP

MVP nên tránh thu thập dữ liệu lâm sàng nhạy cảm. Lightweight mock notes được phép dùng để minh họa workflow, nhưng sản phẩm chưa được xem là production-ready medical software.

## Yêu Cầu Backend Sau Này

- Role-based access control.
- Authentication và session management. Backend hiện đã lưu bcrypt password hashes và bearer session hashes trong PostgreSQL với expiry 12 giờ và logout revocation; phần còn thiếu là account lockout, password reset và password rotation.
- Audit logging cho các thay đổi appointment.
- Input validation tại API boundary.
- Bảo vệ khỏi truy cập trái phép vào dữ liệu patient.
- Xử lý an toàn secrets và environment variables.

## Ghi Chú Compliance

Trước khi triển khai cho phòng khám thật, cần review yêu cầu pháp lý và compliance theo quốc gia mục tiêu và operating model.
