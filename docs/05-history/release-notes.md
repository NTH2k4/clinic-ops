# Ghi Chú Phát Hành

## 2026-08-27 MVP Release Candidate

- Full-stack MVP baseline gồm React/Vite frontend, NestJS/Prisma/PostgreSQL API, appointment workflow, audit/notifications, checked-in OpenAPI contract và single-service Render deployment path.
- Auth/session hardening đã có persisted bearer sessions, expiry, logout revocation, bcrypt password verification và inactive/locked account coverage. Authorization matrix hardening đã tích hợp vào `main` qua merge commit `7d5a5194`, với E2E regression cho patient-owner, doctor-owner và role-excluded scheduling boundaries.
- Local verification sau merge đều pass: API unit 6/6 suites, 37/37 tests; API E2E 8/8 suites, 71/71 tests; Web unit 16/16 files, 130/130 tests; mock Playwright 9/9; API-mode Playwright 5/5.
- Deployed verification update: commit `4b1ff302` đã push lên `main`; API CI, Web CI và Render Deployment đều success; Render health trả đúng commit. Login smoke phát hiện deployed demo credentials trả `401`, nên release candidate bổ sung demo auth repair để upsert demo login users/password hashes. Build-time repair ở commit `4c39911a` và `startCommand` repair ở commit `b782b730` vẫn chưa sửa được login. API-startup repair ở commit `44b5b9cf` pass local verification, nhưng Render chưa serve commit này; Render Deployment workflow fail vì health vẫn trả `b782b730` sau 10 phút.
- Known constraints: Docker Compose socket không khả dụng cho user hiện tại, nhưng configured host PostgreSQL target đã được xác minh; Render Free Web Service có thể cold start sau khi idle; Neon Free có giới hạn storage/compute; Render Free không hỗ trợ pre-deploy command nên migrations chạy trong `buildCommand`; Render dashboard cần được kiểm tra/manual deploy latest commit trước khi có thể chốt deployed login smoke.
- Demo safety: không dùng dữ liệu bệnh nhân thật trên môi trường demo.
- Demo auth repair chỉ upsert các demo login users và không reset dữ liệu.

## 2026-08-26

- Thêm API-mode Playwright regression gate; mock mode vẫn là mặc định cho local development và demo cho đến khi API production hosting/CORS được cấu hình.
