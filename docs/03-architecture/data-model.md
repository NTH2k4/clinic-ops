# Data Model

Đây là conceptual data model cho giai đoạn frontend-first của CareFlow và là nền cho backend contract sau này.

Tài liệu này chưa phải ERD hoặc database schema cuối cùng. Mục tiêu hiện tại là thống nhất entity, field, relationship, enum và business rules đủ rõ để frontend có thể dựng `mock data`, UI workflows và API boundary nhất quán.

## Nguyên Tắc

- Dùng `id` dạng string/UUID trong frontend mock data.
- Dùng ISO 8601 string cho date/time trong mock data, ví dụ `2026-08-24T09:00:00+07:00`.
- Mọi entity nghiệp vụ chính nên có `createdAt` và `updatedAt`.
- Các entity có lifecycle nên có `status`.
- Frontend không tự quyết định authorization thật; mock role chỉ phục vụ prototype.
- Backend sau này là source of truth cho appointment conflict, ownership, authorization và audit log.

## Entity Chính

### User

Đại diện cho tài khoản đăng nhập trong hệ thống.

- id
- displayName
- email
- phone
- role
- status
- avatarUrl
- createdAt
- updatedAt

Quan hệ:

- Một `User` có thể liên kết với một `Patient`, `Staff` hoặc `Doctor` tùy vai trò.
- `role` quyết định navigation và actions hiển thị trong frontend prototype.

### Patient

Hồ sơ người đặt lịch hoặc người được khám.

- id
- userId
- fullName
- phone
- email
- citizenIdNumber
- healthInsuranceNumber
- dateOfBirth
- gender
- address
- guardianName
- guardianPhone
- identityDocumentType
- notes
- status
- createdAt
- updatedAt

Quan hệ:

- Một `Patient` có nhiều `Appointment`.
- `userId` có thể rỗng trong trường hợp receptionist tạo patient cho walk-in hoặc đặt lịch qua điện thoại.
- CCCD (`citizenIdNumber`) và BHYT (`healthInsuranceNumber`) là định danh nghiệp vụ unique khi có.
- Trẻ dưới 14 tuổi hoặc người không có giấy tờ có thể được định danh bằng tổ hợp `fullName`, `dateOfBirth`, `address`, `guardianName` và `guardianPhone`.

### Staff

Hồ sơ nhân sự vận hành phòng khám.

- id
- userId
- fullName
- phone
- email
- role
- status
- createdAt
- updatedAt

Quan hệ:

- Một `Staff` có thể tạo, cập nhật hoặc hủy `Appointment`.
- Một `Staff` có thể là receptionist, nurse hoặc admin.

### Doctor

Hồ sơ bác sĩ.

- id
- userId
- fullName
- specialtyId
- serviceIds
- phone
- email
- title
- room
- status
- createdAt
- updatedAt

Quan hệ:

- Một `Doctor` thuộc một `Specialty`.
- Một `Doctor` bắt buộc liên kết với một `User` role `doctor`; bác sĩ không có tài khoản đăng nhập được xem là dữ liệu không hợp lệ.
- Một `Doctor` có thể phụ trách nhiều `Service`.
- Một `Doctor` có nhiều `DoctorSchedule`.
- Một `Doctor` có nhiều `Appointment`.

### Specialty

Chuyên khoa dùng để nhóm doctors và services.

- id
- name
- description
- status
- createdAt
- updatedAt

Quan hệ:

- Một `Specialty` có nhiều `Doctor`.
- Một `Specialty` có nhiều `Service`.

### Service

Loại dịch vụ có thể đặt lịch.

- id
- name
- specialtyId
- durationMinutes
- price
- currency
- description
- status
- createdAt
- updatedAt

Quan hệ:

- Một `Service` thuộc một `Specialty`.
- Một `Service` có thể được nhiều `Doctor` phụ trách.
- Một `Appointment` phải chọn đúng một `Service`.

### DoctorSchedule

Khung lịch làm việc hoặc lịch nghỉ của doctor.

- id
- doctorId
- dayOfWeek
- startTime
- endTime
- effectiveFrom
- effectiveTo
- type
- status
- createdAt
- updatedAt

Quan hệ:

- Một `DoctorSchedule` thuộc một `Doctor`.
- Frontend dùng entity này để render lịch trống, lịch làm việc và trạng thái không khả dụng.

### Appointment

Lịch khám giữa patient và doctor cho một service cụ thể.

- id
- patientId
- doctorId
- serviceId
- startAt
- endAt
- status
- reason
- internalNote
- cancellationReason
- createdByUserId
- updatedByUserId
- checkedInAt
- startedAt
- completedAt
- cancelledAt
- createdAt
- updatedAt

