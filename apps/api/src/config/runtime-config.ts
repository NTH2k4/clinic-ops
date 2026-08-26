type Env = Record<string, string | undefined>;

const invalidPortMessage = "PORT must be an integer between 1 and 65535.";

export function portFromEnv(env: Env) {
  const rawPort = env.PORT?.trim();
  if (!rawPort) return 3000;

  const port = Number(rawPort);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(invalidPortMessage);
  }
  return port;
}

export function corsOriginsFromEnv(env: Env) {
  const rawOrigins = env.CORS_ALLOWED_ORIGINS?.trim();
  if (!rawOrigins) return [];

  const origins = rawOrigins.split(",").map((origin) => origin.trim()).filter(Boolean);
  const invalidProtocol = origins.some((origin) => {
    try {
      const parsed = new URL(origin);
      return parsed.protocol !== "http:" && parsed.protocol !== "https:";
    } catch {
      return true;
    }
  });
  if (invalidProtocol) {
    throw new Error("CORS_ALLOWED_ORIGINS must contain only http:// or https:// origins.");
  }
  const invalidOriginShape = origins.some((origin) => new URL(origin).origin !== origin);
  if (invalidOriginShape) {
    throw new Error("CORS_ALLOWED_ORIGINS must contain exact origins without path, query, or fragment.");
  }

  return origins;
}
