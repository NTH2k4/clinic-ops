export type UserRole = "patient" | "doctor" | "receptionist" | "nurse" | "admin";

export type AppointmentStatus =
  | "requested"
  | "confirmed"
  | "checked_in"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export type UserStatus = "active" | "inactive" | "locked";
export type PatientStatus = "active" | "inactive";
export type DoctorStatus = "active" | "inactive" | "on_leave";
export type ServiceStatus = "active" | "inactive";
export type ScheduleType = "working" | "blocked" | "leave";
export type ScheduleStatus = "active" | "inactive";
export type Gender = "female" | "male" | "other" | "prefer_not_to_say";
export type NotificationType =
  | "appointment_created"
  | "appointment_confirmed"
  | "appointment_rescheduled"
  | "appointment_cancelled"
  | "appointment_checked_in"
  | "appointment_completed"
  | "system";
export type ReferenceType = "appointment" | "doctor_schedule" | "audit_event";
export type AuditEntityType = "appointment" | "patient" | "doctor" | "service" | "schedule" | "user";

export interface User {
  id: string;
  displayName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: string;
  userId?: string;
  fullName: string;
  phone: string;
  email?: string;
  dateOfBirth: string;
  gender: Gender;
  address?: string;
  notes?: string;
  status: PatientStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Staff {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  role: Extract<UserRole, "receptionist" | "nurse" | "admin">;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  id: string;
  userId?: string;
  fullName: string;
  specialtyId: string;
  serviceIds: string[];
  phone: string;
  email: string;
  title: string;
  room: string;
  status: DoctorStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Specialty {
  id: string;
  name: string;
  description: string;
  status: ServiceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  name: string;
  specialtyId: string;
  durationMinutes: number;
  price: number;
  currency: string;
  description: string;
  status: ServiceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorSchedule {
  id: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  effectiveFrom: string;
  effectiveTo: string;
  type: ScheduleType;
  status: ScheduleStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  serviceId: string;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  reason?: string;
  internalNote?: string;
  cancellationReason?: string;
  createdByUserId: string;
  updatedByUserId?: string;
  checkedInAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
  patient?: Patient;
  statusHistory?: AppointmentStatusHistory[];
}

export interface AppointmentStatusHistory {
  id: string;
  appointmentId: string;
  fromStatus?: AppointmentStatus;
  toStatus: AppointmentStatus;
  actorUserId: string;
  note?: string;
  changedAt: string;
}

export interface Notification {
  id: string;
  recipientUserId: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceType?: ReferenceType;
  referenceId?: string;
  readAt?: string;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  actorUserId: string;
  actorDisplayName?: string;
  entityType: AuditEntityType;
  entityId: string;
  entityDisplayName?: string;
  action: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
