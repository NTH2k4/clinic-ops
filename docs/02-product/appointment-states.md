# Trạng Thái Appointment

## Trạng Thái

- `requested`
- `confirmed`
- `checked_in`
- `in_progress`
- `completed`
- `cancelled`
- `no_show`

## Luồng Mặc Định

```text
requested -> confirmed -> checked_in -> in_progress -> completed
```

## Luồng Thay Thế

```text
requested -> cancelled
confirmed -> cancelled
confirmed -> no_show
checked_in -> cancelled
```

## Quy Tắc

- Appointments đã `completed` không được chỉnh sửa trong MVP.
- Appointments đã `cancelled` vẫn hiển thị trong history.
- Rescheduling giữ nguyên appointment record và ghi một audit event.
- Status change cần có actor và timestamp.

## UI Vận Hành

- Patient-created appointments hiển thị ở `Chờ xác nhận`.
- Operations Queue hiển thị lane `Chờ xác nhận` để receptionist, nurse hoặc admin xác nhận lịch.
- Sau khi `requested -> confirmed`, lịch chuyển sang lane `Đã xác nhận` để tiếp tục check-in.
- Operations Calendar có thể lọc `Chờ xác nhận`, `Đã xác nhận`, `Đã check-in`, `Đang khám`, `Hoàn tất`, `Đã hủy` và `Không đến`.
- Doctor workspace tiếp tục xử lý phần khám: `checked_in -> in_progress -> completed`.
