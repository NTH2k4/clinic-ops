import {
  AppointmentStatus,
  NotificationType,
  PrismaClient,
  ScheduleType,
  UserRole,
} from "@prisma/client";

const prisma = new PrismaClient();

const baseDate = new Date("2026-08-24T00:00:00.000Z");

const specialties = [
  { id: "specialty-general", name: "General Medicine", description: "Primary care and general consultations." },
  { id: "specialty-cardiology", name: "Cardiology", description: "Heart and cardiovascular care." },
  { id: "specialty-pediatrics", name: "Pediatrics", description: "Medical care for children." },
];

const services = [
  { id: "service-general", name: "General Consultation", specialtyId: "specialty-general", durationMinutes: 30, price: 200000 },
  { id: "service-follow-up", name: "Follow-up Consultation", specialtyId: "specialty-general", durationMinutes: 20, price: 150000 },
  { id: "service-health-check", name: "Health Check", specialtyId: "specialty-general", durationMinutes: 45, price: 350000 },
  { id: "service-cardiac", name: "Cardiac Consultation", specialtyId: "specialty-cardiology", durationMinutes: 40, price: 500000 },
  { id: "service-ecg", name: "ECG Assessment", specialtyId: "specialty-cardiology", durationMinutes: 30, price: 300000 },
  { id: "service-heart-follow-up", name: "Heart Follow-up", specialtyId: "specialty-cardiology", durationMinutes: 30, price: 350000 },
  { id: "service-pediatric", name: "Pediatric Consultation", specialtyId: "specialty-pediatrics", durationMinutes: 30, price: 250000 },
  { id: "service-vaccination", name: "Vaccination Visit", specialtyId: "specialty-pediatrics", durationMinutes: 20, price: 180000 },
];

const doctors = [
  { id: "doctor-1", userId: "user-doctor-1", fullName: "Dr. Minh Nguyen", specialtyId: "specialty-general", phone: "+84900000001", email: "minh.nguyen@careflow.local", title: "MD", room: "A101", serviceIds: ["service-general", "service-follow-up", "service-health-check"] },
  { id: "doctor-2", fullName: "Dr. Lan Tran", specialtyId: "specialty-cardiology", phone: "+84900000002", email: "lan.tran@careflow.local", title: "MD", room: "B201", serviceIds: ["service-cardiac", "service-ecg", "service-heart-follow-up"] },
  { id: "doctor-3", fullName: "Dr. Quang Pham", specialtyId: "specialty-pediatrics", phone: "+84900000003", email: "quang.pham@careflow.local", title: "MD", room: "C301", serviceIds: ["service-pediatric", "service-vaccination"] },
  { id: "doctor-4", fullName: "Dr. Hoa Le", specialtyId: "specialty-general", phone: "+84900000004", email: "hoa.le@careflow.local", title: "MD", room: "A102", serviceIds: ["service-general", "service-follow-up"] },
  { id: "doctor-5", fullName: "Dr. Tuan Vo", specialtyId: "specialty-cardiology", phone: "+84900000005", email: "tuan.vo@careflow.local", title: "MD", room: "B202", serviceIds: ["service-cardiac", "service-ecg"] },
];

