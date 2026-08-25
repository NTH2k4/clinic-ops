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

function GoToOperations() {
  const navigate = useNavigate();

  return <button onClick={() => navigate("/app/operations/queue")} type="button">Go to operations</button>;
}

function GoToAdmin() {
  const navigate = useNavigate();

  return <button onClick={() => navigate("/app/admin")} type="button">Go to admin</button>;
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

  it("denies non-operations roles direct access to operations routes", async () => {
    const user = userEvent.setup();
    renderWithProviders(<><App /><GoToOperations /></>);

    await user.click(screen.getByRole("button", { name: /Patient Demo/i }));
    await user.click(screen.getByRole("button", { name: "Go to operations" }));
    expect(screen.getByText("Trang chính patient")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Chuyển vai trò"), "doctor");
    await user.click(screen.getByRole("button", { name: "Go to operations" }));
    expect(screen.getByRole("heading", { name: "Không gian bác sĩ" })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Chuyển vai trò"), "admin");
    await user.click(screen.getByRole("button", { name: "Go to operations" }));
    expect(screen.getByRole("heading", { name: "Admin dashboard" })).toBeInTheDocument();
  });

  it("allows receptionist and nurse direct access to operations routes", async () => {
    const user = userEvent.setup();
    renderWithProviders(<><App /><GoToOperations /></>);

    await user.click(screen.getByRole("button", { name: /Patient Demo/i }));
    await user.selectOptions(screen.getByLabelText("Chuyển vai trò"), "receptionist");
    await user.click(screen.getByRole("button", { name: "Go to operations" }));
    expect(screen.getByRole("heading", { name: "Hàng đợi khám" })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Chuyển vai trò"), "nurse");
    await user.click(screen.getByRole("button", { name: "Go to operations" }));
    expect(screen.getByRole("heading", { name: "Hàng đợi khám" })).toBeInTheDocument();
  });

  it("denies non-admin roles direct access to admin routes", async () => {
    const user = userEvent.setup();
    renderWithProviders(<><App /><GoToAdmin /></>);

    await user.click(screen.getByRole("button", { name: /Patient Demo/i }));
    await user.click(screen.getByRole("button", { name: "Go to admin" }));
    expect(screen.getByText("Trang chính patient")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Chuyển vai trò"), "doctor");
    await user.click(screen.getByRole("button", { name: "Go to admin" }));
    expect(screen.getByRole("heading", { name: "Không gian bác sĩ" })).toBeInTheDocument();
  });

  it("allows admin direct access to admin routes", async () => {
    const user = userEvent.setup();
    renderWithProviders(<><App /><GoToAdmin /></>);

    await user.click(screen.getByRole("button", { name: /Patient Demo/i }));
    await user.selectOptions(screen.getByLabelText("Chuyển vai trò"), "admin");
    await user.click(screen.getByRole("button", { name: "Go to admin" }));

    expect(screen.getByRole("heading", { name: "Admin dashboard" })).toBeInTheDocument();
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

  it("lets desktop users collapse and expand the sidebar without losing navigation access", async () => {
    const user = userEvent.setup();

    renderWithProviders(<App />);

    await user.click(screen.getByRole("button", { name: /Patient Demo/i }));
    await user.selectOptions(screen.getByLabelText("Chuyển vai trò"), "doctor");

    const sidebarToggle = screen.getByRole("button", { name: "Thu gọn thanh điều hướng" });
    expect(sidebarToggle).toHaveAttribute("aria-expanded", "true");

    const mainNavigation = screen.getByRole("navigation", { name: "Điều hướng chính" });
    expect(within(mainNavigation).getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");

    await user.click(sidebarToggle);

    expect(screen.getByRole("button", { name: "Mở rộng thanh điều hướng" })).toHaveAttribute("aria-expanded", "false");
    await user.click(within(mainNavigation).getByRole("link", { name: "Lịch tuần" }));

    expect(screen.getByRole("heading", { name: "Lịch tuần" })).toBeInTheDocument();
    expect(within(mainNavigation).getByRole("link", { name: "Lịch tuần" })).toHaveAttribute("aria-current", "page");
  });
});
