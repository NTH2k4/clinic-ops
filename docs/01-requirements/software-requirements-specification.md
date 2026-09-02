# Software Requirements Specification

## Document Control

| Trường | Giá trị |
| --- | --- |
| Trạng thái | `baseline` |
| Đối tượng đọc chính | Backend engineer, frontend engineer, QA, AI agent |
| Cập nhật lần cuối | 2026-09-02 |
| Phạm vi | Yêu cầu phần mềm chi tiết cho CareFlow v1, được rút từ implementation và tài liệu đã nghiệm thu |

## 1. System Context

CareFlow là web application gồm:

- React/Vite frontend.
- NestJS API tại `/api/v1`.
- PostgreSQL qua Prisma.
- Render single-service production deployment.
- Neon PostgreSQL production database.

## 2. Actors

- `patient`
- `doctor`
- `receptionist`
- `nurse`
- `admin`
- Public visitor cho homepage/register/login.

## 3. Authentication Requirements

| ID | Requirement |
| --- | --- |
| `SRS-AUTH-001` | System MUST allow public patient registration. |
| `SRS-AUTH-002` | Registration MUST reject role/status fields from request. |
| `SRS-AUTH-003` | Password creation/change MUST require at least 10 characters, lowercase, uppercase, number, special character and max 72 UTF-8 bytes. |
| `SRS-AUTH-004` | Login MUST return a session token and current user shape on success. |
| `SRS-AUTH-005` | Login failure MUST use a public generic message. |
| `SRS-AUTH-006` | Sessions MUST be stored as hashes, expire after 12 hours and support logout revocation. |
| `SRS-AUTH-007` | Password change MUST revoke all active sessions for that user. |
| `SRS-AUTH-008` | Authenticated profile update MUST only change `displayName` and `email`. |

## 4. Authorization Requirements

| ID | Requirement |
| --- | --- |
| `SRS-AUTHZ-001` | Protected endpoints MUST require a valid bearer session. |
| `SRS-AUTHZ-002` | Role-restricted endpoints MUST enforce role guards on the backend. |
| `SRS-AUTHZ-003` | Patient-scoped resources MUST enforce linked patient ownership. |
| `SRS-AUTHZ-004` | Doctor-scoped resources MUST enforce linked doctor ownership. |
| `SRS-AUTHZ-005` | Admin account lifecycle endpoints MUST reject self lock/deactivate. |

## 5. Catalog Requirements

| ID | Requirement |
| --- | --- |
| `SRS-CAT-001` | System MUST list active doctors, specialties and services for authenticated users. |
| `SRS-CAT-002` | Admin MUST be able to create/update/deactivate doctors. |
| `SRS-CAT-003` | Admin MUST be able to create/update/deactivate specialties. |
| `SRS-CAT-004` | Admin MUST be able to create/update/deactivate services. |
| `SRS-CAT-005` | Deactivation MUST preserve appointment and audit history. |

## 6. Scheduling Requirements

| ID | Requirement |
| --- | --- |
| `SRS-SCHED-001` | Admin MUST manage `working`, `blocked` and `leave` doctor schedules. |
| `SRS-SCHED-002` | Schedule times MUST be interpreted in `Asia/Ho_Chi_Minh`. |
| `SRS-SCHED-003` | `leave` schedules MUST respect the notice rule currently enforced by backend. |
| `SRS-SCHED-004` | Creating/updating blocked or leave schedules MUST reject overlaps with active appointments. |
| `SRS-SCHED-005` | Availability slots MUST explain unavailable reasons when requested by supported clients. |

## 7. Appointment Requirements

| ID | Requirement |
| --- | --- |
| `SRS-APT-001` | Patient-created appointments MUST start as `requested`. |
| `SRS-APT-002` | Staff-created appointments MUST start as `confirmed`. |
| `SRS-APT-003` | Backend MUST reject slot conflicts against schedules and active appointments. |
| `SRS-APT-004` | Backend MUST reject slots outside one local clinic day. |
| `SRS-APT-005` | Backend MUST reject slots too close to the clinic current time based on the configured cutoff. |
| `SRS-APT-006` | Status transitions MUST follow the documented appointment state graph. |
| `SRS-APT-007` | Terminal appointments MUST NOT be rescheduled. |
| `SRS-APT-008` | Each transition MUST write status history and audit event. |

## 8. User And Account Administration Requirements

| ID | Requirement |
| --- | --- |
| `SRS-USER-001` | Admin MUST list users with pagination/filtering. |
| `SRS-USER-002` | Admin MUST lock/unlock accounts. |
| `SRS-USER-003` | Admin MUST deactivate accounts. |
| `SRS-USER-004` | Admin MUST reset a user password and receive the temporary password only once in response. |
| `SRS-USER-005` | Account lifecycle mutations MUST revoke affected active sessions where applicable. |

## 9. Audit And Notification Requirements

| ID | Requirement |
| --- | --- |
| `SRS-AUDIT-001` | System MUST write audit events for appointment lifecycle changes. |
| `SRS-AUDIT-002` | System MUST write audit events for admin catalog, schedule and account lifecycle changes. |
| `SRS-AUDIT-003` | Audit APIs MUST be admin-only. |
| `SRS-NOTIF-001` | Users MUST be able to list their own notifications. |
| `SRS-NOTIF-002` | Users MUST be able to mark one or all notifications as read. |

## 10. Frontend Requirements

| ID | Requirement |
| --- | --- |
| `SRS-WEB-001` | Web MUST support mock mode for local prototype/regression. |
| `SRS-WEB-002` | Web MUST support API mode for Render production. |
| `SRS-WEB-003` | UI MUST use Vietnamese for user-facing core workflows. |
| `SRS-WEB-004` | Route access MUST redirect unauthenticated users to login. |
| `SRS-WEB-005` | Mobile and desktop smoke flows MUST remain covered by Playwright. |

## 11. Deployment Requirements

| ID | Requirement |
| --- | --- |
| `SRS-DEPLOY-001` | Production demo MUST run as a single Render Web Service. |
| `SRS-DEPLOY-002` | Production API and web MUST be same-origin. |
| `SRS-DEPLOY-003` | Deployment verification MUST check health commit and smoke flows. |
| `SRS-DEPLOY-004` | No real patient data MAY be used on demo deployment. |