async function resetDatabase() {
  await prisma.auditEvent.deleteMany();
  await prisma.appointmentStatusHistory.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.doctorSchedule.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.service.deleteMany();
  await prisma.specialty.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  await resetDatabase();

  await prisma.user.createMany({
    data: [
      { id: "user-patient-1", displayName: "Patient Demo", email: "patient@careflow.local", phone: "+84910000001", role: UserRole.patient, status: "active" },
      { id: "user-doctor-1", displayName: "Dr. Minh Nguyen", email: "minh.nguyen@careflow.local", phone: "+84900000001", role: UserRole.doctor, status: "active" },
      { id: "user-receptionist-1", displayName: "Reception Demo", email: "reception@careflow.local", phone: "+84910000002", role: UserRole.receptionist, status: "active" },
      { id: "user-nurse-1", displayName: "Nurse Demo", email: "nurse@careflow.local", phone: "+84910000003", role: UserRole.nurse, status: "active" },
      { id: "user-admin-1", displayName: "Admin Demo", email: "admin@careflow.local", phone: "+84910000004", role: UserRole.admin, status: "active" },
    ],
  });

  await prisma.patient.createMany({
    data: Array.from({ length: 6 }, (_, index) => ({
      id: `patient-${index + 1}`,
      userId: index === 0 ? "user-patient-1" : undefined,
      fullName: index === 0 ? "Patient Demo" : `Demo Patient ${index + 1}`,
      phone: `+8492000000${index + 1}`,
      email: `patient${index + 1}@careflow.local`,
      dateOfBirth: new Date(Date.UTC(1985 + index, index, index + 1)),
      gender: index % 2 === 0 ? "female" : "male",
      address: "Ho Chi Minh City",
      status: "active",
    })),
  });

  await prisma.staff.createMany({
    data: [
      { id: "staff-receptionist-1", userId: "user-receptionist-1", fullName: "Reception Demo", phone: "+84910000002", email: "reception@careflow.local", role: UserRole.receptionist, status: "active" },
      { id: "staff-nurse-1", userId: "user-nurse-1", fullName: "Nurse Demo", phone: "+84910000003", email: "nurse@careflow.local", role: UserRole.nurse, status: "active" },
      { id: "staff-admin-1", userId: "user-admin-1", fullName: "Admin Demo", phone: "+84910000004", email: "admin@careflow.local", role: UserRole.admin, status: "active" },
    ],
  });

  await prisma.specialty.createMany({ data: specialties.map((specialty) => ({ ...specialty, status: "active" })) });
  await prisma.service.createMany({ data: services.map((service) => ({ ...service, currency: "VND", status: "active" })) });

  for (const doctor of doctors) {
    await prisma.doctor.create({
      data: {
        id: doctor.id,
        userId: doctor.userId,
        fullName: doctor.fullName,
        specialtyId: doctor.specialtyId,
        phone: doctor.phone,
        email: doctor.email,
        title: doctor.title,
        room: doctor.room,
        status: "active",
        services: { connect: doctor.serviceIds.map((id) => ({ id })) },
      },
    });
  }

  await prisma.doctorSchedule.createMany({
    data: doctors.flatMap((doctor) =>
      Array.from({ length: 10 }, (_, index) => {
        const date = new Date(baseDate);
        date.setUTCDate(baseDate.getUTCDate() + index + Math.floor(index / 5) * 2);
        return {
          id: `schedule-${doctor.id}-${index + 1}`,
          doctorId: doctor.id,
          dayOfWeek: ((index % 5) + 1),
          startTime: "08:00",
          endTime: "17:00",
          effectiveFrom: date,
          effectiveTo: date,
          type: ScheduleType.working,
          status: "active",
        };
      }),
    ),
  });

  const statuses = Object.values(AppointmentStatus);
  const appointments = Array.from({ length: 30 }, (_, index) => {
    const status = statuses[index % statuses.length];
    const startAt = new Date("2026-08-24T01:00:00.000Z");
    startAt.setUTCDate(startAt.getUTCDate() + Math.floor(index / 6));
    startAt.setUTCHours(1 + (index % 6) * 2);
    const endAt = new Date(startAt.getTime() + 30 * 60 * 1000);
    const terminalAt = new Date(endAt.getTime());

    return {
      id: `appointment-${index + 1}`,
      patientId: `patient-${(index % 6) + 1}`,
      doctorId: doctors[index % doctors.length].id,
      serviceId: doctors[index % doctors.length].serviceIds[index % doctors[index % doctors.length].serviceIds.length],
      startAt,
      endAt,
      status,
      reason: "Demo appointment",
      createdByUserId: index % 2 === 0 ? "user-patient-1" : "user-receptionist-1",
      updatedByUserId: status === AppointmentStatus.requested ? undefined : "user-receptionist-1",
      checkedInAt: status === AppointmentStatus.checked_in || status === AppointmentStatus.in_progress || status === AppointmentStatus.completed ? terminalAt : undefined,
      startedAt: status === AppointmentStatus.in_progress || status === AppointmentStatus.completed ? terminalAt : undefined,
      completedAt: status === AppointmentStatus.completed ? terminalAt : undefined,
      cancelledAt: status === AppointmentStatus.cancelled ? terminalAt : undefined,
      cancellationReason: status === AppointmentStatus.cancelled ? "Demo cancellation" : undefined,
    };
  });

  await prisma.appointment.createMany({ data: appointments });
  await prisma.appointmentStatusHistory.createMany({
    data: appointments.map((appointment) => ({
      id: `appointment-history-${appointment.id}`,
      appointmentId: appointment.id,
      toStatus: appointment.status,
      actorUserId: appointment.createdByUserId,
      note: "Seeded appointment status.",
      changedAt: appointment.startAt,
    })),
  });

  await prisma.auditEvent.createMany({
    data: appointments.slice(0, 20).map((appointment, index) => ({
      id: `audit-${index + 1}`,
      actorUserId: appointment.createdByUserId,
      appointmentId: appointment.id,
      entityType: "appointment",
      entityId: appointment.id,
      action: "appointment_created",
      timestamp: appointment.startAt,
      metadata: { seeded: true, status: appointment.status },
    })),
  });

  await prisma.notification.createMany({
    data: Array.from({ length: 8 }, (_, index) => ({
      id: `notification-${index + 1}`,
      recipientUserId: index % 2 === 0 ? "user-patient-1" : "user-receptionist-1",
      type: index % 2 === 0 ? NotificationType.appointment_confirmed : NotificationType.appointment_created,
      title: "Appointment update",
      message: `Appointment ${index + 1} has been updated.`,
      referenceType: "appointment",
      referenceId: `appointment-${index + 1}`,
      readAt: index < 2 ? new Date("2026-08-24T00:00:00.000Z") : undefined,
    })),
  });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
