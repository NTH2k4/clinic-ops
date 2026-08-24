# MVP Requirements

## Overview

The MVP is a frontend-first clinic operations application. It should provide a realistic, polished interface using mock data first, then support backend integration after workflows are validated.

## Roles

- Patient
- Doctor
- Receptionist or nurse
- Admin

## Functional Requirements

### Patient

- Register and sign in through a simulated auth flow during the frontend-first phase.
- Browse available services and specialties.
- Request an appointment by selecting service, preferred doctor or specialty, date, and time.
- View upcoming and past appointments.
- Cancel or request reschedule for eligible appointments.

### Doctor

- View today's appointments.
- View schedule by day or week.
- Filter appointments by status.
- Open appointment details.
- Mark appointment as in progress or completed.
- Add lightweight visit notes for internal mock workflow only.

### Receptionist / Nurse

- Create appointments for existing or new patients.
- Check in arrived patients.
- Update appointment status.
- Reschedule or cancel appointments.
- View waiting, checked-in, in-progress, completed, and cancelled appointments.

### Admin

- Manage doctors.
- Manage specialties.
- Manage bookable services.
- Manage staff-facing schedule settings.
- View dashboard metrics.

### Dashboard

- Show today's appointment count.
- Show waiting and checked-in counts.
- Show completed and cancelled counts.
- Show cancellation rate.
- Show common services.
- Show doctor workload summary.

### Audit Log

- Record important appointment actions.
- Show actor, action, timestamp, and affected appointment.

## Data Requirements

The frontend-first phase should use typed mock data for:

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

## Constraints

- Do not implement full medical record management in the MVP.
- Do not implement prescriptions, insurance, real payment, or telemedicine.
- Do not store or process sensitive medical data beyond lightweight mock notes during the prototype phase.
