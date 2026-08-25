# Frontend MVP Spec

## Kiểm Soát Tài Liệu

| Mục | Nội dung |
| --- | --- |
| Tên tài liệu | Frontend MVP Spec |
| Sản phẩm | CareFlow - Đặt lịch khám online |
| Phiên bản | 1.0 |
| Ngày | 2026-08-24 |
| Trạng thái | draft |
| Phạm vi | Frontend-first MVP với `mock data` |
| Đối tượng đọc | Product owner, frontend developer, QA, agent contributors |

## Lịch Sử Phiên Bản

| Phiên bản | Ngày | Nội dung thay đổi |
| --- | --- | --- |
| 1.0 | 2026-08-24 | Bản spec đầu tiên cho frontend MVP của CareFlow. |
| 1.1 | 2026-08-25 | Chốt các open questions về appointment status mặc định, doctor selection, staff workspace và theme switcher. |

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

## Tóm Tắt Sản Phẩm

CareFlow là ứng dụng vận hành phòng khám nhỏ theo hướng đặt lịch khám online và điều phối appointment. Frontend MVP cần cho người dùng thấy rõ cách hệ thống hoạt động qua các vai trò patient, doctor, receptionist/nurse và admin.

MVP ưu tiên:

- Workflow appointment rõ ràng.
- UI vận hành thực tế, dễ scan.
- `mock data` đủ phong phú để thể hiện các trạng thái chính.
- Role-based navigation.
- Responsive behavior tốt trên mobile và desktop.
- Không xử lý dữ liệu y tế nhạy cảm ngoài ghi chú vận hành nhẹ.

## Nhóm Người Dùng

### Patient

Người đặt lịch khám. Mục tiêu là tìm service phù hợp, chọn thời gian, gửi yêu cầu đặt lịch và theo dõi appointment của mình.

Vấn đề chính:

- Không muốn gọi điện để hỏi lịch.
- Muốn biết lịch sắp tới và trạng thái lịch.
- Cần thao tác hủy hoặc yêu cầu đổi lịch khi có thay đổi.

### Doctor

Bác sĩ tiếp nhận lịch khám trong ngày. Mục tiêu là xem danh sách patient, biết ai đang chờ, bắt đầu và hoàn tất appointment.

Vấn đề chính:

- Lịch khám bị rời rạc.
- Không biết patient nào đã check-in.
- Khó theo dõi appointment đang ở trạng thái nào.

### Receptionist / Nurse

Nhân sự vận hành phòng khám. Mục tiêu là tạo lịch thay patient, check-in patient, điều phối queue và xử lý reschedule/cancellation.

Vấn đề chính:

- Phải xử lý nhiều lịch trong ngày.
- Cần nhìn nhanh ai đang chờ, ai đang khám, ai đã hoàn tất.
- Cần tạo appointment cho walk-in hoặc phone booking.

### Admin

Người quản lý cấu hình vận hành. Mục tiêu là quản lý doctors, specialties, services, staff và xem dashboard vận hành.

Vấn đề chính:

- Cần dữ liệu tổng quan về tải khám trong ngày.
- Cần biết service nào phổ biến và doctor nào đang quá tải.
- Cần audit log để truy vết thay đổi quan trọng.

## Vai Trò Và Điều Hướng

Frontend prototype cần có role switcher để chuyển nhanh giữa các vai trò. Đây chỉ là prototype tool, không phải authorization thật.

Receptionist và nurse dùng chung một operations workspace trong frontend MVP. Việc tách quyền chi tiết sẽ để backend phase hoặc phase sau nếu nghiệp vụ yêu cầu.

| Role | Điều hướng chính | Hành động chính |
| --- | --- | --- |
| Patient | Trang chính, Dịch vụ, Đặt lịch, Lịch của tôi, Thông báo | Request appointment, xem lịch, cancel/request reschedule |
| Doctor | Dashboard, Lịch ngày, Lịch tuần, Appointment detail | Start appointment, complete appointment, thêm internal note nhẹ |
| Receptionist/Nurse | Operations dashboard, Queue, Calendar, Tạo appointment, Patient lookup | Tạo lịch, check-in, reschedule, cancel |
| Admin | Admin dashboard, Doctors, Services, Specialties, Staff, Audit log | Quản lý cấu hình, xem metrics, review audit |