Quan hệ:

- Một `Appointment` thuộc một `Patient`.
- Một `Appointment` thuộc một `Doctor`.
- Một `Appointment` thuộc một `Service`.
- Một `Appointment` có nhiều `AppointmentStatusHistory`.
- Một `Appointment` có thể sinh nhiều `AuditEvent`.

### AppointmentStatusHistory

Lịch sử chuyển trạng thái của appointment.

- id
- appointmentId
- fromStatus
- toStatus
- actorUserId
- note
- changedAt

Quan hệ:

- Một `AppointmentStatusHistory` thuộc một `Appointment`.
- `actorUserId` trỏ đến `User` thực hiện thay đổi.

### Notification

Thông báo trong app cho prototype.

- id
- recipientUserId
- type
- title
- message
- referenceType
- referenceId
- readAt
- createdAt

Quan hệ:

- Một `Notification` thuộc một `User`.
- `referenceType` và `referenceId` có thể trỏ đến `Appointment`, `DoctorSchedule` hoặc `AuditEvent`.

### AuditEvent

Audit log cho hành động quan trọng.

- id
- actorUserId
- entityType
- entityId
- action
- timestamp
- metadata

Quan hệ:

- Một `AuditEvent` do một `User` tạo ra thông qua hành động trên hệ thống.
- `entityType` có thể là `appointment`, `patient`, `doctor`, `service`, `schedule`, `user`.

## Mô Hình Auth Và Security

Phần này mô tả các entity liên quan đến authentication/session. Backend hiện đã lưu `User.passwordHash` bằng bcrypt và lưu bearer session hash trong `AuthSession`; các field còn lại dưới đây là hướng mở rộng cho account lifecycle v1 và production hardening sau v1.

### Trường User Authentication

Các field auth nên thuộc `User` hoặc bảng auth riêng khi thiết kế backend:

- passwordHash
- emailVerifiedAt
- phoneVerifiedAt
- lastLoginAt
- passwordUpdatedAt
- failedLoginCount
- lockedUntil

Quy tắc:

- Không lưu field `password` trong database.
- `password` chỉ tồn tại tạm thời trong request đăng ký, đăng nhập, đổi mật khẩu hoặc reset mật khẩu.
- Backend phải hash password trước khi lưu; baseline hiện dùng bcrypt.
- Frontend không lưu password trong localStorage, sessionStorage, IndexedDB hoặc mock persisted state.
- Frontend API mode dùng backend login thật; mock mode vẫn có thể chọn user mẫu cho local prototype và regression coverage.

### RefreshToken

Đại diện cho refresh token hoặc session token ở backend phase.

- id
- userId
- tokenHash
- deviceName
- ipAddress
- userAgent
- expiresAt
- revokedAt
- createdAt

Quy tắc:

- Không lưu raw refresh token trong database; chỉ lưu `tokenHash`.
- Refresh token nên có expiry và cơ chế revoke khi logout.
- Backend phase nên cân nhắc token rotation khi refresh.

### PasswordResetToken

Token dùng cho forgot/reset password.

- id
- userId
- tokenHash
- expiresAt
- usedAt
- createdAt

Quy tắc:

- Token reset password phải có thời hạn.
- Token đã dùng không được dùng lại.
- Database chỉ lưu `tokenHash`, không lưu raw token.

### VerificationCode

Mã xác thực dùng cho email/phone verification hoặc OTP flow.

- id
- userId
- purpose
- channel
- codeHash
- expiresAt
- attemptCount
- usedAt
- createdAt

Quy tắc:

- Không lưu plaintext OTP/code lâu dài.
- Cần giới hạn số lần thử.
- Cần phân biệt `purpose`, ví dụ `email_verification`, `password_reset`, `login_otp`.

## Enums

### UserRole

- `patient`
- `doctor`
- `receptionist`
- `nurse`
- `admin`

### AccountStatus

- `active`
- `inactive`
- `locked`

### DoctorStatus

- `active`
- `inactive`
- `on_leave`

### ServiceStatus

- `active`
- `inactive`

### ScheduleType

- `working`
- `blocked`
- `leave`

### AppointmentStatus

- `requested`
- `confirmed`
- `checked_in`
- `in_progress`
- `completed`
- `cancelled`
- `no_show`

### NotificationType

- `appointment_created`
- `appointment_confirmed`
- `appointment_rescheduled`
- `appointment_cancelled`
- `appointment_checked_in`
- `appointment_completed`
- `system`

## Tóm Tắt Quan Hệ

