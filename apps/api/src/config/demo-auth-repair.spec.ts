import { DemoAuthRepairService, shouldRepairDemoAuthUsers } from "./demo-auth-repair";

type UpsertCall = {
  where: { email: string };
  update: Record<string, never>;
};

describe("demo auth repair", () => {
  const originalServeWebApp = process.env.SERVE_WEB_APP;

  afterEach(() => {
    if (originalServeWebApp === undefined) {
      delete process.env.SERVE_WEB_APP;
      return;
    }
    process.env.SERVE_WEB_APP = originalServeWebApp;
  });

  it("runs only for hosted demo mode", () => {
    expect(shouldRepairDemoAuthUsers({ SERVE_WEB_APP: "true" })).toBe(true);
    expect(shouldRepairDemoAuthUsers({ SERVE_WEB_APP: "TRUE" })).toBe(true);
    expect(shouldRepairDemoAuthUsers({ SERVE_WEB_APP: "false" })).toBe(false);
    expect(shouldRepairDemoAuthUsers({})).toBe(false);
  });

  it("creates missing demo users without resetting existing users in hosted demo mode", async () => {
    process.env.SERVE_WEB_APP = "true";
    const prisma = {
      user: { upsert: jest.fn().mockResolvedValue({}) },
      specialty: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
      service: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
      staff: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
      doctor: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({}) },
      doctorSchedule: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
    };
    const service = new DemoAuthRepairService(prisma as never);

    await service.onApplicationBootstrap();

    expect(prisma.user.upsert).toHaveBeenCalledTimes(5);
    const calls = prisma.user.upsert.mock.calls as Array<[UpsertCall]>;
    const adminUpsert = calls.find(([call]) => call.where.email === "admin@careflow.local")?.[0];
    expect(adminUpsert?.update).toEqual({});
  });

  it("ensures demo catalog and schedules without resetting registered data in hosted demo mode", async () => {
    process.env.SERVE_WEB_APP = "true";
    const prisma = {
      user: { upsert: jest.fn().mockResolvedValue({}), deleteMany: jest.fn() },
      patient: { deleteMany: jest.fn() },
      specialty: { createMany: jest.fn().mockResolvedValue({ count: 3 }) },
      service: { createMany: jest.fn().mockResolvedValue({ count: 8 }) },
      staff: { createMany: jest.fn().mockResolvedValue({ count: 3 }) },
      doctor: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({}) },
      doctorSchedule: { createMany: jest.fn().mockResolvedValue({ count: 50 }) },
    };
    const service = new DemoAuthRepairService(prisma as never);

    await service.onApplicationBootstrap();

    expect(prisma.specialty.createMany).toHaveBeenCalledWith(
      expect.objectContaining({ skipDuplicates: true }),
    );
    expect(prisma.service.createMany).toHaveBeenCalledWith(expect.objectContaining({ skipDuplicates: true }));
    expect(prisma.staff.createMany).toHaveBeenCalledWith(expect.objectContaining({ skipDuplicates: true }));
    expect(prisma.doctor.create).toHaveBeenCalledTimes(5);
    expect(prisma.doctorSchedule.createMany).toHaveBeenCalledWith(
      expect.objectContaining({ skipDuplicates: true }),
    );
    expect(prisma.user.deleteMany).not.toHaveBeenCalled();
    expect(prisma.patient.deleteMany).not.toHaveBeenCalled();
  });

  it("does not touch users outside hosted demo mode", async () => {
    delete process.env.SERVE_WEB_APP;
    const prisma = { user: { upsert: jest.fn().mockResolvedValue({}) } };
    const service = new DemoAuthRepairService(prisma as never);

    await service.onApplicationBootstrap();

    expect(prisma.user.upsert).not.toHaveBeenCalled();
  });
});