## Phạm Vi Route

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

## Đặc Tả Màn Hình

### Đăng Nhập

Mục đích: Cho phép chọn user mẫu và vào app theo role.

Trạng thái bắt buộc:

- Mặc định: hiển thị danh sách mock users hoặc form login giả lập.
- Loading: submit đang xử lý.
- Lỗi: credential không hợp lệ trong mock flow.

Tiêu chí chấp nhận:

- User có thể sign in bằng một mock user.
- Sau sign in, app điều hướng đến dashboard đúng role.
- Không lưu password trong persisted storage.

Độ ưu tiên: Phải có

### Trang Chính Patient

Mục đích: Trang tổng quan cho patient.

Nội dung:

- Appointment sắp tới gần nhất.
- Quick action đặt lịch.
- Danh sách notifications gần đây.
- Shortcut đến lịch của tôi.

Tiêu chí chấp nhận:

- Hiển thị empty state nếu patient chưa có appointment.
- Appointment sắp tới hiển thị doctor, service, thời gian và status.
- Quick action dẫn đến booking flow.

Độ ưu tiên: Phải có

### Duyệt Dịch Vụ

Mục đích: Patient xem services và specialties.

Nội dung:

- Filter theo specialty.
- Danh sách services.
- Thời lượng, giá và mô tả ngắn.
- Doctors có thể phụ trách service.

Tiêu chí chấp nhận:

- Có thể filter services theo specialty.
- Empty filter state hiển thị rõ.
- Mỗi service có action đặt lịch.

Độ ưu tiên: Phải có

### Đặt Appointment

Mục đích: Patient tạo appointment request.

Luồng:

1. Chọn service hoặc specialty.
2. Chọn doctor cụ thể hoặc any available doctor.
3. Chọn ngày và slot giờ.
4. Nhập lý do khám ngắn.
5. Review thông tin.
6. Submit request.

Trạng thái bắt buộc:

- Không có slot trống.
- Doctor không khả dụng.
- Appointment conflict giả lập.
- Submit success.
- Submit error.

Tiêu chí chấp nhận:

- Không cho submit nếu thiếu service, doctor/selection mode, date/time hoặc reason.
- `endAt` được tính từ `Service.durationMinutes`.
- Success state hiển thị appointment vừa tạo.
- Appointment mới xuất hiện trong lịch của patient và operations queue.
- Appointment do patient tạo mặc định ở status `requested`.

Độ ưu tiên: Phải có

### Appointment Của Tôi

Mục đích: Patient xem upcoming và past appointments.

Nội dung:

- Tabs hoặc filter: upcoming, past, cancelled.
- Appointment cards.
- Action cancel hoặc request reschedule khi hợp lệ.

Tiêu chí chấp nhận:

- Cancel chỉ hiển thị với appointment chưa completed/cancelled/no_show.
- Past appointments không có destructive action.
- Empty state phân biệt chưa có dữ liệu và filter không có kết quả.

Độ ưu tiên: Phải có

### Doctor Dashboard

Mục đích: Doctor xem tải khám trong ngày.

Nội dung:

- Số appointments hôm nay.
- Waiting, checked-in, in-progress, completed.
- Next appointment.
- Danh sách appointments theo thời gian.

Tiêu chí chấp nhận:

- Appointments được sort theo `startAt`.
- Status hiển thị bằng text và màu/icon, không chỉ màu.
- Doctor chỉ thấy appointments của mình trong prototype.

Độ ưu tiên: Phải có

### Lịch Ngày / Tuần Của Doctor

Mục đích: Doctor xem lịch theo ngày hoặc tuần.

Nội dung:

