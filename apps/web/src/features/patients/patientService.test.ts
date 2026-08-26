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
});
