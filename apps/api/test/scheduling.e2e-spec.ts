import { Test } from "@nestjs/testing";
import { PrismaClient } from "@prisma/client";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import request from "supertest";
import type { App } from "supertest/types";
import { z } from "zod";
import { AppModule } from "../src/app.module";

const execFileAsync = promisify(execFile);
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) throw new Error("DATABASE_URL is required for scheduling e2e tests.");

const loginSchema = z.object({ data: z.object({ sessionToken: z.string().min(1) }) });
const listMetaSchema = z.object({ page: z.number(), pageSize: z.number(), total: z.number() });
const scheduleListSchema = z.object({
  data: z.array(z.object({
    id: z.string(),
    doctorId: z.string(),
    type: z.string(),
    status: z.string(),
    effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    effectiveTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })),
  meta: listMetaSchema,
});
const scheduleSchema = z.object({
  data: z.object({
    id: z.string(),
    doctorId: z.string(),
    dayOfWeek: z.number(),
    startTime: z.string(),
    endTime: z.string(),
    effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    effectiveTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    type: z.string(),
    status: z.string(),
  }),
});
const availabilitySchema = z.object({
  data: z.array(z.object({ doctorId: z.string(), serviceId: z.string(), startAt: z.string(), endAt: z.string() })),
  meta: listMetaSchema,
});
const explainedAvailabilitySchema = z.object({
  data: z.array(z.object({
    doctorId: z.string(),
    serviceId: z.string(),
    startAt: z.string(),
    endAt: z.string(),
    availabilityStatus: z.enum(["available", "unavailable"]),
    reasonCode: z.enum(["available", "blocked", "leave", "appointment_conflict", "too_soon"]),
    reasonLabel: z.string(),
  })),
  meta: listMetaSchema,
});
const errorSchema = z.object({ error: z.object({ code: z.string() }) });
const appointmentSchema = z.object({ data: z.object({ id: z.string() }) });
const clinicDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Ho_Chi_Minh",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function clinicDateOffset(days: number): string {
  const [year, month, day] = clinicDateFormatter.format(new Date()).split("-").map(Number);
  const utc = Date.UTC(year, month - 1, day + days);
  return new Date(utc).toISOString().slice(0, 10);
}

function dayOfWeek(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  const jsDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return jsDay === 0 ? 7 : jsDay;
}

