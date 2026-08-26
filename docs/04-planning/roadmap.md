# Roadmap

## Phase 0: Baseline Tài Liệu

- Tạo cấu trúc tài liệu dự án.
- Định nghĩa MVP scope.
- Định nghĩa roles, workflows và appointment states.

## Phase 1: Frontend Prototype

- Scaffold app React + Vite + TypeScript.
- Xây shell navigation và role-based views.
- Thêm mock data và mock API services.
- Triển khai appointment workflows và dashboards.

## Phase 2: API Contract

- Chuyển mock service boundaries thành API contract v1.
- Định nghĩa request và response schemas ở mức REST JSON contract.
- Định nghĩa response envelope, pagination, error envelope và common error codes.
- Chuẩn bị backend implementation plan dựa trên contract.

## Phase 3: Backend

- Hoàn thành Node.js/NestJS/Prisma/PostgreSQL backend theo `backend-implementation-plan.md`.
- Hoàn thành authentication và role access.
- Hoàn thành catalog resources và admin deactivate workflow.
- Hoàn thành appointment domain, schedule conflict checks và status transitions.
- Hoàn thành audit logging và notifications.
- Thêm API CI: Prisma generate/migrate/seed, typecheck, lint, unit/E2E, build và high-severity dependency audit.

## Phase 4: Tích Hợp

- Thay mock services bằng backend API client theo `frontend-api-integration-plan.md`.
- Thay mock auth bằng backend session và giữ mock/API feature switch trong lúc migration.
- Thêm API-mode Playwright regression gates bên cạnh mock smoke tests.
- Polish UI và release notes.
