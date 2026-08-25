# API Contract

API contract sẽ được chốt sau khi frontend workflow được kiểm chứng.

## Resource Draft

- `/auth`
- `/users`
- `/patients`
- `/doctors`
- `/services`
- `/specialties`
- `/schedules`
- `/appointments`
- `/audit-events`
- `/notifications`

## Operation Draft Cho Appointment

- List appointments với filters.
- Lấy chi tiết appointment.
- Tạo appointment.
- Reschedule appointment.
- Cancel appointment.
- Check-in appointment.
- Start appointment.
- Complete appointment.

## Quy Tắc Contract

- Status transitions phải được backend validate.
- Appointment conflicts phải bị backend reject.
- Audit events cần được ghi cho các thay đổi quan trọng.
- API errors cần có cấu trúc để hiển thị ở form-level và field-level.
