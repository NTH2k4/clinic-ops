# Frontend MVP Spec

## Document Control

| Mục | Nội dung |
| --- | --- |
| Tên tài liệu | Frontend MVP Spec |
| Sản phẩm | CareFlow - Đặt lịch khám online |
| Phiên bản | 1.0 |
| Ngày | 2026-08-24 |
| Trạng thái | draft |
| Phạm vi | Frontend-first MVP với `mock data` |
| Đối tượng đọc | Product owner, frontend developer, QA, agent contributors |

## Revision History

| Phiên bản | Ngày | Nội dung thay đổi |
| --- | --- | --- |
| 1.0 | 2026-08-24 | Bản spec đầu tiên cho frontend MVP của CareFlow. |

## Mục Đích

Tài liệu này mô tả frontend MVP của CareFlow trước khi scaffold `apps/web`. Spec dùng để thống nhất màn hình, workflow, mock data, UI states, priority và acceptance criteria cho giai đoạn frontend-first.

Tài liệu này không thay thế backend SRS, API spec hoặc ERD. Backend contract chi tiết sẽ được viết sau khi frontend workflow đã được kiểm chứng.

## Tài Liệu Liên Quan

- `docs/00-project/documentation-standards.md`
- `docs/00-project/scope.md`
- `docs/01-requirements/mvp-requirements.md`
- `docs/01-requirements/user-roles.md`
- `docs/01-requirements/user-stories.md`
- `docs/02-product/appointment-states.md`
- `docs/02-product/screens.md`
- `docs/02-product/workflows.md`
- `docs/03-architecture/data-model.md`
- `docs/03-architecture/frontend-architecture.md`
- `docs/06-testing/acceptance-checklist.md`

## Product Summary

CareFlow là ứng dụng vận hành phòng khám nhỏ theo hướng đặt lịch khám online và điều phối appointment. Frontend MVP cần cho người dùng thấy rõ cách hệ thống hoạt động qua các vai trò patient, doctor, receptionist/nurse và admin.

MVP ưu tiên:

- Workflow appointment rõ ràng.
- UI vận hành thực tế, dễ scan.
- `mock data` đủ phong phú để thể hiện các trạng thái chính.
- Role-based navigation.
- Responsive behavior tốt trên mobile và desktop.
- Không xử lý dữ liệu y tế nhạy cảm ngoài ghi chú vận hành nhẹ.

## Personas

### Patient

Người đặt lịch khám. Mục tiêu là tìm service phù hợp, chọn thời gian, gửi yêu cầu đặt lịch và theo dõi appointment của mình.

Pain points:

- Không muốn gọi điện để hỏi lịch.
- Muốn biết lịch sắp tới và trạng thái lịch.
- Cần thao tác hủy hoặc yêu cầu đổi lịch khi có thay đổi.

### Doctor

Bác sĩ tiếp nhận lịch khám trong ngày. Mục tiêu là xem danh sách patient, biết ai đang chờ, bắt đầu và hoàn tất appointment.

Pain points:

- Lịch khám bị rời rạc.
- Không biết patient nào đã check-in.
- Khó theo dõi appointment đang ở trạng thái nào.

### Receptionist / Nurse

Nhân sự vận hành phòng khám. Mục tiêu là tạo lịch thay patient, check-in patient, điều phối queue và xử lý reschedule/cancellation.

Pain points:

- Phải xử lý nhiều lịch trong ngày.
- Cần nhìn nhanh ai đang chờ, ai đang khám, ai đã hoàn tất.
- Cần tạo appointment cho walk-in hoặc phone booking.

### Admin

Người quản lý cấu hình vận hành. Mục tiêu là quản lý doctors, specialties, services, staff và xem dashboard vận hành.

Pain points:

- Cần dữ liệu tổng quan về tải khám trong ngày.
- Cần biết service nào phổ biến và doctor nào đang quá tải.
- Cần audit log để truy vết thay đổi quan trọng.

## Roles And Navigation

Frontend prototype cần có role switcher để chuyển nhanh giữa các vai trò. Đây chỉ là prototype tool, không phải authorization thật.

