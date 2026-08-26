import { Test } from "@nestjs/testing";
import { PrismaClient, UserRole } from "@prisma/client";
import request from "supertest";
import type { App } from "supertest/types";
import { z } from "zod";
import { AppModule } from "../src/app.module";

const loginSchema = z.object({
  data: z.object({ sessionToken: z.string().min(1) }),
});

const listSchema = z.object({
  data: z.array(z.object({ id: z.string(), name: z.string(), status: z.string() })),
  meta: z.object({ requestId: z.string().min(1) }),
});

const serviceSchema = z.object({
  data: z.object({
    id: z.string(),
    name: z.string(),
    status: z.string(),
    specialtyId: z.string(),
  }),
  meta: z.object({ requestId: z.string().min(1) }),
});

const patientSchema = z.object({
  data: z.object({ userId: z.string() }),
});

const errorSchema = z.object({
  error: z.object({ code: z.string() }),
  meta: z.object({ requestId: z.string().min(1) }),
});

describe("Catalog resources", () => {
  const prisma = new PrismaClient();

  afterAll(async () => {
    await prisma.patient.deleteMany({ where: { user: { email: { startsWith: "new-patient-" } } } });
    await prisma.user.deleteMany({ where: { email: { startsWith: "new-patient-" } } });
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
    const parsed = loginSchema.parse(response.body);
    return parsed.data.sessionToken;
  }

  it("rejects unauthenticated service list requests", async () => {
    const { app, server } = await createApp();

    try {
      await request(server)
        .get("/api/v1/services")
        .expect(401)
        .expect((response) => {
          const parsed = errorSchema.parse(response.body);
          expect(parsed.error.code).toBe("UNAUTHENTICATED");
        });
    } finally {
      await app.close();
    }
  });

  it("lets an authenticated patient list active services", async () => {
    const { app, server } = await createApp();

    try {
      const token = await login(server, "patient@careflow.local");

      await request(server)
        .get("/api/v1/services")
        .set("Authorization", `Bearer ${token}`)
        .expect(200)
        .expect((response) => {
          const parsed = listSchema.parse(response.body);
          expect(parsed.data.length).toBeGreaterThan(0);
          expect(parsed.data.every((service) => service.status === "active")).toBe(true);
        });
    } finally {
      await app.close();
    }
  });

  it("writes audit events when an admin creates, updates, and deactivates a service", async () => {
    const { app, server } = await createApp();

    try {
      const token = await login(server, "admin@careflow.local");
      const serviceName = "Travel Medicine";

      const createResponse = await request(server)
        .post("/api/v1/services")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: serviceName,
          specialtyId: "specialty-general",
          durationMinutes: 25,
          price: 220000,
          currency: "VND",
          description: "Pre-travel consultation.",
        })
        .expect(201);
      const created = serviceSchema.parse(createResponse.body);
      expect(created.data).toMatchObject({
        name: serviceName,
        specialtyId: "specialty-general",
        status: "active",
      });

      await request(server)
        .patch(`/api/v1/services/${created.data.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ description: "Updated pre-travel consultation." })
        .expect(200);

      await request(server)
        .post(`/api/v1/services/${created.data.id}/deactivate`)
        .set("Authorization", `Bearer ${token}`)
        .expect(201)
        .expect((response) => {
          const parsed = serviceSchema.parse(response.body);
          expect(parsed.data.status).toBe("inactive");
        });

      const auditEvents = await prisma.auditEvent.findMany({
        where: { actorUserId: "user-admin-1", entityType: "service", entityId: created.data.id },
        select: { action: true },
      });
      expect(auditEvents.map((event) => event.action)).toEqual(expect.arrayContaining([
        "admin_resource_created",
        "admin_resource_updated",
        "admin_resource_deactivated",
      ]));

      await request(server)
        .get("/api/v1/services")
        .set("Authorization", `Bearer ${token}`)
        .expect(200)
        .expect((response) => {
          const parsed = listSchema.parse(response.body);
          expect(parsed.data.some((service) => service.id === created.data.id)).toBe(false);
        });
    } finally {
      await app.close();
    }
  });

  it("forbids doctors and links self-created patient profiles to patient users", async () => {
    const { app, server } = await createApp();

    try {
      const doctorToken = await login(server, "minh.nguyen@careflow.local");
      await request(server)
        .post("/api/v1/patients")
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({ fullName: "Forbidden Patient", phone: "+84929999991" })
        .expect(403)
        .expect((response) => expect(errorSchema.parse(response.body).error.code).toBe("FORBIDDEN"));

      const suffix = Date.now().toString();
      const email = `new-patient-${suffix}@careflow.local`;
      const user = await prisma.user.create({
        data: { displayName: "New Patient", email, role: UserRole.patient, status: "active" },
      });
      const patientToken = await login(server, email);

      await request(server)
        .post("/api/v1/patients")
        .set("Authorization", `Bearer ${patientToken}`)
        .send({ fullName: "New Patient", phone: `+84929${suffix.slice(-6)}` })
        .expect(201)
        .expect((response) => expect(patientSchema.parse(response.body).data.userId).toBe(user.id));
    } finally {
      await app.close();
    }
  });

  it("returns RESOURCE_IN_USE when deactivation would affect active dependencies", async () => {
    const { app, server } = await createApp();

    try {
      const token = await login(server, "admin@careflow.local");
      for (const path of ["/api/v1/doctors/doctor-1/deactivate", "/api/v1/specialties/specialty-general/deactivate"]) {
        await request(server)
          .post(path)
          .set("Authorization", `Bearer ${token}`)
          .expect(409)
          .expect((response) => expect(errorSchema.parse(response.body).error.code).toBe("RESOURCE_IN_USE"));
      }
    } finally {
      await app.close();
    }
  });
});
