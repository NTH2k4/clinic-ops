import { Test } from "@nestjs/testing";
import { PrismaClient, UserRole } from "@prisma/client";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import request from "supertest";
import type { App } from "supertest/types";
import { z } from "zod";
import { AppModule } from "../src/app.module";

const execFileAsync = promisify(execFile);
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) throw new Error("DATABASE_URL is required for catalog e2e tests.");

const loginSchema = z.object({
  data: z.object({ sessionToken: z.string().min(1) }),
});

const listSchema = z.object({
  data: z.array(z.object({ id: z.string(), name: z.string(), status: z.string() })),
  meta: z.object({ requestId: z.string().min(1), page: z.number(), pageSize: z.number(), total: z.number() }),
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
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

  beforeEach(async () => {
    await execFileAsync(process.execPath, ["node_modules/tsx/dist/cli.mjs", "prisma/seed.ts"], {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: databaseUrl },
    });
  });

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

  it("returns bounded catalog pagination metadata", async () => {
    const { app, server } = await createApp();
    try {
      const token = await login(server, "patient@careflow.local");
      await request(server)
        .get("/api/v1/services?page=1&pageSize=2")
        .set("Authorization", `Bearer ${token}`)
        .expect(200)
        .expect((response) => {
          const result = listSchema.parse(response.body);
          expect(result.data).toHaveLength(2);
          expect(result.meta).toMatchObject({ page: 1, pageSize: 2 });
          expect(result.meta.total).toBeGreaterThan(2);
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

  it("rejects lifecycle deactivation through generic PATCH routes", async () => {
    const { app, server } = await createApp();
    try {
      const token = await login(server, "admin@careflow.local");
      for (const path of ["/api/v1/doctors/doctor-1", "/api/v1/specialties/specialty-general", "/api/v1/services/service-general"]) {
        await request(server)
          .patch(path)
          .set("Authorization", `Bearer ${token}`)
          .send({ status: "inactive" })
          .expect(400)
          .expect((response) => expect(errorSchema.parse(response.body).error.code).toBe("VALIDATION_ERROR"));
      }
    } finally {
      await app.close();
    }
  });

  it("forbids doctors from updating patients and prevents patient status mutation", async () => {
    const { app, server } = await createApp();
    try {
      const doctorToken = await login(server, "minh.nguyen@careflow.local");
      const patientToken = await login(server, "patient@careflow.local");

      await request(server).patch("/api/v1/patients/patient-1").set("Authorization", `Bearer ${doctorToken}`).send({ address: "Changed" }).expect(403);
      await request(server)
        .patch("/api/v1/patients/patient-1")
        .set("Authorization", `Bearer ${patientToken}`)
        .send({ status: "inactive" })
        .expect(400)
        .expect((response) => expect(errorSchema.parse(response.body).error.code).toBe("VALIDATION_ERROR"));
      await expect(prisma.patient.findUniqueOrThrow({ where: { id: "patient-1" }, select: { status: true } })).resolves.toEqual({ status: "active" });
    } finally {
      await app.close();
    }
  });

  it("requires date-only patient birth dates", async () => {
    const { app, server } = await createApp();
    try {
      const token = await login(server, "reception@careflow.local");
      await request(server)
        .patch("/api/v1/patients/patient-1")
        .set("Authorization", `Bearer ${token}`)
        .send({ dateOfBirth: "1990-01-01T00:00:00.000Z" })
        .expect(400)
        .expect((response) => expect(errorSchema.parse(response.body).error.code).toBe("VALIDATION_ERROR"));
    } finally {
      await app.close();
    }
  });

  it("maps Prisma uniqueness failures to the API error envelope", async () => {
    const { app, server } = await createApp();
    try {
      const token = await login(server, "reception@careflow.local");
      await request(server)
        .post("/api/v1/patients")
        .set("Authorization", `Bearer ${token}`)
        .send({ fullName: "Duplicate Phone", phone: "+84920000001" })
        .expect(409)
        .expect((response) => expect(errorSchema.parse(response.body).error.code).toBe("RESOURCE_IN_USE"));
    } finally {
      await app.close();
    }
  });
});