- Calendar/list day view.
- Week overview.
- Filter theo status.
- Appointment detail drawer/modal.

Tiêu chí chấp nhận:

- Day view dùng tốt trên mobile.
- Week view không gây horizontal overflow trên mobile.
- Blocked/leave schedule hiển thị khác appointments.

Độ ưu tiên: Phải có

### Appointment Detail

Mục đích: Xem và thao tác trên một appointment.

Nội dung:

- Patient summary.
- Doctor/service/time/status.
- Reason và internal note nhẹ.
- Status history.
- Audit events liên quan.

Hành động theo vai trò:

- Patient: cancel hoặc request reschedule nếu hợp lệ.
- Doctor: start, complete, thêm note nhẹ.
- Receptionist/Nurse: check-in, reschedule, cancel.
- Admin: view-only trong MVP.

Tiêu chí chấp nhận:

- Actions bị disable hoặc ẩn nếu status không hợp lệ.
- Mọi action quan trọng tạo mock audit event.
- Completed appointment không cho sửa.

Độ ưu tiên: Phải có

### Operations Dashboard

Mục đích: Receptionist/nurse theo dõi vận hành trong ngày.

Nội dung:

- Today appointment count.
- Waiting queue.
- Checked-in count.
- In-progress count.
- Cancelled/no-show count.
- Quick action tạo appointment.

Tiêu chí chấp nhận:

- Queue cập nhật khi check-in/start/complete trong mock state.
- Dashboard có empty state khi không có lịch trong ngày.
- Có filter theo doctor hoặc specialty.

Độ ưu tiên: Phải có

### Appointment Queue

Mục đích: Điều phối patient đang chờ, đã check-in, đang khám và hoàn tất.

Nội dung:

- Segments: confirmed, checked_in, in_progress, completed, cancelled.
- Cards hoặc table responsive.
- Quick actions theo status.

Tiêu chí chấp nhận:

- Check-in chuyển `confirmed` sang `checked_in`.
- Start chuyển `checked_in` sang `in_progress`.
- Complete chuyển `in_progress` sang `completed`.
- Invalid transition không được hiển thị như action.

Độ ưu tiên: Phải có

### Tạo Appointment Cho Patient

Mục đích: Staff tạo appointment cho patient qua phone booking hoặc walk-in.

Luồng:

1. Search patient.
2. Tạo patient mới nếu chưa có.
3. Chọn service.
4. Chọn doctor/date/time.
5. Submit appointment.

Tiêu chí chấp nhận:

- Search có empty state.
- Form patient mới validate fullName và phone.
- Conflict giả lập hiển thị rõ.
- Appointment mới xuất hiện trong operations calendar.
- Appointment do staff tạo mặc định ở status `confirmed`.

Độ ưu tiên: Phải có

### Operations Calendar

Mục đích: Staff xem lịch theo ngày/tuần và filter theo doctor/specialty.

Tiêu chí chấp nhận:

- Có day view dễ scan.
- Có filter doctor/specialty/status.
- Appointment cards thể hiện status bằng text và màu/icon.
- Mobile dùng list hoặc compact timeline thay vì table rộng.

Độ ưu tiên: Nên có

### Admin Dashboard

Mục đích: Admin xem overview cấu hình và vận hành.

Nội dung:

- Tổng doctors active.
- Tổng services active.
- Appointments hôm nay.
- Cancellation rate.
- Popular services.
- Doctor workload summary.

Tiêu chí chấp nhận:

- Metrics lấy từ mock data, không hardcode số rời rạc trong component.
- Nếu thiếu dữ liệu, hiển thị summary unavailable thay vì fabricate chart.

Độ ưu tiên: Nên có

### Admin Doctors

Mục đích: Quản lý danh sách doctors trong prototype.

Nội dung:

- List doctors.
- Specialty, services, status, room.
- Create/edit mock doctor form.

Tiêu chí chấp nhận:

- Form validate fullName, specialty và status.
- Doctor inactive không nên xuất hiện trong booking slot mặc định.

