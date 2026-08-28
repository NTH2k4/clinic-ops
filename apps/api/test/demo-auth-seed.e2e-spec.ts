import { AccountStatus, PrismaClient, UserRole } from "@prisma/client";
import { ensureDemoAuthUsers } from "../src/config/demo-auth-repair";

describe("Demo auth seed", () => {
  const prisma = new PrismaClient();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("preserves existing demo account credentials and lifecycle while creating missing users", async () => {
    const originalAdmin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@careflow.local" } });
    const originalNurse = await prisma.user.findUniqueOrThrow({ where: { email: "nurse@careflow.local" } });
    const nurseStaff = await prisma.staff.findUniqueOrThrow({ where: { userId: originalNurse.id } });

    try {
      await prisma.user.update({
        where: { id: originalAdmin.id },
        data: { passwordHash: "stale-hash", role: UserRole.receptionist, status: AccountStatus.locked },
      });
      await prisma.staff.update({ where: { id: nurseStaff.id }, data: { userId: null } });
      await prisma.user.delete({ where: { id: originalNurse.id } });

      await ensureDemoAuthUsers(prisma);

      await expect(prisma.user.findUniqueOrThrow({ where: { id: originalAdmin.id } })).resolves.toMatchObject({
        passwordHash: "stale-hash",
        role: UserRole.receptionist,
        status: AccountStatus.locked,
      });
      await expect(prisma.user.findUniqueOrThrow({ where: { id: originalNurse.id } })).resolves.toMatchObject({
        email: "nurse@careflow.local",
        role: UserRole.nurse,
        status: AccountStatus.active,
      });
    } finally {
      await prisma.user.update({
        where: { id: originalAdmin.id },
        data: {
          passwordHash: originalAdmin.passwordHash,
          role: originalAdmin.role,
          status: originalAdmin.status,
        },
      });
      await prisma.staff.update({ where: { id: nurseStaff.id }, data: { userId: originalNurse.id } });
    }
  });
});
