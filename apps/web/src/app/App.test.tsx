import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";
import { renderWithProviders } from "../test/render";

describe("App", () => {
  it("renders the CareFlow sign-in entry point", () => {
    renderWithProviders(<App />);
    expect(screen.getByRole("heading", { name: /CareFlow/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Đăng nhập/i })).toBeInTheDocument();
  });
});
