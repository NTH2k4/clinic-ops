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

## Luồng Tiếp Nhận Trực Tiếp

1. Patient đến quầy và đọc CCCD, BHYT hoặc thông tin định danh thay thế.
2. Receptionist tìm hồ sơ bằng CCCD/BHYT; nếu chưa có thì nhập thông tin trên giấy tờ hoặc thông tin người giám hộ.
3. Receptionist chọn dịch vụ khám.
4. System tìm phòng/bác sĩ đang trống hoặc có hàng đợi ít nhất.
5. Nếu còn dưới 5 phút tới lúc chuyển ca, system chỉ nhận ngay khi cùng bác sĩ tiếp tục ca liền sau; nếu không thì chuyển sang ca kế tiếp phù hợp.
6. Receptionist xác nhận xếp hàng.
7. System tạo appointment `checked_in`, ghi thời điểm check-in và audit event.

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
