# SDD ledger — plan: docs/04-planning/account-administration-plan.md

Baseline: API typecheck initially failed because Prisma Client was not generated after fresh worktree npm ci; running prisma:generate before API baseline.

Preflight scan:
| Scope | Shared files/interfaces | Result |
| --- | --- | --- |
| Task 1 + Task 2 | `auth.controller.ts`, `auth.service.ts`, `auth.dto.ts`, `auth.e2e-spec.ts` | Compatible: Task 1 adds register/session shape; Task 2 adds change-password on same service/controller after Task 1. |
| Task 1 + Task 5 | `POST /auth/register` response consumed by frontend | Compatible: Task 5 depends on Task 1 response matching login session shape. |
| Task 2 + Task 5 | `POST /auth/change-password` consumed by frontend | Compatible: Task 5 depends on Task 2 returning empty success envelope and clearing auth state. |
| Task 3 + Task 6 | `/users` admin endpoints consumed by frontend | Compatible: Task 6 depends on Task 3 user list/detail/status/reset contracts. |
| Task 3 + Task 4 | users endpoints documented in contract | Compatible: Task 4 follows implementation, no pre-code OpenAPI update. |
| Task 5 + Task 6 | `routes.tsx`, admin/auth UI navigation | Compatible: Task 6 adds admin account route after Task 5 adds auth security route. |
| Task 7 | all prior tasks docs/tests | Compatible: final verification task depends on complete API + Web feature surface. |
| Global constraints | password/session/role/security constraints | No contradiction found; public registration remains patient-only. |
Task 1: complete (commits ab897116..9061b2e9, review clean)
Task 2: fix round 1 — reviewer found an Important login/password-change race where an old-password login verified before password update could create a session after revocation.
Task 2: fix round 2 — scoped re-review found production race resolved, but E2E advisory-lock synchronization uses session-scoped lock/unlock across pooled connections and can pollute the pool.
Task 2: fix round 3 — second scoped re-review found advisory-lock cleanup resolved, but race test still depends on `pg_sleep(1)` instead of explicit interleaving synchronization.
Task 2: fix round 4 — third scoped re-review found gate-table cleanup safe, but the fixed-path `pg_locks` wait probe is global and can be satisfied by unrelated DB lock waiters.
Ruling: Fix round 4 design used `pg_blocking_pids` scoped to the delayed login backend PID — it binds the wait check to the exact test transaction/user — cost if wrong: PostgreSQL-specific E2E complexity remains test-only.
Task 2: complete (commits 9061b2e9..45861bac, final scoped review clean; coordinator verification: auth E2E 16/16, API typecheck exit 0, API lint exit 0, git diff --check exit 0)
Ruling: Task 3 implements the endpoints enumerated in Task 3 and Task 4 (`GET /users`, `GET /users/:id`, `POST /users/:id/lock`, `POST /users/:id/unlock`, `POST /users/:id/deactivate`, `POST /users/:id/reset-password`) and does not implement `POST /users` or `PATCH /users/:id` in this slice — those are older planned contract rows and the approved Phase 2 goal only requires admin list/status/reset — cost if wrong: admin staff/doctor account creation remains deferred to a later account provisioning slice.
Task 3: fix round 1 — reviewer found a Critical lock/deactivate vs login race because `AuthService.login` conditionally locks on `id/passwordHash` but not `status=active`; also found E2E cleanup leaving patient/audit/session test data behind.
Ruling: Task 3 pagination `page` upper bound remains deferred — `pageSize` is already capped and changing shared pagination validation affects multiple list endpoints beyond this scoped task — cost if wrong: very large page values can still be handled in a future shared validation hardening slice.
Task 3: verification note — first coordinator E2E run with users+auth timed out one auth registration test while unit/typecheck/lint/build were running in parallel; rerun of the same E2E command alone passed 23/23, so the failure is attributed to CPU contention against Jest's default 5s test timeout rather than task behavior.
Task 3: complete (commits 45861bac..ed719568, scoped review clean; coordinator verification: users+auth E2E 23/23, API unit 40/40, API typecheck exit 0, API lint exit 0, API build exit 0, npm audit high 0 vulnerabilities, git diff --check exit 0)
Task 4: fix round 1 — reviewer found OpenAPI missing `400` for strict `GET /users` query validation, contract spec not asserting exact new response refs, stale authorization-hardening plan wording says `/users` not implemented, and OpenAPI list summary wording implies only admin accounts.
Task 4: fix round 2 — scoped re-review found active `api-contract.md` still said `/users` administration remains later; patched wording to implemented admin-only list/detail/status/reset with account creation deferred.
Task 4: complete (commits ed719568..114f473f plus local contract wording patch; coordinator verification: OpenAPI contract spec 9/9, API typecheck exit 0, jq openapi exit 0, git diff --check exit 0)
Task 5: complete (frontend API-mode registration and password change; UI/API-client TDD RED recorded, web suite 133/133, typecheck/lint/build exit 0)
