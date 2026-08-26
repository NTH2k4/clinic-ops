import { Controller, Get, UseGuards } from "@nestjs/common";
import { Test } from "@nestjs/testing";
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

describe("Auth and RBAC", () => {
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

  it("logs in and returns the current user", async () => {
    const { app, server } = await createApp();

    try {
      await request(server)
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
    } finally {
      await app.close();
    }
  });

  it("rejects unauthenticated current-user requests", async () => {
    const { app, server } = await createApp();

    try {
      await request(server)
        .get("/api/v1/auth/me")
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
});
