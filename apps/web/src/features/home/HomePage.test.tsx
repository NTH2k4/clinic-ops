import { cleanup, screen, within } from "@testing-library/react";
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
    expect(screen.getByText("15 phút")).toBeInTheDocument();
    expect(screen.getByText("8 chuyên khoa")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Quy trình đặt lịch" })).toBeInTheDocument();
    const hero = screen.getByRole("region", { name: "CareFlow Clinic" });
    expect(within(hero).getByRole("link", { name: "Đặt lịch khám" })).toHaveAttribute("href", "#booking");
    expect(screen.getByRole("link", { name: "Tạo tài khoản" })).toHaveAttribute("href", "/register");
    expect(screen.getAllByRole("link", { name: "Đăng nhập" })[0]).toHaveAttribute("href", "/login");
    expect(screen.getByLabelText("Họ và tên")).toBeInTheDocument();
    expect(screen.getByLabelText("Chuyên khoa")).toBeInTheDocument();
    expect(screen.getByLabelText("Số điện thoại")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gửi yêu cầu tư vấn" })).toBeInTheDocument();
  });

  it("keeps the login route separate from the public homepage", () => {
    renderWithProviders(<App />, { initialEntries: ["/login"] });

    expect(screen.getByRole("heading", { name: "Đăng nhập" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "CareFlow Clinic" })).not.toBeInTheDocument();
  });
});
