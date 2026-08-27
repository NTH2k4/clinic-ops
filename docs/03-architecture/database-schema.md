# Database Schema

## Document Control

| Field | Value |
| --- | --- |
| Status | Baseline |
| Primary audience | Human contributors, AI agents and subagents |
| Last updated | 2026-08-26 |
| Source of truth | `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations` |

## Purpose

This document explains the implemented PostgreSQL schema behind the CareFlow backend. It complements the conceptual model in `docs/03-architecture/data-model.md` with concrete Prisma tables, relations, indexes and implementation rules.

## Database And Migration Model

- Provider: PostgreSQL.
- ORM: Prisma.
- Prisma client generation: `npm run prisma:generate` from `apps/api`.
- Local migration apply: `npx prisma migrate deploy`.
- Local deterministic seed: `npm run prisma:seed`.
- Seed safety: `prisma/seed.ts` refuses to seed a non-local database unless `ALLOW_DATABASE_SEED=true`.

The initial migration is stored at `apps/api/prisma/migrations/20260826000000_init/migration.sql`. Auth session persistence is added by `apps/api/prisma/migrations/20260827000000_auth_sessions/migration.sql`.

## Enum Reference

| Enum | Values | Usage |
| --- | --- | --- |
| `UserRole` | `patient`, `doctor`, `receptionist`, `nurse`, `admin` | Auth identity, staff role and route authorization. |
| `AccountStatus` | `active`, `inactive`, `locked` | User, patient, staff and schedule activation state. |
| `DoctorStatus` | `active`, `inactive`, `on_leave` | Doctor availability for catalog and booking. |
| `ServiceStatus` | `active`, `inactive` | Specialty and service availability. |
| `ScheduleType` | `working`, `blocked`, `leave` | Doctor schedule availability semantics. |
| `AppointmentStatus` | `requested`, `confirmed`, `checked_in`, `in_progress`, `completed`, `cancelled`, `no_show` | Appointment lifecycle. |
| `NotificationType` | `appointment_created`, `appointment_confirmed`, `appointment_rescheduled`, `appointment_cancelled`, `appointment_checked_in`, `appointment_completed`, `system` | In-app notification classification. |

## Identity Tables

### `User`

`User` is the authentication identity. It stores display name, email, bcrypt password hash, phone, role, status and optional avatar URL.

Important rules:

- `email` is unique.
- `passwordHash` is required and must contain a bcrypt hash, never a plaintext password.
- One user may link to exactly one patient, staff or doctor profile.
- Appointment creator/updater relations point back to `User`.
- Audit events, notifications and auth sessions reference `User`.

### `AuthSession`

`AuthSession` stores bearer session token hashes for API authentication.

Important rules:

- `tokenHash` is unique and stores the SHA-256 hash of the bearer token sent in `Authorization: Bearer <token>`.
- `userId` links the session to `User`.
- `expiresAt` controls session expiry.
- `revokedAt` being non-null means logout or administrative revocation invalidated the token.
- Deleting a user cascades to that user's sessions.
- Indexed by `[userId, revokedAt]` for user session lookups and `[expiresAt]` for future cleanup jobs.

### `Patient`

`Patient` is the patient profile used for appointment ownership.

Important rules:

- `userId` is optional and unique so walk-in/imported patients can exist without login access.
- `phone` is unique.
- `dateOfBirth` is a database `Date`, not a timestamp.
- Patient-scoped API reads must filter by the linked patient profile.
- `notes` is a staff-only operational field and is omitted from patient owner projections.

### `Staff`

`Staff` represents receptionist, nurse and admin profiles.

Important rules:

- `userId` is optional and unique.
- `role` uses `UserRole` and should stay aligned with the linked `User.role`.
- Staff profiles are operational records; route access still comes from `User.role`.

### `Doctor`

`Doctor` represents a bookable doctor profile.

Important rules:

- `userId` is optional and unique.
- `email` is unique.
- `specialtyId` is required.
- Doctors have many services through Prisma's implicit many-to-many relation.
- Doctors own schedules and appointments.
- Indexed by `[specialtyId, status]` for catalog and availability reads.

## Catalog Tables

### `Specialty`

`Specialty` groups doctors and services.

Important rules:

- `name` is unique.
- `status` uses `ServiceStatus` to hide inactive specialties from normal catalog reads.

### `Service`

`Service` is a bookable care item.

Important rules:

