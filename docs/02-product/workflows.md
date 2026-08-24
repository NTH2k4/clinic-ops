# Workflows

## Patient Appointment Request

1. Patient selects service or specialty.
2. Patient selects doctor or chooses any available doctor.
3. Patient selects date and time.
4. System creates an appointment request.
5. Appointment appears in patient view and staff queue.

## Reception Booking

1. Receptionist searches or creates patient.
2. Receptionist selects service, doctor, date, and time.
3. System creates appointment.
4. Appointment appears on clinic schedule.

## Check-In Flow

1. Patient arrives.
2. Receptionist marks appointment as checked in.
3. Appointment enters waiting queue.
4. Doctor starts appointment.
5. Doctor completes appointment.

## Reschedule Flow

1. Patient or staff requests reschedule.
2. Staff selects new slot.
3. System updates appointment date and time.
4. Audit log records previous and new schedule.

## Cancellation Flow

1. Patient or staff cancels appointment.
2. System marks appointment cancelled.
3. Dashboard and schedule counts update.
4. Audit log records cancellation.
