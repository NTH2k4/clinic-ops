import { successEnvelope } from "./api-response";

describe("successEnvelope", () => {
  it("wraps data with a request id", () => {
    const response = successEnvelope({ status: "ok" });

    expect(response.data).toEqual({ status: "ok" });
    expect(response.meta.requestId).toEqual(expect.any(String));
    expect(response.meta.requestId).toHaveLength(36);
  });
});