Độ ưu tiên: Nên có

### Admin Services Và Specialties

Mục đích: Quản lý services và specialties.

Tiêu chí chấp nhận:

- Service phải có name, specialty, durationMinutes, price, currency và status.
- Specialty inactive không nên hiển thị trong booking filter mặc định.

Độ ưu tiên: Nên có

### Admin Staff

Mục đích: Xem staff users và role.

Tiêu chí chấp nhận:

- Hiển thị receptionist, nurse và admin.
- Không cần full RBAC editor trong MVP.

Độ ưu tiên: Có thể có

### Audit Log

Mục đích: Review các thay đổi quan trọng.

Nội dung:

- Actor.
- Action.
- Entity type/id.
- Timestamp.
- Metadata summary.

Tiêu chí chấp nhận:

- Có filter theo entity type/action.
- Có empty state.
- Audit events từ appointment actions xuất hiện trong log.

Độ ưu tiên: Nên có

## Luồng Nghiệp Vụ

### Patient Request Appointment

Tác nhân: Patient

Tiền điều kiện:

- Patient đã sign in bằng mock user.
- Có active services, active doctors và available slots.

Luồng chính:

1. Patient mở booking flow.
2. Chọn service.
3. Chọn doctor cụ thể hoặc any available doctor.
4. Chọn slot.
5. Nhập reason.
6. Review và submit.
7. System tạo appointment ở status `requested`.

Kết quả mong đợi:

- Appointment xuất hiện trong My Appointments.
- Staff queue nhận appointment mới.
- Audit event `appointment_created` được ghi.

### Reception Check-In

Tác nhân: Receptionist/Nurse

Tiền điều kiện:

- Appointment ở status `confirmed`.

Luồng chính:

1. Staff mở appointment queue.
2. Chọn appointment.
3. Bấm check-in.
4. System chuyển status sang `checked_in`.

Kết quả mong đợi:

- Appointment vào waiting queue.
- Doctor dashboard thấy patient đang chờ.
- Audit event `appointment_checked_in` được ghi.

### Doctor Start Và Complete

Tác nhân: Doctor

Tiền điều kiện:

- Appointment ở status `checked_in`.

Luồng chính:

1. Doctor mở day schedule.
2. Chọn appointment đang chờ.
3. Bấm start.
4. System chuyển status sang `in_progress`.
5. Doctor thêm internal note nhẹ nếu cần.
6. Bấm complete.
7. System chuyển status sang `completed`.

Kết quả mong đợi:

- Appointment rời active queue.
- Dashboard count cập nhật.
- Audit events được ghi cho start và complete.

### Reschedule Appointment

Tác nhân: Patient hoặc Staff

Tiền điều kiện:

- Appointment chưa `completed`, `cancelled` hoặc `no_show`.

Luồng chính:

1. Actor chọn reschedule.
2. Chọn slot mới.
3. System kiểm tra conflict giả lập.
4. System cập nhật `startAt` và `endAt`.
5. System ghi audit event.

Kết quả mong đợi:

- Appointment giữ nguyên `id`.
- Lịch hiển thị thời gian mới.

### Cancel Appointment

Tác nhân: Patient hoặc Staff

Tiền điều kiện:

- Appointment chưa `completed`, `cancelled` hoặc `no_show`.

Luồng chính:

1. Actor chọn cancel.
2. Xác nhận hành động.
3. Staff nhập `cancellationReason` nếu thao tác từ staff/admin side.
4. System chuyển status sang `cancelled`.

Kết quả mong đợi:

- Appointment vẫn hiển thị trong history.
- Slot không còn bị chiếm.
- Audit event `appointment_cancelled` được ghi.

## Yêu Cầu Frontend State

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

## Yêu Cầu Mock Data

Mock data phải dựa trên `docs/03-architecture/data-model.md`.

Dataset tối thiểu:

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

## Định Hướng Visual Và UX

