# Appointment States

## States

- `requested`
- `confirmed`
- `checked_in`
- `in_progress`
- `completed`
- `cancelled`
- `no_show`

## Default Flow

```text
requested -> confirmed -> checked_in -> in_progress -> completed
```

## Alternate Flows

```text
requested -> cancelled
confirmed -> cancelled
confirmed -> no_show
checked_in -> cancelled
```

## Rules

- Completed appointments cannot be edited in the MVP.
- Cancelled appointments remain visible in history.
- Rescheduling keeps the same appointment record and writes an audit event.
- Status changes should include actor and timestamp.
