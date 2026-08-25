import type {
  Appointment,
  AppointmentStatus,
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

const createdAt = "2026-08-01T08:00:00+07:00";
const updatedAt = "2026-08-24T16:00:00+07:00";

export const users: User[] = [
  { id: "user-patient-1", displayName: "Nguyen Minh Anh", email: "minh.anh@example.com", phone: "0901000001", role: "patient", status: "active", createdAt, updatedAt },
  { id: "user-doctor-1", displayName: "BS. Tran Quang Huy", email: "quang.huy@careflow.vn", phone: "0901000002", role: "doctor", status: "active", createdAt, updatedAt },
  { id: "user-receptionist-1", displayName: "Le Thu Ha", email: "thu.ha@careflow.vn", phone: "0901000003", role: "receptionist", status: "active", createdAt, updatedAt },
  { id: "user-admin-1", displayName: "Pham Gia Bao", email: "gia.bao@careflow.vn", phone: "0901000004", role: "admin", status: "active", createdAt, updatedAt },
];

export const specialties: Specialty[] = [
  { id: "specialty-general", name: "Nội tổng quát", description: "Khám và tư vấn sức khỏe tổng quát.", status: "active", createdAt, updatedAt },
  { id: "specialty-cardiology", name: "Tim mạch", description: "Khám, tư vấn và theo dõi tim mạch.", status: "active", createdAt, updatedAt },
  { id: "specialty-pediatrics", name: "Nhi khoa", description: "Chăm sóc sức khỏe cho trẻ em.", status: "active", createdAt, updatedAt },
  { id: "specialty-dermatology", name: "Da liễu", description: "Khám và điều trị các bệnh da liễu.", status: "active", createdAt, updatedAt },
];

export const services: Service[] = [
  { id: "service-general-consult", name: "Khám tổng quát", specialtyId: "specialty-general", durationMinutes: 30, price: 250000, currency: "VND", description: "Khám sức khỏe ban đầu.", status: "active", createdAt, updatedAt },
  { id: "service-health-check", name: "Tư vấn sức khỏe", specialtyId: "specialty-general", durationMinutes: 45, price: 350000, currency: "VND", description: "Tư vấn kế hoạch chăm sóc sức khỏe.", status: "active", createdAt, updatedAt },
  { id: "service-cardiology-consult", name: "Khám tim mạch", specialtyId: "specialty-cardiology", durationMinutes: 30, price: 400000, currency: "VND", description: "Khám chuyên khoa tim mạch.", status: "active", createdAt, updatedAt },
  { id: "service-ecg", name: "Điện tâm đồ", specialtyId: "specialty-cardiology", durationMinutes: 30, price: 300000, currency: "VND", description: "Đo điện tâm đồ tại phòng khám.", status: "active", createdAt, updatedAt },
  { id: "service-pediatric-consult", name: "Khám nhi", specialtyId: "specialty-pediatrics", durationMinutes: 30, price: 280000, currency: "VND", description: "Khám sức khỏe cho trẻ em.", status: "active", createdAt, updatedAt },
  { id: "service-vaccination-consult", name: "Tư vấn tiêm chủng", specialtyId: "specialty-pediatrics", durationMinutes: 20, price: 150000, currency: "VND", description: "Tư vấn lịch tiêm phù hợp.", status: "active", createdAt, updatedAt },
  { id: "service-dermatology-consult", name: "Khám da liễu", specialtyId: "specialty-dermatology", durationMinutes: 30, price: 350000, currency: "VND", description: "Khám các vấn đề về da.", status: "active", createdAt, updatedAt },
  { id: "service-skin-care", name: "Tư vấn chăm sóc da", specialtyId: "specialty-dermatology", durationMinutes: 45, price: 300000, currency: "VND", description: "Tư vấn quy trình chăm sóc da.", status: "active", createdAt, updatedAt },
];

export const doctors: Doctor[] = [
  { id: "doctor-1", userId: "user-doctor-1", fullName: "BS. Tran Quang Huy", specialtyId: "specialty-general", serviceIds: ["service-general-consult", "service-health-check"], phone: "0902000001", email: "quang.huy@careflow.vn", title: "Bác sĩ chuyên khoa I", room: "P.101", status: "active", createdAt, updatedAt },
  { id: "doctor-2", fullName: "BS. Nguyen Thanh Mai", specialtyId: "specialty-cardiology", serviceIds: ["service-cardiology-consult", "service-ecg"], phone: "0902000002", email: "thanh.mai@careflow.vn", title: "Bác sĩ chuyên khoa II", room: "P.201", status: "active", createdAt, updatedAt },
  { id: "doctor-3", fullName: "BS. Vo Minh Chau", specialtyId: "specialty-pediatrics", serviceIds: ["service-pediatric-consult", "service-vaccination-consult"], phone: "0902000003", email: "minh.chau@careflow.vn", title: "Bác sĩ nhi khoa", room: "P.301", status: "active", createdAt, updatedAt },
  { id: "doctor-4", fullName: "BS. Do Phuong Linh", specialtyId: "specialty-dermatology", serviceIds: ["service-dermatology-consult", "service-skin-care"], phone: "0902000004", email: "phuong.linh@careflow.vn", title: "Bác sĩ da liễu", room: "P.401", status: "active", createdAt, updatedAt },
  { id: "doctor-5", fullName: "BS. Bui Hoang Nam", specialtyId: "specialty-general", serviceIds: ["service-general-consult"], phone: "0902000005", email: "hoang.nam@careflow.vn", title: "Bác sĩ đa khoa", room: "P.102", status: "on_leave", createdAt, updatedAt },
];

export const patients: Patient[] = [
  { id: "patient-1", userId: "user-patient-1", fullName: "Nguyen Minh Anh", phone: "0901000001", email: "minh.anh@example.com", dateOfBirth: "1992-04-18", gender: "female", status: "active", createdAt, updatedAt },
  { id: "patient-2", fullName: "Tran Duc Long", phone: "0903000002", dateOfBirth: "1988-08-09", gender: "male", status: "active", createdAt, updatedAt },
  { id: "patient-3", fullName: "Le Ngoc Han", phone: "0903000003", dateOfBirth: "1995-01-30", gender: "female", status: "active", createdAt, updatedAt },
  { id: "patient-4", fullName: "Pham Gia Khang", phone: "0903000004", dateOfBirth: "2018-05-12", gender: "male", status: "active", createdAt, updatedAt },
  { id: "patient-5", fullName: "Do Bao Tram", phone: "0903000005", dateOfBirth: "1984-11-21", gender: "female", status: "active", createdAt, updatedAt },
  { id: "patient-6", fullName: "Vo Thanh Son", phone: "0903000006", dateOfBirth: "1979-02-03", gender: "male", status: "active", createdAt, updatedAt },
  { id: "patient-7", fullName: "Bui My Duyen", phone: "0903000007", dateOfBirth: "2000-07-16", gender: "female", status: "active", createdAt, updatedAt },
  { id: "patient-8", fullName: "Hoang Tuan Kiet", phone: "0903000008", dateOfBirth: "1990-09-28", gender: "male", status: "active", createdAt, updatedAt },
];

export const staff: Staff[] = [
  { id: "staff-receptionist-1", userId: "user-receptionist-1", fullName: "Le Thu Ha", phone: "0901000003", email: "thu.ha@careflow.vn", role: "receptionist", status: "active", createdAt, updatedAt },
  { id: "staff-admin-1", userId: "user-admin-1", fullName: "Pham Gia Bao", phone: "0901000004", email: "gia.bao@careflow.vn", role: "admin", status: "active", createdAt, updatedAt },
];

const scheduleWeeks = [
  { effectiveFrom: "2026-08-24", effectiveTo: "2026-08-30" },
  { effectiveFrom: "2026-08-31", effectiveTo: "2026-09-06" },
];

export const doctorSchedules: DoctorSchedule[] = doctors.flatMap((doctor) =>
  scheduleWeeks.flatMap((week, weekIndex) =>
    [1, 2, 3, 4, 5].map((dayOfWeek) => ({
      id: `schedule-${doctor.id}-${weekIndex + 1}-${dayOfWeek}`,
      doctorId: doctor.id,
      dayOfWeek,
      startTime: "08:00",
      endTime: "17:00",
      ...week,
      type: doctor.id === "doctor-5" ? "leave" : "working",
      status: "active",
      createdAt,
      updatedAt,
    })),
  ),
);

const appointmentStatuses: AppointmentStatus[] = [
  "requested",
  "confirmed",
  "checked_in",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
];

function createAppointment(index: number, status: AppointmentStatus): Appointment {
  const doctorIndex = index % 4;
  const doctorAppointmentIndex = Math.floor(index / 4);
  const day = String(25 + Math.floor(doctorAppointmentIndex / 8)).padStart(2, "0");
  const startMinutes = 8 * 60 + (doctorAppointmentIndex % 8) * 30;
  const endMinutes = startMinutes + 30;
  const hour = String(Math.floor(startMinutes / 60)).padStart(2, "0");
  const minute = String(startMinutes % 60).padStart(2, "0");
  const endHour = String(Math.floor(endMinutes / 60)).padStart(2, "0");
  const endMinute = String(endMinutes % 60).padStart(2, "0");
  const startAt = `2026-08-${day}T${hour}:${minute}:00+07:00`;
  const endAt = `2026-08-${day}T${endHour}:${endMinute}:00+07:00`;

  return {
    id: `appointment-${index + 1}`,
    patientId: patients[index % patients.length].id,
    doctorId: doctors[doctorIndex].id,
    serviceId: doctors[doctorIndex].serviceIds[index % 2],
    startAt,
    endAt,
    status,
    reason: "Khám và tư vấn theo lịch hẹn.",
    createdByUserId: index % 2 === 0 ? "user-patient-1" : "user-receptionist-1",
    updatedByUserId: "user-receptionist-1",
    ...(status === "checked_in" ? { checkedInAt: startAt } : {}),
    ...(status === "in_progress" ? { checkedInAt: startAt, startedAt: startAt } : {}),
    ...(status === "completed" ? { checkedInAt: startAt, startedAt: startAt, completedAt: endAt } : {}),
    ...(status === "cancelled" ? { cancellationReason: "Bệnh nhân đổi lịch.", cancelledAt: startAt } : {}),
    createdAt,
    updatedAt,
  };
}

export const appointments: Appointment[] = Array.from({ length: 35 }, (_, index) =>
  createAppointment(index, appointmentStatuses[index % appointmentStatuses.length]),
);

export const appointmentConflictFixture = {
  existing: {
    ...appointments[0],
    id: "appointment-conflict-existing",
    doctorId: "doctor-1",
    startAt: "2026-08-25T09:00:00+07:00",
    endAt: "2026-08-25T09:30:00+07:00",
    status: "confirmed" as const,
  },
  candidate: {
    ...appointments[1],
    id: "appointment-conflict-candidate",
    doctorId: "doctor-1",
    startAt: "2026-08-25T09:15:00+07:00",
    endAt: "2026-08-25T09:45:00+07:00",
    status: "requested" as const,
  },
};

export const auditEvents: AuditEvent[] = Array.from({ length: 20 }, (_, index) => ({
  id: `audit-event-${index + 1}`,
  actorUserId: index % 2 === 0 ? "user-receptionist-1" : "user-doctor-1",
  entityType: "appointment",
  entityId: appointments[index].id,
  action: index % 2 === 0 ? "appointment_updated" : "appointment_status_changed",
  timestamp: `2026-08-${String(20 + (index % 5)).padStart(2, "0")}T09:00:00+07:00`,
  metadata: { source: "fixture" },
}));

export const notifications: Notification[] = Array.from({ length: 8 }, (_, index) => ({
  id: `notification-${index + 1}`,
  recipientUserId: index % 2 === 0 ? "user-patient-1" : "user-doctor-1",
  type: index % 2 === 0 ? "appointment_confirmed" : "appointment_created",
  title: index % 2 === 0 ? "Lịch hẹn đã được xác nhận" : "Có lịch hẹn mới",
  message: "Vui lòng kiểm tra thông tin lịch hẹn trong CareFlow.",
  referenceType: "appointment",
  referenceId: appointments[index].id,
  createdAt: `2026-08-24T${String(9 + index).padStart(2, "0")}:00:00+07:00`,
}));