CareFlow nên có cảm giác sạch, tin cậy, bình tĩnh và thực dụng. UI là công cụ vận hành, không phải landing page.

Nguyên tắc:

- Ưu tiên dashboard/list/calendar dễ scan.
- Không dùng hero marketing làm màn hình đầu.
- Không dùng màu để truyền đạt status một mình.
- Status phải có text hoặc icon.
- Primary action mỗi màn hình phải rõ.
- Mobile-first cho patient và staff flows.
- Desktop dense hơn cho admin/operations dashboard.

Design system chi tiết sẽ được viết ở `docs/03-architecture/frontend-design-system.md`.

## Yêu Cầu Accessibility Và Responsive

- Touch target tối thiểu 44px cho action chính.
- Focus state phải nhìn thấy.
- Form label đặt rõ, không chỉ dùng placeholder.
- Error message gắn gần field lỗi.
- Dialog trên mobile nên thành bottom sheet nếu nội dung dài.
- Không để page-level horizontal overflow.
- Calendar mobile phải có list/timeline fallback.
- Tôn trọng `prefers-reduced-motion`.

## Độ Ưu Tiên MoSCoW

### Phải Có

- Mock sign in và role-based navigation.
- Patient booking flow.
- Patient appointment list/detail.
- Doctor dashboard và day schedule.
- Reception queue và check-in flow.
- Appointment status transitions chính.
- Operations dashboard.
- Conceptual audit log cho appointment actions.
- Responsive mobile/desktop layout.

### Nên Có

- Week schedule.
- Operations calendar.
- Admin dashboard.
- Doctors/services/specialties management prototype.
- Notifications panel.
- Filter/search cho appointment list và audit log.

### Có Thể Có

- Staff management prototype.
- Advanced doctor workload visualization.
- Export mock CSV.

### Không Làm Trong Frontend MVP

- Backend thật.
- Real authentication.
- Payment.
- Insurance.
- Telemedicine/video call.
- Prescription.
- Full medical record.
- SMS/email/push notification integration.
- Theme switcher.

## Tiêu Chí Chấp Nhận

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

## Ghi Chú Kiểm Tra

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

## Ngoài Phạm Vi

- Backend API thật.
- Database schema/ERD.
- Real auth/session/token.
- Compliance-ready medical data handling.
- Payment/insurance/prescription/telemedicine.
- External notification providers.
- Multi-branch clinic management.

## Quyết Định Product Đã Chốt

### Appointment Status Khi Tạo Mới

- Patient-created appointment mặc định là `requested`.
- Staff-created appointment mặc định là `confirmed`.

Lý do: Patient booking cần được phòng khám xác nhận trước khi xem là lịch chắc chắn. Staff booking thường diễn ra sau khi đã trao đổi trực tiếp với patient qua quầy hoặc điện thoại, nên có thể vào lịch `confirmed` ngay.

### Doctor Selection

Patient được chọn doctor cụ thể hoặc chọn any available doctor. UI nên ưu tiên any available doctor để giảm ma sát đặt lịch, nhưng vẫn cho patient chọn doctor nếu có nhu cầu.

Lý do: MVP cần hỗ trợ cả người dùng không biết chọn bác sĩ nào và người dùng muốn khám lại với một bác sĩ quen.

### Receptionist / Nurse Workspace

Receptionist và nurse dùng chung operations workspace trong frontend MVP.

Lý do: Hai vai trò này có workflow frontend gần nhau trong MVP: tạo appointment, check-in, queue, reschedule và cancel. Tách UI quá sớm làm tăng scope nhưng chưa tạo đủ giá trị.

### Theme Switcher

Theme switcher không nằm trong frontend MVP. Design system có thể định nghĩa nền tảng màu/semantic tokens, nhưng app MVP ưu tiên một light theme chuyên nghiệp trước.

Lý do: MVP cần tập trung vào workflow vận hành, responsive layout và accessibility. Theme switcher sẽ được xem xét sau khi frontend prototype ổn định.
