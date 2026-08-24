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

## Core Entities

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

Relationships:

- Một `User` có thể liên kết với một `Patient`, `Staff` hoặc `Doctor` tùy vai trò.
- `role` quyết định navigation và actions hiển thị trong frontend prototype.

### Patient

Hồ sơ người đặt lịch hoặc người được khám.

- id
- userId
- fullName
- phone
- email
- dateOfBirth
- gender
- address
- notes
- status
- createdAt
- updatedAt

Relationships:

- Một `Patient` có nhiều `Appointment`.
- `userId` có thể rỗng trong trường hợp receptionist tạo patient cho walk-in hoặc đặt lịch qua điện thoại.

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

Relationships:

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

Relationships:

- Một `Doctor` thuộc một `Specialty`.
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

Relationships:

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

Relationships:

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

Relationships:

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

Relationships:

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

Relationships:

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

Relationships:

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

Relationships:

- Một `AuditEvent` do một `User` tạo ra thông qua hành động trên hệ thống.
- `entityType` có thể là `appointment`, `patient`, `doctor`, `service`, `schedule`, `user`.

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

## Relationship Summary

```text
User 1--0..1 Patient
User 1--0..1 Staff
User 1--0..1 Doctor

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

## Business Rules

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

### Doctor And Schedule

- Doctor phải thuộc một specialty.
- Doctor chỉ nhận appointment cho services mà doctor phụ trách.
- DoctorSchedule loại `blocked` hoặc `leave` làm doctor không khả dụng trong khoảng thời gian đó.
- Conflict checking cuối cùng thuộc trách nhiệm backend.

### Audit

- Các hành động tạo, reschedule, cancel, check-in, start, complete appointment phải ghi audit event.
- AuditEvent là append-only trong backend sau này.
- Frontend prototype có thể render audit từ `mock data`, nhưng không tự xem đó là security boundary.

## Mock Data Guidance

Frontend MVP nên có bộ `mock data` tối thiểu:

- 4 users đại diện cho patient, doctor, receptionist/nurse và admin.
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

## Backend Design Notes

Khi chuyển sang backend phase, data model này cần được nâng cấp thành ERD/database schema. Các quyết định backend cần chốt riêng:

- Tách `User`, `Patient`, `Doctor`, `Staff` thành bảng riêng hay dùng profile inheritance.
- Dùng many-to-many table cho `DoctorService`.
- Thiết kế schedule recurrence.
- Transaction boundary cho appointment booking và reschedule.
- Index cho `doctorId`, `startAt`, `endAt`, `status`.
- Audit metadata format.
- Timezone strategy cho lịch khám ở Việt Nam.
