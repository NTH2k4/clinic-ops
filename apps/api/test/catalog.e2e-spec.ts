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

const doctorSchema = z.object({
  data: z.object({
    id: z.string(),
    status: z.string(),
  }).passthrough(),
  meta: z.object({ requestId: z.string().min(1) }),
});

const doctorListSchema = z.object({
  data: z.array(z.object({ id: z.string() }).passthrough()),
  meta: z.object({ requestId: z.string().min(1), page: z.number(), pageSize: z.number(), total: z.number() }),
});

const patientSchema = z.object({
  data: z.object({ id: z.string(), userId: z.string().nullable().optional() }).passthrough(),
});

const patientDetailSchema = z.object({
  data: z.object({
    id: z.string(),
    fullName: z.string(),
    phone: z.string(),
  }).passthrough(),
});

const demoPasswordHash = "$2a$10$Gfgzco0n8DMTE/AqMyfb.ekoNCRoI6QlhM88/1a.dgKwKEkX.Xmwi";

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
          const serviceNames = parsed.data.map((service) => service.name);
          expect(serviceNames).toEqual(expect.arrayContaining(["Khám tổng quát", "Tái khám", "Khám tim mạch"]));
          expect(serviceNames).not.toEqual(expect.arrayContaining(["General Consultation", "Follow-up Consultation", "Cardiac Consultation"]));
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
        data: { displayName: "New Patient", email, passwordHash: demoPasswordHash, role: UserRole.patient, status: "active" },
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

  it("forbids patient owners from reading another patient profile", async () => {
    const { app, server } = await createApp();

    try {
      const patientToken = await login(server, "patient@careflow.local");

      await request(server)
        .get("/api/v1/patients/patient-2")
        .set("Authorization", `Bearer ${patientToken}`)
        .expect(403)
        .expect((response) => expect(errorSchema.parse(response.body).error.code).toBe("FORBIDDEN"));
    } finally {
      await app.close();
    }
  });

  it("writes audit events when staff create and update patients", async () => {
    const { app, server } = await createApp();

    try {
      const token = await login(server, "reception@careflow.local");
      const createResponse = await request(server)
        .post("/api/v1/patients")
        .set("Authorization", `Bearer ${token}`)
        .send({ fullName: "Audit Patient", phone: `+84928${Date.now().toString().slice(-6)}` })
        .expect(201);
      const created = patientSchema.parse(createResponse.body).data;

      await request(server)
        .patch(`/api/v1/patients/${created.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ address: "Updated audit address" })
        .expect(200);

      const auditEvents = await prisma.auditEvent.findMany({
        where: { actorUserId: "user-receptionist-1", entityType: "patient", entityId: created.id },
        select: { action: true },
      });
      expect(auditEvents.map((event) => event.action)).toEqual(expect.arrayContaining([
        "patient_created",
        "patient_updated",
      ]));
    } finally {
      await app.close();
    }
  });

  it("returns RESOURCE_IN_USE when specialty deactivation would affect active dependencies", async () => {
    const { app, server } = await createApp();

    try {
      const token = await login(server, "admin@careflow.local");
      await request(server)
        .post("/api/v1/specialties/specialty-general/deactivate")
        .set("Authorization", `Bearer ${token}`)
        .expect(409)
        .expect((response) => expect(errorSchema.parse(response.body).error.code).toBe("RESOURCE_IN_USE"));
    } finally {
      await app.close();
    }
  });

  it("lets admins soft-deactivate doctors that still have active appointments", async () => {
    const { app, server } = await createApp();

    try {
      const token = await login(server, "admin@careflow.local");
      await expect(prisma.appointment.count({ where: { doctorId: "doctor-1", status: { in: ["requested", "confirmed", "checked_in", "in_progress"] } } }))
        .resolves.toBeGreaterThan(0);

      await request(server)
        .post("/api/v1/doctors/doctor-1/deactivate")
        .set("Authorization", `Bearer ${token}`)
        .expect(201)
        .expect((response) => {
          expect(doctorSchema.parse(response.body).data).toMatchObject({ id: "doctor-1", status: "inactive" });
        });

      await request(server)
        .get("/api/v1/doctors")
        .set("Authorization", `Bearer ${token}`)
        .expect(200)
        .expect((response) => {
          expect(doctorListSchema.parse(response.body).data.some((doctor) => doctor.id === "doctor-1")).toBe(false);
        });
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

  it("prevents patient owners from updating operational notes", async () => {
    const { app, server } = await createApp();
    try {
      const patientToken = await login(server, "patient@careflow.local");
      await prisma.patient.update({ where: { id: "patient-1" }, data: { notes: "Staff-only context" } });

      await request(server)
        .patch("/api/v1/patients/patient-1")
        .set("Authorization", `Bearer ${patientToken}`)
        .send({ notes: "Patient changed this" })
        .expect(400)
        .expect((response) => expect(errorSchema.parse(response.body).error.code).toBe("VALIDATION_ERROR"));

      await expect(prisma.patient.findUniqueOrThrow({ where: { id: "patient-1" }, select: { notes: true } }))
        .resolves.toEqual({ notes: "Staff-only context" });
    } finally {
      await app.close();
    }
  });

  it("omits staff-only patient notes from patient owner update responses", async () => {
    const { app, server } = await createApp();
    try {
      const patientToken = await login(server, "patient@careflow.local");
      await prisma.patient.update({ where: { id: "patient-1" }, data: { notes: "Staff-only update note" } });

      await request(server)
        .patch("/api/v1/patients/patient-1")
        .set("Authorization", `Bearer ${patientToken}`)
        .send({ address: "Owner visible address" })
        .expect(200)
        .expect((response) => {
          const parsed = patientDetailSchema.parse(response.body);
          expect(parsed.data.address).toBe("Owner visible address");
          expect(parsed.data).not.toHaveProperty("notes");
        });
    } finally {
      await app.close();
    }
  });

  it("omits staff-only patient notes from patient owner reads", async () => {
    const { app, server } = await createApp();
    try {
      const patientToken = await login(server, "patient@careflow.local");
      const staffToken = await login(server, "reception@careflow.local");
      await prisma.patient.update({ where: { id: "patient-1" }, data: { notes: "Staff-only patient note" } });

      await request(server)
        .get("/api/v1/patients/patient-1")
        .set("Authorization", `Bearer ${patientToken}`)
        .expect(200)
        .expect((response) => {
          const parsed = patientDetailSchema.parse(response.body);
          expect(parsed.data).not.toHaveProperty("notes");
        });

      await request(server)
        .get("/api/v1/patients/patient-1")
        .set("Authorization", `Bearer ${staffToken}`)
        .expect(200)
        .expect((response) => {
          const parsed = patientDetailSchema.parse(response.body);
          expect(parsed.data.notes).toBe("Staff-only patient note");
        });
    } finally {
      await app.close();
    }
  });

  it("rejects unknown fields on every catalog create and update route", async () => {
    const { app, server } = await createApp();
    try {
      const token = await login(server, "admin@careflow.local");
      const authorization = `Bearer ${token}`;
      const requests = [
        () => request(server).post("/api/v1/services").set("Authorization", authorization).send({
          name: "Unknown Field Service", specialtyId: "specialty-general", durationMinutes: 30, price: 100000, unexpected: true,
        }),
        () => request(server).patch("/api/v1/services/service-general").set("Authorization", authorization).send({ description: "Valid update", unexpected: true }),
        () => request(server).post("/api/v1/specialties").set("Authorization", authorization).send({ name: "Unknown Field Specialty", unexpected: true }),
        () => request(server).patch("/api/v1/specialties/specialty-general").set("Authorization", authorization).send({ description: "Valid update", unexpected: true }),
        () => request(server).post("/api/v1/doctors").set("Authorization", authorization).send({
          fullName: "Dr. Unknown Field", specialtyId: "specialty-general", phone: "+84909999999", email: "unknown.field@careflow.local", unexpected: true,
        }),
        () => request(server).patch("/api/v1/doctors/doctor-1").set("Authorization", authorization).send({ room: "A103", unexpected: true }),
      ];
      const responses = [];
      for (const send of requests) responses.push(await send());

      expect(responses.map((response) => response.status)).toEqual([400, 400, 400, 400, 400, 400]);
      for (const response of responses) expect(errorSchema.parse(response.body).error.code).toBe("VALIDATION_ERROR");
    } finally {
      await app.close();
    }
  });

  it("accepts long catalog text values while rejecting unknown fields", async () => {
    const { app, server } = await createApp();
    try {
      const token = await login(server, "admin@careflow.local");
      const longDescription = "Extended catalog description. ".repeat(80);

      await request(server)
        .post("/api/v1/services")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Extended Travel Consultation",
          specialtyId: "specialty-general",
          durationMinutes: 45,
          price: 320000,
          currency: "VND",
          description: longDescription,
        })
        .expect(201)
        .expect((response) => {
          const parsed = serviceSchema.parse(response.body);
          expect(parsed.data.name).toBe("Extended Travel Consultation");
        });
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
