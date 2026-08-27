# Security Notes

## MVP Position

The MVP should avoid collecting sensitive clinical data. Lightweight mock notes are acceptable for demonstrating workflow behavior, but the product is not production-ready medical software.

## Backend Requirements

- Role-based access control.
- Authentication and session management. Backend lưu bcrypt password hash và bearer session hash trong PostgreSQL, session hết hạn sau 12 giờ và logout revoke token. Public registration chỉ được tạo patient account `active`, không nhận role/status từ request. Authenticated password change đổi hash và revoke mọi session đang hoạt động. External email reset và SSO vẫn ngoài v1.
- Admin account lifecycle. Chỉ admin được list/detail user, lock, unlock, deactivate hoặc reset password. Lock/deactivate revoke session của target; reset password sinh temporary password, lưu hash và revoke mọi session. Admin không được tự lock hoặc tự deactivate. Temporary password chỉ xuất hiện trong response reset, không được đưa vào audit event hoặc log.
- Audit logging cho account lifecycle actions: `admin_user_locked`, `admin_user_unlocked`, `admin_user_deactivated` và `admin_password_reset`.
- Audit logging for important appointment, patient and catalog changes. The detailed baseline is documented in `docs/03-architecture/audit-data-governance.md`.
- Input validation at the API boundary.
- Protection against unauthorized patient data access. `Patient.notes`, appointment `internalNote` and status-history `note` are staff-only fields in the current API projection.
- Safe handling of secrets and environment variables.

## Compliance Notes

Before using the product for a real clinic, review legal and compliance requirements for the target country and operating model.
