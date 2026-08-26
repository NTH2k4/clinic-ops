# CareFlow - Đặt lịch khám online

CareFlow là MVP vận hành phòng khám, tập trung vào đặt lịch khám, workflow của nhân viên, lịch làm việc của bác sĩ và dashboard vận hành cho người dùng Việt Nam.

Repository này đi theo hướng documentation-first. Giai đoạn đầu của dự án sẽ thống nhất scope, workflow, quyết định kỹ thuật và ranh giới triển khai trước khi scaffold code frontend hoặc backend.

## Định Hướng Dự Án

- Xây frontend trước với `mock data` và ranh giới `mock API`.
- Dùng frontend prototype để kiểm chứng workflow sản phẩm trước khi triển khai backend.
- Giữ dữ liệu y tế ở mức nhẹ trong MVP; không triển khai electronic health record đầy đủ, đơn thuốc, bảo hiểm, telemedicine hoặc tích hợp thanh toán thật.
- Ghi lại thay đổi scope và quyết định kỹ thuật trong docs trước khi implementation.
- Viết tài liệu hướng dự án bằng tiếng Việt theo mặc định, giữ thuật ngữ kỹ thuật và thuật ngữ chuyên ngành bằng tiếng Anh khi rõ nghĩa hơn.

## Tài Liệu

- `docs/00-project/`: tầm nhìn dự án, scope, glossary, workflow làm việc, documentation standards và documentation map.
- `docs/01-requirements/`: yêu cầu MVP, vai trò người dùng, user stories và change requests.
- `docs/02-product/`: workflow sản phẩm, danh sách màn hình và mô hình trạng thái appointment.
- `docs/03-architecture/`: kiến trúc frontend, API contract, data model và ghi chú security.
- `docs/04-planning/`: roadmap, implementation plan và subagent work packages.
- `docs/05-history/`: changelog, decision log và release notes.
- `docs/06-testing/`: test strategy và acceptance checklist.

## Frontend Và CI/CD

Frontend hiện nằm trong `apps/web` và dùng React + Vite + TypeScript. GitHub Actions kiểm tra Pull Request bằng workflow `Web CI` và deploy bản merge vào `main` lên GitHub Pages bằng workflow `Web Pages`. Mock data vẫn là default cho đến Phase 4 API integration.

Sau khi bật Pages source là **GitHub Actions** trong repository settings, app có thể xem tại:

```text
https://nth2k4.github.io/clinic-ops/
```

## Backend

Backend nằm ở `apps/api` và dùng Node.js + NestJS + Prisma + PostgreSQL. API v1 dùng base path `/api/v1` và đã có auth bearer session, catalog, appointment conflict/status workflow, audit events và notifications. PostgreSQL local được khai báo trong `docker-compose.yml`.

API CI chạy Prisma generate, migrate deploy, deterministic seed, typecheck, lint, unit/E2E tests, build và high-severity dependency audit cho thay đổi `apps/api`.

Các lệnh kiểm tra backend:

```bash
cd apps/api
npm run prisma:generate
DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npx prisma migrate deploy
DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run prisma:seed
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run typecheck
npm run lint
npm run build
npm audit --audit-level=high
```

Kế hoạch thay mock service bằng API client nằm tại `docs/04-planning/frontend-api-integration-plan.md`.