- `durationMinutes` drives appointment `endAt`.
- `price` is `Decimal(10, 2)`.
- `currency` defaults to `VND`.
- `specialtyId` is required.
- Services connect to many doctors and appointments.
- Indexed by `[specialtyId, status]`.

## Scheduling Tables

### `DoctorSchedule`

`DoctorSchedule` stores date-bounded local working, blocked and leave intervals.

Important rules:

- `dayOfWeek` uses `1..7`, where Monday is `1` and Sunday is `7`.
- `startTime` and `endTime` are `HH:mm` strings interpreted in `Asia/Ho_Chi_Minh`.
- `effectiveFrom` and `effectiveTo` are database `Date` values.
- `type=working` provides availability.
- `type=blocked` and `type=leave` remove availability.
- Indexed by `[doctorId, effectiveFrom, effectiveTo]`.

The API requires appointment slots to fit inside one local clinic day.

## Appointment Tables

### `Appointment`

`Appointment` is the central workflow table.

Important fields:

- `patientId`, `doctorId`, `serviceId` are required.
- `startAt` and `endAt` are timezone-aware timestamps.
- `status` uses `AppointmentStatus`.
- `reason` is patient/staff visible.
- `internalNote` is staff-only and omitted from patient projections.
- `cancellationReason` is captured for cancelled appointments.
- Lifecycle timestamps include `checkedInAt`, `startedAt`, `completedAt` and `cancelledAt`.
- `createdByUserId` is required; `updatedByUserId` is optional.

Indexes:

- `[doctorId, startAt, endAt, status]` supports conflict checks and doctor schedule reads.
- `[patientId, startAt]` supports patient appointment history.

Conflict semantics:

- Active blocking statuses are `requested`, `confirmed`, `checked_in` and `in_progress`.
- `completed`, `cancelled` and `no_show` do not block future scheduling.

### `AppointmentStatusHistory`

`AppointmentStatusHistory` records status changes.

Important rules:

- `fromStatus` is nullable for the initial seeded or created state.
- `toStatus` is required.
- `actorUserId` records who performed the change.
- `note` may hold transition notes, but patient projections omit it.
- Indexed by `[appointmentId, changedAt]`.

## Audit And Notification Tables

### `AuditEvent`

`AuditEvent` records important operational mutations.

Important rules:

- `actorUserId` is required.
- `appointmentId` is optional because some audit events target catalog or patient entities.
- `entityType`, `entityId` and `action` identify what changed.
- `metadata` is JSON for structured context.
- Indexed by `[entityType, entityId, timestamp]` and `[actorUserId, timestamp]`.
- Patient audit events should not include demographics, contact details or notes in `metadata`.

### `Notification`

`Notification` stores the in-app notification inbox.

Important rules:

- `recipientUserId` is required.
- `readAt` being `null` means unread.
- `referenceType` and `referenceId` link back to domain entities without a hard foreign key.
- Indexed by `[recipientUserId, readAt]`.

## Timestamp And Date Conventions

- Audit, appointment and notification event times use `Timestamptz(3)`.
- Date-only fields use `Date`.
- API datetime inputs must include a timezone.
- Clinic schedule interpretation uses `Asia/Ho_Chi_Minh`.
- Seed data uses deterministic timestamps so E2E tests can assert stable behavior.

## Seed Dataset

The deterministic seed creates:

- 5 users: patient, doctor, receptionist, nurse and admin.
- 0 auth sessions; sessions are created by login and cleared by seed resets.
- 6 patients.
- 3 staff profiles.
- 3 specialties.
- 8 services.
- 5 doctors with service assignments.
- 50 doctor schedules: 10 workday schedules per doctor.
- 30 appointments across all appointment statuses.
- 30 appointment status history rows.
- 20 audit events.
- 8 notifications.

Seeded login emails include:

| Role | Email | Password |
| --- | --- | --- |
| Patient | `patient@careflow.local` | `careflow-demo` |
| Doctor | `minh.nguyen@careflow.local` | `careflow-demo` |
| Receptionist | `reception@careflow.local` | `careflow-demo` |
| Nurse | `nurse@careflow.local` | `careflow-demo` |
| Admin | `admin@careflow.local` | `careflow-demo` |

## Schema Change Rules

- Update `apps/api/prisma/schema.prisma` first.
- Generate a Prisma migration for any persisted schema change.
- Update seed data when tests or frontend flows depend on the new entity shape.
- Update `docs/03-architecture/api-contract.md` when the API surface changes.
- Update this document when tables, relations, indexes, enums or date semantics change.
- Run API E2E tests after any appointment, schedule, auth or catalog schema change.