| Role | Navigation chính | Actions chính |
| --- | --- | --- |
| Patient | Trang chính, Dịch vụ, Đặt lịch, Lịch của tôi, Thông báo | Request appointment, xem lịch, cancel/request reschedule |
| Doctor | Dashboard, Lịch ngày, Lịch tuần, Appointment detail | Start appointment, complete appointment, thêm internal note nhẹ |
| Receptionist/Nurse | Operations dashboard, Queue, Calendar, Tạo appointment, Patient lookup | Tạo lịch, check-in, reschedule, cancel |
| Admin | Admin dashboard, Doctors, Services, Specialties, Staff, Audit log | Quản lý cấu hình, xem metrics, review audit |

## Route Scope

Routes đề xuất cho frontend MVP:

```text
/login
/app
/app/patient
/app/patient/services
/app/patient/book
/app/patient/appointments
/app/doctor
/app/doctor/day
/app/doctor/week
/app/operations
/app/operations/queue
/app/operations/calendar
/app/operations/appointments/new
/app/admin
/app/admin/doctors
/app/admin/services
/app/admin/specialties
/app/admin/staff
/app/admin/audit
```

## Screen Specifications

### Sign In

Purpose: Cho phép chọn user mẫu và vào app theo role.

Required states:

- Default: hiển thị danh sách mock users hoặc form login giả lập.
- Loading: submit đang xử lý.
- Error: credential không hợp lệ trong mock flow.

Acceptance criteria:

- User có thể sign in bằng một mock user.
- Sau sign in, app điều hướng đến dashboard đúng role.
- Không lưu password trong persisted storage.

Priority: Must

### Patient Home

Purpose: Trang tổng quan cho patient.

Content:

- Appointment sắp tới gần nhất.
- Quick action đặt lịch.
- Danh sách notifications gần đây.
- Shortcut đến lịch của tôi.

Acceptance criteria:

- Hiển thị empty state nếu patient chưa có appointment.
- Appointment sắp tới hiển thị doctor, service, thời gian và status.
- Quick action dẫn đến booking flow.

Priority: Must

### Browse Services

Purpose: Patient xem services và specialties.

Content:

- Filter theo specialty.
- Danh sách services.
- Thời lượng, giá và mô tả ngắn.
- Doctors có thể phụ trách service.

Acceptance criteria:

- Có thể filter services theo specialty.
- Empty filter state hiển thị rõ.
- Mỗi service có action đặt lịch.

Priority: Must

### Book Appointment

Purpose: Patient tạo appointment request.

Flow:

1. Chọn service hoặc specialty.
2. Chọn doctor hoặc any available doctor.
3. Chọn ngày và slot giờ.
4. Nhập lý do khám ngắn.
5. Review thông tin.
6. Submit request.

Required states:

- Không có slot trống.
- Doctor không khả dụng.
- Appointment conflict giả lập.
- Submit success.
- Submit error.

Acceptance criteria:

- Không cho submit nếu thiếu service, doctor/selection mode, date/time hoặc reason.
- `endAt` được tính từ `Service.durationMinutes`.
- Success state hiển thị appointment vừa tạo.
- Appointment mới xuất hiện trong lịch của patient và operations queue.

Priority: Must

### My Appointments

Purpose: Patient xem upcoming và past appointments.

Content:

- Tabs hoặc filter: upcoming, past, cancelled.
- Appointment cards.
- Action cancel hoặc request reschedule khi hợp lệ.

Acceptance criteria:

- Cancel chỉ hiển thị với appointment chưa completed/cancelled/no_show.
- Past appointments không có destructive action.
- Empty state phân biệt chưa có dữ liệu và filter không có kết quả.

Priority: Must

### Doctor Dashboard

Purpose: Doctor xem tải khám trong ngày.

Content:

- Số appointments hôm nay.
- Waiting, checked-in, in-progress, completed.
- Next appointment.
- Danh sách appointments theo thời gian.

Acceptance criteria:

- Appointments được sort theo `startAt`.
- Status hiển thị bằng text và màu/icon, không chỉ màu.
- Doctor chỉ thấy appointments của mình trong prototype.

