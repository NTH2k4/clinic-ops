import { PrismaClient } from "@prisma/client";

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
});
