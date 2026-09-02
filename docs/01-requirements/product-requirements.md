# Product Requirements Document

## Document Control

| Trường | Giá trị |
| --- | --- |
| Trạng thái | `baseline` |
| Đối tượng đọc chính | Product owner, designer, frontend/backend engineer, AI agent |
| Cập nhật lần cuối | 2026-09-02 |
| Phạm vi | Product requirements, personas, user stories, acceptance criteria và ưu tiên triển khai CareFlow v1 |

## 1. Mục Tiêu Sản Phẩm

CareFlow giúp phòng khám nhỏ quản lý lịch hẹn và vận hành khám trong ngày từ một ứng dụng web. Product direction là operational, rõ trạng thái, dễ scan và phù hợp người dùng Việt Nam.

## 2. Persona Chính

| Persona | Nhu cầu | Pain point |
| --- | --- | --- |
| Người dùng đặt lịch | Đặt lịch nhanh, biết trạng thái lịch hẹn | Không muốn gọi điện nhiều lần hoặc không biết lịch đã được xác nhận chưa |
| Lễ tân/điều dưỡng | Quản lý hàng đợi, xác nhận lịch, check-in | Dễ nhầm trạng thái khi lịch hẹn nhiều hoặc có lịch tương lai |
| Bác sĩ | Xem lịch của mình, xử lý ca khám | Cần biết bệnh nhân nào đã check-in và ca nào đang khám |
| Admin | Cấu hình vận hành và kiểm soát tài khoản | Cần thao tác rõ, có cảnh báo và audit khi thay đổi dữ liệu |

## 3. Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| `PRD-FR-001` | Người dùng có thể đăng ký tài khoản patient. | Must |
| `PRD-FR-002` | Người dùng có thể đăng nhập, đăng xuất, giữ session và đổi mật khẩu. | Must |
| `PRD-FR-003` | Người dùng có thể xem dịch vụ, chuyên khoa và bác sĩ. | Must |
| `PRD-FR-004` | Người dùng có thể đặt lịch theo dịch vụ, bác sĩ/ngày/giờ. | Must |
| `PRD-FR-005` | Staff có thể xác nhận lịch `requested`, check-in và hủy/reschedule lịch phù hợp. | Must |
| `PRD-FR-006` | Doctor có thể xem lịch ngày/tuần, bắt đầu và hoàn tất ca khám. | Must |
| `PRD-FR-007` | Admin có thể quản lý doctors, services, specialties, staff/users và schedules. | Must |
| `PRD-FR-008` | Admin có thể xem audit log và dashboard vận hành. | Must |
| `PRD-FR-009` | UI hoạt động trên desktop và mobile. | Must |
| `PRD-FR-010` | Public homepage giới thiệu phòng khám, chuyên khoa và bác sĩ. | Should |

## 4. Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| `PRD-NFR-001` | Web app build được bằng Vite và serve cùng NestJS trên Render. |
| `PRD-NFR-002` | API dùng response envelope ổn định với `data`, `error`, `meta.requestId`. |
| `PRD-NFR-003` | Auth session phải tồn tại qua Render restart nếu chưa hết hạn/revoke. |
| `PRD-NFR-004` | Dữ liệu demo không chứa dữ liệu bệnh nhân thật. |
| `PRD-NFR-005` | Tài liệu phải trace được từ requirement đến plan, test và release evidence. |

## 5. User Stories Và Acceptance Criteria

### `US-AUTH-001` - Đăng ký và đăng nhập

Là người dùng mới, tôi muốn tạo tài khoản và đăng nhập để đặt lịch khám.

Acceptance criteria:

- Registration chỉ tạo role `patient`.
- Password mới đáp ứng policy bảo mật đã chốt.
- Sau đăng ký, user vào được patient workspace.
- Login sai không tiết lộ email hay password sai phần nào.

### `US-BOOK-001` - Đặt lịch khám

Là người dùng, tôi muốn chọn dịch vụ, bác sĩ và khung giờ để gửi yêu cầu đặt lịch.

Acceptance criteria:

- Slot đã qua/quá sát giờ hiện tại bị chặn.
- Slot conflict với lịch làm việc/blocked/leave/appointment active bị chặn.
- Appointment do patient tạo có trạng thái `requested`.
- Người dùng thấy lịch vừa đặt trong lịch của mình.

### `US-OPS-001` - Điều phối lịch hẹn

Là lễ tân/điều dưỡng, tôi muốn xác nhận và check-in bệnh nhân để vận hành ngày khám.

Acceptance criteria:

- Lịch `requested` có thể xác nhận sang `confirmed`.
- Check-in chỉ xuất hiện trong đúng ngày khám.
- Calendar/Queue hiển thị lý do khi action không khả dụng.
- Mọi transition quan trọng có audit/history.

### `US-DOCTOR-001` - Xử lý ca khám

Là bác sĩ, tôi muốn xem lịch của mình và cập nhật tiến trình khám.

Acceptance criteria:

- Doctor chỉ xem lịch của chính mình.
- Doctor chỉ start appointment đã `checked_in`.
- Doctor hoàn tất appointment `in_progress`.
- Patient không thấy `internalNote`.

### `US-ADMIN-001` - Quản trị vận hành

Là admin, tôi muốn quản lý danh mục, lịch bác sĩ và tài khoản để cấu hình phòng khám.

Acceptance criteria:

- Admin có thể create/update/deactivate catalog resources.
- Deactivate không phá lịch sử appointment/audit.
- Admin không thể tự lock/deactivate tài khoản của mình.
- Reset password không ghi temporary password vào audit/log.

## 6. Ưu Tiên Triển Khai Sau V1

1. Public homepage thật trên route `/`.
2. Planning/docs cleanup sau khi đã bổ sung source-of-truth docs.
3. Real clinic readiness: thông tin phòng khám, liên hệ, SEO cơ bản.
4. Notification provider hoặc reminder thật nếu có quyết định riêng.
