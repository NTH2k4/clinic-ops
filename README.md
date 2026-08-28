# CareFlow - Đặt lịch khám online

CareFlow là hệ thống quản lý vận hành phòng khám cho người dùng Việt Nam. Bản v1 đã được nghiệm thu, gồm đăng nhập/đăng ký patient, quản trị tài khoản, đặt lịch khám, lịch làm việc bác sĩ, workflow operations, dashboard theo role, audit log và notification inbox.

Production demo:

```text
https://clinic-ops.onrender.com
```

Demo account chính:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@careflow.local` | `careflow-demo` |

## Requirements

- Node.js 22 trở lên.
- npm.
- Docker Compose cho PostgreSQL local, hoặc một PostgreSQL URL tương thích Prisma.

## Development

Khởi động database local từ repository root:

```bash
docker compose up -d postgres
```

Backend:

```bash
cd apps/api
npm ci
export DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow
npm run prisma:generate
npx prisma migrate deploy
npm run prisma:seed
npm run dev
```

Frontend mock mode:

```bash
cd apps/web
npm ci
npm run dev
```

Frontend API mode dùng cùng backend local:

```bash
cd apps/web
VITE_DATA_SOURCE=api VITE_API_BASE_URL=/api/v1 npm run dev
```

## Architecture

- `apps/api`: NestJS API, Prisma ORM, PostgreSQL, Zod validation, bearer sessions stored as hashed `AuthSession` records.
- `apps/web`: React, Vite, TypeScript, TanStack Query, mock/API service boundaries.
- `render.yaml`: Render single-service blueprint. Render builds React, starts NestJS, serves `/api/v1` and falls back to the React app for browser routes.
- `docker-compose.yml`: local PostgreSQL for development and E2E verification.

Runtime modes:

- Local web defaults to `VITE_DATA_SOURCE=mock` for fast UI work without backend.
- Production Render uses `VITE_DATA_SOURCE=api` and `VITE_API_BASE_URL=/api/v1` so browser API calls stay same-origin.
- GitHub Pages remains available as a static mock-mode preview at `https://nth2k4.github.io/clinic-ops/`.

## Verification

Backend gate:

```bash
cd apps/api
npm run prisma:generate
DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npx prisma migrate deploy
DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run prisma:seed
npm run typecheck
npm run lint
npm test -- --runInBand
DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run test:e2e -- --runInBand
npm run build
npm audit --audit-level=high
```

Frontend gate:

```bash
cd apps/web
npm test -- --run
npm run typecheck
npm run lint
npm run build
npm run e2e
DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run e2e:api
```

Production smoke:

```bash
node scripts/production-smoke.mjs https://clinic-ops.onrender.com
```

## Documentation

- `docs/00-project/`: vision, scope, glossary, workflow, documentation standards và documentation map.
- `docs/01-requirements/`: MVP/v1 requirements, user roles, user stories, change requests và traceability matrix.
- `docs/02-product/`: workflows, screens, frontend MVP spec và appointment states.
- `docs/03-architecture/`: frontend/backend architecture, design system, API contract, OpenAPI, database schema, security notes, runbook và governance.
- `docs/04-planning/`: roadmap, implementation plans và release/deployment readiness records. Các plan cũ được giữ làm lịch sử triển khai.
- `docs/05-history/`: changelog, decision log và release notes.
- `docs/06-testing/`: test strategy, acceptance checklist và v1 acceptance package.

CareFlow vẫn theo nguyên tắc documentation-first: thay đổi scope, API contract, security behavior hoặc release evidence phải được cập nhật trong docs cùng với implementation.
