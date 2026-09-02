import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";
import { renderWithProviders } from "../test/render";

describe("App", () => {
  it("renders the public homepage entry point", () => {
    renderWithProviders(<App />);
    expect(screen.getByRole("heading", { name: "CareFlow Clinic" })).toBeInTheDocument();
    expect(screen.getByText("Chuyên khoa nổi bật")).toBeInTheDocument();
  });
});