describe("Schedule and availability reads", () => {
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

  beforeEach(async () => {
    process.env.CAREFLOW_SYSTEM_NOW = "2026-08-23T00:00:00.000Z";
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

  async function login(server: App, email = "patient@careflow.local") {
    const response = await request(server).post("/api/v1/auth/login").send({ email, password: "careflow-demo" }).expect(201);
    return loginSchema.parse(response.body).data.sessionToken;
  }

  it("lists doctor schedules with doctor and date filters", async () => {
    const { app, server } = await createApp();
    try {
      const token = await login(server);
      await request(server)
        .get("/api/v1/doctor-schedules?doctorId=doctor-1&from=2026-08-25&to=2026-08-25&pageSize=5")
        .set("Authorization", `Bearer ${token}`)
        .expect(200)
        .expect((response) => {
          const result = scheduleListSchema.parse(response.body);
          expect(result.data).toHaveLength(1);
          expect(result.data[0]?.doctorId).toBe("doctor-1");
          expect(result.data[0]).toMatchObject({ effectiveFrom: "2026-08-25", effectiveTo: "2026-08-25" });
          expect(result.meta).toMatchObject({ page: 1, pageSize: 5, total: 1 });
        });
    } finally {
      await app.close();
    }
  });

  it("returns deterministic available slots with a doctor candidate", async () => {
    const { app, server } = await createApp();
    try {
      const token = await login(server);
      await request(server)
        .get("/api/v1/availability/slots?serviceId=service-general&date=2026-08-25&doctorId=doctor-1&pageSize=3")
        .set("Authorization", `Bearer ${token}`)
        .expect(200)
        .expect((response) => {
          const result = availabilitySchema.parse(response.body);
          expect(result.data).toHaveLength(3);
          expect(result.data.every((slot) => slot.doctorId === "doctor-1" && slot.serviceId === "service-general")).toBe(true);
          expect(result.data.map((slot) => slot.startAt)).toEqual([...result.data.map((slot) => slot.startAt)].sort());
          expect(result.meta.total).toBeGreaterThan(3);
        });
    } finally {
      await app.close();
    }
  });

  it("rejects non-date-only schedule and availability filters", async () => {
    const { app, server } = await createApp();
    try {
      const token = await login(server);
      for (const path of [
        "/api/v1/doctor-schedules?from=2026-08-25T00:00:00.000Z",
        "/api/v1/availability/slots?serviceId=service-general&date=2026-08-25T00:00:00.000Z",
      ]) {
        await request(server)
          .get(path)
          .set("Authorization", `Bearer ${token}`)
          .expect(400)
          .expect((response) => expect(errorSchema.parse(response.body).error.code).toBe("VALIDATION_ERROR"));
      }
    } finally {
      await app.close();
    }
  });

  it("lets admins create and deactivate blocked schedules that affect availability", async () => {
    const { app, server } = await createApp();
    try {
      const adminToken = await login(server, "admin@careflow.local");
      const patientToken = await login(server);
      const slotStart = "2026-08-25T01:00:00.000Z";

      await request(server)
        .get("/api/v1/availability/slots?serviceId=service-general&date=2026-08-25&doctorId=doctor-1&pageSize=50")
        .set("Authorization", `Bearer ${patientToken}`)
        .expect(200)
        .expect((response) => {
          const result = availabilitySchema.parse(response.body);
          expect(result.data.some((slot) => slot.startAt === slotStart)).toBe(true);
        });

      const createResponse = await request(server)
        .post("/api/v1/doctor-schedules")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          doctorId: "doctor-1",
          dayOfWeek: 2,
          startTime: "08:00",
          endTime: "08:30",
          effectiveFrom: "2026-08-25",
          effectiveTo: "2026-08-25",
          type: "blocked",
        })
        .expect(201);
      const created = scheduleSchema.parse(createResponse.body).data;
      expect(created).toMatchObject({ doctorId: "doctor-1", type: "blocked", status: "active" });

      await request(server)
        .patch(`/api/v1/doctor-schedules/${created.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ endTime: "09:00" })
        .expect(200)
        .expect((response) => {
          const updated = scheduleSchema.parse(response.body).data;
          expect(updated.endTime).toBe("09:00");
        });

      await request(server)
        .get("/api/v1/availability/slots?serviceId=service-general&date=2026-08-25&doctorId=doctor-1&pageSize=50")
        .set("Authorization", `Bearer ${patientToken}`)
        .expect(200)
        .expect((response) => {
          const result = availabilitySchema.parse(response.body);
          expect(result.data.some((slot) => slot.startAt === slotStart)).toBe(false);
        });

      await request(server)
        .post(`/api/v1/doctor-schedules/${created.id}/deactivate`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(201)
        .expect((response) => {
          const deactivated = scheduleSchema.parse(response.body).data;
          expect(deactivated.status).toBe("inactive");
        });

      await request(server)
        .get("/api/v1/availability/slots?serviceId=service-general&date=2026-08-25&doctorId=doctor-1&pageSize=50")
        .set("Authorization", `Bearer ${patientToken}`)
        .expect(200)
        .expect((response) => {
          const result = availabilitySchema.parse(response.body);
          expect(result.data.some((slot) => slot.startAt === slotStart)).toBe(true);
        });
    } finally {
      await app.close();
    }
  });

  it("explains blocked slots when includeUnavailable is requested for a doctor", async () => {
    const { app, server } = await createApp();
    try {
      const adminToken = await login(server, "admin@careflow.local");
      const patientToken = await login(server);

      await request(server)
        .post("/api/v1/doctor-schedules")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          doctorId: "doctor-1",
          dayOfWeek: 2,
          startTime: "08:00",
          endTime: "08:30",
          effectiveFrom: "2026-08-25",
          effectiveTo: "2026-08-25",
          type: "blocked",
        })
        .expect(201);

      await request(server)
        .get("/api/v1/availability/slots?serviceId=service-general&date=2026-08-25&doctorId=doctor-1&pageSize=50&includeUnavailable=true")
        .set("Authorization", `Bearer ${patientToken}`)
        .expect(200)
        .expect((response) => {
          const result = explainedAvailabilitySchema.parse(response.body);
          const blocked = result.data.find((slot) => slot.startAt === "2026-08-25T01:00:00.000Z");
          expect(blocked).toMatchObject({
            doctorId: "doctor-1",
            serviceId: "service-general",
            availabilityStatus: "unavailable",
            reasonCode: "blocked",
            reasonLabel: "Bác sĩ bị chặn lịch",
          });
        });
    } finally {
      await app.close();
    }
  });

  it("explains leave slots when includeUnavailable is requested for a doctor", async () => {
    const { app, server } = await createApp();
    try {
      const patientToken = await login(server);

      await prisma.doctorSchedule.create({
        data: {
          id: "schedule-doctor-1-leave-2026-08-25",
          doctorId: "doctor-1",
          dayOfWeek: 2,
          startTime: "09:00",
          endTime: "09:30",
          effectiveFrom: new Date("2026-08-25T00:00:00.000Z"),
          effectiveTo: new Date("2026-08-25T00:00:00.000Z"),
          type: "leave",
          status: "active",
        },
      });

      await request(server)
        .get("/api/v1/availability/slots?serviceId=service-general&date=2026-08-25&doctorId=doctor-1&pageSize=50&includeUnavailable=true")
        .set("Authorization", `Bearer ${patientToken}`)
        .expect(200)
        .expect((response) => {
          const result = explainedAvailabilitySchema.parse(response.body);
          const leave = result.data.find((slot) => slot.startAt === "2026-08-25T02:00:00.000Z");
          expect(leave).toMatchObject({
            availabilityStatus: "unavailable",
            reasonCode: "leave",
            reasonLabel: "Bác sĩ nghỉ phép",
          });
        });
    } finally {
      await app.close();
    }
  });

  it("rejects leave requests made less than one week before the working day", async () => {
    const { app, server } = await createApp();
    try {
      const adminToken = await login(server, "admin@careflow.local");
      const leaveDate = clinicDateOffset(6);

      await request(server)
        .post("/api/v1/doctor-schedules")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          doctorId: "doctor-1",
          dayOfWeek: dayOfWeek(leaveDate),
          startTime: "09:00",
          endTime: "09:30",
          effectiveFrom: leaveDate,
          effectiveTo: leaveDate,
          type: "leave",
        })
        .expect(409)
        .expect((response) => {
          const result = errorSchema.parse(response.body);
          expect(result.error.code).toBe("LEAVE_NOTICE_TOO_SHORT");
        });
    } finally {
      await app.close();
    }
  });

  it("explains active appointment conflicts when includeUnavailable is requested for a doctor", async () => {
    const { app, server } = await createApp();
    try {
      const patientToken = await login(server);

      await request(server)
        .get("/api/v1/availability/slots?serviceId=service-general&date=2026-08-25&doctorId=doctor-1&pageSize=50&includeUnavailable=true")
        .set("Authorization", `Bearer ${patientToken}`)
        .expect(200)
        .expect((response) => {
          const result = explainedAvailabilitySchema.parse(response.body);
          const conflict = result.data.find((slot) => slot.startAt === "2026-08-25T05:00:00.000Z");
          expect(conflict).toMatchObject({
            availabilityStatus: "unavailable",
            reasonCode: "appointment_conflict",
            reasonLabel: "Bác sĩ đã có lịch hẹn",
          });
        });
    } finally {
      await app.close();
    }
  });

  it("requires doctorId for includeUnavailable explanation mode", async () => {
    const { app, server } = await createApp();
    try {
      const patientToken = await login(server);

      await request(server)
        .get("/api/v1/availability/slots?serviceId=service-general&date=2026-08-25&includeUnavailable=true")
        .set("Authorization", `Bearer ${patientToken}`)
        .expect(400)
        .expect((response) => expect(errorSchema.parse(response.body).error.code).toBe("VALIDATION_ERROR"));
    } finally {
      await app.close();
    }
  });

  it("keeps includeUnavailable=false in available-only mode without requiring doctorId", async () => {
    const { app, server } = await createApp();
    try {
      const patientToken = await login(server);

      await request(server)
        .get("/api/v1/availability/slots?serviceId=service-general&date=2026-08-25&includeUnavailable=false&pageSize=3")
        .set("Authorization", `Bearer ${patientToken}`)
        .expect(200)
        .expect((response) => {
          const result = availabilitySchema.parse(response.body);
          expect(result.data).not.toHaveLength(0);
          expect(result.data[0]).not.toHaveProperty("availabilityStatus");
        });
    } finally {
      await app.close();
    }
  });

  it("forbids non-admin schedule management", async () => {
    const { app, server } = await createApp();
    try {
      const patientToken = await login(server);
      await request(server)
        .post("/api/v1/doctor-schedules")
        .set("Authorization", `Bearer ${patientToken}`)
        .send({
          doctorId: "doctor-1",
          dayOfWeek: 2,
          startTime: "08:00",
          endTime: "08:30",
          effectiveFrom: "2026-08-25",
          effectiveTo: "2026-08-25",
          type: "blocked",
        })
        .expect(403)
        .expect((response) => expect(errorSchema.parse(response.body).error.code).toBe("FORBIDDEN"));
    } finally {
      await app.close();
    }
  });

  it("forbids doctors from checking patient-facing availability", async () => {
    const { app, server } = await createApp();
    try {
      const doctorToken = await login(server, "minh.nguyen@careflow.local");

      await request(server)
        .get("/api/v1/availability/slots?serviceId=service-general&date=2026-08-25&doctorId=doctor-1")
        .set("Authorization", `Bearer ${doctorToken}`)
        .expect(403)
        .expect((response) => expect(errorSchema.parse(response.body).error.code).toBe("FORBIDDEN"));
    } finally {
      await app.close();
    }
  });

  it("rejects blocked schedules that overlap active appointments", async () => {
    const { app, server } = await createApp();
    try {
      const adminToken = await login(server, "admin@careflow.local");
      const receptionistToken = await login(server, "reception@careflow.local");
      const createAppointment = await request(server)
        .post("/api/v1/appointments")
        .set("Authorization", `Bearer ${receptionistToken}`)
        .send({
          patientId: "patient-1",
          doctorId: "doctor-1",
          serviceId: "service-general",
          startAt: "2026-08-25T01:00:00.000Z",
        })
        .expect(201);
      expect(appointmentSchema.parse(createAppointment.body).data.id).toBeTruthy();

      await request(server)
        .post("/api/v1/doctor-schedules")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          doctorId: "doctor-1",
          dayOfWeek: 2,
          startTime: "08:00",
          endTime: "08:30",
          effectiveFrom: "2026-08-25",
          effectiveTo: "2026-08-25",
          type: "blocked",
        })
        .expect(409)
        .expect((response) => expect(errorSchema.parse(response.body).error.code).toBe("RESOURCE_IN_USE"));
    } finally {
      await app.close();
    }
  });
});
