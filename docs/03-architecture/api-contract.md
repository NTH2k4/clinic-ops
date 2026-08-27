# API Contract

## Mục Tiêu

Tài liệu này định nghĩa API contract v1 cho CareFlow sau khi frontend-first prototype đã kiểm chứng các workflow chính. Contract dùng để triển khai backend thật và thay `mockStore`/mock services trong `apps/web` bằng API client mà không đổi lớn UI.

Machine-readable contract: `docs/03-architecture/openapi.json`. The checked-in OpenAPI document is the API consumer reference for endpoint paths, methods, auth, shared envelopes, pagination metadata and request schemas. API CI validates this file through `apps/api/src/openapi-contract.spec.ts`.

## Contract Principles

- Base path: `/api/v1`.
- Auth dùng session hoặc bearer token tùy backend plan, nhưng response frontend nhận phải có `currentUser`.
- Date-only field dùng ISO `yyyy-MM-dd`.
- Datetime field dùng ISO 8601 có timezone, ví dụ `2026-08-25T09:00:00+07:00`.
- Backend là source of truth cho authorization, appointment conflict, status transition và audit log.
- Frontend không gửi `createdAt`, `updatedAt`, audit fields hoặc status history trực tiếp.
- Admin delete mặc định là soft delete hoặc deactivate để giữ lịch sử appointment/audit.

## Response Conventions

### Success Envelope

```json
{
  "data": {},
  "meta": {
    "requestId": "req_01J8Y3R8Z4N5"
  }
}
```

List response có pagination:

```json
{
  "data": [],
  "meta": {
    "requestId": "req_01J8Y3R8Z4N5",
    "page": 1,
    "pageSize": 20,
    "total": 42
  }
}
```

### Error Envelope

```json
{
  "error": {
    "code": "APPOINTMENT_CONFLICT",
    "message": "Khung giờ đã có lịch hẹn khác.",
    "fields": {
      "startAt": "Khung giờ đã bị chiếm."
    }
  },
  "meta": {
    "requestId": "req_01J8Y3R8Z4N5"
  }
}
```

Common error codes:

- `UNAUTHENTICATED`
- `FORBIDDEN`
- `VALIDATION_ERROR`
- `NOT_FOUND`
- `APPOINTMENT_CONFLICT`
- `INVALID_STATUS_TRANSITION`
- `RESOURCE_IN_USE`
- `RATE_LIMITED`
- `INTERNAL_ERROR`

## Auth

| Method | Path | Role | Mục đích |
| --- | --- | --- | --- |
| POST | `/auth/login` | public | Đăng nhập bằng email/password. |
| POST | `/auth/logout` | authenticated | Hủy session/token hiện tại. |
| GET | `/auth/me` | authenticated | Lấy current user và linked profile. |

`POST /auth/login` request:

```json
{
  "email": "admin@careflow.local",
  "password": "example-password"
}
```

`GET /auth/me` response `data`:

```json
{
  "currentUser": {
    "id": "user-admin-1",
    "displayName": "Admin Demo",
    "email": "admin@careflow.local",
    "role": "admin",
    "status": "active"
  },
  "linkedProfile": {
    "type": "staff",
    "id": "staff-admin-1"
  }
}
```

## Core Resources

### Users

Status: planned, not implemented in the current backend. The current admin workspace still uses mock staff data for this surface.

| Method | Path | Role | Mục đích |
| --- | --- | --- | --- |
| GET | `/users` | admin | List users với filter `role`, `status`, `q`. |
| GET | `/users/{id}` | admin | Lấy chi tiết user. |
| POST | `/users` | admin | Tạo user cho staff/doctor/admin. |
| PATCH | `/users/{id}` | admin | Sửa displayName, phone, role hoặc status hợp lệ. |
| POST | `/users/{id}/deactivate` | admin | Vô hiệu hóa user, giữ audit history. |

### Patients