```text
User 1--0..1 Patient
User 1--0..1 Staff
User 1--0..1 Doctor
User 1--many RefreshToken
User 1--many PasswordResetToken
User 1--many VerificationCode

Specialty 1--many Doctor
Specialty 1--many Service
Doctor many--many Service

Doctor 1--many DoctorSchedule
Patient 1--many Appointment
Doctor 1--many Appointment
Service 1--many Appointment

Appointment 1--many AppointmentStatusHistory
Appointment 1--many AuditEvent
User 1--many Notification
User 1--many AuditEvent
```

## Quy Tắc Nghiệp Vụ

### Appointment

- Appointment phải có `patientId`, `doctorId`, `serviceId`, `startAt`, `endAt` và `status`.
- `endAt` phải sau `startAt`.
- Duration mặc định của appointment nên lấy từ `Service.durationMinutes`.
- Một doctor không được có hai appointments active trùng thời gian.
- Active statuses gồm `requested`, `confirmed`, `checked_in` và `in_progress`.
- Appointments ở trạng thái `completed`, `cancelled` hoặc `no_show` không còn chiếm slot lịch.
- Reschedule giữ nguyên `appointment.id`, cập nhật `startAt`/`endAt`, ghi `AppointmentStatusHistory` nếu status đổi và ghi `AuditEvent`.
- Cancel appointment phải ghi `cancellationReason` nếu người thao tác là staff hoặc admin.
- Completed appointment không được chỉnh sửa trong MVP.

### Patient

- Patient có thể tồn tại không cần `userId` nếu được staff tạo thủ công.
- Phone nên unique trong phạm vi prototype để giảm trùng hồ sơ.
- Patient notes trong MVP chỉ là ghi chú vận hành nhẹ, không phải medical record.

### Doctor Và Schedule

- Doctor phải thuộc một specialty.
- Doctor chỉ nhận appointment cho services mà doctor phụ trách.
- V1 coi lịch `working` active theo `dayOfWeek` là lịch làm việc mặc định hàng tuần; nếu không có `leave` hợp lệ trước 7 ngày, bác sĩ được xem là có đi làm trong ngày đó.
- DoctorSchedule loại `blocked` hoặc `leave` làm doctor không khả dụng trong khoảng thời gian đó.
- Conflict checking cuối cùng thuộc trách nhiệm backend.

### Audit

- Các hành động tạo, reschedule, cancel, check-in, start, complete appointment phải ghi audit event.
- AuditEvent là append-only trong backend sau này.
- Frontend prototype có thể render audit từ `mock data`, nhưng không tự xem đó là security boundary.

### Auth Và Session

- Register, login, logout, refresh token, forgot password và reset password là workflows riêng của auth domain.
- Frontend chỉ hiển thị form và gửi request; backend chịu trách nhiệm hash password, issue token, revoke token và validate reset token.
- Role-based navigation trong frontend chỉ là UX. Backend vẫn phải enforce authorization.
- Session state trong frontend API mode nằm trong memory; mock mode dùng mock store và không lưu credential nhạy cảm.

## Hướng Dẫn Mock Data

Frontend MVP nên có bộ `mock data` tối thiểu:

- 4 users đại diện cho patient, doctor, receptionist/nurse và admin.
- 4 mock auth profiles tương ứng với các users này, không chứa plaintext password trong persisted mock data.
- 8-12 patients với trạng thái và lịch sử appointment khác nhau.
- 5-8 doctors thuộc 3-4 specialties.
- 8-12 services có duration và price khác nhau.
- 2 tuần doctor schedules để test calendar day/week.
- 30-50 appointments phủ đủ statuses.
- 20-30 audit events cho các flow quan trọng.
- 8-12 notifications cho appointment changes.

Mock data phải thể hiện được các trạng thái UI:

- Empty state.
- Loading state.
- Error state.
- Filter không có kết quả.
- Appointment conflict giả lập.
- Doctor không khả dụng.
- Mobile calendar/list view.

## Ghi Chú Backend Design

Khi chuyển sang backend phase, data model này cần được nâng cấp thành ERD/database schema. Các quyết định backend cần chốt riêng:

- Tách `User`, `Patient`, `Doctor`, `Staff` thành bảng riêng hay dùng profile inheritance.
- Tách auth fields khỏi `User` hay giữ cùng bảng.
- Thiết kế refresh token/session storage.
- Password hashing algorithm và policy.
- Dùng many-to-many table cho `DoctorService`.
- Thiết kế schedule recurrence.
- Transaction boundary cho appointment booking và reschedule.
- Index cho `doctorId`, `startAt`, `endAt`, `status`.
- Audit metadata format.
- Timezone strategy cho lịch khám ở Việt Nam.
