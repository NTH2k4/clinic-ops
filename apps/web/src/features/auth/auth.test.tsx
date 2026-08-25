import userEvent from "@testing-library/user-event";
import { cleanup, screen, within } from "@testing-library/react";
import { useNavigate } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../../app/App";
import { renderWithProviders } from "../../test/render";

function GoToRoleHome() {
  const navigate = useNavigate();

  return (
    <button onClick={() => navigate("/app")} type="button">
      Go to role home
    </button>
  );
}

afterEach(() => {
  cleanup();
});

describe("authentication and role routing", () => {
  it("signs in with the patient demo and switches to the doctor workspace", async () => {
    const user = userEvent.setup();

    renderWithProviders(<App />);

    expect(screen.getByRole("heading", { name: "Đăng nhập" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Patient Demo/i }));

    expect(screen.getByText("Trang chính patient")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Chuyển vai trò"), "doctor");

    expect(screen.getByText("Không gian bác sĩ")).toBeInTheDocument();
  });

  it("redirects an anonymous protected child route to login", () => {
    renderWithProviders(<App />, { initialEntries: ["/app/doctor/day"] });

    expect(screen.getByRole("heading", { name: "Đăng nhập" })).toBeInTheDocument();
  });

  it.each([
    ["doctor", "Không gian bác sĩ"],
    ["receptionist", "Operations Workspace"],
    ["admin", "Admin dashboard"],
  ] as const)("redirects %s from /app to %s", async (role, expectedHeading) => {
    const user = userEvent.setup();

    renderWithProviders(
      <>
        <App />
        <GoToRoleHome />
      </>,
    );

    await user.click(screen.getByRole("button", { name: /Patient Demo/i }));
    await user.selectOptions(screen.getByLabelText("Chuyển vai trò"), role);
    await user.click(screen.getByRole("button", { name: "Go to role home" }));

    expect(screen.getByRole("heading", { name: expectedHeading })).toBeInTheDocument();
  });

  it("routes receptionist and nurse to the shared operations home", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <>
        <App />
        <GoToRoleHome />
      </>,
    );

    await user.click(screen.getByRole("button", { name: /Patient Demo/i }));
    await user.selectOptions(screen.getByLabelText("Chuyển vai trò"), "receptionist");
    await user.click(screen.getByRole("button", { name: "Go to role home" }));
    expect(screen.getByRole("heading", { name: "Operations Workspace" })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Chuyển vai trò"), "nurse");
    await user.click(screen.getByRole("button", { name: "Go to role home" }));
    expect(screen.getByRole("heading", { name: "Operations Workspace" })).toBeInTheDocument();
  });

  it("returns to login after sign-out", async () => {
    const user = userEvent.setup();

    renderWithProviders(<App />);

    await user.click(screen.getByRole("button", { name: /Patient Demo/i }));
    await user.click(screen.getByRole("button", { name: "Đăng xuất" }));

    expect(screen.getByRole("heading", { name: "Đăng nhập" })).toBeInTheDocument();
  });

  it("provides mobile navigation for the active role", async () => {
    const user = userEvent.setup();

    renderWithProviders(<App />);

    await user.click(screen.getByRole("button", { name: /Patient Demo/i }));

    const mobileNavigation = screen.getByRole("navigation", { name: "Điều hướng di động" });
    await user.click(within(mobileNavigation).getByRole("link", { name: "Dịch vụ" }));

    expect(screen.getByRole("heading", { name: "Dịch vụ" })).toBeInTheDocument();
  });
});
