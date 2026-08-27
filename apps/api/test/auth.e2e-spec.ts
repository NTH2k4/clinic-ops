import { Controller, Get, HttpException, UseGuards } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import request from "supertest";
import type { App } from "supertest/types";
import { z } from "zod";
import { AppModule } from "../src/app.module";
import { Roles, RolesGuard } from "../src/common/roles";
import { SessionGuard } from "../src/auth/session.guard";

@Controller("admin-only")
class AdminOnlyController {
  @Get()
  @UseGuards(SessionGuard, RolesGuard)
  @Roles("admin")
  adminOnly() {
    return { data: { ok: true }, meta: { requestId: "test-request" } };
  }

  @Get("roles-only")
  @UseGuards(RolesGuard)
  @Roles("admin")
  rolesOnly() {
    return { data: { ok: true }, meta: { requestId: "test-request" } };
  }

  @Get("rate-limited")
  rateLimited() {
    throw new HttpException("Too many requests.", 429);
  }

  @Get("internal-error")
  internalError() {
    throw new HttpException("Unexpected failure.", 500);
  }
}

const loginResponseSchema = z.object({
  data: z.object({
    currentUser: z.object({
      email: z.string(),
      role: z.string(),
      status: z.string(),
    }),
    linkedProfile: z.unknown(),
    sessionToken: z.string().min(1),
  }),
  meta: z.object({ requestId: z.string().min(1) }),
});

const errorResponseSchema = z.object({
  error: z.object({ code: z.string(), message: z.string() }),
  meta: z.object({ requestId: z.string().min(1) }),
});

const emptySuccessResponseSchema = z.object({
  data: z.object({}),
  meta: z.object({ requestId: z.string().min(1) }),
});

const customPasswordHash = "$2a$10$c1VsAHp3ekzMRZ.TnR0uSu89qTaTlpJmq1tVRFQirbbDBHvIyxrfO";