Priority: Must

### Doctor Day / Week Schedule

Purpose: Doctor xem lịch theo ngày hoặc tuần.

Content:

- Calendar/list day view.
- Week overview.
- Filter theo status.
- Appointment detail drawer/modal.

Acceptance criteria:

- Day view dùng tốt trên mobile.
- Week view không gây horizontal overflow trên mobile.
- Blocked/leave schedule hiển thị khác appointments.

Priority: Must

### Appointment Detail

Purpose: Xem và thao tác trên một appointment.

Content:

- Patient summary.
- Doctor/service/time/status.
- Reason và internal note nhẹ.
- Status history.
- Audit events liên quan.

Actions by role:

- Patient: cancel hoặc request reschedule nếu hợp lệ.
- Doctor: start, complete, thêm note nhẹ.
- Receptionist/Nurse: check-in, reschedule, cancel.
- Admin: view-only trong MVP.

Acceptance criteria:

- Actions bị disable hoặc ẩn nếu status không hợp lệ.
- Mọi action quan trọng tạo mock audit event.
- Completed appointment không cho sửa.

Priority: Must

### Operations Dashboard

Purpose: Receptionist/nurse theo dõi vận hành trong ngày.

Content:

- Today appointment count.
- Waiting queue.
- Checked-in count.
- In-progress count.
- Cancelled/no-show count.
- Quick action tạo appointment.

Acceptance criteria:

- Queue cập nhật khi check-in/start/complete trong mock state.
- Dashboard có empty state khi không có lịch trong ngày.
- Có filter theo doctor hoặc specialty.

Priority: Must

### Appointment Queue

Purpose: Điều phối patient đang chờ, đã check-in, đang khám và hoàn tất.

Content:

- Segments: confirmed, checked_in, in_progress, completed, cancelled.
- Cards hoặc table responsive.
- Quick actions theo status.

Acceptance criteria:

- Check-in chuyển `confirmed` sang `checked_in`.
- Start chuyển `checked_in` sang `in_progress`.
- Complete chuyển `in_progress` sang `completed`.
- Invalid transition không được hiển thị như action.

Priority: Must

### Create Appointment For Patient

Purpose: Staff tạo appointment cho patient qua phone booking hoặc walk-in.

Flow:

1. Search patient.
2. Tạo patient mới nếu chưa có.
3. Chọn service.
4. Chọn doctor/date/time.
5. Submit appointment.

Acceptance criteria:

- Search có empty state.
- Form patient mới validate fullName và phone.
- Conflict giả lập hiển thị rõ.
- Appointment mới xuất hiện trong operations calendar.

Priority: Must

### Operations Calendar

Purpose: Staff xem lịch theo ngày/tuần và filter theo doctor/specialty.

Acceptance criteria:

- Có day view dễ scan.
- Có filter doctor/specialty/status.
- Appointment cards thể hiện status bằng text và màu/icon.
- Mobile dùng list hoặc compact timeline thay vì table rộng.

Priority: Should

### Admin Dashboard

Purpose: Admin xem overview cấu hình và vận hành.

Content:

- Tổng doctors active.
- Tổng services active.
- Appointments hôm nay.
- Cancellation rate.
- Popular services.
- Doctor workload summary.

Acceptance criteria:

- Metrics lấy từ mock data, không hardcode số rời rạc trong component.
- Nếu thiếu dữ liệu, hiển thị summary unavailable thay vì fabricate chart.

Priority: Should

### Admin Doctors

Purpose: Quản lý danh sách doctors trong prototype.

Content:

- List doctors.
- Specialty, services, status, room.
- Create/edit mock doctor form.

Acceptance criteria:

- Form validate fullName, specialty và status.
- Doctor inactive không nên xuất hiện trong booking slot mặc định.

Priority: Should

### Admin Services And Specialties

Purpose: Quản lý services và specialties.

Acceptance criteria:

- Service phải có name, specialty, durationMinutes, price, currency và status.
- Specialty inactive không nên hiển thị trong booking filter mặc định.

Priority: Should

### Admin Staff

Purpose: Xem staff users và role.

Acceptance criteria:

