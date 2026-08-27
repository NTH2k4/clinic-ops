import { Test } from "@nestjs/testing";
import { AccountStatus, PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";
import request from "supertest";
import type { App } from "supertest/types";
import { z } from "zod";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

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
  const sessionTokens = new Set<string>();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  afterEach(async () => {
    await prisma.authSession.deleteMany({
      where: { tokenHash: { in: [...sessionTokens].map((token) => createHash("sha256").update(token).digest("hex")) } },
    });
    sessionTokens.clear();
  });

  function prismaWithUserLookupHook(afterUserLookup: (user: { id: string } | null) => Promise<void>) {
    const controlledPrisma = {} as PrismaService;
    Object.setPrototypeOf(controlledPrisma, prisma);
    const controlledUser = {} as typeof prisma.user;
    Object.setPrototypeOf(controlledUser, prisma.user);
    Object.defineProperty(controlledUser, "findUnique", {
      value: async (args: Parameters<typeof prisma.user.findUnique>[0]) => {
        const user = await prisma.user.findUnique(args);
        await afterUserLookup(user);
        return user;
      },
    });
    Object.defineProperty(controlledPrisma, "user", { value: controlledUser });
    Object.defineProperty(controlledPrisma, "$transaction", { value: prisma.$transaction.bind(prisma) });
    return controlledPrisma;
  }

  async function createApp(afterUserLookup?: (user: { id: string } | null) => Promise<void>) {
    const moduleBuilder = Test.createTestingModule({ imports: [AppModule] });
    if (afterUserLookup) {
      moduleBuilder.overrideProvider(PrismaService).useValue(prismaWithUserLookupHook(afterUserLookup));
    }
    const moduleRef = await moduleBuilder.compile();
    const app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1");
    await app.init();
    return { app, server: app.getHttpServer() as App };
  }

  async function login(server: App, email: string, password: string) {
    const response = await request(server).post("/api/v1/auth/login").send({ email, password }).expect(201);
    const result = loginResponseSchema.parse(response.body).data;
    sessionTokens.add(result.sessionToken);
    return result;
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
    await prisma.$transaction(async (transaction) => {
      await transaction.authSession.deleteMany({ where: { userId: id } });
      await transaction.auditEvent.deleteMany({ where: { OR: [{ actorUserId: id }, { entityType: "user", entityId: id }] } });
      await transaction.patient.deleteMany({ where: { userId: id } });
      await transaction.staff.deleteMany({ where: { userId: id } });
      await transaction.doctor.deleteMany({ where: { userId: id } });
      await transaction.user.delete({ where: { id } });
    });
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

  it("rejects malformed user ids before account lifecycle handlers run", async () => {
    const { app, server } = await createApp();

    try {
      const admin = await loginAdmin(server);
      const authorization = `Bearer ${admin.sessionToken}`;

      const detailResponse = await request(server).get("/api/v1/users/bad%20id").set("Authorization", authorization).expect(400);
      expect(errorResponseSchema.parse(detailResponse.body).error.code).toBe("VALIDATION_ERROR");

      for (const path of [
        "/api/v1/users/bad%20id/lock",
        "/api/v1/users/bad%20id/unlock",
        "/api/v1/users/bad%20id/deactivate",
        "/api/v1/users/bad%20id/reset-password",
      ]) {
        const response = await request(server).post(path).set("Authorization", authorization).expect(400);
        expect(errorResponseSchema.parse(response.body).error.code).toBe("VALIDATION_ERROR");
      }
    } finally {
      await app.close();
    }
  });

  it("does not unlock or lock an inactive user", async () => {
    const { app, server } = await createApp();
    const user = await createTestUser("inactive-transition");

    try {
      const admin = await loginAdmin(server);
      const authorization = `Bearer ${admin.sessionToken}`;

      await request(server).post(`/api/v1/users/${user.id}/deactivate`).set("Authorization", authorization).expect(201);

      for (const action of ["unlock", "lock"]) {
        const response = await request(server).post(`/api/v1/users/${user.id}/${action}`).set("Authorization", authorization).expect(400);
        expect(errorResponseSchema.parse(response.body).error.code).toBe("INVALID_STATUS_TRANSITION");
      }

      await expect(prisma.user.findUniqueOrThrow({ where: { id: user.id } })).resolves.toMatchObject({ status: "inactive" });
    } finally {
      await deleteTestUser(user.id);
      await app.close();
    }
  });

  it("rolls back account status changes when the required audit insert fails", async () => {
    const { app, server } = await createApp();
    const user = await createTestUser("audit-rollback");

    try {
      const admin = await loginAdmin(server);
      await prisma.$executeRawUnsafe(`
        CREATE OR REPLACE FUNCTION careflow_test_reject_user_lock_audit()
        RETURNS TRIGGER AS $$
        BEGIN
          IF NEW."entityType" = 'user' AND NEW."entityId" = '${user.id}' AND NEW."action" = 'admin_user_locked' THEN
            RAISE EXCEPTION 'rejecting test audit event';
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TRIGGER careflow_test_reject_user_lock_audit
        BEFORE INSERT ON "AuditEvent"
        FOR EACH ROW EXECUTE FUNCTION careflow_test_reject_user_lock_audit()
      `);

      await request(server)
        .post(`/api/v1/users/${user.id}/lock`)
        .set("Authorization", `Bearer ${admin.sessionToken}`)
        .expect(500);

      await expect(prisma.user.findUniqueOrThrow({ where: { id: user.id } })).resolves.toMatchObject({ status: "active" });
      await expect(prisma.auditEvent.findMany({ where: { entityType: "user", entityId: user.id, action: "admin_user_locked" } })).resolves.toHaveLength(0);
    } finally {
      await prisma.$executeRawUnsafe('DROP TRIGGER IF EXISTS careflow_test_reject_user_lock_audit ON "AuditEvent"');
      await prisma.$executeRawUnsafe('DROP FUNCTION IF EXISTS careflow_test_reject_user_lock_audit()');
      await deleteTestUser(user.id);
      await app.close();
    }
  });

  it("does not create a session after an admin locks the user between login lookup and session creation", async () => {
    const user = await createTestUser("lock-race");
    const serverRef: { current?: App } = {};
    let adminAuthorization = "";
    let lockTriggered = false;
    const { app, server: createdServer } = await createApp(async (lookedUpUser) => {
      if (lockTriggered || lookedUpUser?.id !== user.id) return;
      if (!serverRef.current) throw new Error("Test server was not initialized.");
      lockTriggered = true;
      await request(serverRef.current).post(`/api/v1/users/${user.id}/lock`).set("Authorization", adminAuthorization).expect(201);
    });
    serverRef.current = createdServer;

    try {
      const admin = await loginAdmin(createdServer);
      adminAuthorization = `Bearer ${admin.sessionToken}`;

      await request(createdServer).post("/api/v1/auth/login").send({ email: user.email, password: user.password }).expect(401);

      expect(lockTriggered).toBe(true);
      await expect(prisma.authSession.findMany({ where: { userId: user.id } })).resolves.toHaveLength(0);
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
