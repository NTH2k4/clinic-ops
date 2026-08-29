import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Test } from "@nestjs/testing";
import { NotificationType, PrismaClient } from "@prisma/client";
import request from "supertest";
import type { App } from "supertest/types";
import { z } from "zod";
import { AppModule } from "../src/app.module";

const execFileAsync = promisify(execFile);
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run audit-notifications e2e tests.");
}

const loginSchema = z.object({ data: z.object({ sessionToken: z.string().min(1) }) });
const auditListSchema = z.object({
  data: z.array(z.object({
    id: z.string(),
    actorUserId: z.string(),
    actorDisplayName: z.string(),
    entityType: z.string(),
    entityId: z.string(),
    entityDisplayName: z.string(),
    action: z.string(),
    timestamp: z.string(),
  })),
  meta: z.object({ requestId: z.string().min(1), page: z.number(), pageSize: z.number(), total: z.number() }),
});
const auditResponseSchema = z.object({ data: z.object({
  id: z.string(),
  actorUserId: z.string(),
  actorDisplayName: z.string(),
  entityId: z.string(),
  entityDisplayName: z.string(),
}) });
const notificationSchema = z.object({
  id: z.string(),
  recipientUserId: z.string(),
  type: z.nativeEnum(NotificationType),
  title: z.string(),
  message: z.string(),
  referenceType: z.string().nullable(),
  referenceId: z.string().nullable(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
});
const notificationListSchema = z.object({ data: z.array(notificationSchema), meta: z.object({ requestId: z.string().min(1), page: z.number(), pageSize: z.number(), total: z.number() }) });
const notificationResponseSchema = z.object({ data: notificationSchema, meta: z.object({ requestId: z.string().min(1) }) });
const errorSchema = z.object({ error: z.object({ code: z.string() }), meta: z.object({ requestId: z.string().min(1) }) });

describe("Audit events and notifications", () => {
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
    const response = await request(server).post("/api/v1/auth/login").send({ email, password: "careflow-demo" }).expect(201);
    return loginSchema.parse(response.body).data.sessionToken;
  }

  it("lets an admin filter audit events by entity type and action", async () => {
    await prisma.auditEvent.createMany({
      data: [
        { id: "audit-service-created", actorUserId: "user-admin-1", entityType: "service", entityId: "service-general", action: "admin_resource_created", timestamp: new Date("2026-08-25T00:00:00.000Z") },
        { id: "audit-service-updated", actorUserId: "user-admin-1", entityType: "service", entityId: "service-general", action: "admin_resource_updated", timestamp: new Date("2026-08-25T01:00:00.000Z") },
      ],
    });
    const { app, server } = await createApp();
    try {
      const adminToken = await login(server, "admin@careflow.local");

      await request(server)
        .get("/api/v1/audit-events?entityType=service&action=admin_resource_created")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200)
        .expect((response) => {
          const events = auditListSchema.parse(response.body).data;
          expect(events).toHaveLength(1);
          expect(events[0]).toMatchObject({
            id: "audit-service-created",
            actorDisplayName: "Admin Demo",
            entityType: "service",
            entityDisplayName: "Khám tổng quát",
            action: "admin_resource_created",
          });
        });
    } finally {
      await app.close();
    }
  });

  it("filters audit events by entity, actor, and time and returns detail", async () => {
    const { app, server } = await createApp();
    try {
      const adminToken = await login(server, "admin@careflow.local");
      await request(server)
        .get("/api/v1/audit-events?entityId=appointment-1&actorUserId=user-patient-1&from=2026-08-24T00:00:00.000Z&to=2026-08-24T02:00:00.000Z&pageSize=1")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200)
        .expect((response) => {
          const result = auditListSchema.parse(response.body);
          expect(result.data).toHaveLength(1);
          expect(result.data[0]?.entityId).toBe("appointment-1");
          expect(result.meta).toMatchObject({ page: 1, pageSize: 1, total: 1 });
        });

      await request(server)
        .get("/api/v1/audit-events/audit-1")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200)
        .expect((response) => expect(auditResponseSchema.parse(response.body).data).toMatchObject({
          id: "audit-1",
          actorUserId: "user-patient-1",
          actorDisplayName: "Patient Demo",
          entityDisplayName: "Patient Demo - Khám tổng quát",
        }));
    } finally {
      await app.close();
    }
  });

  it("forbids non-admin users from listing audit events", async () => {
    const { app, server } = await createApp();
    try {
      const patientToken = await login(server, "patient@careflow.local");

      await request(server)
        .get("/api/v1/audit-events")
        .set("Authorization", `Bearer ${patientToken}`)
        .expect(403)
        .expect((response) => expect(errorSchema.parse(response.body).error.code).toBe("FORBIDDEN"));
    } finally {
      await app.close();
    }
  });

  it("lists only notifications belonging to the current user", async () => {
    const { app, server } = await createApp();
    try {
      const patientToken = await login(server, "patient@careflow.local");

      await request(server)
        .get("/api/v1/notifications")
        .set("Authorization", `Bearer ${patientToken}`)
        .expect(200)
        .expect((response) => {
          const notifications = notificationListSchema.parse(response.body).data;
          expect(notifications.length).toBeGreaterThan(0);
          expect(notifications.every((notification) => notification.recipientUserId === "user-patient-1")).toBe(true);
        });
    } finally {
      await app.close();
    }
  });

  it("paginates notifications within the current user scope", async () => {
    const { app, server } = await createApp();
    try {
      const patientToken = await login(server, "patient@careflow.local");
      await request(server)
        .get("/api/v1/notifications?page=1&pageSize=2")
        .set("Authorization", `Bearer ${patientToken}`)
        .expect(200)
        .expect((response) => {
          const result = notificationListSchema.parse(response.body);
          expect(result.data).toHaveLength(2);
          expect(result.meta).toMatchObject({ page: 1, pageSize: 2, total: 4 });
        });
    } finally {
      await app.close();
    }
  });

  it("marks the current user's notification as read", async () => {
    const { app, server } = await createApp();
    try {
      const patientToken = await login(server, "patient@careflow.local");

      await request(server)
        .post("/api/v1/notifications/notification-3/read")
        .set("Authorization", `Bearer ${patientToken}`)
        .expect(201)
        .expect((response) => expect(notificationResponseSchema.parse(response.body).data.readAt).not.toBeNull());

      const notification = await prisma.notification.findUniqueOrThrow({ where: { id: "notification-3" }, select: { readAt: true } });
      expect(notification.readAt).toBeInstanceOf(Date);
      await request(server)
        .post("/api/v1/notifications/notification-2/read")
        .set("Authorization", `Bearer ${patientToken}`)
        .expect(404)
        .expect((response) => expect(errorSchema.parse(response.body).error.code).toBe("NOT_FOUND"));
    } finally {
      await app.close();
    }
  });

  it("marks all of the current user's notifications as read", async () => {
    const { app, server } = await createApp();
    try {
      const patientToken = await login(server, "patient@careflow.local");

      await request(server)
        .post("/api/v1/notifications/read-all")
        .set("Authorization", `Bearer ${patientToken}`)
        .expect(201);

      await expect(prisma.notification.count({ where: { recipientUserId: "user-patient-1", readAt: null } })).resolves.toBe(0);
      await expect(prisma.notification.count({ where: { recipientUserId: "user-receptionist-1", readAt: null } })).resolves.toBeGreaterThan(0);
    } finally {
      await app.close();
    }
  });
});
