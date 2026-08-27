import { Test } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
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
  patientId: z.string(),
  doctorId: z.string(),
  status: z.nativeEnum(AppointmentStatus),
  endAt: z.string(),
  internalNote: z.string().nullable().optional(),
  statusHistory: z.array(z.object({ toStatus: z.nativeEnum(AppointmentStatus) })),
});
const appointmentResponseSchema = z.object({ data: appointmentDataSchema });
const statusResponseSchema = z.object({ data: appointmentDataSchema.pick({ status: true, statusHistory: true }) });
const errorResponseSchema = z.object({ error: z.object({ code: z.string() }) });
const appointmentListSchema = z.object({
  data: z.array(appointmentDataSchema),
  meta: z.object({ page: z.number(), pageSize: z.number(), total: z.number() }),
});
const appointmentProjectionSchema = z.object({
  id: z.string(),
  internalNote: z.string().nullable().optional(),
  statusHistory: z.array(z.object({ note: z.string().nullable().optional() }).passthrough()),
}).passthrough();

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

  it("logs key appointment workflow actions with the request id", async () => {
    const { app, server } = await createApp();
    const logSpy = jest.spyOn(Logger.prototype, "log").mockImplementation();

    try {
      const patientToken = await login(server, "patient@careflow.local");
      const response = await request(server)
        .post("/api/v1/appointments")
        .set("Authorization", `Bearer ${patientToken}`)
        .set("x-request-id", "appointment-log-1")
        .send({
          patientId: "patient-1",
          doctorId: "doctor-1",
          serviceId: "service-general",
          startAt: "2026-08-25T01:00:00.000Z",
          reason: "Follow-up consultation",
        })
        .expect(201);
      const appointment = appointmentResponseSchema.parse(response.body).data;

      expect(logSpy.mock.calls.some(([message]) => {
        if (typeof message !== "string") return false;
        const parsed: unknown = JSON.parse(message);
        const log = z.object({
          event: z.literal("appointment_workflow"),
          requestId: z.string(),
          action: z.string(),
          appointmentId: z.string(),
          actorUserId: z.string(),
        }).safeParse(parsed);
        return log.success
          && log.data.requestId === "appointment-log-1"
          && log.data.action === "appointment_created"
          && log.data.appointmentId === appointment.id
          && log.data.actorUserId === "user-patient-1";
      })).toBe(true);
    } finally {
      logSpy.mockRestore();
      await app.close();
    }
  });

  it("rejects patient-only attempts to set an internal note", async () => {
    const { app, server } = await createApp();
    try {
      const patientToken = await login(server, "patient@careflow.local");

      await request(server)
        .post("/api/v1/appointments")
        .set("Authorization", `Bearer ${patientToken}`)
        .send({ serviceId: "service-general", doctorId: "doctor-1", startAt: "2026-08-25T08:00:00.000Z", internalNote: "staff only" })
        .expect(400)
        .expect((response) => expect(errorResponseSchema.parse(response.body).error.code).toBe("VALIDATION_ERROR"));
    } finally {
      await app.close();
    }
  });

  it("rejects appointment creation for an inactive patient", async () => {
    const { app, server } = await createApp();
    try {
      const receptionistToken = await login(server, "reception@careflow.local");
      await prisma.patient.update({ where: { id: "patient-1" }, data: { status: "inactive" } });

      await request(server)
        .post("/api/v1/appointments")
        .set("Authorization", `Bearer ${receptionistToken}`)
        .send({ patientId: "patient-1", serviceId: "service-general", doctorId: "doctor-1", startAt: "2026-08-25T08:00:00.000Z" })
        .expect(409)
        .expect((response) => expect(errorResponseSchema.parse(response.body).error.code).toBe("PATIENT_INACTIVE"));
    } finally {
      await app.close();
    }
  });

  it("records the validated appointment source in audit metadata", async () => {
    const { app, server } = await createApp();
    try {
      const patientToken = await login(server, "patient@careflow.local");
      const response = await request(server)
        .post("/api/v1/appointments")
        .set("Authorization", `Bearer ${patientToken}`)
        .send({ serviceId: "service-general", doctorId: "doctor-1", startAt: "2026-08-25T08:00:00.000Z", source: "patient_portal" })
        .expect(201);
      const appointment = appointmentResponseSchema.parse(response.body).data;

      const audit = await prisma.auditEvent.findFirstOrThrow({ where: { appointmentId: appointment.id, action: "appointment_created" } });
      expect(audit.metadata).toMatchObject({ source: "patient_portal" });
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

  it("forbids a doctor from starting another doctor's appointment", async () => {
    const { app, server } = await createApp();
    try {
      const doctorToken = await login(server, "minh.nguyen@careflow.local");

      await request(server)
        .post("/api/v1/appointments/appointment-3/start")
        .set("Authorization", `Bearer ${doctorToken}`)
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

  it("serializes concurrent transitions from the same current status", async () => {
    const { app, server } = await createApp();
    try {
      const receptionistToken = await login(server, "reception@careflow.local");
      await prisma.$executeRawUnsafe(`
        CREATE OR REPLACE FUNCTION careflow_test_delay_appointment_update() RETURNS trigger AS $$
        BEGIN
          IF OLD.id = 'appointment-2' THEN PERFORM pg_sleep(0.25); END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
      `);
      await prisma.$executeRawUnsafe('DROP TRIGGER IF EXISTS careflow_test_delay_appointment_update ON "Appointment"');
      await prisma.$executeRawUnsafe(`
        CREATE TRIGGER careflow_test_delay_appointment_update
          BEFORE UPDATE ON "Appointment"
          FOR EACH ROW EXECUTE FUNCTION careflow_test_delay_appointment_update();
      `);

      const responses = await Promise.all([
        request(server).post("/api/v1/appointments/appointment-2/check-in").set("Authorization", `Bearer ${receptionistToken}`),
        request(server).post("/api/v1/appointments/appointment-2/no-show").set("Authorization", `Bearer ${receptionistToken}`),
      ]);

      expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
      const histories = await prisma.appointmentStatusHistory.findMany({ where: { appointmentId: "appointment-2" }, orderBy: { changedAt: "asc" } });
      expect(histories).toHaveLength(2);
      expect(histories[1]?.fromStatus).toBe(AppointmentStatus.confirmed);
      expect([AppointmentStatus.checked_in, AppointmentStatus.no_show]).toContain(histories[1]?.toStatus);
    } finally {
      await prisma.$executeRawUnsafe('DROP TRIGGER IF EXISTS careflow_test_delay_appointment_update ON "Appointment"');
      await prisma.$executeRawUnsafe("DROP FUNCTION IF EXISTS careflow_test_delay_appointment_update()");
      await app.close();
    }
  });

  it("lists and returns appointments within the actor scope", async () => {
    const { app, server } = await createApp();
    try {
      const patientToken = await login(server, "patient@careflow.local");
      const doctorToken = await login(server, "minh.nguyen@careflow.local");

      await request(server)
        .get("/api/v1/appointments?page=1&pageSize=2")
        .set("Authorization", `Bearer ${patientToken}`)
        .expect(200)
        .expect((response) => {
          const result = appointmentListSchema.parse(response.body);
          expect(result.data).toHaveLength(2);
          expect(result.data.every((appointment) => appointment.patientId === "patient-1")).toBe(true);
          expect(result.meta).toMatchObject({ page: 1, pageSize: 2 });
          expect(result.meta.total).toBeGreaterThan(2);
        });

      await request(server)
        .get("/api/v1/appointments?doctorId=doctor-1")
        .set("Authorization", `Bearer ${doctorToken}`)
        .expect(200)
        .expect((response) => expect(appointmentListSchema.parse(response.body).data.every((appointment) => appointment.doctorId === "doctor-1")).toBe(true));

      await request(server).get("/api/v1/appointments/appointment-2").set("Authorization", `Bearer ${patientToken}`).expect(403);
      await request(server).get("/api/v1/appointments/appointment-1").set("Authorization", `Bearer ${patientToken}`).expect(200);
    } finally {
      await app.close();
    }
  });

  it("omits operational notes from patient appointment reads", async () => {
    const { app, server } = await createApp();
    try {
      await prisma.appointment.update({ where: { id: "appointment-1" }, data: { internalNote: "Sensitive staff note" } });
      await prisma.appointmentStatusHistory.updateMany({ where: { appointmentId: "appointment-1" }, data: { note: "Sensitive status note" } });
      const patientToken = await login(server, "patient@careflow.local");
      const receptionistToken = await login(server, "reception@careflow.local");

      const listResponse = await request(server)
        .get("/api/v1/appointments?pageSize=100")
        .set("Authorization", `Bearer ${patientToken}`)
        .expect(200);
      const list = z.object({ data: z.array(appointmentProjectionSchema) }).parse(listResponse.body).data;
      const patientAppointment = list.find((appointment) => appointment.id === "appointment-1");
      expect(patientAppointment).toBeDefined();
      expect(patientAppointment).not.toHaveProperty("internalNote");
      expect(patientAppointment?.statusHistory.every((history) => !("note" in history))).toBe(true);

      const patientDetailResponse = await request(server)
        .get("/api/v1/appointments/appointment-1")
        .set("Authorization", `Bearer ${patientToken}`)
        .expect(200);
      const patientDetail = z.object({ data: appointmentProjectionSchema }).parse(patientDetailResponse.body).data;
      expect(patientDetail).not.toHaveProperty("internalNote");
      expect(patientDetail.statusHistory.every((history) => !("note" in history))).toBe(true);

      const staffDetailResponse = await request(server)
        .get("/api/v1/appointments/appointment-1")
        .set("Authorization", `Bearer ${receptionistToken}`)
        .expect(200);
      const staffDetail = z.object({ data: appointmentProjectionSchema }).parse(staffDetailResponse.body).data;
      expect(staffDetail.internalNote).toBe("Sensitive staff note");
      expect(staffDetail.statusHistory[0]?.note).toBe("Sensitive status note");
    } finally {
      await app.close();
    }
  });

  it("rejects appointment datetimes without a timezone", async () => {
    const { app, server } = await createApp();
    try {
      const receptionistToken = await login(server, "reception@careflow.local");
      for (const startAt of ["2026-08-25T09:00:00", "2026-08-25 09:00:00Z"]) {
        await request(server)
          .post("/api/v1/appointments")
          .set("Authorization", `Bearer ${receptionistToken}`)
          .send({ patientId: "patient-1", serviceId: "service-general", startAt })
          .expect(400)
          .expect((response) => expect(errorResponseSchema.parse(response.body).error.code).toBe("VALIDATION_ERROR"));
      }
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
        .expect((response) => expect(errorResponseSchema.parse(response.body).error.code).toBe("INVALID_STATUS_TRANSITION"));
    } finally {
      await app.close();
    }
  });

  it("updates an internal note without creating a reschedule audit event", async () => {
    const { app, server } = await createApp();
    try {
      const receptionistToken = await login(server, "reception@careflow.local");

      await request(server)
        .patch("/api/v1/appointments/appointment-2")
        .set("Authorization", `Bearer ${receptionistToken}`)
        .send({ internalNote: "Arrive early" })
        .expect(200)
        .expect((response) => expect(appointmentResponseSchema.parse(response.body).data.internalNote).toBe("Arrive early"));

      await expect(prisma.auditEvent.count({ where: { appointmentId: "appointment-2", action: "appointment_rescheduled" } })).resolves.toBe(0);
      await expect(prisma.auditEvent.count({ where: { appointmentId: "appointment-2", action: "appointment_updated" } })).resolves.toBe(1);
    } finally {
      await app.close();
    }
  });
});
