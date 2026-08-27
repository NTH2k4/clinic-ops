import { Controller, Get, HttpException, UseGuards } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { PrismaClient, UserRole } from "@prisma/client";
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
  error: z.object({ code: z.string() }),
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
