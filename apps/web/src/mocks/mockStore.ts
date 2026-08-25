import {
  appointments,
  auditEvents,
  doctorSchedules,
  doctors,
  notifications,
  patients,
  services,
  specialties,
  staff,
  users,
} from "./fixtures";
import type {
  Appointment,
  AuditEvent,
  Doctor,
  DoctorSchedule,
  Notification,
  Patient,
  Service,
  Specialty,
  Staff,
  User,
} from "../types/models";

interface MockStore {
  appointments: Appointment[];
  auditEvents: AuditEvent[];
  doctorSchedules: DoctorSchedule[];
  doctors: Doctor[];
  notifications: Notification[];
  patients: Patient[];
  services: Service[];
  specialties: Specialty[];
  staff: Staff[];
  users: User[];
  reset(): void;
}

function cloneFixtures() {
  return structuredClone({
    appointments,
    auditEvents,
    doctorSchedules,
    doctors,
    notifications,
    patients,
    services,
    specialties,
    staff,
    users,
  });
}

const initialStore = cloneFixtures();

export const mockStore: MockStore = {
  ...initialStore,
  reset() {
    Object.assign(this, cloneFixtures());
  },
};
