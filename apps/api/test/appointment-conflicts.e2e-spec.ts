import { PrismaClient } from "@prisma/client";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { AppointmentConflictsService } from "../src/appointments/appointment-conflicts.service";
import { PrismaService } from "../src/prisma/prisma.service";

const execFileAsync = promisify(execFile);
const databaseUrl = "postgresql://careflow:careflow@localhost:5432/careflow";

describe("AppointmentConflictsService", () => {
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  const conflicts = new AppointmentConflictsService(prisma as PrismaService);

  beforeEach(async () => {
    await execFileAsync(process.execPath, ["node_modules/tsx/dist/cli.mjs", "prisma/seed.ts"], {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: databaseUrl },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("rejects a slot outside the doctor's working hours", async () => {
    await expect(conflicts.assertSlotAvailable({
      doctorId: "doctor-1",
      serviceId: "service-general",
      startAt: new Date("2026-08-25T10:00:00.000Z"),
    })).rejects.toMatchObject({ statusCode: 409, code: "OUTSIDE_WORKING_HOURS" });
  });

  it("rejects a slot that overlaps an active appointment", async () => {
    await expect(conflicts.assertSlotAvailable({
      doctorId: "doctor-1",
      serviceId: "service-general",
      startAt: new Date("2026-08-24T01:15:00.000Z"),
    })).rejects.toMatchObject({ statusCode: 409, code: "APPOINTMENT_CONFLICT" });
  });

  it("allows a slot occupied only by a cancelled appointment", async () => {
    const slot = await conflicts.assertSlotAvailable({
      doctorId: "doctor-1",
      serviceId: "service-general",
      startAt: new Date("2026-08-24T06:00:00.000Z"),
    });

    expect(slot).toMatchObject({ doctor: { id: "doctor-1" }, service: { id: "service-general" } });
    expect(slot.endAt.toISOString()).toBe("2026-08-24T06:30:00.000Z");
  });

  it("assigns the first available doctor by id when doctorId is omitted", async () => {
    const slot = await conflicts.assertSlotAvailable({
      serviceId: "service-general",
      startAt: new Date("2026-08-24T08:00:00.000Z"),
    });

    expect(slot.doctor.id).toBe("doctor-1");
  });
});
