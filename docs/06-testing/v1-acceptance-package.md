# Gói Nghiệm Thu CareFlow V1

## Kiểm Soát Tài Liệu

| Trường | Giá trị |
| --- | --- |
| Trạng thái | `accepted` |
| Người đọc | Chủ dự án và người nghiệm thu cuối |
| Cập nhật lần cuối | 2026-08-28 |
| Truy vết | `docs/01-requirements/v1-traceability-matrix.md` |

## Phạm Vi Release

CareFlow v1 là bản demo vận hành phòng khám chạy trên Render với frontend React/Vite, API NestJS, Prisma/PostgreSQL và database Neon. Phạm vi gồm authentication, đăng ký bệnh nhân, đặt lịch, vận hành lễ tân/điều dưỡng, luồng bác sĩ, quản trị danh mục/tài khoản/lịch làm việc, nhật ký kiểm toán, smoke test production và runbook vận hành.

Không nhập dữ liệu bệnh nhân thật vào môi trường này.

## Truy Cập Demo

| Mục | Giá trị |
| --- | --- |
| Production URL | `https://clinic-ops.onrender.com` |
| Hạ tầng hosted | Render Free Web Service + Neon PostgreSQL |
| Baseline production đã smoke | `673ffe52b12033eecc3fa9927ebebf906ab0d016` |
| Commit gói docs Phase 5 ban đầu | `8157b224f81e7910f0f404d7711d9e60f17ef404` |

Tài khoản demo gốc:

| Tác nhân | Email | Mật khẩu |
| --- | --- | --- |
| Bệnh nhân | `patient@careflow.local` | `careflow-demo` |
| Bác sĩ | `minh.nguyen@careflow.local` | `careflow-demo` |
| Lễ tân | `reception@careflow.local` | `careflow-demo` |
| Điều dưỡng | `nurse@careflow.local` | `careflow-demo` |
| Quản trị | `admin@careflow.local` | `careflow-demo` |

Tài khoản test thủ công dễ nhớ:

| Tác nhân | Email | Mật khẩu |
| --- | --- | --- |
| Quản trị | `admin@test.com` | `admin` |
| Bác sĩ | `doctor@test.com` | `doctor` |
| Lễ tân | `receptionist@test.com` | `receptionist` |
| Điều dưỡng | `nurse@test.com` | `nurse` |
| Bệnh nhân | `patient@test.com` | `patient` |

Dữ liệu seed phục vụ test có thể giữ tiếng Anh để developer dễ đọc và truy vết. Đây là dữ liệu tổng hợp, không phải nội dung phòng khám thật hướng tới người dùng cuối.

## Dữ Liệu Test Có Sẵn

- Ít nhất 10 bệnh nhân active cho danh sách bệnh nhân và luồng đặt lịch.
- Ít nhất 10 lịch hẹn để kiểm thử workspace bệnh nhân, bác sĩ, lễ tân và điều dưỡng.
- Ít nhất 10 thông báo để kiểm thử popover thông báo, unread state và điều hướng liên quan.
- Ít nhất 10 lịch làm việc active cho tài khoản bác sĩ test `doctor@test.com`.
- Hosted startup repair chỉ tạo dữ liệu còn thiếu; không reset mật khẩu, vai trò hoặc trạng thái của user đã tồn tại.

## Bằng Chứng Verification

| Gate | Bằng chứng |
| --- | --- |
| Phase 2 Account Administration | API typecheck/lint/unit/E2E/build/audit pass; Web unit/typecheck/lint/build/mock Playwright/API-mode Playwright pass; production account smoke pass trên Render tại `a52072e1`. |
| Phase 3 Scheduling Operations | API unit `43/43`, API E2E `98/98`, Web unit `145/145`, mock Playwright `9/9`, API-mode Playwright `9/9`; production catalog/scheduling smoke pass sau remediation tại `f6697049`. |
| Phase 4 Production Demo Operations | `scripts/production-smoke.mjs` đã thêm và test; workflow hỗ trợ `RENDER_DEPLOY_HOOK_URL`; deploy hook automation verified với API/Web/Render workflows thành công tại `05ebf87b`. |
| Auth/Shell UX polish | Production đã serve `673ffe52`; đăng nhập, hiện/ẩn mật khẩu, xác nhận đăng xuất, notification popover đóng khi bấm ra ngoài, tài khoản test thủ công và seed data đã được product owner review và chấp nhận. |

Smoke production tham khảo:

```bash
RENDER_EXTERNAL_URL=https://clinic-ops.onrender.com \
EXPECTED_RENDER_COMMIT=673ffe52b12033eecc3fa9927ebebf906ab0d016 \
node scripts/production-smoke.mjs
```

## Checklist Nghiệm Thu Thủ Công

- [x] Tôi mở được `https://clinic-ops.onrender.com`.
- [x] Tôi đăng nhập được bằng tài khoản quản trị gốc `admin@careflow.local` / `careflow-demo`.
- [x] Tôi đăng nhập được bằng các tài khoản test thủ công theo từng tác nhân.
- [x] Tôi có thể đăng ký bệnh nhân mới và vào workspace bệnh nhân.
- [x] Tôi có thể đặt hoặc xem lịch hẹn mà không dùng dữ liệu bệnh nhân thật.
- [x] Tôi có thể kiểm thử workspace bác sĩ, lễ tân và điều dưỡng với dữ liệu lịch hẹn có sẵn.
- [x] Tôi thấy popup xác nhận trước khi đăng xuất.
- [x] Tôi mở thông báo và đóng được popover bằng cách bấm ra ngoài.
- [x] Tôi tìm được hướng dẫn deploy/recovery trong `docs/03-architecture/backend-runbook.md` và `docs/04-planning/render-deployment-plan.md`.
- [x] Tôi chấp nhận các giới hạn của bản demo v1.

## Giới Hạn Đã Biết

- Render Free có thể cold start sau thời gian idle.
- GitHub Actions deploy hook automation đã verify cho commit đổi runtime/deployment path. Docs-only commit không trigger workflow do path filter.
- Neon Free tier có giới hạn storage và compute.
- GitHub Pages vẫn là mock/demo surface; Render là full-stack production target.
- Demo data là dữ liệu tổng hợp, không phù hợp cho vận hành bệnh nhân thật.
- Admin Accounts pagination page upper-bound vẫn là follow-up nhỏ.

## Kết Quả Nghiệm Thu

CareFlow v1 đã được product owner review và chấp nhận vào 2026-08-28. Nếu feedback sau nghiệm thu làm đổi scope, cập nhật `docs/01-requirements/v1-traceability-matrix.md`, tài liệu này, release notes và readiness docs trong cùng follow-up change.
