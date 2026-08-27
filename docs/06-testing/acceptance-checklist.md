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

- [ ] API verification gate sau merge. **Partially blocked**: `docker compose up -d postgres` failed. First actionable error: `permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock`; cấp quyền Docker daemon hoặc dùng môi trường có daemon khả dụng, rồi hoàn tất database-dependent commands.
- [ ] Prisma generate, migrate deploy và deterministic seed. Generate pass; migrate deploy và seed không chạy vì PostgreSQL local không khởi động được.
- [x] API typecheck và lint. Cả hai pass.
- [ ] API unit và E2E tests. Unit pass: 6/6 suites, 37/37 tests. E2E không chạy vì phụ thuộc PostgreSQL, migrations và seed.
- [x] API build và `npm audit --audit-level=high`. Build pass; audit báo `found 0 vulnerabilities`.
