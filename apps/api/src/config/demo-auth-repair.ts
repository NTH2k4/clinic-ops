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
const seedTimestamp = new Date("2026-08-01T00:00:00.000Z");
const baseDate = new Date("2026-08-24T00:00:00.000Z");

const demoUsers = [
  {
    id: "user-patient-1",
    displayName: "Patient Demo",
    email: "patient@careflow.local",
    phone: "+84910000001",
    role: UserRole.patient,
  },
  {
    id: "user-doctor-1",
    displayName: "Dr. Minh Nguyen",
    email: "minh.nguyen@careflow.local",
    phone: "+84900000001",
    role: UserRole.doctor,
  },
  {
    id: "user-receptionist-1",
    displayName: "Reception Demo",
    email: "reception@careflow.local",
    phone: "+84910000002",
    role: UserRole.receptionist,
  },
  {
    id: "user-nurse-1",
    displayName: "Nurse Demo",
    email: "nurse@careflow.local",
    phone: "+84910000003",
    role: UserRole.nurse,
  },
  {
    id: "user-admin-1",
    displayName: "Admin Demo",
    email: "admin@careflow.local",
    phone: "+84910000004",
    role: UserRole.admin,
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
];

const demoStaff = [
  { id: "staff-receptionist-1", userId: "user-receptionist-1", fullName: "Reception Demo", phone: "+84910000002", email: "reception@careflow.local", role: UserRole.receptionist },
  { id: "staff-nurse-1", userId: "user-nurse-1", fullName: "Nurse Demo", phone: "+84910000003", email: "nurse@careflow.local", role: UserRole.nurse },
  { id: "staff-admin-1", userId: "user-admin-1", fullName: "Admin Demo", phone: "+84910000004", email: "admin@careflow.local", role: UserRole.admin },
];

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
        passwordHash: demoPasswordHash,
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
