import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

const apiPatient = {
  id: "patient-api-1",
  userId: null,
  fullName: "API Patient",
  phone: "0900000000",
  email: null,
  dateOfBirth: null,
  gender: null,
  address: null,
  notes: null,
  status: "active",
  createdAt: "2026-08-24T08:00:00.000Z",
  updatedAt: "2026-08-24T08:00:00.000Z",
};

function apiSuccess(data: unknown, list = false): Response {
  return new Response(JSON.stringify({
    data,
    meta: list
      ? { requestId: "req-patients", page: 1, pageSize: 20, total: 1 }
      : { requestId: "req-patient" },
  }), { status: 200 });
}

describe("patientService in API mode", () => {
  it("lists and maps patients through the patients endpoint", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(apiSuccess([apiPatient], true));
    const { createPatientService } = await import("./patientService");
    const service = createPatientService({ source: "api", fetcher });

    await expect(service.listPatients({ q: "API", page: 1, pageSize: 20 })).resolves.toMatchObject({
      data: [{ id: "patient-api-1", fullName: "API Patient", dateOfBirth: "", gender: "prefer_not_to_say" }],
      meta: { total: 1 },
    });
    expect(fetcher).toHaveBeenCalledWith(
      "/api/v1/patients?q=API&page=1&pageSize=20",
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
  });

  it("creates and updates patient records without client-generated metadata", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(apiSuccess(apiPatient))
      .mockResolvedValueOnce(apiSuccess({ ...apiPatient, phone: "0911111111" }));
    const { createPatientService } = await import("./patientService");
    const service = createPatientService({ source: "api", fetcher });

    await service.createPatient({ fullName: "API Patient", phone: "0900000000" });
    await service.updatePatient("patient-api-1", { phone: "0911111111" });

    expect(fetcher).toHaveBeenNthCalledWith(1, "/api/v1/patients", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ fullName: "API Patient", phone: "0900000000" }),
    }));
    expect(fetcher).toHaveBeenNthCalledWith(2, "/api/v1/patients/patient-api-1", expect.objectContaining({
      method: "PATCH",
      body: JSON.stringify({ phone: "0911111111" }),
    }));
  });

  it("normalizes API date-time birth dates to date-only values", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(apiSuccess({
      ...apiPatient,
      dateOfBirth: "1990-01-02T00:00:00.000Z",
    }));
    const { createPatientService } = await import("./patientService");
    const service = createPatientService({ source: "api", fetcher });

    await expect(service.getPatient("patient-api-1")).resolves.toMatchObject({
      dateOfBirth: "1990-01-02",
    });
  });

  it("clears the in-memory API session and query cache after an unauthenticated response", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      error: { code: "UNAUTHENTICATED", message: "Authentication is required." },
      meta: { requestId: "req-unauthenticated" },
    }), { status: 401 }));
    const { queryClient } = await import("../../lib/queryClient");
    const { getApiSessionToken, setApiSessionToken } = await import("../../lib/api/session");
    const { createPatientService } = await import("./patientService");
    const service = createPatientService({ source: "api", fetcher });
    setApiSessionToken("patient-session-token");
    queryClient.setQueryData(["patients", "stale"], { value: "stale" });

    await expect(service.getPatient("patient-api-1")).rejects.toMatchObject({ code: "UNAUTHENTICATED" });

    expect(getApiSessionToken()).toBeNull();
    expect(queryClient.getQueryData(["patients", "stale"])).toBeUndefined();
  });
});
