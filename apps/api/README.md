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

Copy `apps/api/.env.example` when preparing a local or hosted environment and replace values for the target deployment.

## Seeded Demo Accounts

All seeded demo users use password `careflow-demo`.

| Role | Email |
| --- | --- |
| Patient | `patient@careflow.local` |
| Doctor | `minh.nguyen@careflow.local` |
| Receptionist | `reception@careflow.local` |
| Nurse | `nurse@careflow.local` |
| Admin | `admin@careflow.local` |

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
| `npm run start` | Run the built API from `dist/main.js`. |
| `npm run lint` | Run ESLint for API source and tests. |
| `npm run typecheck` | Run TypeScript without emitting files. |
| `npm test -- --runInBand` | Run unit tests. |
| `npm run test:e2e -- --runInBand` | Run database-backed E2E tests. |
| `npm run prisma:generate` | Generate Prisma client. |
| `npm run prisma:migrate` | Create/apply a local Prisma development migration. |
| `npm run prisma:seed` | Reset and seed the local CareFlow database. |

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

The MVP auth flow is intentionally simple:

- `POST /auth/login` accepts seeded email plus password `careflow-demo`.
- The API creates an in-memory bearer session token.
- Protected endpoints require `Authorization: Bearer <sessionToken>`.
- `POST /auth/logout` deletes the in-memory session.

This model is for MVP integration only. Production work should add durable sessions or a production token strategy, expiry, password hashing for real user credentials and revocation behavior.

## Browser CORS

The API enables CORS only when `CORS_ALLOWED_ORIGINS` is set. Keep it unset for same-origin local proxy usage. For deployed frontend/API split-origin usage, set it to the exact frontend origin:

```bash
CORS_ALLOWED_ORIGINS=https://nth2k4.github.io
```

Do not use wildcard browser origins for production because the API uses bearer sessions.

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
