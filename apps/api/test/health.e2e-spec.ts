import { Test } from "@nestjs/testing";
import request from "supertest";
import type { App } from "supertest/types";
import { z } from "zod";
import { AppModule } from "../src/app.module";

const healthResponseSchema = z.object({
  data: z.object({
    status: z.literal("ok"),
  }),
  meta: z.object({
    requestId: z.string().min(1),
  }),
});

describe("HealthController", () => {
  it("returns the API success envelope", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1");
    await app.init();

    const server = app.getHttpServer() as App;

    await request(server)
      .get("/api/v1/health")
      .expect(200)
      .expect((response) => {
        const body: unknown = response.body;
        const parsed = healthResponseSchema.parse(body);
        expect(parsed.data).toEqual({ status: "ok" });
        expect(parsed.meta.requestId).toEqual(expect.any(String));
      });

    await app.close();
  });
});
