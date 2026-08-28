import { Injectable, Logger, type OnApplicationBootstrap } from "@nestjs/common";
import {
  AccountStatus,
  DoctorStatus,
  type PrismaClient,
  ScheduleType,
  ServiceStatus,
  UserRole,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

const demoPasswordHash = "$2a$10$Gfgzco0n8DMTE/AqMyfb.ekoNCRoI6QlhM88/1a.dgKwKEkX.Xmwi";
const actorPasswordHashes = {
  admin: "$2a$10$EOKY5iWR8UI8ftp2vl9pAO3485jRiJ0NfnXJ1wWZnAy5MRwwiTQfm",
  doctor: "$2a$10$UvwQzfKl8mXjuxm04YwDWesgd46cnfcQcNWGc/tUl4YL/d/bvtaia",
  receptionist: "$2a$10$DIWO8Tb2FJByP00Ab7Iom./HaHe9Uqy5FQDxFBfL3YGe0NzMZgDfG",
  nurse: "$2a$10$U/08FelonbOUNnc96C5Bhe7UCYQT3ythDIAmKNg/vzU1kAECWyXyi",
  patient: "$2a$10$2n8VSO9/Uc2ovmo.Asgklu6AnKtDVTLUpxXe7gqs4AGSMsu1b734m",
};
const seedTimestamp = new Date("2026-08-01T00:00:00.000Z");
const baseDate = new Date("2026-08-24T00:00:00.000Z");

const demoUsers = [
  {
    id: "user-patient-1",
    displayName: "Patient Demo",
    email: "patient@careflow.local",
    phone: "+84910000001",
    role: UserRole.patient,
    passwordHash: demoPasswordHash,
  },
  {
    id: "user-doctor-1",
    displayName: "Dr. Minh Nguyen",
    email: "minh.nguyen@careflow.local",
    phone: "+84900000001",
    role: UserRole.doctor,
    passwordHash: demoPasswordHash,
  },
  {
    id: "user-receptionist-1",
    displayName: "Reception Demo",
    email: "reception@careflow.local",
    phone: "+84910000002",
    role: UserRole.receptionist,
    passwordHash: demoPasswordHash,
  },
  {
    id: "user-nurse-1",
    displayName: "Nurse Demo",
    email: "nurse@careflow.local",
    phone: "+84910000003",
    role: UserRole.nurse,
    passwordHash: demoPasswordHash,
  },
  {
    id: "user-admin-1",
    displayName: "Admin Demo",
    email: "admin@careflow.local",
    phone: "+84910000004",
    role: UserRole.admin,
    passwordHash: demoPasswordHash,
  },
  {
    id: "user-admin-test",
    displayName: "Admin Test",
    email: "admin@test.com",
    phone: "+84910000104",
    role: UserRole.admin,
    passwordHash: actorPasswordHashes.admin,
  },
  {
    id: "user-doctor-test",
    displayName: "Doctor Test",
    email: "doctor@test.com",
    phone: "+84910000101",
    role: UserRole.doctor,
    passwordHash: actorPasswordHashes.doctor,
  },
  {
    id: "user-receptionist-test",
    displayName: "Receptionist Test",
    email: "receptionist@test.com",
    phone: "+84910000102",
    role: UserRole.receptionist,
    passwordHash: actorPasswordHashes.receptionist,
  },
  {
    id: "user-nurse-test",
    displayName: "Nurse Test",
    email: "nurse@test.com",
    phone: "+84910000103",
    role: UserRole.nurse,
    passwordHash: actorPasswordHashes.nurse,
  },
  {
    id: "user-patient-test",
    displayName: "Patient Test",
    email: "patient@test.com",
    phone: "+84910000100",
    role: UserRole.patient,
    passwordHash: actorPasswordHashes.patient,
  },
];

const demoSpecialties = [
  { id: "specialty-general", name: "General Medicine", description: "Primary care and general consultations." },
  { id: "specialty-cardiology", name: "Cardiology", description: "Heart and cardiovascular care." },
  { id: "specialty-pediatrics", name: "Pediatrics", description: "Medical care for children." },
];

const demoServices = [
  { id: "service-general", name: "General Consultation", specialtyId: "specialty-general", durationMinutes: 30, price: 200000 },
  { id: "service-follow-up", name: "Follow-up Consultation", specialtyId: "specialty-general", durationMinutes: 20, price: 150000 },
  { id: "service-health-check", name: "Health Check", specialtyId: "specialty-general", durationMinutes: 45, price: 350000 },
  { id: "service-cardiac", name: "Cardiac Consultation", specialtyId: "specialty-cardiology", durationMinutes: 40, price: 500000 },
  { id: "service-ecg", name: "ECG Assessment", specialtyId: "specialty-cardiology", durationMinutes: 30, price: 300000 },
  { id: "service-heart-follow-up", name: "Heart Follow-up", specialtyId: "specialty-cardiology", durationMinutes: 30, price: 350000 },
  { id: "service-pediatric", name: "Pediatric Consultation", specialtyId: "specialty-pediatrics", durationMinutes: 30, price: 250000 },
  { id: "service-vaccination", name: "Vaccination Visit", specialtyId: "specialty-pediatrics", durationMinutes: 20, price: 180000 },
];

const demoDoctors = [
  { id: "doctor-1", userId: "user-doctor-1", fullName: "Dr. Minh Nguyen", specialtyId: "specialty-general", phone: "+84900000001", email: "minh.nguyen@careflow.local", title: "MD", room: "A101", serviceIds: ["service-general", "service-follow-up", "service-health-check"] },
  { id: "doctor-2", fullName: "Dr. Lan Tran", specialtyId: "specialty-cardiology", phone: "+84900000002", email: "lan.tran@careflow.local", title: "MD", room: "B201", serviceIds: ["service-cardiac", "service-ecg", "service-heart-follow-up"] },
  { id: "doctor-3", fullName: "Dr. Quang Pham", specialtyId: "specialty-pediatrics", phone: "+84900000003", email: "quang.pham@careflow.local", title: "MD", room: "C301", serviceIds: ["service-pediatric", "service-vaccination"] },
  { id: "doctor-4", fullName: "Dr. Hoa Le", specialtyId: "specialty-general", phone: "+84900000004", email: "hoa.le@careflow.local", title: "MD", room: "A102", serviceIds: ["service-general", "service-follow-up"] },
  { id: "doctor-5", fullName: "Dr. Tuan Vo", specialtyId: "specialty-cardiology", phone: "+84900000005", email: "tuan.vo@careflow.local", title: "MD", room: "B202", serviceIds: ["service-cardiac", "service-ecg"] },
  { id: "doctor-test", userId: "user-doctor-test", fullName: "Doctor Test", specialtyId: "specialty-general", phone: "+84900000006", email: "doctor@test.com", title: "MD", room: "A103", serviceIds: ["service-general", "service-follow-up", "service-health-check"] },
];

const demoStaff = [
  { id: "staff-receptionist-1", userId: "user-receptionist-1", fullName: "Reception Demo", phone: "+84910000002", email: "reception@careflow.local", role: UserRole.receptionist },
  { id: "staff-nurse-1", userId: "user-nurse-1", fullName: "Nurse Demo", phone: "+84910000003", email: "nurse@careflow.local", role: UserRole.nurse },
  { id: "staff-admin-1", userId: "user-admin-1", fullName: "Admin Demo", phone: "+84910000004", email: "admin@careflow.local", role: UserRole.admin },
  { id: "staff-receptionist-test", userId: "user-receptionist-test", fullName: "Receptionist Test", phone: "+84910000102", email: "receptionist@test.com", role: UserRole.receptionist },
  { id: "staff-nurse-test", userId: "user-nurse-test", fullName: "Nurse Test", phone: "+84910000103", email: "nurse@test.com", role: UserRole.nurse },
  { id: "staff-admin-test", userId: "user-admin-test", fullName: "Admin Test", phone: "+84910000104", email: "admin@test.com", role: UserRole.admin },
];

const demoPatients = [
  { id: "patient-test", userId: "user-patient-test", fullName: "Patient Test", phone: "+84920000100", email: "patient@test.com" },
  ...Array.from({ length: 10 }, (_, index) => ({
    id: `patient-${index + 1}`,
    userId: index === 0 ? "user-patient-1" : undefined,
    fullName: index === 0 ? "Patient Demo" : `Demo Patient ${index + 1}`,
    phone: `+849200000${String(index + 1).padStart(2, "0")}`,
    email: `patient${index + 1}@careflow.local`,
  })),
].map((patient, index) => ({
  ...patient,
  dateOfBirth: new Date(Date.UTC(1985 + index, index % 12, (index % 28) + 1)),
  gender: index % 2 === 0 ? "female" : "male",
  address: "Ho Chi Minh City",
}));

export function shouldRepairDemoAuthUsers(env: NodeJS.ProcessEnv) {
  return env.SERVE_WEB_APP?.trim().toLowerCase() === "true";
}

export async function ensureDemoAuthUsers(db: PrismaClient) {
  for (const user of demoUsers) {
    await db.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        ...user,
        passwordHash: user.passwordHash,
        status: AccountStatus.active,
      },
    });
  }
}

