# Task 2 Report: Authenticated Password Change API

## Implementation

- Added strict `changePasswordSchema` validation for `currentPassword` and `newPassword`.
- Added guarded `POST /auth/change-password`, returning the standard `{ data: {} }` success envelope.
- Added `AuthService.changePassword(userId, input)` to verify the current password with bcrypt, hash the replacement password, and revoke all unrevoked sessions for the user in a transaction.
- Added isolated-account E2E coverage for required current password, incorrect current password, stored password hashing, prior-token revocation, old-password rejection, and new-password login.

## TDD Record

The added E2E tests were run before implementation and failed as expected because `POST /api/v1/auth/change-password` did not exist:

- Test suites: 1 failed
- Tests: 2 failed, 13 passed
- Failure: expected `400` or `201`, received `404 Not Found`

## Verification

- `DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run test:e2e -- --runInBand auth.e2e-spec.ts`: 1 suite passed, 15 tests passed.
- `npm run typecheck`: exit 0.
- `npm run lint`: exit 0.
- `npm test -- --runInBand`: 7 suites passed, 40 tests passed.
- `git diff --check`: exit 0.

## Fix Round 1

### Changed Files

- `apps/api/src/auth/auth.service.ts`
- `apps/api/test/auth.e2e-spec.ts`
- `.superpowers/sdd/account-administration-plan/task-2-report.md`

### Fix

- Login now conditionally locks the user row by the bcrypt hash it verified, inside the same transaction that creates the session. If the hash changed before that lock is acquired, login returns the existing generic unauthenticated error. If login acquires the lock first, the concurrent password change waits and then revokes the newly created session.
- Added deterministic E2E race coverage using a test-only PostgreSQL trigger and transaction-scoped advisory lock to pause a login immediately before session insertion.
- Expanded password-change E2E coverage to reject unknown request fields and revoke two active bearer sessions.

### Tests Run

- RED: `DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run test:e2e -- --runInBand auth.e2e-spec.ts`: 1 suite failed, 1 test failed, 15 tests passed. The delayed old-password token incorrectly received `200` after the password change.
- GREEN: same auth E2E command: 1 suite passed, 16 tests passed.
- `npm run typecheck`: exit 0.
- `npm run lint`: exit 0.
- `npm test -- --runInBand`: 7 suites passed, 40 tests passed.

### Residual Concern

None. The race is covered deterministically at E2E level; the trigger, function, and advisory lock are test-only and removed in test cleanup.

## Fix Round 2

### Changed Files

- `apps/api/test/auth.e2e-spec.ts`
- `.superpowers/sdd/account-administration-plan/task-2-report.md`

### Fix

- Replaced the race-test readiness probe from session-scoped `pg_try_advisory_lock` to transaction-scoped `pg_try_advisory_xact_lock`.
- Removed manual advisory-lock unlock calls. Each probe now releases automatically when its query transaction completes, independent of Prisma connection pooling.
- Retained `finally` cleanup for the test-only trigger and function.
- Parsed the empty successful password-change envelope with Zod before asserting its data, resolving the lint violation found during this verification round.

### Tests Run

- `DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run test:e2e -- --runInBand auth.e2e-spec.ts`: 1 suite passed, 16 tests passed.
- `npm run typecheck`: exit 0.
- `npm run lint`: exit 0.

### Residual Concern

None. The deterministic synchronization no longer has connection-scoped state outside the transaction that owns it.

## Fix Round 3

### Changed Files

- `apps/api/test/auth.e2e-spec.ts`
- `.superpowers/sdd/account-administration-plan/task-2-report.md`

### Fix

- Replaced the fixed `pg_sleep(1)` delay with a test-controlled `careflow_test_login_gate` table. The AuthSession insert trigger waits only until the test explicitly sets its release flag.
- Before release, the test observes a second synchronization point: either the vulnerable path has committed the password hash change and session revocations, or the fixed path has the password-change request waiting on the user-row lock.
- The gate is released in `finally` before trigger/function/table cleanup, ensuring a failed assertion cannot leave a blocked login transaction.
- Kept all advisory locks transaction-scoped; no pooled connection owns state after a query completes.

### Tests Run

- Mutation RED: temporarily removed the login conditional lock and ran `DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run test:e2e -- --runInBand auth.e2e-spec.ts`: 1 suite failed, 1 test failed, 15 tests passed. The delayed old-password token received `200` where the test requires `401`.
- GREEN: restored the exact production guard and ran the same auth E2E command: 1 suite passed, 16 tests passed.
- `npm run typecheck`: exit 0.
- `npm run lint`: exit 0.

### Residual Concern

None. The test no longer relies on elapsed time to decide the request ordering; its short polling interval only waits for explicit database state.

## Fix Round 4

### Changed Files

- `apps/api/test/auth.e2e-spec.ts`
- `.superpowers/sdd/account-administration-plan/task-2-report.md`

### Fix

- Replaced the global `pg_locks` waiter probe with a lookup for the delayed login transaction's granted advisory lock. The two-part transaction-scoped lock uses a fixed test namespace and a key derived from the test user's ID, and the lookup captures the exact PostgreSQL backend PID holding that gate.
- The second synchronization point now accepts a lock wait only when `pg_blocking_pids` proves that the password-hash `UPDATE` is blocked by that delayed login backend. An unrelated database waiter cannot release the gate.
- Retained the scoped committed-state alternative for the vulnerable mutation path and the `finally` cleanup that releases the gate before dropping the trigger, function, and table.
- Kept production code unchanged and introduced no session-scoped advisory locks.

### Tests Run

- Mutation RED: temporarily removed the production login transaction and conditional hash lock, then ran `DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run test:e2e -- --runInBand auth.e2e-spec.ts`: 1 suite failed, 1 test failed, 15 tests passed. The delayed old-password token received `200` where the test requires `401`.
- GREEN after restoring the exact production guard: the same auth E2E command passed 1 suite and all 16 tests.
- `npm run typecheck`: exit 0.
- `npm run lint`: exit 0.

### Residual Concern

None. Both synchronization points are scoped to the delayed login for this test user, and all database gate state is transaction-scoped or removed in `finally`.
