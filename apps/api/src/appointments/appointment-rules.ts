import { AppointmentStatus, UserRole } from "@prisma/client";

const transitions: Readonly<Record<AppointmentStatus, Readonly<Partial<Record<AppointmentStatus, readonly UserRole[]>>>>> = {
  requested: {
    confirmed: [UserRole.receptionist, UserRole.nurse, UserRole.admin],
    cancelled: [UserRole.patient, UserRole.receptionist, UserRole.nurse, UserRole.admin],
  },
  confirmed: {
    checked_in: [UserRole.receptionist, UserRole.nurse, UserRole.admin],
    cancelled: [UserRole.patient, UserRole.receptionist, UserRole.nurse, UserRole.admin],
    no_show: [UserRole.receptionist, UserRole.nurse, UserRole.admin],
  },
  checked_in: {
    in_progress: [UserRole.doctor],
    cancelled: [UserRole.receptionist, UserRole.nurse, UserRole.admin],
  },
  in_progress: { completed: [UserRole.doctor] },
  completed: {},
  cancelled: {},
  no_show: {},
};

export function canTransition(from: AppointmentStatus, to: AppointmentStatus, role: UserRole) {
  return transitions[from][to]?.includes(role) ?? false;
}
