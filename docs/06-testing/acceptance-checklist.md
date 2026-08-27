# Checklist Chấp Nhận

## Frontend MVP

- Patient có thể yêu cầu đặt appointment.
- Patient có thể xem appointment history.
- Receptionist có thể tạo appointment cho patient.
- Receptionist có thể check-in patient.
- Doctor có thể xem schedule hôm nay.
- Doctor có thể start và complete appointment.
- Admin có thể xem doctors, services và specialties.
- Dashboard phản ánh đúng appointment status counts.
- Audit log hiển thị các thay đổi appointment.
- UI hoạt động tốt trên desktop và mobile.

## Backend MVP

- Backend validate appointment status transitions.
- Backend reject schedule conflicts.
- Backend enforce role-based access.
- Backend ghi audit events cho các thay đổi appointment.
- Frontend có thể thay mock services bằng API calls thật.

## MVP Release Candidate

- Authorization hardening được tích hợp vào `main`.
- API verification gate chạy lại sau merge: Prisma generate, migrations, seed, typecheck, lint, unit tests, E2E tests, build và high-severity audit.
- Web verification gate chạy lại sau merge: unit tests, typecheck, lint, build, mock Playwright và API-mode Playwright.
- Docs trong `docs/04-planning/` phản ánh đúng branch, commit, verification và deployment status.
- Release notes ghi rõ scope MVP, known constraints và demo safety note.
- Render health/login smoke được kiểm tra nếu `RENDER_EXTERNAL_URL` khả dụng và push/deploy đã được người dùng duyệt.

## Task 2 API Verification (2026-08-27)

- [x] API verification gate sau merge. Pass trên configured host PostgreSQL `postgresql://careflow:careflow@localhost:5432/careflow`; `pg_isready` báo accepting connections. Docker Compose failure vẫn được ghi nhận là setup limitation: current user không có quyền truy cập `/var/run/docker.sock`.
- [x] Prisma generate, migrate deploy và deterministic seed. Generate pass; migration deployment báo 3 migrations và không có pending migration; deterministic seed pass.
- [x] API typecheck và lint. Cả hai pass.
- [x] API unit và E2E tests. Unit pass: 6/6 suites, 37/37 tests. E2E pass với configured `DATABASE_URL`; Jest output không hiển thị suite/test count.
- [x] API build và `npm audit --audit-level=high`. Build pass; audit báo `found 0 vulnerabilities`.
