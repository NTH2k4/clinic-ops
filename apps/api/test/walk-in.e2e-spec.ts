import { Test } from "@nestjs/testing";
import { AppointmentStatus, PrismaClient, ScheduleType } from "@prisma/client";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import request from "supertest";
import type { App } from "supertest/types";
import { z } from "zod";
import { AppModule } from "../src/app.module";

const execFileAsync = promisify(execFile);
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) throw new Error("DATABASE_URL is required for walk-in e2e tests.");

const loginSchema = z.object({ data: z.object({ sessionToken: z.string().min(1) }) });
const quoteSchema = z.object({
  data: z.object({
    patientMatch: z.enum(["existing", "new"]),
    patientId: z.string().nullable(),
    doctorId: z.string(),
    doctorName: z.string(),
    room: z.string().nullable(),
    serviceId: z.string(),
    startAt: z.string(),
    estimatedWaitMinutes: z.number(),
    queueAhead: z.number(),
    assignmentReason: z.enum(["room_empty", "lowest_queue", "continued_shift", "next_shift"]),
  }),
});
const intakeSchema = z.object({
  data: z.object({
    appointment: z.object({
      id: z.string(),
      patientId: z.string(),
      doctorId: z.string(),
      serviceId: z.string(),
      status: z.literal(AppointmentStatus.checked_in),
      checkedInAt: z.string(),
    }),
    quote: quoteSchema.shape.data,
  }),
});

