import { existsSync } from "node:fs";
import { resolve } from "node:path";

type Env = Record<string, string | undefined>;

type ResolveWebDistPathOptions = {
  env: Env;
  cwd: string;
  moduleDir: string;
  exists?: (path: string) => boolean;
};

export function serveWebAppFromEnv(env: Env) {
  return env.SERVE_WEB_APP?.trim().toLowerCase() === "true";
}

export function resolveWebDistPath(options: ResolveWebDistPathOptions) {
  const exists = options.exists ?? existsSync;
  const configuredPath = options.env.WEB_DIST_DIR?.trim();
  const candidates = [
    configuredPath ? resolve(configuredPath) : undefined,
    resolve(options.cwd, "../web/dist"),
    resolve(options.cwd, "apps/web/dist"),
    resolve(options.moduleDir, "../../../web/dist"),
  ].filter((path): path is string => Boolean(path));

  const webDistPath = candidates.find((candidate) => exists(resolve(candidate, "index.html")));
  if (!webDistPath) {
    throw new Error("Built web index.html was not found. Run the web build before starting the API with SERVE_WEB_APP=true.");
  }

  return webDistPath;
}
