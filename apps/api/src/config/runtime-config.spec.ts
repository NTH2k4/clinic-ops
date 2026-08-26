import { corsOriginsFromEnv, portFromEnv } from "./runtime-config";

describe("runtime config", () => {
  it("uses port 3000 when PORT is not set", () => {
    expect(portFromEnv({})).toBe(3000);
  });

  it("parses a valid numeric PORT", () => {
    expect(portFromEnv({ PORT: "3001" })).toBe(3001);
  });

  it("rejects invalid PORT values before the server starts", () => {
    expect(() => portFromEnv({ PORT: "abc" })).toThrow("PORT must be an integer between 1 and 65535.");
    expect(() => portFromEnv({ PORT: "0" })).toThrow("PORT must be an integer between 1 and 65535.");
    expect(() => portFromEnv({ PORT: "65536" })).toThrow("PORT must be an integer between 1 and 65535.");
  });

  it("keeps CORS disabled when CORS_ALLOWED_ORIGINS is not set", () => {
    expect(corsOriginsFromEnv({})).toEqual([]);
    expect(corsOriginsFromEnv({ CORS_ALLOWED_ORIGINS: "   " })).toEqual([]);
  });

  it("parses comma-separated HTTP origins for browser deployments", () => {
    expect(corsOriginsFromEnv({
      CORS_ALLOWED_ORIGINS: "https://careflow.example.com, http://localhost:4173 ,https://preview.example.com",
    })).toEqual(["https://careflow.example.com", "http://localhost:4173", "https://preview.example.com"]);
  });

  it("rejects non-HTTP CORS origins", () => {
    expect(() => corsOriginsFromEnv({ CORS_ALLOWED_ORIGINS: "https://careflow.example.com,ftp://careflow.example.com" }))
      .toThrow("CORS_ALLOWED_ORIGINS must contain only http:// or https:// origins.");
  });

  it("rejects CORS values that are URLs instead of origins", () => {
    expect(() => corsOriginsFromEnv({ CORS_ALLOWED_ORIGINS: "https://careflow.example.com/app" }))
      .toThrow("CORS_ALLOWED_ORIGINS must contain exact origins without path, query, or fragment.");
    expect(() => corsOriginsFromEnv({ CORS_ALLOWED_ORIGINS: "https://careflow.example.com?preview=true" }))
      .toThrow("CORS_ALLOWED_ORIGINS must contain exact origins without path, query, or fragment.");
    expect(() => corsOriginsFromEnv({ CORS_ALLOWED_ORIGINS: "https://careflow.example.com#staging" }))
      .toThrow("CORS_ALLOWED_ORIGINS must contain exact origins without path, query, or fragment.");
  });
});
