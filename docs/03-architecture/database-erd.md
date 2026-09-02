# Database ERD

## Document Control

| Trường | Giá trị |
| --- | --- |
| Trạng thái | `baseline` |
| Đối tượng đọc chính | Backend engineer, reviewer, AI agent |
| Cập nhật lần cuối | 2026-09-02 |
| Source of truth | `apps/api/prisma/schema.prisma`, `docs/03-architecture/database-schema.md` |

## Mục Đích

Tài liệu này bổ sung ERD dạng Mermaid để người đọc thấy quan hệ database nhanh hơn so với đọc Prisma schema đầy đủ. Đây là bản diagram hóa schema đã triển khai, không thay thế Prisma schema.

## ERD Tổng Quan

```mermaid
erDiagram
  User ||--o| Patient : "links"
  User ||--o| Staff : "links"
  User ||--o| Doctor : "links"
  User ||--o{ AuthSession : "has"
  User ||--o{ Notification : "receives"
  User ||--o{ AuditEvent : "performs"
  User ||--o{ AppointmentStatusHistory : "changes"

  Specialty ||--o{ Doctor : "groups"
  Specialty ||--o{ Service : "groups"
  Doctor }o--o{ Service : "provides"
  Doctor ||--o{ DoctorSchedule : "has"
  Doctor ||--o{ Appointment : "assigned"
  Service ||--o{ Appointment : "booked"
  Patient ||--o{ Appointment : "owns"
  Appointment ||--o{ AppointmentStatusHistory : "tracks"
  Appointment ||--o{ AuditEvent : "audits"

  User {
    string id PK
    string displayName
    string email UK
    string passwordHash
    string phone
    UserRole role
    AccountStatus status
    string avatarUrl
    datetime createdAt
    datetime updatedAt
  }

  AuthSession {
    string id PK
    string tokenHash UK
    string userId FK
    datetime expiresAt
    datetime revokedAt
    datetime createdAt
    datetime updatedAt
  }

  Patient {
    string id PK
    string userId UK
    string fullName
    string phone UK
    string email
    date dateOfBirth
    string gender
    string address
    string notes
    AccountStatus status
  }

  Staff {
    string id PK
    string userId UK
    string fullName
    string phone
    string email
    UserRole role
    AccountStatus status
  }

  Doctor {
    string id PK
    string userId UK
    string specialtyId FK
    string fullName
    string phone
    string email UK
    string title
    string room
    DoctorStatus status
  }

  Specialty {
    string id PK
    string name UK
    string description
    ServiceStatus status
  }

  Service {
    string id PK
    string specialtyId FK
    string name
    int durationMinutes
    decimal price
    string currency
    string description
    ServiceStatus status
  }

  DoctorSchedule {
    string id PK
    string doctorId FK
    int dayOfWeek
    string startTime
    string endTime
    date effectiveFrom
    date effectiveTo
    ScheduleType type
    AccountStatus status
  }

  Appointment {
    string id PK
    string patientId FK
    string doctorId FK
    string serviceId FK
    datetime startAt
    datetime endAt
    AppointmentStatus status
    string reason
    string internalNote
    string cancellationReason
    string createdByUserId FK
    string updatedByUserId FK
  }

  AppointmentStatusHistory {
    string id PK
    string appointmentId FK
    AppointmentStatus fromStatus
    AppointmentStatus toStatus
    string actorUserId FK
    string note
    datetime changedAt
  }

  Notification {
    string id PK
    string recipientUserId FK
    NotificationType type
    string title
    string message
    string referenceType
    string referenceId
    datetime readAt
    datetime createdAt
  }

  AuditEvent {
    string id PK
    string actorUserId FK
    string appointmentId FK
    string entityType
    string entityId
    string action
    datetime timestamp
    json metadata
  }
```

## Điểm Khác Giữa ERD Và Prisma Schema

- Mermaid không thể hiện đầy đủ Prisma implicit many-to-many join table giữa `Doctor` và `Service`; relation này tồn tại trong schema runtime.
- Diagram gom bớt `createdAt`/`updatedAt` ở một số entity để dễ đọc; schema thật vẫn có timestamp đầy đủ.
- Index chi tiết nằm trong `docs/03-architecture/database-schema.md` và `apps/api/prisma/schema.prisma`.
- Enum chi tiết nằm trong `docs/03-architecture/database-schema.md`.

## Business-Critical Relations

- `User -> Patient/Doctor/Staff` là linked profile dùng cho ownership và role-scoped access.
- `Appointment -> Patient/Doctor/Service` là lõi booking workflow.
- `DoctorSchedule -> Doctor` quyết định availability.
- `AppointmentStatusHistory` và `AuditEvent` giữ trace cho workflow và admin actions.
- `AuthSession` lưu token hash, không lưu plaintext bearer token.
