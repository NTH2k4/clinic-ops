import { afterEach, describe, expect, it, vi } from "vitest";
import { createCatalogApi } from "../../lib/api/catalog";
import { createApiHttpClient } from "../../lib/api/http";
import { setApiSessionToken } from "../../lib/api/session";
import { mockStore } from "../../mocks/mockStore";
import { createCatalogService } from "./catalogService";

afterEach(() => {
  setApiSessionToken(null);
  vi.restoreAllMocks();
});

function listResponse(data: unknown[], page: number, pageSize: number, total: number) {
  return new Response(JSON.stringify({ data, meta: { requestId: `req-${page}`, page, pageSize, total } }), { status: 200 });
}

describe("catalog service", () => {
  it("returns filtered active fixture services in mock mode with pagination metadata", async () => {
    const service = createCatalogService({ source: "mock" });

    const result = await service.listServices({ status: "active", specialtyId: "specialty-general", page: 1, pageSize: 2 });

    expect(result.data).toEqual(
      mockStore.services
        .filter((item) => item.status === "active" && item.specialtyId === "specialty-general")
        .slice(0, 2),
    );
    expect(result.meta).toEqual({ requestId: "mock", page: 1, pageSize: 2, total: 2 });
  });

  it("calls all API catalog lists with bearer auth, serializes filters, and maps backend records", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(listResponse([{
        id: "service-api",
        name: "Tim mach",
        specialtyId: "specialty-api",
        durationMinutes: 45,
        price: "500000.00",
        currency: "VND",
        description: null,
        status: "active",
        createdAt: "2026-08-20T01:00:00.000Z",
        updatedAt: "2026-08-21T01:00:00.000Z",
      }], 2, 10, 11))
      .mockResolvedValueOnce(listResponse([{
        id: "specialty-api",
        name: "Tim mạch",
        description: null,
        status: "active",
        createdAt: "2026-08-18T01:00:00.000Z",
        updatedAt: "2026-08-19T01:00:00.000Z",
      }], 1, 25, 1))
      .mockResolvedValueOnce(listResponse([{
        id: "doctor-api",
        userId: "user-doctor-api",
        fullName: "Dr. API",
        specialtyId: "specialty-api",
        phone: "+84900000099",
        email: "doctor.api@careflow.test",
        title: null,
        room: null,
        status: "active",
        services: [{ id: "service-api" }],
        specialty: { id: "specialty-api", name: "Tim mạch" },
        createdAt: "2026-08-22T01:00:00.000Z",
        updatedAt: "2026-08-23T01:00:00.000Z",
      }], 1, 100, 1));
    const client = createApiHttpClient({ baseUrl: "/api/v1", getToken: () => "catalog-token", fetcher });
    const service = createCatalogService({ source: "api", api: createCatalogApi(client.requestEnvelope) });

    const services = await service.listServices({ status: "active", q: "tim mach", specialtyId: "specialty-api", page: 2, pageSize: 10 });
    const specialties = await service.listSpecialties({ status: "active", q: "tim", page: 1, pageSize: 25 });
    const doctors = await service.listDoctors({ status: "active", specialtyId: "specialty-api", serviceId: "service-api", page: 1, pageSize: 100 });

    expect(services).toEqual({
      data: [{
        id: "service-api",
        name: "Tim mach",
        specialtyId: "specialty-api",
        durationMinutes: 45,
        price: 500000,
        currency: "VND",
        description: "",
        status: "active",
        createdAt: "2026-08-20T01:00:00.000Z",
        updatedAt: "2026-08-21T01:00:00.000Z",
      }],
      meta: { requestId: "req-2", page: 2, pageSize: 10, total: 11 },
    });
    expect(specialties.data[0]).toEqual({
      id: "specialty-api",
      name: "Tim mạch",
      description: "",
      status: "active",
      createdAt: "2026-08-18T01:00:00.000Z",
      updatedAt: "2026-08-19T01:00:00.000Z",
    });
    expect(doctors.data[0]).toEqual({
      id: "doctor-api",
      userId: "user-doctor-api",
      fullName: "Dr. API",
      specialtyId: "specialty-api",
      serviceIds: ["service-api"],
      phone: "+84900000099",
      email: "doctor.api@careflow.test",
      title: "",
      room: "",
      status: "active",
      createdAt: "2026-08-22T01:00:00.000Z",
      updatedAt: "2026-08-23T01:00:00.000Z",
    });

    expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
      "/api/v1/services?status=active&q=tim+mach&specialtyId=specialty-api&page=2&pageSize=10",
      "/api/v1/specialties?status=active&q=tim&page=1&pageSize=25",
      "/api/v1/doctors?status=active&specialtyId=specialty-api&serviceId=service-api&page=1&pageSize=100",
    ]);
    for (const [, init] of fetcher.mock.calls) {
      expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer catalog-token");
    }
  });

  it("uses the in-memory signed-in token with the default API client", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(listResponse([], 1, 20, 0));
    setApiSessionToken("signed-in-token");
    const service = createCatalogService({ source: "api", fetcher });

    await service.listSpecialties();

    const [, init] = fetcher.mock.calls[0];
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer signed-in-token");
  });

  it("creates, updates, and deactivates services through the API catalog client", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: {
        id: "service-new",
        name: "Khám du lịch",
        specialtyId: "specialty-general",
        durationMinutes: 30,
        price: "250000.00",
        currency: "VND",
        description: null,
        status: "active",
        createdAt: "2026-08-20T01:00:00.000Z",
        updatedAt: "2026-08-21T01:00:00.000Z",
      }, meta: { requestId: "req-create" } }), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: {
        id: "service-new",
        name: "Khám du lịch cập nhật",
        specialtyId: "specialty-general",
        durationMinutes: 45,
        price: "300000.00",
        currency: "VND",
        description: "Tư vấn trước chuyến đi.",
        status: "active",
        createdAt: "2026-08-20T01:00:00.000Z",
        updatedAt: "2026-08-22T01:00:00.000Z",
      }, meta: { requestId: "req-update" } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: {
        id: "service-new",
        name: "Khám du lịch cập nhật",
        specialtyId: "specialty-general",
        durationMinutes: 45,
        price: "300000.00",
        currency: "VND",
        description: "Tư vấn trước chuyến đi.",
        status: "inactive",
        createdAt: "2026-08-20T01:00:00.000Z",
        updatedAt: "2026-08-23T01:00:00.000Z",
      }, meta: { requestId: "req-deactivate" } }), { status: 201 }));
    const service = createCatalogService({ source: "api", fetcher });

    await expect(service.createService({
      name: "Khám du lịch",
      specialtyId: "specialty-general",
      durationMinutes: 30,
      price: 250000,
      currency: "VND",
      description: "",
    })).resolves.toMatchObject({ id: "service-new", description: "", price: 250000 });
    await expect(service.updateService("service-new", { name: "Khám du lịch cập nhật", durationMinutes: 45, price: 300000 })).resolves.toMatchObject({ name: "Khám du lịch cập nhật", durationMinutes: 45 });
    await expect(service.deactivateService("service-new")).resolves.toMatchObject({ status: "inactive" });

    expect(fetcher.mock.calls.map(([url, init]) => [url, init?.method, init?.body])).toEqual([
      ["/api/v1/services", "POST", JSON.stringify({
        name: "Khám du lịch",
        specialtyId: "specialty-general",
        durationMinutes: 30,
        price: 250000,
        currency: "VND",
        description: "",
      })],
      ["/api/v1/services/service-new", "PATCH", JSON.stringify({ name: "Khám du lịch cập nhật", durationMinutes: 45, price: 300000 })],
      ["/api/v1/services/service-new/deactivate", "POST", undefined],
    ]);
  });

  it("returns complete filtered fixture lists from all mock full-list helpers", async () => {
    const service = createCatalogService({ source: "mock" });

    const [services, specialties, doctors] = await Promise.all([
      service.listAllServices({ status: "active" }),
      service.listAllSpecialties({ status: "active" }),
      service.listAllDoctors({ status: "active" }),
    ]);

    expect(services.data).toEqual(mockStore.services.filter(({ status }) => status === "active"));
    expect(services.meta.total).toBe(services.data.length);
    expect(specialties.data).toEqual(mockStore.specialties.filter(({ status }) => status === "active"));
    expect(specialties.meta.total).toBe(specialties.data.length);
    expect(doctors.data).toEqual(mockStore.doctors.filter(({ status }) => status === "active"));
    expect(doctors.meta.total).toBe(doctors.data.length);
  });

  it("fetches every API page for full service lists", async () => {
    const records = ["service-api-1", "service-api-2"].map((id, index) => ({
      id,
      name: `Service ${index + 1}`,
      specialtyId: "specialty-api",
      durationMinutes: 30,
      price: "250000.00",
      currency: "VND",
      description: null,
      status: "active",
      createdAt: "2026-08-20T01:00:00.000Z",
      updatedAt: "2026-08-21T01:00:00.000Z",
    }));
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(listResponse([records[0]], 1, 100, 2))
      .mockResolvedValueOnce(listResponse([records[1]], 2, 100, 2));
    const service = createCatalogService({ source: "api", fetcher });

    const result = await service.listAllServices({ status: "active" });

    expect(result.data.map(({ id }) => id)).toEqual(["service-api-1", "service-api-2"]);
    expect(result.meta.total).toBe(2);
    expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
      "/api/v1/services?status=active&page=1&pageSize=100",
      "/api/v1/services?status=active&page=2&pageSize=100",
    ]);
  });
});
