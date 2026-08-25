import userEvent from "@testing-library/user-event";
import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TopBar } from "../../components/TopBar";
import { mockStore } from "../../mocks/mockStore";
import { renderWithProviders } from "../../test/render";
import { AdminDashboard } from "./AdminDashboard";
import { AdminDoctors } from "./AdminDoctors";
import { AuditLog } from "./AuditLog";

afterEach(() => {
  cleanup();
  mockStore.reset();
});

describe("admin workspace", () => {
  it("derives the active doctor metric from mock data", () => {
    renderWithProviders(<AdminDashboard />);

    expect(screen.getByText("Doctors active")).toBeInTheDocument();
  });

  it("renders the doctors management table", () => {
    renderWithProviders(<AdminDoctors />);

    expect(screen.getByRole("table", { name: "Doctors" })).toBeInTheDocument();
  });

  it("filters audit events by entity type", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuditLog />);

    await user.selectOptions(screen.getByLabelText("Entity type"), "appointment");

    expect(screen.getAllByText("appointment").length).toBeGreaterThan(0);
  });

  it("opens appointment notifications", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TopBar />);

    await user.click(screen.getByRole("button", { name: "Thông báo" }));

    expect(screen.getByText(/appointment/i)).toBeInTheDocument();
  });
});
