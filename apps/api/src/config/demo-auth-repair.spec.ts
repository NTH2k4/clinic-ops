import { DemoAuthRepairService, shouldRepairDemoAuthUsers } from "./demo-auth-repair";

type UpsertCall = {
  where: { email: string };
  update: Record<string, unknown>;
};

type CatalogUpsertCall = {
  where: { id: string };
  update: { name?: string };
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

  it("creates missing demo users and repairs the hosted Admin Demo password", async () => {
    process.env.SERVE_WEB_APP = "true";
    const prisma = {
      user: { upsert: jest.fn().mockResolvedValue({}) },
      specialty: { upsert: jest.fn().mockResolvedValue({}) },
      service: { upsert: jest.fn().mockResolvedValue({}) },
      patient: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
      staff: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
      doctor: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({}) },
      doctorSchedule: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
      appointment: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
      appointmentStatusHistory: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
      auditEvent: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
      notification: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
    };
    const service = new DemoAuthRepairService(prisma as never);

    await service.onApplicationBootstrap();

    expect(prisma.user.upsert).toHaveBeenCalledTimes(14);
    const calls = prisma.user.upsert.mock.calls as Array<[UpsertCall]>;
    const adminUpsert = calls.find(([call]) => call.where.email === "admin@careflow.local")?.[0];
    expect(adminUpsert?.update).toMatchObject({ status: "active" });
    expect(adminUpsert?.update.passwordHash).toEqual(expect.any(String));
    const doctorUpserts = calls.filter(([call]) => call.where.email.endsWith("@careflow.local") && call.where.email !== "admin@careflow.local");
    expect(doctorUpserts.map(([call]) => call.where.email)).toEqual(expect.arrayContaining([
      "lan.tran@careflow.local",
      "quang.pham@careflow.local",
      "hoa.le@careflow.local",
      "tuan.vo@careflow.local",
    ]));
    const testAdminUpsert = calls.find(([call]) => call.where.email === "admin@test.com")?.[0];
    expect(testAdminUpsert?.update).toEqual({});
  });

  it("ensures demo catalog and schedules without resetting registered data in hosted demo mode", async () => {
    process.env.SERVE_WEB_APP = "true";
    const prisma = {
      user: { upsert: jest.fn().mockResolvedValue({}), deleteMany: jest.fn() },
      specialty: { upsert: jest.fn().mockResolvedValue({}) },
      service: { upsert: jest.fn().mockResolvedValue({}) },
      patient: { createMany: jest.fn().mockResolvedValue({ count: 10 }), deleteMany: jest.fn() },
      staff: { createMany: jest.fn().mockResolvedValue({ count: 5 }) },
      doctor: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({}) },
      doctorSchedule: { createMany: jest.fn().mockResolvedValue({ count: 60 }) },
      appointment: { createMany: jest.fn().mockResolvedValue({ count: 40 }) },
      appointmentStatusHistory: { createMany: jest.fn().mockResolvedValue({ count: 40 }) },
      auditEvent: { createMany: jest.fn().mockResolvedValue({ count: 20 }) },
      notification: { createMany: jest.fn().mockResolvedValue({ count: 10 }) },
    };
    const service = new DemoAuthRepairService(prisma as never);

    await service.onApplicationBootstrap();

    expect(prisma.specialty.upsert).toHaveBeenCalledTimes(3);
    expect(prisma.service.upsert).toHaveBeenCalledTimes(8);
    expect(prisma.staff.createMany).toHaveBeenCalledWith(expect.objectContaining({ skipDuplicates: true }));
    expect(prisma.patient.createMany).toHaveBeenCalledWith(expect.objectContaining({ skipDuplicates: true }));
    expect(prisma.doctor.create).toHaveBeenCalledTimes(6);
    expect(prisma.doctorSchedule.createMany).toHaveBeenCalledWith(
      expect.objectContaining({ skipDuplicates: true }),
    );
    expect(prisma.appointment.createMany).toHaveBeenCalledWith(expect.objectContaining({ skipDuplicates: true }));
    expect(prisma.notification.createMany).toHaveBeenCalledWith(expect.objectContaining({ skipDuplicates: true }));
    expect(prisma.user.deleteMany).not.toHaveBeenCalled();
    expect(prisma.patient.deleteMany).not.toHaveBeenCalled();
  });

  it("updates hosted demo catalog labels to Vietnamese when demo rows already exist", async () => {
    process.env.SERVE_WEB_APP = "true";
    const prisma = {
      user: { upsert: jest.fn().mockResolvedValue({}) },
      specialty: { upsert: jest.fn().mockResolvedValue({}) },
      service: { upsert: jest.fn().mockResolvedValue({}) },
      patient: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
      staff: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
      doctor: { findUnique: jest.fn().mockResolvedValue({ services: [] }), update: jest.fn().mockResolvedValue({}) },
      doctorSchedule: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
      appointment: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
      appointmentStatusHistory: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
      auditEvent: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
      notification: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
    };
    const service = new DemoAuthRepairService(prisma as never);

    await service.onApplicationBootstrap();

    const specialtyCalls = prisma.specialty.upsert.mock.calls as Array<[CatalogUpsertCall]>;
    const serviceCalls = prisma.service.upsert.mock.calls as Array<[CatalogUpsertCall]>;
    const generalSpecialty = specialtyCalls.find(([call]) => call.where.id === "specialty-general")?.[0];
    const generalService = serviceCalls.find(([call]) => call.where.id === "service-general")?.[0];
    const cardiacService = serviceCalls.find(([call]) => call.where.id === "service-cardiac")?.[0];
    expect(generalSpecialty?.update.name).toBe("Nội tổng quát");
    expect(generalService?.update.name).toBe("Khám tổng quát");
    expect(cardiacService?.update.name).toBe("Khám tim mạch");
  });

  it("does not touch users outside hosted demo mode", async () => {
    delete process.env.SERVE_WEB_APP;
    const prisma = { user: { upsert: jest.fn().mockResolvedValue({}) } };
    const service = new DemoAuthRepairService(prisma as never);

    await service.onApplicationBootstrap();

    expect(prisma.user.upsert).not.toHaveBeenCalled();
  });
});
