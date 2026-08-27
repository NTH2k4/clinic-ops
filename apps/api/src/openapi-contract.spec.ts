import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type OpenApiDocument = {
  openapi?: string;
  info?: { title?: string; version?: string };
  paths?: Record<string, Record<string, OperationObject>>;
  components?: {
    securitySchemes?: Record<string, { type?: string; scheme?: string }>;
    requestBodies?: Record<string, { content?: { "application/json"?: { schema?: { $ref?: string } } } }>;
    schemas?: Record<string, { required?: string[]; properties?: Record<string, unknown> }>;
  };
};

type OperationObject = {
  parameters?: Array<{ $ref?: string; name?: string }>;
  requestBody?: { $ref?: string };
  responses?: Record<string, unknown>;
};

const specPath = resolve(__dirname, "../../../docs/03-architecture/openapi.json");

describe("OpenAPI contract", () => {
  const spec = JSON.parse(readFileSync(specPath, "utf8")) as OpenApiDocument;

  it("documents the API version and bearer auth scheme", () => {
    expect(spec.openapi).toMatch(/^3\./);
    expect(spec.info?.title).toBe("CareFlow API");
    expect(spec.components?.securitySchemes?.bearerAuth).toEqual({
      type: "http",
      scheme: "bearer",
    });
  });

  it("documents shared response envelope schemas", () => {
    expect(spec.components?.schemas?.SuccessEnvelope).toBeDefined();
    expect(spec.components?.schemas?.ListEnvelope).toBeDefined();
    expect(spec.components?.schemas?.ErrorEnvelope).toBeDefined();
  });

  it("documents the implemented v1 endpoint surface", () => {
    const requiredOperations = [
      ["get", "/api/v1/health"],
      ["post", "/api/v1/auth/login"],
      ["post", "/api/v1/auth/logout"],
      ["get", "/api/v1/auth/me"],
      ["get", "/api/v1/doctors"],
      ["post", "/api/v1/doctors"],
      ["get", "/api/v1/doctors/{id}"],
      ["patch", "/api/v1/doctors/{id}"],
      ["post", "/api/v1/doctors/{id}/deactivate"],
      ["get", "/api/v1/specialties"],
      ["post", "/api/v1/specialties"],
      ["patch", "/api/v1/specialties/{id}"],
      ["post", "/api/v1/specialties/{id}/deactivate"],
      ["get", "/api/v1/services"],
      ["post", "/api/v1/services"],
      ["get", "/api/v1/services/{id}"],
      ["patch", "/api/v1/services/{id}"],
      ["post", "/api/v1/services/{id}/deactivate"],
      ["get", "/api/v1/patients"],
      ["post", "/api/v1/patients"],
      ["get", "/api/v1/patients/{id}"],
      ["patch", "/api/v1/patients/{id}"],
      ["post", "/api/v1/patients/{id}/deactivate"],
      ["get", "/api/v1/doctor-schedules"],
      ["post", "/api/v1/doctor-schedules"],
      ["patch", "/api/v1/doctor-schedules/{id}"],
      ["post", "/api/v1/doctor-schedules/{id}/deactivate"],
      ["get", "/api/v1/availability/slots"],
      ["get", "/api/v1/appointments"],
      ["get", "/api/v1/appointments/{id}"],
      ["post", "/api/v1/appointments"],
      ["patch", "/api/v1/appointments/{id}"],
      ["post", "/api/v1/appointments/{id}/confirm"],
      ["post", "/api/v1/appointments/{id}/cancel"],
      ["post", "/api/v1/appointments/{id}/check-in"],
      ["post", "/api/v1/appointments/{id}/start"],
      ["post", "/api/v1/appointments/{id}/complete"],
      ["post", "/api/v1/appointments/{id}/no-show"],
      ["get", "/api/v1/audit-events"],
      ["get", "/api/v1/audit-events/{id}"],
      ["get", "/api/v1/notifications"],
      ["post", "/api/v1/notifications/{id}/read"],
      ["post", "/api/v1/notifications/read-all"],
    ] as const;

    for (const [method, path] of requiredOperations) {
      expect(spec.paths?.[path]?.[method]).toBeDefined();
    }

    const documentedOperations = Object.entries(spec.paths ?? {}).flatMap(([path, methods]) =>
      Object.keys(methods).map((method) => [method, path] as const),
    );
    expect(documentedOperations.sort()).toEqual([...requiredOperations].sort());
  });

  it("documents partial update bodies separately from create bodies", () => {
    expect(spec.paths?.["/api/v1/doctors/{id}"]?.patch?.requestBody?.$ref).toBe("#/components/requestBodies/DoctorUpdate");
    expect(spec.paths?.["/api/v1/services/{id}"]?.patch?.requestBody?.$ref).toBe("#/components/requestBodies/ServiceUpdate");
    expect(spec.paths?.["/api/v1/specialties/{id}"]?.patch?.requestBody?.$ref).toBe("#/components/requestBodies/SpecialtyUpdate");
    expect(spec.paths?.["/api/v1/patients/{id}"]?.patch?.requestBody?.$ref).toBe("#/components/requestBodies/PatientUpdate");
    expect(spec.paths?.["/api/v1/doctor-schedules/{id}"]?.patch?.requestBody?.$ref).toBe("#/components/requestBodies/ScheduleUpdate");
  });

  it("matches schedule DTO constraints", () => {
    const scheduleCreate = spec.components?.schemas?.ScheduleCreateRequest;
    expect(scheduleCreate?.required).toEqual(["doctorId", "dayOfWeek", "startTime", "endTime", "effectiveFrom", "effectiveTo", "type"]);
    expect(scheduleCreate?.properties?.dayOfWeek).toMatchObject({ type: "integer", minimum: 1, maximum: 7 });
    expect(scheduleCreate?.properties?.type).toEqual({ enum: ["working", "blocked", "leave"] });
  });

  it("documents schedule POST runtime response codes", () => {
    expect(spec.paths?.["/api/v1/doctor-schedules"]?.post?.responses).toHaveProperty("201");
    expect(spec.paths?.["/api/v1/doctor-schedules/{id}/deactivate"]?.post?.responses).toHaveProperty("201");
  });

  it("matches patient DTO constraints", () => {
    const patientCreate = spec.components?.schemas?.PatientCreateRequest;
    expect(patientCreate?.required).toEqual(["fullName", "phone"]);
    expect(patientCreate?.properties?.email).toEqual({ type: ["string", "null"], format: "email" });
    expect(patientCreate?.properties).not.toHaveProperty("status");
  });

  it("documents audit date-time filters", () => {
    const parameterRefs = spec.paths?.["/api/v1/audit-events"]?.get?.parameters?.map((parameter) => parameter.$ref ?? parameter.name);
    expect(parameterRefs).toEqual(expect.arrayContaining(["#/components/parameters/FromDateTime", "#/components/parameters/ToDateTime"]));
  });
});
