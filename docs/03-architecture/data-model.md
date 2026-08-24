# Data Model

Đây là data model nháp cho giai đoạn frontend-first và backend contract sau này.

## Core Entities

### User

- id
- name
- email
- role
- status

### Patient

- id
- fullName
- phone
- email
- dateOfBirth
- notes

### Doctor

- id
- fullName
- specialtyId
- serviceIds
- status

### Service

- id
- name
- specialtyId
- durationMinutes
- price
- status

### Specialty

- id
- name
- description

### Appointment

- id
- patientId
- doctorId
- serviceId
- startAt
- endAt
- status
- reason
- internalNote
- createdByUserId
- updatedAt

### AuditEvent

- id
- actorUserId
- entityType
- entityId
- action
- timestamp
- metadata
