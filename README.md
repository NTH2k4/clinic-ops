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

Frontend hiện nằm trong `apps/web` và dùng React + Vite + TypeScript. GitHub Actions kiểm tra Pull Request bằng workflow `Web CI` và deploy bản merge vào `main` lên GitHub Pages bằng workflow `Web Pages`.

Sau khi bật Pages source là **GitHub Actions** trong repository settings, app có thể xem tại:

```text
https://nth2k4.github.io/clinic-ops/
```

## Backend

Backend bắt đầu ở `apps/api` và dùng Node.js + NestJS + TypeScript. Scaffold hiện có health endpoint tại `/api/v1/health`; PostgreSQL local được khai báo trong `docker-compose.yml`.

Các lệnh kiểm tra backend:

```bash
cd apps/api
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run typecheck
npm run lint
npm run build
npm audit
```
