import userEvent from "@testing-library/user-event";
import { cleanup, screen, waitFor, within } from "@testing-library/react";
import { useNavigate } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "../../app/App";
import { navigationForRole } from "../../components/navigation";
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
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function renderApiApp() {
  vi.resetModules();
  vi.stubEnv("VITE_DATA_SOURCE", "api");

  const [{ App: ApiApp }, { renderWithProviders: renderApiWithProviders }] = await Promise.all([
    import("../../app/App"),
    import("../../test/render"),
  ]);

  return renderApiWithProviders(<ApiApp />);
}

function successResponse(data: unknown) {
  return new Response(JSON.stringify({ data, meta: { requestId: "req-1" } }), { status: 200 });
}

function storageValues(storage: Storage) {
  return Array.from({ length: storage.length }, (_, index) => storage.getItem(storage.key(index)!));
}

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

  it("keeps admin mobile navigation sticky and scannable with longer role menus", async () => {
    const user = userEvent.setup();

    renderWithProviders(<App />);

    await user.click(screen.getByRole("button", { name: /Admin Demo/i }));

    const mobileNavigation = screen.getByRole("navigation", { name: "Điều hướng di động" });
    expect(mobileNavigation).toHaveClass("sticky", "bottom-0");
    expect(within(mobileNavigation).getAllByRole("link")).toHaveLength(navigationForRole("admin").length);
    expect(within(mobileNavigation).getByRole("link", { name: "Schedules" })).toBeInTheDocument();
    expect(within(mobileNavigation).getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");

    await user.click(within(mobileNavigation).getByRole("link", { name: "Audit log" }));

    expect(screen.getByRole("heading", { name: "Audit log" })).toBeInTheDocument();
    expect(within(mobileNavigation).getByRole("link", { name: "Audit log" })).toHaveAttribute("aria-current", "page");
  });

  it("lets desktop users collapse and expand the sidebar without losing navigation access", async () => {
    const user = userEvent.setup();

    renderWithProviders(<App />);

    await user.click(screen.getByRole("button", { name: /Patient Demo/i }));
    await user.selectOptions(screen.getByLabelText("Chuyển vai trò"), "doctor");

    const sidebarToggle = screen.getByRole("button", { name: "Thu gọn thanh điều hướng" });
    expect(sidebarToggle).toHaveAttribute("aria-expanded", "true");

    const mainNavigation = screen.getByRole("navigation", { name: "Điều hướng chính" });
    expect(mainNavigation.closest("aside")).toHaveClass("sticky", "top-0", "h-screen");
    expect(within(mainNavigation).getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");

    await user.click(sidebarToggle);

    expect(screen.getByRole("button", { name: "Mở rộng thanh điều hướng" })).toHaveAttribute("aria-expanded", "false");
    await user.click(within(mainNavigation).getByRole("link", { name: "Lịch tuần" }));

    expect(screen.getByRole("heading", { name: "Lịch tuần" })).toBeInTheDocument();
    expect(within(mainNavigation).getByRole("link", { name: "Lịch tuần" })).toHaveAttribute("aria-current", "page");
  });
});

