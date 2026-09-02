# Sequence Diagrams

## Document Control

| Trường | Giá trị |
| --- | --- |
| Trạng thái | `baseline` |
| Đối tượng đọc chính | Product owner, frontend/backend engineer, QA, AI agent |
| Cập nhật lần cuối | 2026-09-02 |
| Phạm vi | Sequence-level overview cho các flow chính của CareFlow v1 |

## Quy Ước

- `Web` là React frontend.
- `API` là NestJS API tại `/api/v1`.
- `DB` là PostgreSQL qua Prisma.
- Backend luôn là source of truth cho auth, authorization, conflict, transition và audit.

## SD-001: Register And Login

```mermaid
sequenceDiagram
  actor User as Người dùng
  participant Web as React Web
  participant API as NestJS API
  participant DB as PostgreSQL

  User->>Web: Nhập thông tin đăng ký
  Web->>API: POST /api/v1/auth/register
  API->>API: Validate password policy và payload strict
  API->>DB: Create User + Patient + AuthSession
  DB-->>API: Created records
  API-->>Web: sessionToken + currentUser + linkedProfile
  Web-->>User: Mở Patient Workspace
```

## SD-002: Patient Booking Request

```mermaid
sequenceDiagram
  actor Patient as Người dùng
  participant Web as Patient Portal
  participant API as Appointments API
  participant Conflict as Conflict Service
  participant DB as PostgreSQL

  Patient->>Web: Chọn dịch vụ, bác sĩ, ngày, giờ
  Web->>API: POST /api/v1/appointments
  API->>API: Enforce patient ownership
  API->>Conflict: Validate service, doctor, schedule, slot and active appointments
  Conflict->>DB: Read schedules and active appointments
  DB-->>Conflict: Availability facts
  Conflict-->>API: Slot accepted
  API->>DB: Create appointment requested + history + audit + notification
  API-->>Web: Appointment response
  Web-->>Patient: Hiển thị lịch chờ xác nhận
```

## SD-003: Operations Confirm And Check-In

```mermaid
sequenceDiagram
  actor Staff as Lễ tân/Điều dưỡng
  participant Web as Operations UI
  participant API as Appointments API
  participant DB as PostgreSQL

  Staff->>Web: Mở Queue hoặc Calendar theo ngày
  Web->>API: GET /api/v1/appointments
  API->>DB: Query appointments by role/date/status
  DB-->>API: Appointment list
  API-->>Web: List response
  Staff->>Web: Xác nhận lịch requested
  Web->>API: POST /api/v1/appointments/{id}/confirm
  API->>DB: Write status history + audit event
  API-->>Web: confirmed appointment
  Staff->>Web: Check-in đúng ngày khám
  Web->>API: POST /api/v1/appointments/{id}/check-in
  API->>DB: Write checked_in timestamp, history and audit
  API-->>Web: checked_in appointment
```

## SD-004: Doctor Visit Flow

```mermaid
sequenceDiagram
  actor Doctor as Bác sĩ
  participant Web as Doctor Workspace
  participant API as Appointments API
  participant DB as PostgreSQL

  Doctor->>Web: Mở lịch ngày/tuần
  Web->>API: GET /api/v1/appointments
  API->>API: Enforce linked doctor ownership
  API->>DB: Query doctor appointments
  DB-->>API: Doctor schedule data
  API-->>Web: Appointment list
  Doctor->>Web: Bắt đầu khám
  Web->>API: POST /api/v1/appointments/{id}/start
  API->>DB: checked_in -> in_progress + audit
  API-->>Web: in_progress appointment
  Doctor->>Web: Hoàn tất khám
  Web->>API: POST /api/v1/appointments/{id}/complete
  API->>DB: in_progress -> completed + audit
  API-->>Web: completed appointment
```

## SD-005: Admin Schedule Management

```mermaid
sequenceDiagram
  actor Admin as Admin
  participant Web as Admin Schedules UI
  participant API as Scheduling API
  participant Conflict as Conflict Service
  participant DB as PostgreSQL

  Admin->>Web: Tạo working/blocked/leave schedule
  Web->>API: POST /api/v1/doctor-schedules
  API->>API: Validate role, date, time, schedule type
  API->>Conflict: Check active appointment overlap for blocked/leave
  Conflict->>DB: Query doctor active appointments
  DB-->>Conflict: Overlap facts
  Conflict-->>API: Accepted or conflict
  API->>DB: Create schedule + audit event
  API-->>Web: Schedule response
  Web-->>Admin: Cập nhật danh sách lịch
```

## SD-006: Production Smoke

```mermaid
sequenceDiagram
  actor Operator as Operator
  participant Script as production-smoke.mjs
  participant API as Render API

  Operator->>Script: Run smoke with RENDER_EXTERNAL_URL
  Script->>API: GET /api/v1/health
  API-->>Script: Health + commit
  Script->>API: POST /api/v1/auth/login
  API-->>Script: Admin role + token
  Script->>API: GET catalog/schedule/availability smoke endpoints
  API-->>Script: Expected demo data
  Script->>API: POST /api/v1/auth/logout
  API-->>Script: Session revoked
  Script-->>Operator: Pass/fail without printing token
```

## Coverage Matrix

| Sequence | Requirement refs | Test evidence |
| --- | --- | --- |
| `SD-001` | `SRS-AUTH-*` | API auth unit/E2E, Web auth tests, API-mode Playwright |
| `SD-002` | `SRS-APT-*`, `SRS-SCHED-*` | API appointment/scheduling E2E, booking Playwright |
| `SD-003` | `SRS-APT-*` | Operations Playwright, API appointment E2E |
| `SD-004` | `SRS-AUTHZ-*`, `SRS-APT-*` | Doctor workflow Playwright, API authorization E2E |
| `SD-005` | `SRS-SCHED-*`, `SRS-AUDIT-*` | Scheduling E2E, admin schedule Playwright |
| `SD-006` | `SRS-DEPLOY-*` | `scripts/production-smoke.mjs`, acceptance checklist |
