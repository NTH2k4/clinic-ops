import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";
import { renderWithProviders } from "../test/render";

describe("App", () => {
  it("renders the CareFlow sign-in entry point", () => {
    renderWithProviders(<App />);
    expect(screen.getByText("CareFlow")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Đăng nhập" })).toBeInTheDocument();
  });
});
