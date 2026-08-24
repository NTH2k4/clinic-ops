# API Contract

The API contract will be finalized after the frontend workflows are validated.

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

- List appointments with filters.
- Get appointment detail.
- Create appointment.
- Reschedule appointment.
- Cancel appointment.
- Check in appointment.
- Start appointment.
- Complete appointment.

## Contract Rules

- Status transitions must be validated by backend.
- Appointment conflicts must be rejected by backend.
- Audit events should be written for important changes.
- API errors should be structured for form-level and field-level display.
