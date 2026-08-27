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
