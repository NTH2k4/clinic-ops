import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../../app/App";
import { renderWithProviders } from "../../test/render";

describe("authentication and role routing", () => {
  it("signs in with the patient demo and switches to the doctor workspace", async () => {
    const user = userEvent.setup();

    renderWithProviders(<App />);

    expect(screen.getByRole("heading", { name: "Đăng nhập" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Patient Demo/i }));

    expect(screen.getByText("Trang chính patient")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Chuyển vai trò"), "doctor");

    expect(screen.getByText("Doctor dashboard")).toBeInTheDocument();
  });
});
