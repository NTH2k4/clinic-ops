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

- Triển khai Node.js/NestJS/Prisma/PostgreSQL backend theo `backend-implementation-plan.md`.
- Triển khai authentication và role access.
- Triển khai catalog resources và admin deactivate workflow.
- Triển khai appointment domain, schedule conflict checks và status transitions.
- Triển khai audit logging và notifications.

## Phase 4: Tích Hợp

- Thay mock services bằng backend API client.
- Thêm end-to-end workflow verification.
- Polish UI và release notes.