describe("Walk-in intake workflows", () => {
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

  beforeEach(async () => {
    process.env.CAREFLOW_SYSTEM_NOW = "2026-09-03T03:00:00.000Z";
    await execFileAsync(process.execPath, ["node_modules/tsx/dist/cli.mjs", "prisma/seed.ts"], {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: databaseUrl },
    });
  });

  afterAll(async () => {
    delete process.env.CAREFLOW_SYSTEM_NOW;
    await prisma.$disconnect();
  });

  async function createApp() {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1");
    await app.init();
    return { app, server: app.getHttpServer() as App };
  }

  async function login(server: App, email = "reception@careflow.local") {
    const response = await request(server)
      .post("/api/v1/auth/login")
      .send({ email, password: "careflow-demo" })
      .expect(201);
    return loginSchema.parse(response.body).data.sessionToken;
  }

  async function queueAppointment(id: string, doctorId: string, patientId: string, startAt: string, status: AppointmentStatus) {
    await prisma.appointment.create({
      data: {
        id,
        patientId,
        doctorId,
        serviceId: "service-general",
        startAt: new Date(startAt),
        endAt: new Date(new Date(startAt).getTime() + 30 * 60_000),
        status,
        reason: "Queue fixture",
        createdByUserId: "user-receptionist-1",
        checkedInAt: status === AppointmentStatus.checked_in || status === AppointmentStatus.in_progress ? new Date(startAt) : undefined,
        startedAt: status === AppointmentStatus.in_progress ? new Date(startAt) : undefined,
      },
    });
  }

  it("quotes the working doctor room with the lowest walk-in queue load", async () => {
    const { app, server } = await createApp();
    try {
      const token = await login(server);
      await prisma.doctor.update({ where: { id: "doctor-test" }, data: { status: "inactive" } });
      await queueAppointment("walkin-queue-1", "doctor-1", "patient-1", "2026-09-03T02:30:00.000Z", AppointmentStatus.in_progress);
      await queueAppointment("walkin-queue-2", "doctor-1", "patient-2", "2026-09-03T03:00:00.000Z", AppointmentStatus.checked_in);

      const response = await request(server)
        .post("/api/v1/walk-in-intake/quote")
        .set("Authorization", `Bearer ${token}`)
        .send({
          patient: { fullName: "Nguyen Van Walkin", phone: "+84930000222", citizenIdNumber: "079203000222" },
          serviceId: "service-general",
        })
        .expect(201);

      const quote = quoteSchema.parse(response.body).data;
      expect(quote).toMatchObject({
        patientMatch: "new",
        patientId: null,
        doctorId: "doctor-4",
        room: "A102",
        serviceId: "service-general",
        estimatedWaitMinutes: 0,
        queueAhead: 0,
        assignmentReason: "room_empty",
      });
      expect(new Date(quote.startAt).toISOString()).toBe("2026-09-03T03:00:00.000Z");
    } finally {
      await app.close();
    }
  });

  it("does not apply the online 30-minute cutoff to walk-in intake", async () => {
    const { app, server } = await createApp();
    try {
      const token = await login(server);
      await prisma.doctor.updateMany({ where: { id: { not: "doctor-4" } }, data: { status: "inactive" } });

      const response = await request(server)
        .post("/api/v1/walk-in-intake/quote")
        .set("Authorization", `Bearer ${token}`)
        .send({
          patient: { fullName: "Tran Van Now", phone: "+84930000223", citizenIdNumber: "079203000223" },
          serviceId: "service-general",
        })
        .expect(201);

      const quote = quoteSchema.parse(response.body).data;
      expect(new Date(quote.startAt).toISOString()).toBe("2026-09-03T03:00:00.000Z");
    } finally {
      await app.close();
    }
  });

  it("allows immediate assignment near a shift boundary when the same doctor continues", async () => {
    process.env.CAREFLOW_SYSTEM_NOW = "2026-09-03T02:57:00.000Z";
    await prisma.doctorSchedule.deleteMany({ where: { doctorId: "doctor-4" } });
    await prisma.doctorSchedule.createMany({
      data: [
        {
          id: "doctor-4-short-shift",
          doctorId: "doctor-4",
          dayOfWeek: 4,
          startTime: "08:00",
          endTime: "10:00",
          effectiveFrom: new Date("2026-09-03T00:00:00.000Z"),
          effectiveTo: new Date("2026-09-03T00:00:00.000Z"),
          type: ScheduleType.working,
          status: "active",
        },
        {
          id: "doctor-4-continued-shift",
          doctorId: "doctor-4",
          dayOfWeek: 4,
          startTime: "10:00",
          endTime: "17:00",
          effectiveFrom: new Date("2026-09-03T00:00:00.000Z"),
          effectiveTo: new Date("2026-09-03T00:00:00.000Z"),
          type: ScheduleType.working,
          status: "active",
        },
      ],
    });

    const { app, server } = await createApp();
    try {
      const token = await login(server);
      await prisma.doctor.updateMany({ where: { id: { not: "doctor-4" } }, data: { status: "inactive" } });

      const response = await request(server)
        .post("/api/v1/walk-in-intake/quote")
        .set("Authorization", `Bearer ${token}`)
        .send({
          patient: { fullName: "Pham Thi Boundary", phone: "+84930000224", citizenIdNumber: "079203000224" },
          serviceId: "service-general",
        })
        .expect(201);

      const quote = quoteSchema.parse(response.body).data;
      expect(quote.doctorId).toBe("doctor-4");
      expect(quote.assignmentReason).toBe("continued_shift");
      expect(new Date(quote.startAt).toISOString()).toBe("2026-09-03T02:57:00.000Z");
    } finally {
      await app.close();
    }
  });

  it("creates a checked-in appointment and a patient when the walk-in is confirmed", async () => {
    const { app, server } = await createApp();
    try {
      const token = await login(server);
      await prisma.doctor.update({ where: { id: "doctor-test" }, data: { status: "inactive" } });

      const response = await request(server)
        .post("/api/v1/walk-in-intake")
        .set("Authorization", `Bearer ${token}`)
        .send({
          patient: {
            fullName: "Le Minh Nhi",
            phone: "+84930000225",
            dateOfBirth: "2018-05-12",
            address: "Ward 1, District 3, Ho Chi Minh City",
            guardianName: "Le Van Guardian",
            guardianPhone: "+84930000226",
            identityDocumentType: "guardian_verified",
          },
          serviceId: "service-general",
          reason: "Walk-in consultation",
        })
        .expect(201);

      const body = intakeSchema.parse(response.body).data;
      expect(body.appointment).toMatchObject({
        status: AppointmentStatus.checked_in,
        serviceId: "service-general",
      });
      await expect(prisma.patient.findUniqueOrThrow({ where: { id: body.appointment.patientId } }))
        .resolves.toMatchObject({ fullName: "Le Minh Nhi", guardianName: "Le Van Guardian" });
      await expect(prisma.auditEvent.findFirst({ where: { appointmentId: body.appointment.id, action: "walk_in_intake_created" } }))
        .resolves.not.toBeNull();
    } finally {
      await app.close();
    }
  });
});
