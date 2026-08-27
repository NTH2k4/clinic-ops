# Audit And Data Governance

## Document Control

| Field | Value |
| --- | --- |
| Status | Baseline |
| Primary audience | Backend contributors, AI agents and reviewers |
| Last updated | 2026-08-27 |
| Source of truth | `apps/api/src`, `apps/api/prisma/schema.prisma`, backend E2E tests |

## Purpose

This document defines the backend baseline for audit coverage, patient data projection and sensitive data handling. It is intentionally narrow: it describes current MVP behavior and the rules future backend changes must preserve.

## Audit Policy

The backend writes durable `AuditEvent` records for operational mutations that affect clinic data or appointment state.

| Entity | Covered actions | Notes |
| --- | --- | --- |
| `appointment` | `appointment_created`, `appointment_confirmed`, `appointment_checked_in`, `appointment_in_progress`, `appointment_completed`, `appointment_cancelled`, `appointment_no_show`, `appointment_rescheduled`, `appointment_updated` | Appointment audit events include `appointmentId`, `entityType=appointment`, `entityId`, `actorUserId` and limited workflow metadata. |
| `patient` | `patient_created`, `patient_updated`, `admin_resource_deactivated` | Patient create/update events do not store patient demographics, contact details or notes in audit metadata. |
| `service` | `admin_resource_created`, `admin_resource_updated`, `admin_resource_deactivated` | Catalog lifecycle events store only entity identity and action. |
| `specialty` | `admin_resource_created`, `admin_resource_updated`, `admin_resource_deactivated` | Catalog lifecycle events store only entity identity and action. |
| `doctor` | `admin_resource_created`, `admin_resource_updated`, `admin_resource_deactivated` | Catalog lifecycle events store only entity identity and action. |

Authentication events are not yet written to `AuditEvent`; failed login diagnostics remain in structured server logs. Add auth audit events only after account lockout and password reset flows are defined.

## Patient Data Projection

`Patient.notes` is an operational staff-only field.

Rules:

- Receptionist, nurse and admin users may read patient notes.
- Patient owners may read their own patient profile but must not receive `notes`.
- Patient owners may create and update their own patient profile fields except `notes`.
- Doctors may not create or update patient profiles through the current patient routes.
- Appointment `internalNote` and status-history `note` remain omitted from patient appointment projections.

## Sensitive Data In Logs

Sensitive patient data must not be logged by default.

The current logging baseline follows these constraints:

- Request completion logs include method, query-free path, status code and duration.
- Exception logs include method, query-free path, status code and public error code.
- Appointment workflow logs include request ID, action, appointment ID, actor user ID and status-only metadata.
- Patient audit events do not include full name, phone, email, address, date of birth or notes in metadata.

Do not add request bodies, query strings, patient notes, contact details or clinical notes to logs without a separate product/security decision.

## Retention

Current MVP retention is indefinite for `AuditEvent` and `Notification` rows. There is no automatic purge job.

Future production policy should define:

- minimum audit retention period;
- notification retention or archival behavior;
- whether deleted users/patients require pseudonymized historical audit records;
- export and deletion workflows for jurisdiction-specific compliance needs.