| Method | Path | Role | Mục đích |
| --- | --- | --- | --- |
| GET | `/patients` | receptionist, nurse, admin | List patients với `q`, `status`. |
| GET | `/patients/{id}` | patient owner, staff, admin | Lấy hồ sơ patient. |
| POST | `/patients` | patient, receptionist, nurse, admin | Tạo patient profile. |
| PATCH | `/patients/{id}` | patient owner, receptionist, nurse, admin | Sửa thông tin liên hệ/hồ sơ. |
| POST | `/patients/{id}/deactivate` | admin | Ẩn hồ sơ khỏi workflow mới, giữ lịch sử. |

### Doctors

| Method | Path | Role | Mục đích |
| --- | --- | --- | --- |
| GET | `/doctors` | authenticated | List doctors với `specialtyId`, `serviceId`, `status`. |
| GET | `/doctors/{id}` | authenticated | Lấy chi tiết doctor. |
| POST | `/doctors` | admin | Tạo doctor. |
| PATCH | `/doctors/{id}` | admin | Sửa specialty, services, contact, title, room, status. |
| POST | `/doctors/{id}/deactivate` | admin | Vô hiệu hóa doctor nếu không có appointment active. |

### Specialties

| Method | Path | Role | Mục đích |
| --- | --- | --- | --- |
| GET | `/specialties` | authenticated | List specialties active hoặc all nếu admin. |
| POST | `/specialties` | admin | Tạo specialty. |
| PATCH | `/specialties/{id}` | admin | Sửa name, description, status. |
| POST | `/specialties/{id}/deactivate` | admin | Vô hiệu hóa nếu không còn service/doctor active phụ thuộc. |

### Services

| Method | Path | Role | Mục đích |
| --- | --- | --- | --- |
| GET | `/services` | authenticated | List services với `specialtyId`, `status`, `q`. |
| GET | `/services/{id}` | authenticated | Lấy chi tiết service. |
| POST | `/services` | admin | Tạo service. |
| PATCH | `/services/{id}` | admin | Sửa name, specialty, duration, price, description, status. |
| POST | `/services/{id}/deactivate` | admin | Vô hiệu hóa service, không hard delete appointment history. |

## Scheduling

### Doctor Schedules

| Method | Path | Role | Mục đích |
| --- | --- | --- | --- |
| GET | `/doctor-schedules` | authenticated | List schedule với `doctorId`, `from`, `to`. |
| POST | `/doctor-schedules` | admin | Tạo working, blocked hoặc leave schedule. |
| PATCH | `/doctor-schedules/{id}` | admin | Sửa effective range/time/status. |
| POST | `/doctor-schedules/{id}/deactivate` | admin | Ngừng áp dụng schedule block. |

`DoctorSchedule` hỗ trợ:

- `type`: `working`, `blocked` hoặc `leave`.
- `dayOfWeek`: `1` đến `7`, với `1` là Monday.
- `effectiveFrom` và `effectiveTo` là date-only ISO.
- `startTime` và `endTime` là giờ địa phương dạng `HH:mm`, theo timezone clinic `Asia/Ho_Chi_Minh`.

### Availability

| Method | Path | Role | Mục đích |
| --- | --- | --- | --- |
| GET | `/availability/slots` | patient, receptionist, nurse, admin | Lấy slot khả dụng theo service/date/doctor mode. |

Query:

```text
serviceId=service-general&date=2026-08-25&doctorId=doctor-1
```

Nếu không truyền `doctorId`, backend trả slot cho any available doctor. Mỗi slot response phải có doctor candidate để frontend có thể assign deterministic khi submit.

## Appointments

