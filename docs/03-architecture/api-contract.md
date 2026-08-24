# API Contract

API contract sẽ được chốt sau khi frontend workflows được kiểm chứng.

## Draft Resources

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

## Draft Appointment Operations

- List appointments với filters.
- Lấy chi tiết appointment.
- Tạo appointment.
- Reschedule appointment.
- Cancel appointment.
- Check-in appointment.
- Start appointment.
- Complete appointment.

## Contract Rules

- Status transitions phải được backend validate.
- Appointment conflicts phải bị backend reject.
- Audit events cần được ghi cho các thay đổi quan trọng.
- API errors cần có cấu trúc để hiển thị ở form-level và field-level.
