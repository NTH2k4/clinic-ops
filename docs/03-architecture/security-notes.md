# Security Notes

## MVP Position

The MVP should avoid collecting sensitive clinical data. Lightweight mock notes are acceptable for demonstrating workflow behavior, but the product is not production-ready medical software.

## Backend Requirements

- Role-based access control.
- Authentication and session management. Backend lưu bcrypt password hash và bearer session hash trong PostgreSQL, session hết hạn sau 12 giờ và logout revoke token. Public registration chỉ được tạo patient account `active`, không nhận role/status từ request. Password mới cho registration/change phải có ít nhất 10 ký tự, gồm chữ hoa, chữ thường, số, ký tự đặc biệt và tối đa 72 byte UTF-8; seeded demo login vẫn dùng `careflow-demo`. Authenticated password change đổi hash và revoke mọi session đang hoạt động. Login failure trả message public không phân biệt email/password/account status; protected route thiếu session vẫn trả message authentication-required riêng. External email reset và SSO vẫn ngoài v1.
- Admin account lifecycle. Chỉ admin được list/detail user, lock, unlock, deactivate hoặc reset password. UI quản trị yêu cầu modal xác nhận trước khi lock, unlock, deactivate hoặc reset password. Lock/deactivate revoke session của target; reset password đặt temporary password cố định `careflow123`, lưu hash và revoke mọi session. Admin không được tự lock hoặc tự deactivate. `inactive` là trạng thái terminal trong slice này: unlock chỉ áp dụng cho `locked`, lock chỉ áp dụng cho `active`, deactivate áp dụng cho `active` hoặc `locked`. Temporary password chỉ xuất hiện trong response reset, không được đưa vào audit event hoặc log.
- Audit logging cho account lifecycle actions: `admin_user_locked`, `admin_user_unlocked`, `admin_user_deactivated` và `admin_password_reset`. Account lifecycle mutation, session revocation và audit event phải nằm trong cùng database transaction để tránh thay đổi trạng thái không có audit trail.
- Audit logging for important appointment, patient and catalog changes. The detailed baseline is documented in `docs/03-architecture/audit-data-governance.md`.
- Input validation at the API boundary.
- Protection against unauthorized patient data access. `Patient.notes`, appointment `internalNote` and status-history `note` are staff-only fields in the current API projection.
- Safe handling of secrets and environment variables.

## Compliance Notes

Before using the product for a real clinic, review legal and compliance requirements for the target country and operating model.
