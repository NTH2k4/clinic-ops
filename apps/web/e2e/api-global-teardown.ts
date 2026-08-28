import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export default async function globalTeardown() {
  const webE2eDir = dirname(fileURLToPath(import.meta.url));
  const apiDir = resolve(webE2eDir, "../../api");

  execFileSync("npm", ["run", "prisma:seed"], {
    cwd: apiDir,
    env: process.env,
    stdio: "inherit",
  });
}