describe("Auth and RBAC", () => {
  const prisma = new PrismaClient();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function createApp() {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [AdminOnlyController],
    }).compile();
    const app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1");
    await app.init();
    return { app, server: app.getHttpServer() as App };
  }

  async function findLatestAdminSession(sessionToken: string) {
    const session = await prisma.authSession.findFirstOrThrow({
      where: { user: { email: "admin@careflow.local" } },
      orderBy: { createdAt: "desc" },
    });
    expect(session.tokenHash).not.toBe(sessionToken);
    return session;
  }

  it("registers a public patient account and returns an auth session", async () => {
    const { app, server } = await createApp();
    const email = "new.patient@example.test";
    const phone = "+84919990001";

    try {
      await prisma.user.deleteMany({ where: { email } });
      await prisma.patient.deleteMany({ where: { phone } });

      const registerResponse = await request(server)
        .post("/api/v1/auth/register")
        .send({
          displayName: "Nguyen Patient",
          email,
          phone,
          password: "careflow-demo-123",
        })
        .expect(201)
        .expect((response) => {
          const body: unknown = response.body;
          const parsed = loginResponseSchema.parse(body);
          expect(parsed.data.currentUser).toMatchObject({
            email,
            role: "patient",
            status: "active",
          });
          expect(parsed.data.linkedProfile).toMatchObject({ type: "patient" });
          expect(parsed.data.sessionToken).toEqual(expect.any(String));
        });

      const registerBody: unknown = registerResponse.body;
      const registered = loginResponseSchema.parse(registerBody);
      const user = await prisma.user.findUniqueOrThrow({
        where: { email },
        include: { patient: true, authSessions: { orderBy: { createdAt: "desc" }, take: 1 } },
      });

      expect(user).toMatchObject({
        displayName: "Nguyen Patient",
        email,
        phone,
        role: UserRole.patient,
        status: "active",
      });
      expect(user.passwordHash).not.toBe("careflow-demo-123");
      expect(user.patient).toMatchObject({
        fullName: "Nguyen Patient",
        email,
        phone,
        status: "active",
      });
      expect(registered.data.linkedProfile).toEqual({ type: "patient", id: user.patient?.id });
      expect(user.authSessions).toHaveLength(1);
      expect(user.authSessions[0].tokenHash).not.toBe(registered.data.sessionToken);
    } finally {
      await prisma.user.deleteMany({ where: { email } });
      await prisma.patient.deleteMany({ where: { phone } });
      await app.close();
    }
  });

  it("rejects role injection during public patient registration", async () => {
    const { app, server } = await createApp();
    const email = "bad.role@example.test";
    const phone = "+84919990002";

    try {
      await prisma.user.deleteMany({ where: { email } });
      await prisma.patient.deleteMany({ where: { phone } });

      await request(server)
        .post("/api/v1/auth/register")
        .send({
          displayName: "Bad Role",
          email,
          phone,
          password: "careflow-demo-123",
          role: "admin",
        })
        .expect(400)
        .expect((response) => {
          const body: unknown = response.body;
          const parsed = errorResponseSchema.parse(body);
          expect(parsed.error.code).toBe("VALIDATION_ERROR");
        });

      await expect(prisma.user.findUnique({ where: { email } })).resolves.toBeNull();
      await expect(prisma.patient.findUnique({ where: { phone } })).resolves.toBeNull();
    } finally {
      await prisma.user.deleteMany({ where: { email } });
      await prisma.patient.deleteMany({ where: { phone } });
      await app.close();
    }
  });

  it("logs in and returns the current user", async () => {
    const { app, server } = await createApp();

    try {
      const loginResponse = await request(server)
        .post("/api/v1/auth/login")
        .send({ email: "admin@careflow.local", password: "careflow-demo" })
        .expect(201)
        .expect((response) => {
          const body: unknown = response.body;
          const parsed = loginResponseSchema.parse(body);
          expect(parsed.data.currentUser).toMatchObject({
            email: "admin@careflow.local",
            role: "admin",
            status: "active",
          });
          expect(parsed.data.sessionToken).toEqual(expect.any(String));
          expect(parsed.meta.requestId).toEqual(expect.any(String));
        });
      const loginBody: unknown = loginResponse.body;
      const login = loginResponseSchema.parse(loginBody);
      await findLatestAdminSession(login.data.sessionToken);
    } finally {
      await app.close();
    }
  });

  it("rejects unauthenticated current-user requests", async () => {
    const { app, server } = await createApp();

    try {
      await request(server)
        .get("/api/v1/auth/me")
        .set("x-request-id", "request-auth-error-1")
        .expect(401)
        .expect("x-request-id", "request-auth-error-1")
        .expect((response) => {
          const body: unknown = response.body;
          const parsed = errorResponseSchema.parse(body);
          expect(parsed.error.code).toBe("UNAUTHENTICATED");
          expect(parsed.meta.requestId).toBe("request-auth-error-1");
        });
    } finally {
      await app.close();
    }
  });

  it("verifies stored password hashes for login", async () => {
    const { app, server } = await createApp();
    const email = `custom-password-${Date.now()}@careflow.local`;

    try {
      await prisma.user.create({
        data: {
          displayName: "Custom Password User",
          email,
          passwordHash: customPasswordHash,
          role: UserRole.admin,
          status: "active",
        },
      });

      await request(server)
        .post("/api/v1/auth/login")
        .send({ email, password: "careflow-demo" })
        .expect(401)
        .expect((response) => {
          const body: unknown = response.body;
          const parsed = errorResponseSchema.parse(body);
          expect(parsed.error.code).toBe("UNAUTHENTICATED");
        });

      await request(server)
        .post("/api/v1/auth/login")
        .send({ email, password: "custom-password" })
        .expect(201)
        .expect((response) => {
          const body: unknown = response.body;
          const parsed = loginResponseSchema.parse(body);
          expect(parsed.data.currentUser.email).toBe(email);
        });
    } finally {
      await prisma.user.deleteMany({ where: { email } });
      await app.close();
    }
  });

  it("requires the current password and rejects an incorrect current password", async () => {
    const { app, server } = await createApp();
    const email = `password-change-validation-${Date.now()}@careflow.local`;

    try {
      await prisma.user.create({
        data: {
          displayName: "Password Change Validation User",
          email,
          passwordHash: customPasswordHash,
          role: UserRole.patient,
          status: "active",
        },
      });
      const loginResponse = await request(server)
        .post("/api/v1/auth/login")
        .send({ email, password: "custom-password" })
        .expect(201);
      const login = loginResponseSchema.parse(loginResponse.body);
      const authorization = `Bearer ${login.data.sessionToken}`;

      await request(server)
        .post("/api/v1/auth/change-password")
        .set("Authorization", authorization)
        .send({ newPassword: "custom-password-456" })
        .expect(400)
        .expect((response) => {
          const parsed = errorResponseSchema.parse(response.body);
          expect(parsed.error.code).toBe("VALIDATION_ERROR");
          expect(parsed.error.message).toBe("Request validation failed.");
        });

      await request(server)
        .post("/api/v1/auth/change-password")
        .set("Authorization", authorization)
        .send({ currentPassword: "custom-password", newPassword: "custom-password-456", extra: "not-allowed" })
        .expect(400)
        .expect((response) => {
          const parsed = errorResponseSchema.parse(response.body);
          expect(parsed.error.code).toBe("VALIDATION_ERROR");
          expect(parsed.error.message).toBe("Request validation failed.");
        });

      await request(server)
        .post("/api/v1/auth/change-password")
        .set("Authorization", authorization)
        .send({ currentPassword: "incorrect-password", newPassword: "custom-password-456" })
        .expect(401)
        .expect((response) => {
          const parsed = errorResponseSchema.parse(response.body);
          expect(parsed.error.code).toBe("UNAUTHENTICATED");
          expect(parsed.error.message).toBe("Current password is incorrect.");
        });
    } finally {
      await prisma.user.deleteMany({ where: { email } });
      await app.close();
    }
  });

  it("changes a password, revokes active sessions, and allows login with the new password", async () => {
    const { app, server } = await createApp();
    const email = `password-change-${Date.now()}@careflow.local`;
    const newPassword = "custom-password-456";

    try {
      await prisma.user.create({
        data: {
          displayName: "Password Change User",
          email,
          passwordHash: customPasswordHash,
          role: UserRole.patient,
          status: "active",
        },
      });
      const loginResponse = await request(server)
        .post("/api/v1/auth/login")
        .send({ email, password: "custom-password" })
        .expect(201);
      const login = loginResponseSchema.parse(loginResponse.body);
      const authorization = `Bearer ${login.data.sessionToken}`;
      const secondLoginResponse = await request(server)
        .post("/api/v1/auth/login")
        .send({ email, password: "custom-password" })
        .expect(201);
      const secondLogin = loginResponseSchema.parse(secondLoginResponse.body);
      const secondAuthorization = `Bearer ${secondLogin.data.sessionToken}`;

      await request(server)
        .post("/api/v1/auth/change-password")
        .set("Authorization", authorization)
        .send({ currentPassword: "custom-password", newPassword })
        .expect(201)
        .expect((response) => expect(emptySuccessResponseSchema.parse(response.body).data).toEqual({}));

      const userAfterChange = await prisma.user.findUniqueOrThrow({
        where: { email },
        include: { authSessions: true },
      });
      expect(userAfterChange.passwordHash).not.toBe(customPasswordHash);
      await expect(bcrypt.compare(newPassword, userAfterChange.passwordHash)).resolves.toBe(true);
      await expect(bcrypt.compare("custom-password", userAfterChange.passwordHash)).resolves.toBe(false);
      expect(userAfterChange.authSessions).not.toHaveLength(0);
      expect(userAfterChange.authSessions.every((session) => session.revokedAt !== null)).toBe(true);

      await request(server).get("/api/v1/auth/me").set("Authorization", authorization).expect(401);
      await request(server).get("/api/v1/auth/me").set("Authorization", secondAuthorization).expect(401);
      await request(server)
        .post("/api/v1/auth/login")
        .send({ email, password: "custom-password" })
        .expect(401);
      await request(server)
        .post("/api/v1/auth/login")
        .send({ email, password: newPassword })
        .expect(201)
        .expect((response) => expect(loginResponseSchema.parse(response.body).data.currentUser.email).toBe(email));
    } finally {
      await prisma.user.deleteMany({ where: { email } });
      await app.close();
    }
  });

  it("revokes a delayed old-password login session when the password changes concurrently", async () => {
    const { app, server } = await createApp();
    const email = `password-change-race-${Date.now()}@careflow.local`;
    const newPassword = "custom-password-456";

    try {
      await prisma.user.create({
        data: {
          displayName: "Password Change Race User",
          email,
          passwordHash: customPasswordHash,
          role: UserRole.patient,
          status: "active",
        },
      });
      const initialLoginResponse = await request(server)
        .post("/api/v1/auth/login")
        .send({ email, password: "custom-password" })
        .expect(201);
      const initialLogin = loginResponseSchema.parse(initialLoginResponse.body);
      const user = await prisma.user.findUniqueOrThrow({ where: { email } });
      const loginGateLockNamespace = 82461;
      const loginGateLockKey = Number.parseInt(user.id.slice(0, 8), 16) % 2_147_483_647;
      await prisma.$executeRawUnsafe('CREATE TABLE careflow_test_login_gate ("userId" TEXT PRIMARY KEY, "release" BOOLEAN NOT NULL DEFAULT FALSE)');
      await prisma.$executeRawUnsafe('INSERT INTO careflow_test_login_gate ("userId") VALUES ($1)', user.id);
      await prisma.$executeRawUnsafe(`
        CREATE OR REPLACE FUNCTION careflow_test_pause_auth_session_insert()
        RETURNS TRIGGER AS $$
        BEGIN
          IF NEW."userId" = '${user.id}' THEN
            PERFORM pg_advisory_xact_lock(${loginGateLockNamespace}, ${loginGateLockKey});
            WHILE NOT (SELECT "release" FROM careflow_test_login_gate WHERE "userId" = NEW."userId") LOOP
              PERFORM pg_sleep(0.01);
            END LOOP;
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TRIGGER careflow_test_pause_auth_session_insert
        BEFORE INSERT ON "AuthSession"
        FOR EACH ROW EXECUTE FUNCTION careflow_test_pause_auth_session_insert()
      `);
      const delayedLoginPromise = request(server)
        .post("/api/v1/auth/login")
        .send({ email, password: "custom-password" })
        .expect(201)
        .then((response) => response);
      let delayedLoginBackendPid: number | undefined;
      for (let attempt = 0; attempt < 50; attempt += 1) {
        const lockHolders = await prisma.$queryRaw<Array<{ pid: number }>>`
          SELECT pid
          FROM pg_locks
          WHERE locktype = 'advisory'
            AND classid::bigint = ${loginGateLockNamespace}
            AND objid::bigint = ${loginGateLockKey}
            AND objsubid = 2
            AND granted
        `;
        delayedLoginBackendPid = lockHolders[0]?.pid;
        if (delayedLoginBackendPid !== undefined) break;
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      expect(delayedLoginBackendPid).toEqual(expect.any(Number));
      if (delayedLoginBackendPid === undefined) throw new Error("Delayed login did not reach the test gate.");

      const passwordChangePromise = request(server)
        .post("/api/v1/auth/change-password")
        .set("Authorization", `Bearer ${initialLogin.data.sessionToken}`)
        .send({ currentPassword: "custom-password", newPassword })
        .expect(201)
        .then((response) => response);
      let changeReachedSecondSyncPoint = false;
      for (let attempt = 0; attempt < 50; attempt += 1) {
        const currentUser = await prisma.user.findUniqueOrThrow({
          where: { id: user.id },
          include: { authSessions: true },
        });
        if (currentUser.passwordHash !== customPasswordHash && currentUser.authSessions.some((session) => session.revokedAt !== null)) {
          changeReachedSecondSyncPoint = true;
          break;
        }
        const waitingChange = await prisma.$queryRaw<Array<{ waiting: boolean }>>`
          SELECT EXISTS (
            SELECT 1
            FROM pg_stat_activity activity
            WHERE activity.datname = current_database()
              AND activity.wait_event_type = 'Lock'
              AND activity.query LIKE 'UPDATE %"User"%passwordHash%'
              AND ${delayedLoginBackendPid}::integer = ANY(pg_blocking_pids(activity.pid))
          ) AS "waiting"
        `;
        if (waitingChange[0]?.waiting) {
          changeReachedSecondSyncPoint = true;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      expect(changeReachedSecondSyncPoint).toBe(true);
      await prisma.$executeRawUnsafe('UPDATE careflow_test_login_gate SET "release" = TRUE WHERE "userId" = $1', user.id);

      await passwordChangePromise;
      const delayedLoginResponse = await delayedLoginPromise;
      const delayedLogin = loginResponseSchema.parse(delayedLoginResponse.body);

      await request(server)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${delayedLogin.data.sessionToken}`)
        .expect(401);
    } finally {
      await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF to_regclass('careflow_test_login_gate') IS NOT NULL THEN
            UPDATE careflow_test_login_gate SET "release" = TRUE;
          END IF;
        END;
        $$
      `);
      await prisma.$executeRawUnsafe('DROP TRIGGER IF EXISTS careflow_test_pause_auth_session_insert ON "AuthSession"');
      await prisma.$executeRawUnsafe('DROP FUNCTION IF EXISTS careflow_test_pause_auth_session_insert()');
      await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS careflow_test_login_gate');
      await prisma.user.deleteMany({ where: { email } });
      await app.close();
    }
  });

  it.each([
    ["inactive", "inactive"],
    ["locked", "locked"],
  ] as const)("rejects %s account login", async (_label, status) => {
    const { app, server } = await createApp();
    const email = `${status}-account-${Date.now()}@careflow.local`;

    try {
      await prisma.user.create({
        data: {
          displayName: `${status} Account`,
          email,
          passwordHash: customPasswordHash,
          role: UserRole.admin,
          status,
        },
      });

      await request(server)
        .post("/api/v1/auth/login")
        .send({ email, password: "custom-password" })
        .expect(401)
        .expect((response) => {
          const body: unknown = response.body;
          const parsed = errorResponseSchema.parse(body);
          expect(parsed.error.code).toBe("UNAUTHENTICATED");
        });
    } finally {
      await prisma.user.deleteMany({ where: { email } });
      await app.close();
    }
  });

  it("rejects unauthenticated access to admin-only roles", async () => {
    const { app, server } = await createApp();

    try {
      await request(server)
        .get("/api/v1/admin-only/roles-only")
        .expect(401)
        .expect((response) => {
          const body: unknown = response.body;
          const parsed = errorResponseSchema.parse(body);
          expect(parsed.error.code).toBe("UNAUTHENTICATED");
          expect(parsed.meta.requestId).toEqual(expect.any(String));
        });
    } finally {
      await app.close();
    }
  });

  it("rejects receptionist access to admin-only routes", async () => {
    const { app, server } = await createApp();

    try {
      const loginResponse = await request(server)
        .post("/api/v1/auth/login")
        .send({ email: "reception@careflow.local", password: "careflow-demo" })
        .expect(201);
      const loginBody: unknown = loginResponse.body;
      const login = loginResponseSchema.parse(loginBody);

      await request(server)
        .get("/api/v1/admin-only")
        .set("Authorization", `Bearer ${login.data.sessionToken}`)
        .expect(403)
        .expect((response) => {
          const body: unknown = response.body;
          const parsed = errorResponseSchema.parse(body);
          expect(parsed.error.code).toBe("FORBIDDEN");
          expect(parsed.meta.requestId).toEqual(expect.any(String));
        });
    } finally {
      await app.close();
    }
  });

  it("preserves rate-limit and internal HttpException categories", async () => {
    const { app, server } = await createApp();

    try {
      await request(server)
        .get("/api/v1/admin-only/rate-limited")
        .expect(429)
        .expect((response) => expect(errorResponseSchema.parse(response.body).error.code).toBe("RATE_LIMITED"));
      await request(server)
        .get("/api/v1/admin-only/internal-error")
        .expect(500)
        .expect((response) => expect(errorResponseSchema.parse(response.body).error.code).toBe("INTERNAL_ERROR"));
    } finally {
      await app.close();
    }
  });

  it("revokes a session token at logout", async () => {
    const { app, server } = await createApp();

    try {
      const loginResponse = await request(server)
        .post("/api/v1/auth/login")
        .send({ email: "admin@careflow.local", password: "careflow-demo" })
        .expect(201);
      const loginBody: unknown = loginResponse.body;
      const login = loginResponseSchema.parse(loginBody);
      const authorization = `Bearer ${login.data.sessionToken}`;

      await request(server).post("/api/v1/auth/logout").set("Authorization", authorization).expect(201);

      await request(server)
        .get("/api/v1/auth/me")
        .set("Authorization", authorization)
        .expect(401)
        .expect((response) => {
          const body: unknown = response.body;
          const parsed = errorResponseSchema.parse(body);
          expect(parsed.error.code).toBe("UNAUTHENTICATED");
        });
    } finally {
      await app.close();
    }
  });

  it("keeps a session token valid after the API process restarts", async () => {
    const firstInstance = await createApp();
    let sessionToken: string;

    try {
      const loginResponse = await request(firstInstance.server)
        .post("/api/v1/auth/login")
        .send({ email: "admin@careflow.local", password: "careflow-demo" })
        .expect(201);
      const loginBody: unknown = loginResponse.body;
      const login = loginResponseSchema.parse(loginBody);
      sessionToken = login.data.sessionToken;
    } finally {
      await firstInstance.app.close();
    }

    const restartedInstance = await createApp();

    try {
      await request(restartedInstance.server)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${sessionToken}`)
        .expect(200)
        .expect((response) => {
          const body: unknown = response.body;
          const parsed = loginResponseSchema.omit({ data: true }).extend({
            data: loginResponseSchema.shape.data.omit({ sessionToken: true }),
          }).parse(body);
          expect(parsed.data.currentUser).toMatchObject({
            email: "admin@careflow.local",
            role: "admin",
            status: "active",
          });
        });
    } finally {
      await restartedInstance.app.close();
    }
  });

  it("rejects expired session tokens", async () => {
    const { app, server } = await createApp();

    try {
      const loginResponse = await request(server)
        .post("/api/v1/auth/login")
        .send({ email: "admin@careflow.local", password: "careflow-demo" })
        .expect(201);
      const loginBody: unknown = loginResponse.body;
      const login = loginResponseSchema.parse(loginBody);
      const authorization = `Bearer ${login.data.sessionToken}`;

      const storedSession = await findLatestAdminSession(login.data.sessionToken);
      await prisma.authSession.update({
        where: { id: storedSession.id },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      await request(server)
        .get("/api/v1/auth/me")
        .set("Authorization", authorization)
        .expect(401)
        .expect((response) => {
          const body: unknown = response.body;
          const parsed = errorResponseSchema.parse(body);
          expect(parsed.error.code).toBe("UNAUTHENTICATED");
        });
    } finally {
      await app.close();
    }
  });
});