- Hiển thị receptionist, nurse và admin.
- Không cần full RBAC editor trong MVP.

Priority: Could

### Audit Log

Purpose: Review các thay đổi quan trọng.

Content:

- Actor.
- Action.
- Entity type/id.
- Timestamp.
- Metadata summary.

Acceptance criteria:

- Có filter theo entity type/action.
- Có empty state.
- Audit events từ appointment actions xuất hiện trong log.

Priority: Should

## Workflows

### Patient Appointment Request

Actor: Patient

Preconditions:

- Patient đã sign in bằng mock user.
- Có active services, active doctors và available slots.

Main flow:

1. Patient mở booking flow.
2. Chọn service.
3. Chọn doctor hoặc any available doctor.
4. Chọn slot.
5. Nhập reason.
6. Review và submit.
7. System tạo appointment ở status `requested` hoặc `confirmed` theo mock configuration.

Expected result:

- Appointment xuất hiện trong My Appointments.
- Staff queue nhận appointment mới.
- Audit event `appointment_created` được ghi.

### Reception Check-In

Actor: Receptionist/Nurse

Preconditions:

- Appointment ở status `confirmed`.

Main flow:

1. Staff mở appointment queue.
2. Chọn appointment.
3. Bấm check-in.
4. System chuyển status sang `checked_in`.

Expected result:

- Appointment vào waiting queue.
- Doctor dashboard thấy patient đang chờ.
- Audit event `appointment_checked_in` được ghi.

### Doctor Start And Complete

Actor: Doctor

Preconditions:

- Appointment ở status `checked_in`.

Main flow:

1. Doctor mở day schedule.
2. Chọn appointment đang chờ.
3. Bấm start.
4. System chuyển status sang `in_progress`.
5. Doctor thêm internal note nhẹ nếu cần.
6. Bấm complete.
7. System chuyển status sang `completed`.

Expected result:

- Appointment rời active queue.
- Dashboard count cập nhật.
- Audit events được ghi cho start và complete.

### Reschedule Appointment

Actor: Patient hoặc Staff

Preconditions:

- Appointment chưa `completed`, `cancelled` hoặc `no_show`.

Main flow:

1. Actor chọn reschedule.
2. Chọn slot mới.
3. System kiểm tra conflict giả lập.
4. System cập nhật `startAt` và `endAt`.
5. System ghi audit event.

Expected result:

- Appointment giữ nguyên `id`.
- Lịch hiển thị thời gian mới.

### Cancel Appointment

Actor: Patient hoặc Staff

Preconditions:

- Appointment chưa `completed`, `cancelled` hoặc `no_show`.

Main flow:

1. Actor chọn cancel.
2. Xác nhận hành động.
3. Staff nhập `cancellationReason` nếu thao tác từ staff/admin side.
4. System chuyển status sang `cancelled`.

Expected result:

- Appointment vẫn hiển thị trong history.
- Slot không còn bị chiếm.
- Audit event `appointment_cancelled` được ghi.

## Frontend State Requirements

### Auth State

- Prototype có thể dùng mock auth state.
- Không lưu password trong persisted storage.
- Role switcher chỉ phục vụ demo và development.
- Protected routes redirect về `/login` nếu chưa có mock session.

### Data State

- Dữ liệu được quản lý qua service boundary để sau này thay bằng API client.
- Mock services nên expose functions tương tự future API, ví dụ `listAppointments`, `createAppointment`, `updateAppointmentStatus`.
- UI không import trực tiếp fixture nếu action cần mutate state.

### UI States

Mỗi list/form quan trọng cần có:

- Loading state.
- Empty state.
- Error state.
- Filter empty state.
- Success feedback.
- Disabled state khi action không hợp lệ.

## Mock Data Requirements

Mock data phải dựa trên `docs/03-architecture/data-model.md`.

Minimum dataset:

- 4 users theo 4 role chính.
- 8-12 patients.
- 5-8 doctors.
- 3-4 specialties.
- 8-12 services.
- 2 tuần doctor schedules.
- 30-50 appointments phủ đủ statuses.
- 20-30 audit events.
- 8-12 notifications.

