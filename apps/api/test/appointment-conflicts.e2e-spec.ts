import { PrismaClient } from "@prisma/client";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { AppointmentConflictsService } from "../src/appointments/appointment-conflicts.service";
import { PrismaService } from "../src/prisma/prisma.service";

const execFileAsync = promisify(execFile);
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) throw new Error("DATABASE_URL is required for appointment conflict e2e tests.");

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

  it("covers an appointment that crosses contiguous working schedule blocks", async () => {
    const effectiveDate = new Date("2026-08-24T00:00:00.000Z");
    await prisma.doctorSchedule.deleteMany({ where: { doctorId: "doctor-1", effectiveFrom: effectiveDate } });
    await prisma.doctorSchedule.createMany({
      data: [
        { id: "schedule-doctor-1-morning", doctorId: "doctor-1", dayOfWeek: 1, startTime: "08:00", endTime: "12:00", effectiveFrom: effectiveDate, effectiveTo: effectiveDate, type: "working", status: "active" },
        { id: "schedule-doctor-1-afternoon", doctorId: "doctor-1", dayOfWeek: 1, startTime: "12:00", endTime: "17:00", effectiveFrom: effectiveDate, effectiveTo: effectiveDate, type: "working", status: "active" },
      ],
    });

    const slot = await conflicts.assertSlotAvailable({
      doctorId: "doctor-1",
      serviceId: "service-general",
      startAt: new Date("2026-08-24T04:45:00.000Z"),
    });

    expect(slot.endAt.toISOString()).toBe("2026-08-24T05:15:00.000Z");
  });

  it("uses the caller transaction when checking a slot", async () => {
    await prisma.$transaction(async (transaction) => {
      await transaction.appointment.create({
        data: {
          id: "transaction-appointment",
          patientId: "patient-1",
          doctorId: "doctor-1",
          serviceId: "service-general",
          startAt: new Date("2026-08-24T08:00:00.000Z"),
          endAt: new Date("2026-08-24T08:30:00.000Z"),
          status: "confirmed",
          createdByUserId: "user-receptionist-1",
        },
      });

      await expect(conflicts.assertSlotAvailable({
        doctorId: "doctor-1",
        serviceId: "service-general",
        startAt: new Date("2026-08-24T08:15:00.000Z"),
        transaction,
      })).rejects.toMatchObject({ statusCode: 409, code: "APPOINTMENT_CONFLICT" });
    });
  });
});
