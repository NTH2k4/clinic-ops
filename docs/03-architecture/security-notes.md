# Security Notes

## MVP Position

The MVP should avoid collecting sensitive clinical data. Lightweight mock notes are acceptable for demonstrating workflow behavior, but the product is not production-ready medical software.

## Backend Requirements

- Role-based access control.
- Authentication and session management. The backend now stores bcrypt password hashes and bearer session hashes in PostgreSQL with 12-hour expiry and logout revocation. The next approved auth slice is patient registration, authenticated password change and admin account lifecycle actions; external email reset and SSO stay outside v1.
- Audit logging for important appointment, patient and catalog changes. The detailed baseline is documented in `docs/03-architecture/audit-data-governance.md`.
- Input validation at the API boundary.
- Protection against unauthorized patient data access. `Patient.notes`, appointment `internalNote` and status-history `note` are staff-only fields in the current API projection.
- Safe handling of secrets and environment variables.

## Compliance Notes

Before using the product for a real clinic, review legal and compliance requirements for the target country and operating model.
