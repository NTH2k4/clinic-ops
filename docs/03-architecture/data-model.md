# Data Model

This is a draft model for the frontend-first phase and future backend contract.

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
