import { Test } from "@nestjs/testing";
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

const errorSchema = z.object({
  error: z.object({ code: z.string() }),
  meta: z.object({ requestId: z.string().min(1) }),
});

describe("Catalog resources", () => {
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

  it("lets an admin create and deactivate a service", async () => {
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
        .post(`/api/v1/services/${created.data.id}/deactivate`)
        .set("Authorization", `Bearer ${token}`)
        .expect(201)
        .expect((response) => {
          const parsed = serviceSchema.parse(response.body);
          expect(parsed.data.status).toBe("inactive");
        });

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
});
