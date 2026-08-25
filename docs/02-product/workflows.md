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

## Luồng Cancellation

1. Patient hoặc staff cancel appointment.
2. System đánh dấu appointment là cancelled.
3. Dashboard và schedule counts được cập nhật.
4. Audit log ghi lại cancellation.
