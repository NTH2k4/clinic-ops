import { Test } from "@nestjs/testing";
import { PrismaClient, UserRole } from "@prisma/client";
import request from "supertest";
import type { App } from "supertest/types";
import { z } from "zod";
import { AppModule } from "../src/app.module";
import { ensureDemoAuthUsers } from "../src/config/demo-auth-repair";

const loginResponseSchema = z.object({
  data: z.object({
    currentUser: z.object({
      email: z.string(),
      role: z.string(),
      status: z.string(),
    }),
    sessionToken: z.string().min(1),
  }),
});

describe("Demo auth seed repair", () => {
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

  it("repairs the admin demo login without resetting existing data", async () => {
    await prisma.user.upsert({
      where: { email: "admin@careflow.local" },
      update: { passwordHash: "stale-hash", status: "locked" },
      create: {
        id: "user-admin-1",
        displayName: "Admin Demo",
        email: "admin@careflow.local",
        passwordHash: "stale-hash",
        role: UserRole.admin,
        status: "locked",
      },
    });

    await ensureDemoAuthUsers(prisma);

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
        });
    } finally {
      await app.close();
    }
  });
});
