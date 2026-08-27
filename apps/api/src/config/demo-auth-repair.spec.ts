import { DemoAuthRepairService, shouldRepairDemoAuthUsers } from "./demo-auth-repair";

type UpsertCall = {
  where: { email: string };
  update: { status: string };
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

  it("repairs demo users when the API starts in hosted demo mode", async () => {
    process.env.SERVE_WEB_APP = "true";
    const prisma = { user: { upsert: jest.fn().mockResolvedValue({}) } };
    const service = new DemoAuthRepairService(prisma as never);

    await service.onApplicationBootstrap();

    expect(prisma.user.upsert).toHaveBeenCalledTimes(5);
    const calls = prisma.user.upsert.mock.calls as Array<[UpsertCall]>;
    const adminRepair = calls.find(([call]) => call.where.email === "admin@careflow.local")?.[0];
    expect(adminRepair?.update.status).toBe("active");
  });

  it("does not touch users outside hosted demo mode", async () => {
    delete process.env.SERVE_WEB_APP;
    const prisma = { user: { upsert: jest.fn().mockResolvedValue({}) } };
    const service = new DemoAuthRepairService(prisma as never);

    await service.onApplicationBootstrap();

    expect(prisma.user.upsert).not.toHaveBeenCalled();
  });
});
