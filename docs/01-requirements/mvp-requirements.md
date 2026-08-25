# Yêu Cầu MVP

## Tổng Quan

MVP là ứng dụng vận hành phòng khám theo hướng frontend-first. Ứng dụng cần có interface thực tế, polished, dùng `mock data` trước, sau đó hỗ trợ tích hợp backend khi workflow đã được kiểm chứng.

## Vai Trò

- Patient
- Doctor
- Receptionist hoặc nurse
- Admin

## Yêu Cầu Chức Năng

### Patient

- Đăng ký và sign in thông qua simulated auth flow trong giai đoạn frontend-first.
- Xem các services và specialties đang có.
- Yêu cầu đặt appointment bằng cách chọn service, doctor hoặc specialty mong muốn, ngày và giờ.
- Xem appointments sắp tới và đã qua.
- Hủy lịch hoặc yêu cầu reschedule với appointments đủ điều kiện.

### Doctor

- Xem appointments trong ngày.
- Xem schedule theo ngày hoặc tuần.
- Filter appointments theo status.
- Mở chi tiết appointment.
- Đánh dấu appointment là `in_progress` hoặc `completed`.
- Thêm visit notes nhẹ, chỉ phục vụ internal mock workflow.

### Receptionist / Nurse

- Tạo appointments cho patients đã có hoặc patients mới.
- Check-in patients đã đến.
- Cập nhật appointment status.
- Reschedule hoặc cancel appointments.
- Xem appointments ở các trạng thái waiting, checked-in, in-progress, completed và cancelled.

### Admin

- Quản lý doctors.
- Quản lý specialties.
- Quản lý bookable services.
- Quản lý schedule settings cho staff.
- Xem dashboard metrics.

### Dashboard

- Hiển thị số lượng appointments trong ngày.
- Hiển thị số lượng waiting và checked-in.
- Hiển thị số lượng completed và cancelled.
- Hiển thị cancellation rate.
- Hiển thị common services.
- Hiển thị doctor workload summary.

### Audit Log

- Ghi lại các hành động quan trọng trên appointment.
- Hiển thị actor, action, timestamp và appointment bị ảnh hưởng.

## Yêu Cầu Dữ Liệu

Giai đoạn frontend-first cần dùng typed `mock data` cho:

- Users
- Patients
- Doctors
- Staff
- Services
- Specialties
- Appointments
- Schedules
- Audit events
- Notifications

## Ràng Buộc

- Không triển khai medical record management đầy đủ trong MVP.
- Không triển khai prescriptions, insurance, real payment hoặc telemedicine.
- Không lưu trữ hoặc xử lý dữ liệu y tế nhạy cảm ngoài lightweight mock notes trong giai đoạn prototype.
