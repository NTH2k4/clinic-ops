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
