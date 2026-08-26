import { Test } from "@nestjs/testing";
import request from "supertest";
import type { App } from "supertest/types";
import { z } from "zod";
import { AppModule } from "../src/app.module";

const loginSchema = z.object({ data: z.object({ sessionToken: z.string().min(1) }) });
const listMetaSchema = z.object({ page: z.number(), pageSize: z.number(), total: z.number() });
const scheduleListSchema = z.object({
  data: z.array(z.object({ id: z.string(), doctorId: z.string(), effectiveFrom: z.string(), effectiveTo: z.string() })),
  meta: listMetaSchema,
});
const availabilitySchema = z.object({
  data: z.array(z.object({ doctorId: z.string(), serviceId: z.string(), startAt: z.string(), endAt: z.string() })),
  meta: listMetaSchema,
});
const errorSchema = z.object({ error: z.object({ code: z.string() }) });

describe("Schedule and availability reads", () => {
  async function createApp() {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1");
    await app.init();
    return { app, server: app.getHttpServer() as App };
  }

  async function login(server: App) {
    const response = await request(server).post("/api/v1/auth/login").send({ email: "patient@careflow.local", password: "careflow-demo" }).expect(201);
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
});
