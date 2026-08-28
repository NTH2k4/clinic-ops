# CareFlow API

NestJS API for the CareFlow clinic operations MVP.

## Requirements

- Node.js 22.
- npm.
- Docker with Docker Compose for local PostgreSQL.

## Stack

- NestJS 11.
- Prisma 6.
- PostgreSQL 16.
- Zod validation.
- Jest and Supertest for unit and E2E tests.

## API Base Path

The API listens on port `3000` by default and mounts all routes under:

```text
/api/v1
```

Example health check:

```bash
curl http://localhost:3000/api/v1/health
```

## Local Setup

From the repository root:

```bash
docker compose up -d postgres
```

From `apps/api`:

```bash
npm ci
export DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow
npm run prisma:generate
npx prisma migrate deploy
npm run prisma:seed
npm run dev
```

The API will run at:

```text
http://localhost:3000/api/v1
```

To use a different port:

```bash
PORT=3001 npm run dev
```

## Environment Variables

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | None | PostgreSQL connection string used by Prisma and E2E tests. |
| `PORT` | No | `3000` | API listen port. Invalid values fail startup before binding the server. |
| `CORS_ALLOWED_ORIGINS` | No | CORS disabled | Comma-separated `http://` or `https://` origins allowed to call the API from browsers. Use the deployed frontend origin in staging/production. |
| `ALLOW_DATABASE_SEED` | No | unset | Set to `true` only when intentionally seeding a non-local database. |
| `SERVE_WEB_APP` | No | `false` | Set to `true` when one Render Web Service should serve both the React build and API. |
| `WEB_DIST_DIR` | No | Auto-detected | Optional path to the built `apps/web/dist` directory. |

Copy `apps/api/.env.example` when preparing a local or hosted environment and replace values for the target deployment.

## Seeded Demo Accounts

The original seeded demo users use password `careflow-demo`.

| Role | Email |
| --- | --- |
| Patient | `patient@careflow.local` |
| Doctor | `minh.nguyen@careflow.local` |
| Receptionist | `reception@careflow.local` |
| Nurse | `nurse@careflow.local` |
| Admin | `admin@careflow.local` |

Manual QA accounts are seeded with actor-name passwords for faster role testing:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@test.com` | `admin` |
| Doctor | `doctor@test.com` | `doctor` |
| Receptionist | `receptionist@test.com` | `receptionist` |
| Nurse | `nurse@test.com` | `nurse` |
| Patient | `patient@test.com` | `patient` |

The full seed now creates at least 10 active patients, at least 10 appointments, at least 10 notifications and at least 10 active schedules for the manual QA doctor account. Hosted demo startup repair creates missing manual QA accounts and baseline records only; it does not reset existing user credentials, roles or statuses.

Seed data may keep English display names and labels because it is synthetic developer/test data, not final user-facing clinic content.

Login example:

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@careflow.local","password":"careflow-demo"}'
```

Use the returned `sessionToken` as a bearer token:

```bash
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer <sessionToken>"
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Nest in watch mode. |
| `npm run build` | Build the API. |
| `npm run start` | Run the built API from `dist/src/main.js`. |
| `npm run lint` | Run ESLint for API source and tests. |
| `npm run typecheck` | Run TypeScript without emitting files. |
| `npm test -- --runInBand` | Run unit tests. |
| `npm run test:e2e -- --runInBand` | Run database-backed E2E tests. |
| `npm run prisma:generate` | Generate Prisma client. |
| `npm run prisma:migrate` | Create/apply a local Prisma development migration. |
| `npm run prisma:seed` | Reset and seed the local CareFlow database. |
| `npm run prisma:seed:demo-auth` | Idempotently create missing demo login users without changing existing credentials, roles, or statuses. |

## Verification Gate

Use this gate before handing off backend changes:

```bash
cd apps/api
npm run prisma:generate
DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npx prisma migrate deploy
DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run prisma:seed
npm run typecheck
npm run lint
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run build
npm audit --audit-level=high
```

E2E tests require a reachable PostgreSQL database through `DATABASE_URL`.

## Auth Model

The current auth flow uses stored password hashes and durable API sessions:

- `POST /auth/login` verifies the submitted password against `User.passwordHash` with bcrypt.
- Seeded demo users still use password `careflow-demo`.
- New passwords submitted through registration or password change must contain at least 10 characters, uppercase, lowercase, number and special character, and must stay within bcrypt's 72-byte UTF-8 limit.
- The API creates a random bearer session token and stores only its SHA-256 hash in PostgreSQL in `AuthSession`.
- Sessions expire after 12 hours.
- Protected endpoints require `Authorization: Bearer <sessionToken>`.
- `POST /auth/logout` revokes the persisted session by setting `revokedAt`.
- Restarting the API process does not invalidate unexpired, unrevoked sessions.

This model is sufficient for the v1 production-like demo. Patient registration, authenticated password change, admin reset and admin lock/unlock flows are implemented; external email reset and SSO remain outside v1.

## Browser CORS

The API enables CORS only when `CORS_ALLOWED_ORIGINS` is set. Keep it unset for same-origin local proxy usage. For deployed frontend/API split-origin usage, set it to the exact frontend origin:

```bash
CORS_ALLOWED_ORIGINS=https://nth2k4.github.io
```

Do not use wildcard browser origins for production because the API uses bearer sessions.

## Single-Service Render Deployment

The free Render deployment uses one Node Web Service for both the API and the React frontend. Render builds `apps/web`, starts `apps/api`, and the Nest process serves the built frontend when `SERVE_WEB_APP=true`.

Key behavior:

- API routes stay under `/api/v1`.
- Non-API browser routes fall back to the React `index.html`.
- Frontend production build uses `VITE_DATA_SOURCE=api` and `VITE_API_BASE_URL=/api/v1`, so browser calls stay same-origin.
- Render `buildCommand` runs Prisma migrations before the API build.
- In hosted demo mode (`SERVE_WEB_APP=true`), API startup creates only missing demo users; deploys and restarts preserve existing credentials, roles, and statuses.
- Render `startCommand` starts the API directly; it does not run a credential-reset seed step.
- `initialDeployHook` seeds the full demo dataset once with `ALLOW_DATABASE_SEED=true`.

Render configuration lives in the repository root `render.yaml`. Deployment runbook details are in `docs/04-planning/render-deployment-plan.md`.

## Main Resources

- `health`: health probe.
- `auth`: login, logout and current session.
- `doctors`, `specialties`, `services`: catalog resources.
- `patients`: patient records.
- `doctor-schedules`, `availability/slots`: scheduling reads.
- `appointments`: booking, reschedule and workflow transitions.
- `audit-events`: admin-only audit log.
- `notifications`: current-user notification inbox.

Detailed behavior is documented in:

- `docs/03-architecture/api-contract.md`
- `docs/03-architecture/openapi.json`
- `docs/03-architecture/backend-architecture.md`
- `docs/03-architecture/database-schema.md`

## CI

`.github/workflows/api-ci.yml` runs on changes to `apps/api/**`, `docs/03-architecture/openapi.json` and the API CI workflow. It uses PostgreSQL 16 and runs Prisma generate, migration deploy, seed, typecheck, lint, unit tests, E2E tests, build and high-severity dependency audit. Unit tests include `src/openapi-contract.spec.ts`, which validates that the checked-in OpenAPI contract still documents the implemented v1 endpoint surface.
