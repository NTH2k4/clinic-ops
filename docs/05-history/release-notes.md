# Ghi Chú Phát Hành

## 2026-08-27 MVP Release Candidate

- Full-stack MVP baseline gồm React/Vite frontend, NestJS/Prisma/PostgreSQL API, appointment workflow, audit/notifications, checked-in OpenAPI contract và single-service Render deployment path.
- Auth/session hardening đã có persisted bearer sessions, expiry, logout revocation, bcrypt password verification và inactive/locked account coverage. Authorization matrix hardening đã tích hợp vào `main` qua merge commit `7d5a5194`, với E2E regression cho patient-owner, doctor-owner và role-excluded scheduling boundaries.
- Local verification sau merge đều pass: API unit 6/6 suites, 37/37 tests; API E2E 8/8 suites, 71/71 tests; Web unit 16/16 files, 130/130 tests; mock Playwright 9/9; API-mode Playwright 5/5.
- Known constraints: Docker Compose socket không khả dụng cho user hiện tại, nhưng configured host PostgreSQL target đã được xác minh; Render Free + Neon Free vẫn là hạ tầng demo và Render health/login smoke còn chờ approval push/deploy cùng `RENDER_EXTERNAL_URL`.
- Demo safety: không dùng dữ liệu bệnh nhân thật trên môi trường demo.
- Chưa push hoặc deploy release candidate local này.

## 2026-08-26

- Thêm API-mode Playwright regression gate; mock mode vẫn là mặc định cho local development và demo cho đến khi API production hosting/CORS được cấu hình.