| Method | Path | Role | Mục đích |
| --- | --- | --- | --- |
| GET | `/appointments` | authenticated | List appointments theo role và filters. |
| GET | `/appointments/{id}` | authorized actor | Lấy appointment detail. |
| POST | `/appointments` | patient, receptionist, nurse, admin | Tạo appointment. |
| PATCH | `/appointments/{id}` | receptionist, nurse, admin | Sửa doctor/service/time/note khi appointment chưa terminal. |
| POST | `/appointments/{id}/cancel` | patient owner, receptionist, nurse, admin | Hủy appointment hợp lệ. |
| POST | `/appointments/{id}/check-in` | receptionist, nurse, admin | Chuyển `confirmed` sang `checked_in`. |
| POST | `/appointments/{id}/start` | doctor | Chuyển `checked_in` sang `in_progress`. |
| POST | `/appointments/{id}/complete` | doctor | Chuyển `in_progress` sang `completed`. |
| POST | `/appointments/{id}/no-show` | receptionist, nurse, admin | Đánh dấu `no_show` khi patient không đến. |

List filters:

- `status`
- `patientId`
- `doctorId`
- `serviceId`
- `specialtyId`
- `from`
- `to`
- `q`

`POST /appointments` request:

```json
{
  "patientId": "patient-1",
  "serviceId": "service-general",
  "doctorId": "doctor-1",
  "startAt": "2026-08-25T09:00:00+07:00",
  "reason": "Đau đầu kéo dài",
  "source": "patient_portal"
}
```

Create rules:

- Patient-created appointment mặc định là `requested`.
- Staff-created appointment mặc định là `confirmed`.
- Backend tính `endAt` theo `service.durationMinutes`.
- Backend reject nếu doctor không active, service không active, slot ngoài schedule hoặc conflict với active appointment khác.

Allowed status transitions:

| From | To | Actors |
| --- | --- | --- |
| `requested` | `confirmed` | receptionist, nurse, admin |
| `requested` | `cancelled` | patient owner, receptionist, nurse, admin |
| `confirmed` | `checked_in` | receptionist, nurse, admin |
| `confirmed` | `cancelled` | patient owner, receptionist, nurse, admin |
| `confirmed` | `no_show` | receptionist, nurse, admin |
| `checked_in` | `in_progress` | doctor |
| `checked_in` | `cancelled` | receptionist, nurse, admin |
| `in_progress` | `completed` | doctor |

Terminal statuses:

- `completed`
- `cancelled`
- `no_show`

Terminal appointments không được sửa time/doctor/service/status bằng endpoint thường.

## Audit Events

| Method | Path | Role | Mục đích |
| --- | --- | --- | --- |
| GET | `/audit-events` | admin | List audit events với filters. |
| GET | `/audit-events/{id}` | admin | Lấy chi tiết audit event. |

Filters:

- `entityType`
- `entityId`
- `actorUserId`
- `action`
- `from`
- `to`

Backend phải ghi audit event cho:

- appointment created, confirmed, rescheduled, cancelled, checked in, started, completed, no-show.
- admin create/update/deactivate doctor, service, specialty, staff/user.
- auth-sensitive events như login failed nếu backend plan chọn lưu audit bảo mật.

## Notifications

| Method | Path | Role | Mục đích |
| --- | --- | --- | --- |
| GET | `/notifications` | authenticated | List notifications của current user. |
| POST | `/notifications/{id}/read` | owner | Đánh dấu một notification đã đọc. |
| POST | `/notifications/read-all` | owner | Đánh dấu tất cả notification đã đọc. |

Notification response giữ `referenceType` và `referenceId` để frontend điều hướng theo role như prototype hiện tại.

## Backend Phase Boundaries

Phase backend đầu tiên nên triển khai theo thứ tự:

1. Auth/session và current user.
2. Read-only catalog endpoints: doctors, specialties, services.
3. Appointment read/create/conflict validation.
4. Appointment status transition endpoints.
5. Operations/admin management endpoints.
6. Audit events và notifications.

Implemented authorization boundaries use `SessionGuard` for bearer-session authentication, `RolesGuard` with `@Roles(...)` for route-level role gates, and domain-level ownership checks for patient and doctor scoped actions. `/users` administration remains a later admin-management slice.

Không tích hợp payment, insurance, prescription, telemedicine hoặc external SMS/email/push trong API v1.
