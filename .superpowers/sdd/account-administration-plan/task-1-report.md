# Task 1 Report: Public Patient Registration API

## Status

Complete.

## TDD Red Step

Added E2E coverage in `apps/api/test/auth.e2e-spec.ts` before implementation:

- `registers a public patient account and returns an auth session`
- `rejects role injection during public patient registration`

Red command:

```bash
cd apps/api
DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run test:e2e -- --runInBand auth.e2e-spec.ts
```

Expected failure observed:

- Test suite failed.
- Registration success case expected `201` but received `404 Not Found`.
- Role injection rejection case expected `400` but received `404 Not Found`.
- Existing tests: 11 passed.

## Implementation

- Created `apps/api/src/auth/auth.dto.ts` with a strict Zod patient registration schema for `displayName`, `email`, `phone`, and `password`.
- Added `POST /api/v1/auth/register` in `AuthController`.
- Added `AuthService.registerPatient(input): Promise<AuthLoginResult>`.
- Registration creates only `UserRole.patient` accounts with active user and linked active patient records.
- User, patient, and auth session creation run in one Prisma transaction.
- Passwords are bcrypt hashed before persistence.
- Session tokens remain in the response, while only SHA-256 token hashes are stored.
- Login and registration now share the same auth session creation path and response shape.

## Verification

```bash
cd apps/api
DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run test:e2e -- --runInBand auth.e2e-spec.ts
```

Result: passed, 13 tests passed.

```bash
cd apps/api
npm test -- --runInBand
```

Result: passed, 7 suites passed, 40 tests passed.

```bash
cd apps/api
npm run typecheck
```

Result: passed.

## Concerns

- The auth E2E suite intentionally logs the existing internal-error test stack through `ApiExceptionFilter`; this is pre-existing test behavior and not related to registration.
