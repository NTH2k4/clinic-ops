import userEvent from "@testing-library/user-event";
import { cleanup, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../../app/App";
import { DetailDrawer } from "../../components/DetailDrawer";
import { mockStore } from "../../mocks/mockStore";
import { renderWithProviders } from "../../test/render";
import type { Appointment } from "../../types/models";

afterEach(() => {
  cleanup();
  mockStore.reset();
});

async function signInAsDoctor() {
  const user = userEvent.setup();
  renderWithProviders(<App />);
  await user.click(screen.getByRole("button", { name: /Doctor Demo/i }));
  return user;
}

function DoctorFlowHarness() {
  const [appointment, setAppointment] = useState<Appointment>(() => {
    const checkedIn = mockStore.appointments.find((candidate) => candidate.status === "checked_in");
    if (!checkedIn) throw new Error("Missing checked-in fixture");
    return checkedIn;
  });

  return <DetailDrawer actorUserId="user-doctor-1" appointment={appointment} onClose={() => undefined} onUpdated={setAppointment} />;
}

describe("doctor workspace", () => {
  it("shows the doctor's daily workload summary", async () => {
    await signInAsDoctor();

    expect(screen.getByRole("heading", { name: "Không gian bác sĩ" })).toBeInTheDocument();
    expect(screen.getByText("Waiting")).toBeInTheDocument();
    expect(screen.getAllByText("Đã check-in").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Đang khám").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Hoàn tất").length).toBeGreaterThan(0);
  });

  it("moves a checked-in appointment through the doctor consultation flow", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DoctorFlowHarness />);

    await user.click(screen.getByRole("button", { name: /Start appointment/i }));
    expect(screen.getByText("Đang khám")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Complete appointment/i }));
    expect(screen.getByText("Hoàn tất")).toBeInTheDocument();
  });
});