export async function ensureDemoBaselineData(db: PrismaClient) {
  await db.specialty.createMany({
    data: demoSpecialties.map((specialty) => ({
      ...specialty,
      status: ServiceStatus.active,
      createdAt: seedTimestamp,
      updatedAt: seedTimestamp,
    })),
    skipDuplicates: true,
  });

  await db.service.createMany({
    data: demoServices.map((service) => ({
      ...service,
      currency: "VND",
      status: ServiceStatus.active,
      createdAt: seedTimestamp,
      updatedAt: seedTimestamp,
    })),
    skipDuplicates: true,
  });

  await db.patient.createMany({
    data: demoPatients.map((patient) => ({
      ...patient,
      status: AccountStatus.active,
      createdAt: seedTimestamp,
      updatedAt: seedTimestamp,
    })),
    skipDuplicates: true,
  });

  await db.staff.createMany({
    data: demoStaff.map((staff) => ({
      ...staff,
      status: AccountStatus.active,
      createdAt: seedTimestamp,
      updatedAt: seedTimestamp,
    })),
    skipDuplicates: true,
  });

  for (const doctor of demoDoctors) {
    const existingDoctor = await db.doctor.findUnique({
      where: { id: doctor.id },
      select: { services: { select: { id: true } } },
    });

    if (existingDoctor) {
      const existingServiceIds = new Set(existingDoctor.services.map((service) => service.id));
      const missingServiceIds = doctor.serviceIds.filter((serviceId) => !existingServiceIds.has(serviceId));
      if (missingServiceIds.length > 0) {
        await db.doctor.update({
          where: { id: doctor.id },
          data: { services: { connect: missingServiceIds.map((id) => ({ id })) } },
        });
      }
      continue;
    }

    await db.doctor.create({
      data: {
        id: doctor.id,
        userId: doctor.userId,
        fullName: doctor.fullName,
        specialtyId: doctor.specialtyId,
        phone: doctor.phone,
        email: doctor.email,
        title: doctor.title,
        room: doctor.room,
        status: DoctorStatus.active,
        createdAt: seedTimestamp,
        updatedAt: seedTimestamp,
        services: { connect: doctor.serviceIds.map((id) => ({ id })) },
      },
    });
  }

  await db.doctorSchedule.createMany({
    data: demoDoctors.flatMap((doctor) =>
      Array.from({ length: 10 }, (_, index) => {
        const date = new Date(baseDate);
        date.setUTCDate(baseDate.getUTCDate() + index + Math.floor(index / 5) * 2);
        return {
          id: `schedule-${doctor.id}-${index + 1}`,
          doctorId: doctor.id,
          dayOfWeek: (index % 5) + 1,
          startTime: "08:00",
          endTime: "17:00",
          effectiveFrom: date,
          effectiveTo: date,
          type: ScheduleType.working,
          status: AccountStatus.active,
          createdAt: seedTimestamp,
          updatedAt: seedTimestamp,
        };
      }),
    ),
    skipDuplicates: true,
  });

  const serviceById = new Map(demoServices.map((service) => [service.id, service]));
  const statuses = [
    "requested",
    "confirmed",
    "checked_in",
    "in_progress",
    "completed",
    "cancelled",
    "no_show",
  ] as const;
  const appointmentStartHoursUtc = [1, 2, 3, 4, 5, 6];
  const appointments = Array.from({ length: 40 }, (_, index) => {
    const doctor = index < 30 ? demoDoctors[index % 5] : demoDoctors[5];
    const serviceId = doctor.serviceIds[index % doctor.serviceIds.length];
    const service = serviceById.get(serviceId);
    if (!service) throw new Error(`Missing seeded service ${serviceId}.`);

    const startAt = new Date("2026-08-24T01:00:00.000Z");
    startAt.setUTCDate(startAt.getUTCDate() + Math.floor(index / appointmentStartHoursUtc.length));
    startAt.setUTCHours(appointmentStartHoursUtc[index % appointmentStartHoursUtc.length]);
    const endAt = new Date(startAt.getTime() + service.durationMinutes * 60 * 1000);
    const status = statuses[index % statuses.length];
    const terminalAt = new Date(endAt.getTime());

    return {
      id: `appointment-${index + 1}`,
      patientId: index < 30 ? `patient-${(index % 6) + 1}` : "patient-test",
      doctorId: doctor.id,
      serviceId,
      startAt,
      endAt,
      status,
      reason: "Demo appointment",
      createdByUserId: index < 30 ? index % 2 === 0 ? "user-patient-1" : "user-receptionist-1" : "user-patient-test",
      updatedByUserId: status === "requested" ? undefined : "user-receptionist-1",
      checkedInAt: status === "checked_in" || status === "in_progress" || status === "completed" ? terminalAt : undefined,
      startedAt: status === "in_progress" || status === "completed" ? terminalAt : undefined,
      completedAt: status === "completed" ? terminalAt : undefined,
      cancelledAt: status === "cancelled" ? terminalAt : undefined,
      cancellationReason: status === "cancelled" ? "Demo cancellation" : undefined,
      createdAt: seedTimestamp,
      updatedAt: seedTimestamp,
    };
  });

  await db.appointment.createMany({ data: appointments, skipDuplicates: true });
  await db.appointmentStatusHistory.createMany({
    data: appointments.map((appointment) => ({
      id: `appointment-history-${appointment.id}`,
      appointmentId: appointment.id,
      toStatus: appointment.status,
      actorUserId: appointment.createdByUserId,
      note: "Seeded appointment status.",
      changedAt: appointment.startAt,
    })),
    skipDuplicates: true,
  });
  await db.auditEvent.createMany({
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
    skipDuplicates: true,
  });
  await db.notification.createMany({
    data: Array.from({ length: 10 }, (_, index) => ({
      id: `notification-${index + 1}`,
      recipientUserId: index < 8 ? index % 2 === 0 ? "user-patient-1" : "user-receptionist-1" : "user-patient-test",
      type: index % 2 === 0 ? "appointment_confirmed" : "appointment_created",
      title: "Appointment update",
      message: `Appointment ${index + 1} has been updated.`,
      referenceType: "appointment",
      referenceId: `appointment-${index + 1}`,
      readAt: index < 2 ? new Date("2026-08-24T00:00:00.000Z") : undefined,
      createdAt: seedTimestamp,
    })),
    skipDuplicates: true,
  });
}

@Injectable()
export class DemoAuthRepairService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DemoAuthRepairService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap() {
    if (!shouldRepairDemoAuthUsers(process.env)) {
      return;
    }

    await ensureDemoAuthUsers(this.prisma);
    await ensureDemoBaselineData(this.prisma);
    this.logger.log("Demo auth users and baseline scheduling data ensured for hosted demo mode.");
  }
}