describe("API authentication", () => {
  it("toggles API login password visibility from inside the password field", async () => {
    const user = userEvent.setup();

    await renderApiApp();

    const passwordInput = screen.getByLabelText("Mật khẩu", { selector: "input" });
    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Hiện mật khẩu" }));

    expect(passwordInput).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Ẩn mật khẩu" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ẩn mật khẩu" }));

    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("links API-mode login to patient registration", async () => {
    const user = userEvent.setup();

    await renderApiApp();

    await user.click(screen.getByRole("link", { name: "Đăng ký tài khoản" }));

    expect(screen.getByRole("heading", { name: "Đăng ký tài khoản" })).toBeInTheDocument();
  });

  it("registers a patient through the API and opens the patient workspace", async () => {
    const user = userEvent.setup();
    const sessionToken = "registered-session-token";
    const fetcher = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);

      if (url.endsWith("/auth/register")) {
        return successResponse({
          sessionToken,
          currentUser: {
            id: "user-patient-new",
            displayName: "New Patient",
            email: "new.patient@example.test",
            role: "patient",
            status: "active",
          },
          linkedProfile: { type: "patient", id: "patient-new" },
        });
      }

      if (url.includes("/services") || url.includes("/doctors") || url.includes("/specialties")) {
        return new Response(JSON.stringify({ data: [], meta: { requestId: "req-list", page: 1, pageSize: 100, total: 0 } }), { status: 200 });
      }

      return successResponse({});
    });
    vi.stubGlobal("fetch", fetcher);

    await renderApiApp();
    await user.click(screen.getByRole("link", { name: "Đăng ký tài khoản" }));
    await user.type(screen.getByLabelText("Họ và tên"), "New Patient");
    await user.type(screen.getByLabelText("Email"), "new.patient@example.test");
    await user.type(screen.getByLabelText("Số điện thoại"), "+84919990001");
    await user.type(screen.getByLabelText("Mật khẩu"), "Careflow#123");
    await user.type(screen.getByLabelText("Xác nhận mật khẩu"), "Careflow#123");
    await user.click(screen.getByRole("button", { name: "Tạo tài khoản" }));

    expect(await screen.findByText("Trang chính patient")).toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledWith(
      "/api/v1/auth/register",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          displayName: "New Patient",
          email: "new.patient@example.test",
          phone: "+84919990001",
          password: "Careflow#123",
        }),
      }),
    );

    const { getApiSessionToken } = await import("../../lib/api/session");
    expect(getApiSessionToken()).toBe(sessionToken);
  });

  it("prevents API registration when password confirmation does not match", async () => {
    const user = userEvent.setup();
    const fetcher = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetcher);

    await renderApiApp();
    await user.click(screen.getByRole("link", { name: "Đăng ký tài khoản" }));
    await user.type(screen.getByLabelText("Họ và tên"), "New Patient");
    await user.type(screen.getByLabelText("Email"), "new.patient@example.test");
    await user.type(screen.getByLabelText("Số điện thoại"), "+84919990001");
    await user.type(screen.getByLabelText("Mật khẩu"), "Careflow#123");
    await user.type(screen.getByLabelText("Xác nhận mật khẩu"), "Careflow#124");
    await user.click(screen.getByRole("button", { name: "Tạo tài khoản" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Mật khẩu xác nhận không khớp.");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("toggles registration password fields independently without changing entered values", async () => {
    const user = userEvent.setup();

    await renderApiApp();
    await user.click(screen.getByRole("link", { name: "Đăng ký tài khoản" }));
    const passwordInput = screen.getByLabelText("Mật khẩu", { selector: "input" });
    const confirmPasswordInput = screen.getByLabelText("Xác nhận mật khẩu", { selector: "input" });

    await user.type(passwordInput, "Careflow#123");
    await user.type(confirmPasswordInput, "Careflow#123");

    expect(passwordInput).toHaveAttribute("type", "password");
    expect(confirmPasswordInput).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Hiện mật khẩu" }));

    expect(passwordInput).toHaveAttribute("type", "text");
    expect(confirmPasswordInput).toHaveAttribute("type", "password");
    expect(passwordInput).toHaveValue("Careflow#123");
    expect(confirmPasswordInput).toHaveValue("Careflow#123");

    await user.click(screen.getByRole("button", { name: "Hiện xác nhận mật khẩu" }));

    expect(passwordInput).toHaveAttribute("type", "text");
    expect(confirmPasswordInput).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: "Ẩn mật khẩu" }));

    expect(passwordInput).toHaveAttribute("type", "password");
    expect(confirmPasswordInput).toHaveAttribute("type", "text");
  });

  it("requires both passwords and clears the API session after changing a password", async () => {
    const user = userEvent.setup();
    const sessionToken = "password-session-token";
    const fetcher = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);

      if (url.endsWith("/auth/login")) {
        return successResponse({
          sessionToken,
          currentUser: {
            id: "user-patient-1",
            displayName: "API Patient",
            email: "patient@example.test",
            role: "patient",
            status: "active",
          },
          linkedProfile: { type: "patient", id: "patient-1" },
        });
      }

      if (url.endsWith("/auth/change-password")) {
        return successResponse({});
      }

      if (url.includes("/services") || url.includes("/doctors") || url.includes("/specialties")) {
        return new Response(JSON.stringify({ data: [], meta: { requestId: "req-list", page: 1, pageSize: 100, total: 0 } }), { status: 200 });
      }

      return successResponse({});
    });
    vi.stubGlobal("fetch", fetcher);

    await renderApiApp();
    await user.type(screen.getByLabelText("Email"), "patient@example.test");
    await user.type(screen.getByLabelText("Mật khẩu"), "current-password");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));
    await screen.findByText("Trang chính patient");

    await user.click(screen.getByRole("button", { name: "Bảo mật tài khoản" }));

    expect(screen.getByLabelText("Mật khẩu hiện tại")).toBeRequired();
    expect(screen.getByLabelText("Mật khẩu mới")).toBeRequired();
    await user.type(screen.getByLabelText("Mật khẩu hiện tại"), "current-password");
    await user.type(screen.getByLabelText("Mật khẩu mới"), "Careflow#124");
    await user.click(screen.getByRole("button", { name: "Đổi mật khẩu" }));

    expect(await screen.findByRole("heading", { name: "Đăng nhập" })).toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledWith(
      "/api/v1/auth/change-password",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ currentPassword: "current-password", newPassword: "Careflow#124" }),
      }),
    );

    const { getApiSessionToken } = await import("../../lib/api/session");
    expect(getApiSessionToken()).toBeNull();
  });

  it("returns to login when a catalog request reports an expired session", async () => {
    const user = userEvent.setup();
    let sessionExpired = false;
    const fetcher = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url.endsWith("/auth/login")) {
        return successResponse({
          sessionToken: "expired-session-token",
          currentUser: {
            id: "user-patient-1",
            displayName: "API Patient",
            email: "patient@example.test",
            role: "patient",
            status: "active",
          },
          linkedProfile: { type: "patient", id: "patient-1" },
        });
      }
      if (sessionExpired && url.includes("/services")) {
        return new Response(JSON.stringify({
          error: { code: "UNAUTHENTICATED", message: "Session expired." },
          meta: { requestId: "req-expired" },
        }), { status: 401 });
      }
      return new Response(JSON.stringify({
        data: [],
        meta: { requestId: "req-list", page: 1, pageSize: 100, total: 0 },
      }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetcher);

    await renderApiApp();
    await user.type(screen.getByLabelText("Email"), "patient@example.test");
    await user.type(screen.getByLabelText("Mật khẩu"), "secret");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));
    expect(await screen.findByRole("heading", { name: "Trang chính patient" })).toBeInTheDocument();

    const { queryClient } = await import("../../lib/queryClient");
    const { getApiSessionToken } = await import("../../lib/api/session");
    const { catalogService } = await import("../catalog/catalogService");
    queryClient.setQueryData(["session-sensitive"], { value: "stale" });
    sessionExpired = true;

    await expect(catalogService.listServices()).rejects.toMatchObject({ code: "UNAUTHENTICATED" });

    expect(await screen.findByRole("heading", { name: "Đăng nhập" })).toBeInTheDocument();
    expect(getApiSessionToken()).toBeNull();
    expect(queryClient.getQueryData(["session-sensitive"])).toBeUndefined();
  });

  it("signs in through the API without persisting the session token and hides demo role switching", async () => {
    const user = userEvent.setup();
    const sessionToken = "api-session-token";
    const fetcher = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url.endsWith("/auth/login")) {
        return successResponse({
          sessionToken,
          currentUser: {
            id: "user-patient-1",
            displayName: "API Patient",
            email: "patient@example.test",
            role: "patient",
            status: "active",
          },
          linkedProfile: { type: "patient", id: "patient-1" },
        });
      }
      if (url.includes("/services") || url.includes("/doctors") || url.includes("/specialties")) {
        return new Response(JSON.stringify({ data: [], meta: { requestId: "req-list", page: 1, pageSize: 100, total: 0 } }), { status: 200 });
      }
      return successResponse({});
    });
    vi.stubGlobal("fetch", fetcher);
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    localStorage.clear();
    sessionStorage.clear();

    await renderApiApp();

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Mật khẩu")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Patient Demo/i })).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Email"), "patient@example.test");
    await user.type(screen.getByLabelText("Mật khẩu"), "secret");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));

    expect(await screen.findByText("Trang chính patient")).toBeInTheDocument();
    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      "/api/v1/auth/login",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ email: "patient@example.test", password: "secret" }) }),
    );
    expect(setItem).not.toHaveBeenCalled();
    expect([...storageValues(localStorage), ...storageValues(sessionStorage)]).not.toContain(sessionToken);
    expect(screen.queryByLabelText("Chuyển vai trò")).not.toBeInTheDocument();
    await waitFor(() => {
      const catalogCall = fetcher.mock.calls.find(([url]) => String(url).includes("/services"));
      expect(catalogCall).toBeDefined();
      expect(new Headers(catalogCall?.[1]?.headers).get("Authorization")).toBe(`Bearer ${sessionToken}`);
    });

    const { queryClient } = await import("../../lib/queryClient");
    queryClient.setQueryData(["auth-cache"], { value: "stale" });

    await user.click(screen.getByRole("button", { name: "Đăng xuất" }));

    await waitFor(() => expect(fetcher).toHaveBeenCalledWith(
      "/api/v1/auth/logout",
      expect.objectContaining({ method: "POST" }),
    ));
    await waitFor(() => expect(queryClient.getQueryData(["auth-cache"])).toBeUndefined());
  });

  it("shows the backend login error without exposing a token", async () => {
    const user = userEvent.setup();
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { code: "INVALID_CREDENTIALS", message: "Email or password is incorrect." },
          meta: { requestId: "req-401" },
        }),
        { status: 401 },
      ),
    );
    vi.stubGlobal("fetch", fetcher);

    await renderApiApp();

    await user.type(screen.getByLabelText("Email"), "patient@example.test");
    await user.type(screen.getByLabelText("Mật khẩu"), "incorrect");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));

    expect(await screen.findByText("Email or password is incorrect.")).toBeInTheDocument();
    expect(screen.queryByText("api-session-token")).not.toBeInTheDocument();
  });
});
