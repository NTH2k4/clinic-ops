# Ghi Chú Phát Hành

## 2026-08-27 MVP Release Candidate

- Final review fix round 3 is locally verified on branch `account-administration` and pending final review, merge, and deploy. Hosted startup creates missing demo users only, login/registration/password change reject bcrypt-unsafe inputs over 72 UTF-8 bytes, password change rejects reuse, and the OpenAPI login/logout success responses match the runtime `201` status. The new login prefix-collision regression passes in the targeted auth E2E suite (`21/21`); coordinator rerun confirmed full API E2E `10/10` suites `93/93` tests.
- Phase 2 Account Administration đã hoàn thành local verification: public registration chỉ tạo patient, password change xoá session và yêu cầu đăng nhập lại, admin account workspace có smoke coverage cho lock/unlock. API-mode Playwright hiện pass `8/8`, gồm ba regression mới với email/số điện thoại sinh duy nhất và teardown reset DB về seeded baseline sau suite; không ghi session token, password hay temporary password vào output/tài liệu.
- Full verification sau final review fix round 3 pass: API typecheck/lint/build/audit, unit `7/7` suites `41/41` tests và E2E `10/10` suites `93/93` tests; Web unit `16/16` files `141/141` tests, typecheck/lint/build, mock Playwright `9/9` và API-mode Playwright `8/8`. Vite chỉ có cảnh báo bundle `634.62 kB` vượt ngưỡng `500 kB`, không làm build fail.
- Final local rerun on 2026-08-28 for commit `54b9818d` also confirmed OpenAPI JSON parse, `git diff --check`, and API-mode teardown cleanup with `0` generated `@example.test` users remaining.
- Chưa chạy production register/password/admin smoke cho commit Phase 2 này và chưa thay đổi trạng thái deploy của release candidate trước đó.
- Full-stack MVP baseline gồm React/Vite frontend, NestJS/Prisma/PostgreSQL API, appointment workflow, audit/notifications, checked-in OpenAPI contract và single-service Render deployment path.
- Auth/session hardening đã có persisted bearer sessions, expiry, logout revocation, bcrypt password verification và inactive/locked account coverage. Authorization matrix hardening đã tích hợp vào `main` qua merge commit `7d5a5194`, với E2E regression cho patient-owner, doctor-owner và role-excluded scheduling boundaries.
- Local verification sau merge đều pass: API unit 6/6 suites, 37/37 tests; API E2E 8/8 suites, 71/71 tests; Web unit 16/16 files, 130/130 tests; mock Playwright 9/9; API-mode Playwright 5/5.
- Deployed verification update: commit `91fd347f` đã được manual deploy lên Render sau khi API-startup demo auth repair ở commit `44b5b9cf` pass local verification. Render health trả đúng commit `91fd347fe479a174026a69f0e2b782316e39944d`; login smoke với demo admin trả user role `admin` và session token. Token không được ghi vào tài liệu.
- Known constraints: Docker Compose socket không khả dụng cho user hiện tại, nhưng configured host PostgreSQL target đã được xác minh; Render Free Web Service có thể cold start sau khi idle; Neon Free có giới hạn storage/compute; Render Free không hỗ trợ pre-deploy command nên migrations chạy trong `buildCommand`; Render auto-deploy vẫn cần theo dõi riêng vì manual deploy latest commit đã được dùng để đóng smoke gate.
- Demo safety: không dùng dữ liệu bệnh nhân thật trên môi trường demo.
- Earlier deployed demo-auth repair behavior is superseded on this branch; the pending deployment must preserve existing demo password hashes, roles, and statuses on startup.

## 2026-08-26

- Thêm API-mode Playwright regression gate; mock mode vẫn là mặc định cho local development và demo cho đến khi API production hosting/CORS được cấu hình.
