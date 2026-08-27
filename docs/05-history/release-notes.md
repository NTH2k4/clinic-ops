# Ghi Chú Phát Hành

## 2026-08-27 MVP Release Candidate

- Full-stack MVP baseline gồm React/Vite frontend, NestJS/Prisma/PostgreSQL API, appointment workflow, audit/notifications, checked-in OpenAPI contract và single-service Render deployment path.
- Auth/session hardening đã có persisted bearer sessions, expiry, logout revocation, bcrypt password verification và inactive/locked account coverage. Authorization matrix hardening đã tích hợp vào `main` qua merge commit `7d5a5194`, với E2E regression cho patient-owner, doctor-owner và role-excluded scheduling boundaries.
- Local verification sau merge đều pass: API unit 6/6 suites, 37/37 tests; API E2E 8/8 suites, 71/71 tests; Web unit 16/16 files, 130/130 tests; mock Playwright 9/9; API-mode Playwright 5/5.
- Deployed verification update: commit `4b1ff302` đã push lên `main`; API CI, Web CI và Render Deployment đều success; Render health trả đúng commit. Login smoke phát hiện deployed demo credentials trả `401`, nên release candidate bổ sung `prisma:seed:demo-auth` để repair demo login users/password hashes trong Render `buildCommand`; local bugfix verification pass với targeted E2E 1/1 và full API E2E 9/9 suites, 72/72 tests.
- Known constraints: Docker Compose socket không khả dụng cho user hiện tại, nhưng configured host PostgreSQL target đã được xác minh; Render Free Web Service có thể cold start sau khi idle; Neon Free có giới hạn storage/compute; Render Free không hỗ trợ pre-deploy command nên migrations và demo auth repair chạy trong `buildCommand`; Render login smoke cần chạy lại sau bugfix redeploy.
- Demo safety: không dùng dữ liệu bệnh nhân thật trên môi trường demo.
- Demo auth repair chỉ upsert các demo login users và không reset dữ liệu.

## 2026-08-26

- Thêm API-mode Playwright regression gate; mock mode vẫn là mặc định cho local development và demo cho đến khi API production hosting/CORS được cấu hình.
