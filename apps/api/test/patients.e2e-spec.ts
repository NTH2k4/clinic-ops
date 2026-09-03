import { Test } from "@nestjs/testing";
import { PrismaClient } from "@prisma/client";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import request from "supertest";
import type { App } from "supertest/types";
import { z } from "zod";
import { AppModule } from "../src/app.module";

const execFileAsync = promisify(execFile);
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) throw new Error("DATABASE_URL is required for patient e2e tests.");

const loginSchema = z.object({ data: z.object({ sessionToken: z.string().min(1) }) });
const patientDetailSchema = z.object({
  data: z.object({
    id: z.string(),
    fullName: z.string(),
    phone: z.string(),
    citizenIdNumber: z.string().nullable().optional(),
    healthInsuranceNumber: z.string().nullable().optional(),
    maskedCitizenIdNumber: z.string().nullable().optional(),
    maskedHealthInsuranceNumber: z.string().nullable().optional(),
  }).passthrough(),
});
const patientListSchema = z.object({
  data: z.array(z.object({
    id: z.string(),
    fullName: z.string(),
    phone: z.string(),
    citizenIdNumber: z.string().optional(),
    healthInsuranceNumber: z.string().optional(),
    maskedCitizenIdNumber: z.string().nullable().optional(),
    maskedHealthInsuranceNumber: z.string().nullable().optional(),
  }).passthrough()),
});

describe("Patient identity workflows", () => {
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
    const response = await request(server)
      .post("/api/v1/auth/login")
      .send({ email, password: "careflow-demo" })
      .expect(201);
    return loginSchema.parse(response.body).data.sessionToken;
  }

  it("allows staff to create and find a patient by CCCD while masking list output", async () => {
    const { app, server } = await createApp();
    try {
      const token = await login(server, "reception@careflow.local");
      const createdResponse = await request(server)
        .post("/api/v1/patients")
        .set("Authorization", `Bearer ${token}`)
        .send({
          fullName: "Nguyen Van Walkin",
          phone: "+84930000111",
          citizenIdNumber: "079203000111",
          dateOfBirth: "1990-02-03",
          address: "12 Tran Hung Dao, Ho Chi Minh City",
        })
        .expect(201);
      const created = patientDetailSchema.parse(createdResponse.body).data;

      expect(created.citizenIdNumber).toBe("079203000111");
      expect(created.maskedCitizenIdNumber).toBe("********0111");

      const listedResponse = await request(server)
        .get("/api/v1/patients?q=079203000111")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
      const listed = patientListSchema.parse(listedResponse.body).data;

      expect(listed).toHaveLength(1);
      expect(listed[0]).toMatchObject({
        id: created.id,
        fullName: "Nguyen Van Walkin",
        maskedCitizenIdNumber: "********0111",
      });
      expect(listed[0].citizenIdNumber).toBeUndefined();
    } finally {
      await app.close();
    }
  });

  it("allows staff to create an under-14 fallback identity with guardian contact", async () => {
    const { app, server } = await createApp();
    try {
      const token = await login(server, "reception@careflow.local");
      const createdResponse = await request(server)
        .post("/api/v1/patients")
        .set("Authorization", `Bearer ${token}`)
        .send({
          fullName: "Le Minh Nhi",
          phone: "+84930000112",
          dateOfBirth: "2018-05-12",
          address: "Ward 1, District 3, Ho Chi Minh City",
          guardianName: "Le Van Guardian",
          guardianPhone: "+84930000113",
          identityDocumentType: "guardian_verified",
        })
        .expect(201);
      const created = patientDetailSchema.parse(createdResponse.body).data;

      expect(created.fullName).toBe("Le Minh Nhi");

      const listedResponse = await request(server)
        .get("/api/v1/patients?q=Le Van Guardian")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
      const listed = patientListSchema.parse(listedResponse.body).data;

      expect(listed.map((patient) => patient.id)).toContain(created.id);
    } finally {
      await app.close();
    }
  });
});
