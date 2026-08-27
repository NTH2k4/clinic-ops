import { describe, expect, it } from "vitest";
import { routerBasename } from "./routerBasename";

describe("AppProviders", () => {
  it("normalizes the Vite base URL for BrowserRouter", () => {
    expect(routerBasename("/")).toBeUndefined();
    expect(routerBasename("/clinic-ops/")).toBe("/clinic-ops");
    expect(routerBasename("/clinic-ops")).toBe("/clinic-ops");
  });
});