Dataset cần bao phủ:

- Patient chưa có appointment.
- Doctor không có lịch hôm nay.
- Doctor có lịch kín.
- Appointment conflict giả lập.
- Cancelled/no-show history.
- Empty filter result.

## Visual And UX Direction

CareFlow nên có cảm giác sạch, tin cậy, bình tĩnh và thực dụng. UI là công cụ vận hành, không phải landing page.

Principles:

- Ưu tiên dashboard/list/calendar dễ scan.
- Không dùng hero marketing làm màn hình đầu.
- Không dùng màu để truyền đạt status một mình.
- Status phải có text hoặc icon.
- Primary action mỗi màn hình phải rõ.
- Mobile-first cho patient và staff flows.
- Desktop dense hơn cho admin/operations dashboard.

Design system chi tiết sẽ được viết ở `docs/03-architecture/frontend-design-system.md`.

## Accessibility And Responsive Requirements

- Touch target tối thiểu 44px cho action chính.
- Focus state phải nhìn thấy.
- Form label đặt rõ, không chỉ dùng placeholder.
- Error message gắn gần field lỗi.
- Dialog trên mobile nên thành bottom sheet nếu nội dung dài.
- Không để page-level horizontal overflow.
- Calendar mobile phải có list/timeline fallback.
- Tôn trọng `prefers-reduced-motion`.

## MoSCoW Priority

### Must Have

- Mock sign in và role-based navigation.
- Patient booking flow.
- Patient appointment list/detail.
- Doctor dashboard và day schedule.
- Reception queue và check-in flow.
- Appointment status transitions chính.
- Operations dashboard.
- Conceptual audit log cho appointment actions.
- Responsive mobile/desktop layout.

### Should Have

- Week schedule.
- Operations calendar.
- Admin dashboard.
- Doctors/services/specialties management prototype.
- Notifications panel.
- Filter/search cho appointment list và audit log.

### Could Have

- Staff management prototype.
- Advanced doctor workload visualization.
- Export mock CSV.
- Theme switcher.

### Won't Have In Frontend MVP

- Backend thật.
- Real authentication.
- Payment.
- Insurance.
- Telemedicine/video call.
- Prescription.
- Full medical record.
- SMS/email/push notification integration.

## Acceptance Criteria

Frontend MVP được xem là đạt khi:

- User có thể sign in bằng mock user và chuyển role trong prototype.
- Patient có thể tạo appointment request hoàn chỉnh.
- Patient có thể xem upcoming/past/cancelled appointments.
- Receptionist/nurse có thể tạo appointment cho patient.
- Receptionist/nurse có thể check-in appointment.
- Doctor có thể start và complete appointment.
- Admin có thể xem dashboard và danh sách doctors/services/specialties.
- Dashboard metrics thay đổi theo mock state, không chỉ hardcode.
- Audit log nhận events từ appointment actions.
- Các invalid transitions không xuất hiện như action hợp lệ.
- App có loading, empty, error và filter empty states cho các list quan trọng.
- UI hoạt động tốt ở mobile và desktop.
- Không có plaintext password trong persisted mock data.

## Verification Notes

Khi triển khai frontend, cần có verification commands tối thiểu:

```sh
npm test -- --run
npm run typecheck
npm run lint
npm run build
```

Nếu có Playwright:

```sh
npm run e2e
```

Browser verification cần kiểm tra tối thiểu:

- Mobile width 360px.
- Tablet width 768px.
- Desktop width 1280px.
- Wide desktop width 1440px.

## Out Of Scope

- Backend API thật.
- Database schema/ERD.
- Real auth/session/token.
- Compliance-ready medical data handling.
- Payment/insurance/prescription/telemedicine.
- External notification providers.
- Multi-branch clinic management.

## Open Questions

- Frontend MVP sẽ dùng trạng thái appointment tạo mới là `requested` hay `confirmed` mặc định?
- Patient có được tự chọn doctor bắt buộc không, hay có option any available doctor?
- Staff role trong UI nên gộp receptionist/nurse hay tách navigation riêng?
- Theme switcher có cần trong MVP không, hay để sau design system?
