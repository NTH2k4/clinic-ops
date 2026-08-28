import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

describe("Database schema", () => {
  const prisma = new PrismaClient();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("stores a seeded active doctor with specialty and services", async () => {
    const doctor = await prisma.doctor.findFirst({
      include: { specialty: true, services: true },
      where: { status: "active" },
    });

    expect(doctor?.specialty.name).toEqual(expect.any(String));
    expect(doctor?.services.length).toBeGreaterThan(0);
  });

  it("seeds memorable manual-test accounts and enough role data for manual QA", async () => {
    const expectedAccounts = [
      { email: "admin@test.com", password: "admin", role: "admin" },
      { email: "doctor@test.com", password: "doctor", role: "doctor" },
      { email: "receptionist@test.com", password: "receptionist", role: "receptionist" },
      { email: "nurse@test.com", password: "nurse", role: "nurse" },
      { email: "patient@test.com", password: "patient", role: "patient" },
    ];

    for (const account of expectedAccounts) {
      const user = await prisma.user.findUniqueOrThrow({ where: { email: account.email } });
      expect(user.role).toBe(account.role);
      await expect(bcrypt.compare(account.password, user.passwordHash)).resolves.toBe(true);
    }

    await expect(prisma.patient.count({ where: { status: "active" } })).resolves.toBeGreaterThanOrEqual(10);
    await expect(prisma.appointment.count()).resolves.toBeGreaterThanOrEqual(10);
    await expect(prisma.notification.count()).resolves.toBeGreaterThanOrEqual(10);
    await expect(prisma.doctorSchedule.count({ where: { doctorId: "doctor-test", status: "active" } })).resolves.toBeGreaterThanOrEqual(10);
    await expect(prisma.appointment.count({ where: { patientId: "patient-test" } })).resolves.toBeGreaterThanOrEqual(10);
  });
});
