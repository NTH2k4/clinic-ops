# Luồng Nghiệp Vụ

## Patient Request Appointment

1. Patient chọn service hoặc specialty.
2. Patient chọn doctor hoặc chọn bất kỳ doctor còn lịch trống.
3. Patient chọn ngày và giờ.
4. System tạo appointment request.
5. Appointment xuất hiện trong patient view và staff queue.

## Reception Booking

1. Receptionist tìm kiếm hoặc tạo patient.
2. Receptionist chọn service, doctor, ngày và giờ.
3. System tạo appointment.
4. Appointment xuất hiện trên clinic schedule.

## Luồng Check-In

1. Patient đến phòng khám.
2. Receptionist đánh dấu appointment là checked in.
3. Appointment đi vào waiting queue.
4. Doctor bắt đầu appointment.
5. Doctor hoàn tất appointment.

## Luồng Reschedule

1. Patient hoặc staff yêu cầu reschedule.
2. Staff chọn slot mới.
3. System cập nhật ngày và giờ của appointment.
4. Audit log ghi lại schedule cũ và mới.

## Luồng Quản Lý Lịch Bác Sĩ

1. Admin mở schedule management trong admin workspace.
2. Admin lọc theo bác sĩ hoặc khoảng ngày hiệu lực.
3. Admin tạo hoặc sửa working schedule, blocked interval hoặc leave period.
4. System validate khoảng giờ, khoảng ngày và appointment conflict.
5. System ghi audit event cho create/update/deactivate schedule.
6. Operations staff thấy availability mới khi tạo appointment.

## Luồng Giải Thích Slot Không Khả Dụng

1. Operations staff chọn service, bác sĩ và ngày khám.
2. System lấy availability explanation từ backend ở API mode.
3. UI hiển thị slot còn trống và slot không khả dụng cùng lý do.
4. Staff chỉ có thể chọn slot còn trống.
5. Backend vẫn kiểm tra conflict lần cuối khi staff tạo appointment.

## Luồng Cancellation

1. Patient hoặc staff cancel appointment.
2. System đánh dấu appointment là cancelled.
3. Dashboard và schedule counts được cập nhật.
4. Audit log ghi lại cancellation.
