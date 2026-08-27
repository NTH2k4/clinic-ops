# Ghi Chú Phát Hành

## 2026-08-27 MVP Release Candidate Plan

- Mục tiêu release candidate tiếp theo là tích hợp authorization hardening, chạy lại full API/Web verification, đồng bộ docs/status/release notes và chuẩn bị deploy Render nếu được duyệt.
- Frontend và backend baseline đã có; vòng này không mở thêm user administration, password reset, schedule management UI, payment, insurance hoặc external notification provider.
- Render Free + Neon Free vẫn là hạ tầng demo đã chốt. Không dùng dữ liệu bệnh nhân thật trên môi trường demo này.
- Kế hoạch triển khai chi tiết nằm tại `docs/04-planning/mvp-release-completion-plan.md`.
- Roadmap sau MVP release candidate nằm tại `docs/04-planning/careflow-v1-delivery-roadmap.md`; execution map subagent-driven nằm tại `docs/04-planning/careflow-v1-subagent-execution-plan.md`.

## 2026-08-26

- Thêm API-mode Playwright regression gate; mock mode vẫn là mặc định cho local development và demo cho đến khi API production hosting/CORS được cấu hình.
