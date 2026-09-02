# Kế Hoạch Triển Khai Public Homepage

## Document Control

| Trường | Giá trị |
| --- | --- |
| Trạng thái | `active` |
| Đối tượng đọc chính | Product owner, frontend engineer, AI agent |
| Cập nhật lần cuối | 2026-09-02 |
| Phạm vi | Triển khai giao diện trang chủ công khai cho CareFlow |

## Mục Tiêu

Tạo homepage public tại route `/` để người dùng tìm thấy CareFlow trên web có thể hiểu nhanh dịch vụ, chuyên khoa, bác sĩ tiêu biểu và đi tiếp tới đặt lịch/đăng nhập.

## Ràng Buộc

- Không thay đổi backend/API/database.
- Không thay đổi route đăng nhập `/login` hoặc authenticated workspace `/app/*`.
- Copy user-facing dùng tiếng Việt.
- Homepage không dùng `AppShell` vì đây là trang public.
- CTA chính dẫn tới `/register`, CTA phụ dẫn tới `/login`.
- Dữ liệu bác sĩ/chuyên khoa trên homepage là curated static content cho landing page, không thay thế catalog API.

## Phạm Vi Giao Diện

- Header public với brand, anchor navigation, nút đăng nhập và đặt lịch.
- Hero first viewport có ảnh phòng khám/bác sĩ, headline, mô tả, CTA và chỉ số tin cậy.
- Section chuyên khoa nổi bật: Tổng quát, Tim mạch, Nhi khoa, Tiêm chủng, Tái khám, Điện tâm đồ.
- Section bác sĩ tiêu biểu: 3 hồ sơ ngắn, chuyên khoa, kinh nghiệm và lịch khám gợi ý.
- Section quy trình đặt lịch 3 bước.
- CTA cuối trang.

## Test Và Verification

- Unit/UI test route `/` render homepage, CTA `/register` và `/login`.
- Unit/UI test `/login` vẫn render login page.
- Web gate tối thiểu: `npm test -- --run src/app/App.test.tsx`, `npm run typecheck`, `npm run lint`, `npm run build`.
- `git diff --check` trước khi commit/push.
