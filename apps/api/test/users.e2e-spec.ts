import { Test } from "@nestjs/testing";
import { AccountStatus, PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import request from "supertest";
import type { App } from "supertest/types";
import { z } from "zod";
import { AppModule } from "../src/app.module";

const loginResponseSchema = z.object({
  data: z.object({
    currentUser: z.object({ id: z.string(), email: z.string(), role: z.string(), status: z.string() }),
    sessionToken: z.string().min(1),
  }),
});

const errorResponseSchema = z.object({
  error: z.object({ code: z.string(), message: z.string() }),
});

const userResponseSchema = z.object({
  data: z.object({
    id: z.string(),
    displayName: z.string(),
    email: z.string(),
    phone: z.string().nullable(),
    role: z.string(),
    status: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    linkedProfile: z.object({ type: z.string(), id: z.string() }).nullable(),
  }).strict(),
});

const usersListResponseSchema = z.object({
  data: z.array(userResponseSchema.shape.data),
  meta: z.object({ page: z.number(), pageSize: z.number(), total: z.number(), requestId: z.string() }),
});

const resetPasswordResponseSchema = z.object({
  data: z.object({ temporaryPassword: z.string().min(8) }),
});

const passwordHash = "$2a$10$c1VsAHp3ekzMRZ.TnR0uSu89qTaTlpJmq1tVRFQirbbDBHvIyxrfO";

describe("User account administration", () => {
  const prisma = new PrismaClient();

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

  async function login(server: App, email: string, password: string) {
    const response = await request(server).post("/api/v1/auth/login").send({ email, password }).expect(201);
    return loginResponseSchema.parse(response.body).data;
  }

  async function loginAdmin(server: App) {
    return login(server, "admin@careflow.local", "careflow-demo");
  }

  async function createTestUser(label: string, role = UserRole.patient) {
    const suffix = `${label}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const email = `${suffix}@example.test`;
    const phone = `+849${Math.floor(Math.random() * 9_000_000_000 + 1_000_000_000)}`;
    const user = await prisma.user.create({
      data: {
        displayName: `Account ${label}`,
        email,
        phone,
        passwordHash,
        role,
        status: AccountStatus.active,
        ...(role === UserRole.patient
          ? { patient: { create: { fullName: `Account ${label}`, email, phone, status: AccountStatus.active } } }
          : {}),
      },
      include: { patient: true },
    });
    return { ...user, password: "custom-password" };
  }

  async function deleteTestUser(id: string) {
    await prisma.user.delete({ where: { id } });
  }

  it("lists and retrieves users with admin-only filters and no password hash", async () => {
    const { app, server } = await createApp();
    const user = await createTestUser("filterable");

    try {
      const admin = await loginAdmin(server);
      const authorization = `Bearer ${admin.sessionToken}`;

      for (const query of [
        { role: "patient" },
        { status: "active" },
        { q: user.email },
      ]) {
        const response = await request(server).get("/api/v1/users").query(query).set("Authorization", authorization).expect(200);
        const body = usersListResponseSchema.parse(response.body);
        expect(body.data.some((item) => item.id === user.id)).toBe(true);
      }

      const detailResponse = await request(server).get(`/api/v1/users/${user.id}`).set("Authorization", authorization).expect(200);
      const detail = userResponseSchema.parse(detailResponse.body).data;
      expect(detail).toMatchObject({
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        phone: user.phone,
        role: "patient",
        status: "active",
        linkedProfile: { type: "patient", id: user.patient?.id },
      });
    } finally {
      await deleteTestUser(user.id);
      await app.close();
    }
  });

  it("rejects non-admin access to account administration", async () => {
    const { app, server } = await createApp();

    try {
      const receptionist = await login(server, "reception@careflow.local", "careflow-demo");
      const response = await request(server)
        .get("/api/v1/users")
        .set("Authorization", `Bearer ${receptionist.sessionToken}`)
        .expect(403);
      expect(errorResponseSchema.parse(response.body).error.code).toBe("FORBIDDEN");
    } finally {
      await app.close();
    }
  });

  it("locks and unlocks another user while revoking the locked user's active sessions", async () => {
    const { app, server } = await createApp();
    const user = await createTestUser("lockable");

    try {
      const admin = await loginAdmin(server);
      const target = await login(server, user.email, user.password);
      const authorization = `Bearer ${admin.sessionToken}`;

      await request(server).post(`/api/v1/users/${user.id}/lock`).set("Authorization", authorization).expect(201);

      await request(server).get("/api/v1/auth/me").set("Authorization", `Bearer ${target.sessionToken}`).expect(401);
      await request(server).post("/api/v1/auth/login").send({ email: user.email, password: user.password }).expect(401);
      await expect(prisma.authSession.findMany({ where: { userId: user.id, revokedAt: null } })).resolves.toHaveLength(0);

      await request(server).post(`/api/v1/users/${user.id}/unlock`).set("Authorization", authorization).expect(201);
      await request(server).post("/api/v1/auth/login").send({ email: user.email, password: user.password }).expect(201);
    } finally {
      await deleteTestUser(user.id);
      await app.close();
    }
  });

  it("rejects self-lock and self-deactivation", async () => {
    const { app, server } = await createApp();

    try {
      const admin = await loginAdmin(server);
      const authorization = `Bearer ${admin.sessionToken}`;

      for (const action of ["lock", "deactivate"]) {
        const response = await request(server).post(`/api/v1/users/${admin.currentUser.id}/${action}`).set("Authorization", authorization).expect(400);
        expect(errorResponseSchema.parse(response.body).error.code).toBe("VALIDATION_ERROR");
      }
    } finally {
      await app.close();
    }
  });

  it("deactivates a user and revokes the user's active sessions", async () => {
    const { app, server } = await createApp();
    const user = await createTestUser("deactivatable");

    try {
      const admin = await loginAdmin(server);
      const target = await login(server, user.email, user.password);

      await request(server)
        .post(`/api/v1/users/${user.id}/deactivate`)
        .set("Authorization", `Bearer ${admin.sessionToken}`)
        .expect(201);

      await request(server).get("/api/v1/auth/me").set("Authorization", `Bearer ${target.sessionToken}`).expect(401);
      await expect(prisma.user.findUniqueOrThrow({ where: { id: user.id } })).resolves.toMatchObject({ status: "inactive" });
      await expect(prisma.authSession.findMany({ where: { userId: user.id, revokedAt: null } })).resolves.toHaveLength(0);
    } finally {
      await deleteTestUser(user.id);
      await app.close();
    }
  });

  it("resets a password with a response-only temporary password and revokes active sessions", async () => {
    const { app, server } = await createApp();
    const user = await createTestUser("resettable");

    try {
      const admin = await loginAdmin(server);
      const target = await login(server, user.email, user.password);
      const response = await request(server)
        .post(`/api/v1/users/${user.id}/reset-password`)
        .set("Authorization", `Bearer ${admin.sessionToken}`)
        .expect(201);
      const temporaryPassword = resetPasswordResponseSchema.parse(response.body).data.temporaryPassword;

      const updatedUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
      const resetAudit = await prisma.auditEvent.findFirstOrThrow({
        where: { entityType: "user", entityId: user.id, action: "admin_password_reset" },
        orderBy: { timestamp: "desc" },
      });
      expect(updatedUser.passwordHash).not.toContain(temporaryPassword);
      await expect(bcrypt.compare(temporaryPassword, updatedUser.passwordHash)).resolves.toBe(true);
      expect(JSON.stringify(resetAudit.metadata)).not.toContain(temporaryPassword);
      await request(server).get("/api/v1/auth/me").set("Authorization", `Bearer ${target.sessionToken}`).expect(401);
      await request(server).post("/api/v1/auth/login").send({ email: user.email, password: user.password }).expect(401);
      await request(server).post("/api/v1/auth/login").send({ email: user.email, password: temporaryPassword }).expect(201);
    } finally {
      await deleteTestUser(user.id);
      await app.close();
    }
  });
});
