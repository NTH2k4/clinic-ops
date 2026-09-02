import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../../app/App";
import { renderWithProviders } from "../../test/render";

afterEach(() => {
  cleanup();
});

describe("HomePage", () => {
  it("renders the public homepage at the root route", () => {
    renderWithProviders(<App />, { initialEntries: ["/"] });

    expect(screen.getByRole("heading", { name: "CareFlow Clinic" })).toBeInTheDocument();
    expect(screen.getByText("Chuyên khoa nổi bật")).toBeInTheDocument();
    expect(screen.getByText("Bác sĩ tiêu biểu")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Đặt lịch khám" })).toHaveAttribute("href", "/register");
    expect(screen.getByRole("link", { name: "Đăng nhập" })).toHaveAttribute("href", "/login");
  });

  it("keeps the login route separate from the public homepage", () => {
    renderWithProviders(<App />, { initialEntries: ["/login"] });

    expect(screen.getByRole("heading", { name: "Đăng nhập" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "CareFlow Clinic" })).not.toBeInTheDocument();
  });
});
