import { PrismaClient } from "@prisma/client";
import { ensureDemoAuthUsers } from "../src/config/demo-auth-repair";

const prisma = new PrismaClient();

async function main() {
  await ensureDemoAuthUsers(prisma);
}

if (require.main === module) {
  main()
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
