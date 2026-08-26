import { Test } from "@nestjs/testing";
import { PrismaModule } from "./prisma.module";

describe("PrismaModule", () => {
  it("initializes without a database connection", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [PrismaModule] }).compile();

    await expect(moduleRef.init()).resolves.toBe(moduleRef);
    await moduleRef.close();
  });
});
