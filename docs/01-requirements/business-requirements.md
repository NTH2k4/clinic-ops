# Business Requirements Document

## Document Control

| Trường | Giá trị |
| --- | --- |
| Trạng thái | `baseline` |
| Đối tượng đọc chính | Product owner, contributor, AI agent |
| Cập nhật lần cuối | 2026-09-02 |
| Phạm vi | Mục tiêu nghiệp vụ, scope, stakeholder, personas và business rules cho CareFlow v1 |

## 1. Tổng Quan

CareFlow là hệ thống đặt lịch khám online và quản lý vận hành phòng khám nhỏ. Sản phẩm tập trung vào việc làm rõ lịch hẹn, trạng thái khám, lịch làm việc bác sĩ và quyền thao tác theo vai trò.

## 2. Mục Tiêu Nghiệp Vụ

| ID | Mục tiêu |
| --- | --- |
| `BR-001` | Người dùng có thể đăng ký, đăng nhập và đặt lịch khám trực tuyến. |
| `BR-002` | Nhân sự phòng khám có thể xác nhận, check-in, điều phối và cập nhật trạng thái lịch hẹn. |
| `BR-003` | Bác sĩ có thể xem lịch khám của mình và xử lý tiến trình khám. |
| `BR-004` | Admin có thể quản lý dịch vụ, chuyên khoa, bác sĩ, lịch làm việc và tài khoản. |
| `BR-005` | Hệ thống giữ lịch sử/audit cho các thay đổi quan trọng. |
| `BR-006` | Demo production chạy được trên hạ tầng miễn phí và không dùng dữ liệu bệnh nhân thật. |

## 3. In Scope

- Đăng ký tài khoản người dùng/patient.
- Đăng nhập, đăng xuất, duy trì session, đổi mật khẩu.
- Cập nhật thông tin tài khoản cơ bản.
- Danh mục chuyên khoa, dịch vụ và bác sĩ.
- Đặt lịch khám theo dịch vụ, bác sĩ và khung giờ khả dụng.
- Xác nhận lịch, check-in, bắt đầu khám, hoàn tất, hủy và no-show.
- Quản lý lịch làm việc, lịch chặn và lịch nghỉ của bác sĩ.
- Dashboard theo vai trò.
- Audit log và notification inbox trong app.
- Production-like demo trên Render/Neon.

## 4. Out Of Scope

- Hồ sơ bệnh án điện tử đầy đủ.
- Kê đơn, chẩn đoán lâm sàng chính thức.
- Bảo hiểm, thanh toán thật, hóa đơn.
- Telemedicine/video call.
- Email/SMS/push notification provider.
- Quản lý nhiều chi nhánh.
- Dữ liệu bệnh nhân thật hoặc compliance certification.

## 5. Stakeholder Và Persona Nghiệp Vụ

| ID | Nhóm | Nhu cầu chính |
| --- | --- | --- |
| `BP-001` | Người dùng đặt lịch | Tìm dịch vụ/chuyên khoa, chọn bác sĩ/khung giờ, theo dõi lịch hẹn. |
| `BP-002` | Lễ tân/điều dưỡng | Điều phối hàng đợi, xác nhận lịch, check-in và xử lý lịch hẹn theo ngày. |
| `BP-003` | Bác sĩ | Xem lịch khám, bắt đầu/hoàn tất khám, ghi chú nội bộ nhẹ. |
| `BP-004` | Admin phòng khám | Cấu hình danh mục, lịch làm việc, tài khoản và xem audit. |
| `BP-005` | Chủ dự án | Kiểm soát scope, duyệt tài liệu, duyệt deploy và giữ chi phí hạ tầng bằng 0. |

## 6. Business Rules

| ID | Rule |
| --- | --- |
| `BRULE-001` | Patient-created appointment bắt đầu ở trạng thái `requested`. |
| `BRULE-002` | Staff-created appointment bắt đầu ở trạng thái `confirmed`. |
| `BRULE-003` | Chỉ staff/admin được xác nhận appointment `requested`. |
| `BRULE-004` | Check-in chỉ thực hiện trong đúng ngày khám. |
| `BRULE-005` | Doctor chỉ xử lý appointment thuộc hồ sơ bác sĩ liên kết với user hiện tại. |
| `BRULE-006` | Patient chỉ xem/cập nhật appointment thuộc hồ sơ patient liên kết với user hiện tại. |
| `BRULE-007` | Backend là source of truth cho conflict, authorization, status transition và audit. |
| `BRULE-008` | Dịch vụ/chuyên khoa/bác sĩ không bị hard delete nếu đã có lịch sử liên quan. |
| `BRULE-009` | Không ghi token, temporary password hoặc dữ liệu nhạy cảm vào docs/log/test output. |
| `BRULE-010` | Yêu cầu deploy production phải được người dùng duyệt rõ. |

## 7. Success Criteria

- Người dùng có thể hoàn thành luồng đăng ký, đăng nhập, đặt lịch và xem lịch của mình.
- Staff có thể xác nhận/check-in/cập nhật lịch hẹn theo workflow đã chốt.
- Doctor có thể xử lý lịch khám của mình.
- Admin có thể quản trị danh mục, lịch làm việc và tài khoản.
- API/Web verification và production smoke có evidence trong docs.
- Tài liệu đủ để người/agent mới hiểu scope mà không cần đọc lại chat history.
