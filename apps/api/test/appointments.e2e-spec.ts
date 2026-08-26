import { Test } from "@nestjs/testing";
import { AppointmentStatus, PrismaClient } from "@prisma/client";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import request from "supertest";
import type { App } from "supertest/types";
import { z } from "zod";
import { AppModule } from "../src/app.module";

const execFileAsync = promisify(execFile);
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) throw new Error("DATABASE_URL is required for appointment e2e tests.");

const loginSchema = z.object({ data: z.object({ sessionToken: z.string().min(1) }) });
const appointmentDataSchema = z.object({
  id: z.string(),
  status: z.nativeEnum(AppointmentStatus),
  endAt: z.string(),
  statusHistory: z.array(z.object({ toStatus: z.nativeEnum(AppointmentStatus) })),
});
const appointmentResponseSchema = z.object({ data: appointmentDataSchema });
const statusResponseSchema = z.object({ data: appointmentDataSchema.pick({ status: true, statusHistory: true }) });
const errorResponseSchema = z.object({ error: z.object({ code: z.string() }) });

describe("Appointment workflows", () => {
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

  beforeEach(async () => {
    await execFileAsync(process.execPath, ["node_modules/tsx/dist/cli.mjs", "prisma/seed.ts"], {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: databaseUrl },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function createApp() {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1");
    await app.init();
    return { app, server: app.getHttpServer() as App };
  }

  async function login(server: App, email: string) {
    const response = await request(server)
      .post("/api/v1/auth/login")
      .send({ email, password: "careflow-demo" })
      .expect(201);
    return loginSchema.parse(response.body).data.sessionToken;
  }

  async function createAppointment(server: App, token: string, startAt: string) {
    const response = await request(server)
      .post("/api/v1/appointments")
      .set("Authorization", `Bearer ${token}`)
      .send({ patientId: "patient-1", doctorId: "doctor-1", serviceId: "service-general", startAt, reason: "Follow-up consultation" })
      .expect(201);
    return appointmentResponseSchema.parse(response.body).data;
  }

  it("creates a requested appointment for a patient and records its history and audit event", async () => {
    const { app, server } = await createApp();
    try {
      const patientToken = await login(server, "patient@careflow.local");
      const appointment = await createAppointment(server, patientToken, "2026-08-25T01:00:00.000Z");

      expect(appointment).toMatchObject({ status: AppointmentStatus.requested, endAt: "2026-08-25T01:30:00.000Z" });
      expect(appointment.statusHistory.map((history) => history.toStatus)).toEqual([AppointmentStatus.requested]);
      await expect(prisma.appointmentStatusHistory.findFirstOrThrow({ where: { appointmentId: appointment.id }, select: { fromStatus: true, toStatus: true, actorUserId: true } }))
        .resolves.toEqual({ fromStatus: null, toStatus: AppointmentStatus.requested, actorUserId: "user-patient-1" });
      await expect(prisma.auditEvent.findFirstOrThrow({ where: { appointmentId: appointment.id, action: "appointment_created" }, select: { actorUserId: true, entityType: true, entityId: true } }))
        .resolves.toEqual({ actorUserId: "user-patient-1", entityType: "appointment", entityId: appointment.id });
    } finally {
      await app.close();
    }
  });

  it("creates a confirmed appointment for a receptionist", async () => {
    const { app, server } = await createApp();
    try {
      const receptionistToken = await login(server, "reception@careflow.local");
      const appointment = await createAppointment(server, receptionistToken, "2026-08-25T02:00:00.000Z");

      expect(appointment.status).toBe(AppointmentStatus.confirmed);
    } finally {
      await app.close();
    }
  });

  it("checks in a confirmed appointment as a receptionist", async () => {
    const { app, server } = await createApp();
    try {
      const receptionistToken = await login(server, "reception@careflow.local");
      const appointment = await createAppointment(server, receptionistToken, "2026-08-25T03:00:00.000Z");

      await request(server)
        .post(`/api/v1/appointments/${appointment.id}/check-in`)
        .set("Authorization", `Bearer ${receptionistToken}`)
        .expect(201)
        .expect((response) => {
          const appointment = statusResponseSchema.parse(response.body).data;
          expect(appointment.status).toBe(AppointmentStatus.checked_in);
          expect(appointment.statusHistory.map((history) => history.toStatus))
            .toEqual([AppointmentStatus.confirmed, AppointmentStatus.checked_in]);
        });

      const checkedInAppointment = await prisma.appointment.findUniqueOrThrow({ where: { id: appointment.id }, select: { checkedInAt: true } });
      expect(checkedInAppointment.checkedInAt).not.toBeNull();
      await expect(prisma.auditEvent.findFirst({ where: { appointmentId: appointment.id, action: "appointment_checked_in" } })).resolves.not.toBeNull();
    } finally {
      await app.close();
    }
  });

  it("starts a checked-in appointment as its doctor", async () => {
    const { app, server } = await createApp();
    try {
      const receptionistToken = await login(server, "reception@careflow.local");
      const doctorToken = await login(server, "minh.nguyen@careflow.local");
      const appointment = await createAppointment(server, receptionistToken, "2026-08-25T04:00:00.000Z");
      await request(server).post(`/api/v1/appointments/${appointment.id}/check-in`).set("Authorization", `Bearer ${receptionistToken}`).expect(201);

      await request(server)
        .post(`/api/v1/appointments/${appointment.id}/start`)
        .set("Authorization", `Bearer ${doctorToken}`)
        .expect(201)
        .expect((response) => expect(statusResponseSchema.parse(response.body).data.status).toBe(AppointmentStatus.in_progress));

      const startedAppointment = await prisma.appointment.findUniqueOrThrow({ where: { id: appointment.id }, select: { startedAt: true } });
      expect(startedAppointment.startedAt).not.toBeNull();
    } finally {
      await app.close();
    }
  });

  it("completes an in-progress appointment as its doctor", async () => {
    const { app, server } = await createApp();
    try {
      const receptionistToken = await login(server, "reception@careflow.local");
      const doctorToken = await login(server, "minh.nguyen@careflow.local");
      const appointment = await createAppointment(server, receptionistToken, "2026-08-25T06:00:00.000Z");
      await request(server).post(`/api/v1/appointments/${appointment.id}/check-in`).set("Authorization", `Bearer ${receptionistToken}`).expect(201);
      await request(server).post(`/api/v1/appointments/${appointment.id}/start`).set("Authorization", `Bearer ${doctorToken}`).expect(201);

      await request(server)
        .post(`/api/v1/appointments/${appointment.id}/complete`)
        .set("Authorization", `Bearer ${doctorToken}`)
        .expect(201)
        .expect((response) => expect(statusResponseSchema.parse(response.body).data.status).toBe(AppointmentStatus.completed));

      const completedAppointment = await prisma.appointment.findUniqueOrThrow({ where: { id: appointment.id }, select: { completedAt: true } });
      expect(completedAppointment.completedAt).not.toBeNull();
      await expect(prisma.auditEvent.findFirst({ where: { appointmentId: appointment.id, action: "appointment_completed" } })).resolves.not.toBeNull();
    } finally {
      await app.close();
    }
  });

  it("forbids a patient from completing an appointment", async () => {
    const { app, server } = await createApp();
    try {
      const patientToken = await login(server, "patient@careflow.local");

      await request(server)
        .post("/api/v1/appointments/appointment-5/complete")
        .set("Authorization", `Bearer ${patientToken}`)
        .expect(403)
        .expect((response) => expect(errorResponseSchema.parse(response.body).error.code).toBe("FORBIDDEN"));
    } finally {
      await app.close();
    }
  });

  it("confirms a requested appointment as a receptionist and records the transition", async () => {
    const { app, server } = await createApp();
    try {
      const patientToken = await login(server, "patient@careflow.local");
      const receptionistToken = await login(server, "reception@careflow.local");
      const appointment = await createAppointment(server, patientToken, "2026-08-25T02:00:00.000Z");

      await request(server)
        .post(`/api/v1/appointments/${appointment.id}/confirm`)
        .set("Authorization", `Bearer ${receptionistToken}`)
        .expect(201)
        .expect((response) => {
          const appointment = statusResponseSchema.parse(response.body).data;
          expect(appointment.status).toBe(AppointmentStatus.confirmed);
          expect(appointment.statusHistory.map((history) => history.toStatus))
            .toEqual([AppointmentStatus.requested, AppointmentStatus.confirmed]);
        });

      await expect(prisma.auditEvent.findFirst({ where: { appointmentId: appointment.id, action: "appointment_confirmed" } })).resolves.not.toBeNull();
    } finally {
      await app.close();
    }
  });

  it("requires a non-blank cancellation reason from staff", async () => {
    const { app, server } = await createApp();
    try {
      const receptionistToken = await login(server, "reception@careflow.local");
      const appointment = await createAppointment(server, receptionistToken, "2026-08-25T02:00:00.000Z");

      await request(server)
        .post(`/api/v1/appointments/${appointment.id}/cancel`)
        .set("Authorization", `Bearer ${receptionistToken}`)
        .send({ cancellationReason: "  " })
        .expect(400)
        .expect((response) => expect(errorResponseSchema.parse(response.body).error.code).toBe("VALIDATION_ERROR"));
    } finally {
      await app.close();
    }
  });

  it("allows only one concurrent active appointment for the same slot", async () => {
    const { app, server } = await createApp();
    try {
      const receptionistToken = await login(server, "reception@careflow.local");
      const requestBody = { patientId: "patient-1", doctorId: "doctor-1", serviceId: "service-general", startAt: "2026-08-25T06:00:00.000Z" };
      const responses = await Promise.all([
        request(server).post("/api/v1/appointments").set("Authorization", `Bearer ${receptionistToken}`).send(requestBody),
        request(server).post("/api/v1/appointments").set("Authorization", `Bearer ${receptionistToken}`).send(requestBody),
      ]);

      expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
      await expect(prisma.appointment.count({
        where: { doctorId: "doctor-1", startAt: new Date("2026-08-25T06:00:00.000Z"), status: AppointmentStatus.confirmed },
      })).resolves.toBe(1);
    } finally {
      await app.close();
    }
  });

  it("rejects rescheduling a completed appointment", async () => {
    const { app, server } = await createApp();
    try {
      const receptionistToken = await login(server, "reception@careflow.local");

      await request(server)
        .patch("/api/v1/appointments/appointment-5")
        .set("Authorization", `Bearer ${receptionistToken}`)
        .send({ startAt: "2026-08-25T06:00:00.000Z" })
        .expect(409)
        .expect((response) => expect(errorResponseSchema.parse(response.body).error.code).toBe("INVALID_APPOINTMENT_TRANSITION"));
    } finally {
      await app.close();
    }
  });
});
