import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { ClinicDateField } from "./ClinicDateField";
import { LoadingState } from "./LoadingState";
import { MetricCard } from "./MetricCard";
import { SegmentedControl } from "./SegmentedControl";
import { StatusBadge } from "./StatusBadge";
import { renderWithProviders } from "../test/render";
import type { AppointmentStatus } from "../types/models";

afterEach(() => {
  cleanup();
});

describe("shared UI components", () => {
  it("renders appointment status with text and accessible label", () => {
    renderWithProviders(<StatusBadge status={"requested" satisfies AppointmentStatus} />);

    expect(screen.getByText("Chờ xác nhận")).toBeInTheDocument();
    expect(screen.getByLabelText("Trạng thái: Chờ xác nhận")).toBeInTheDocument();
  });

  it("renders metric, empty, loading and error states", () => {
    renderWithProviders(
      <>
        <MetricCard label="Lịch hẹn hôm nay" value={12} helper="Tăng 3 lịch so với hôm qua" />
        <EmptyState title="Không có dữ liệu" description="Chưa có lịch hẹn trong bộ lọc này." />
        <LoadingState label="Đang tải lịch hẹn" />
        <ErrorState title="Không tải được dữ liệu" description="Vui lòng thử lại sau." />
      </>,
    );

    expect(screen.getByText("Lịch hẹn hôm nay")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Không có dữ liệu")).toBeInTheDocument();
    expect(screen.getByText("Đang tải lịch hẹn")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Không tải được dữ liệu");
  });

  it("renders segmented control as pressed buttons and handles selection", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(
      <SegmentedControl
        value="day"
        options={[
          { label: "Ngày", value: "day" },
          { label: "Tuần", value: "week" },
        ]}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole("button", { name: "Ngày" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Tuần" }));

    expect(onChange).toHaveBeenCalledWith("week");
  });

  it("renders clinic dates as editable segments without a native browser date input", () => {
    const onChange = vi.fn();
    const { container } = renderWithProviders(<ClinicDateField id="clinic-date" label="Ngày khám" onChange={onChange} value="2026-08-25" />);

    const nativeDateInput = container.querySelector('input[type="date"]');
    expect(nativeDateInput).toHaveAttribute("tabindex", "-1");
    expect(container.firstElementChild).toHaveClass("[&_input[type=date]]:hidden");
    expect(screen.getAllByRole("spinbutton").length).toBeGreaterThanOrEqual(3);
    expect(screen.getByRole("spinbutton", { name: /^Ngày,/ })).toHaveTextContent("25");
    expect(screen.getByRole("spinbutton", { name: /^Tháng,/ })).toHaveTextContent("08");
    expect(screen.getByRole("spinbutton", { name: /^Năm,/ })).toHaveTextContent("2026");
    expect(screen.getByRole("button", { name: /^Mở lịch Ngày khám/ })).toBeInTheDocument();
  });

  it("lets users edit one date segment without clearing the full date", async () => {
    const user = userEvent.setup();

    function DateHarness() {
      const [value, setValue] = useState("2026-08-25");
      return (
        <>
          <ClinicDateField id="clinic-date" label="Ngày khám" onChange={setValue} value={value} />
          <output aria-label="Ngày đã chọn">{value}</output>
        </>
      );
    }

    renderWithProviders(<DateHarness />);

    const daySegment = screen.getByRole("spinbutton", { name: /^Ngày,/ });
    await user.click(daySegment);
    await user.keyboard("{ArrowUp}");

    expect(screen.getByLabelText("Ngày đã chọn")).toHaveTextContent("2026-08-26");
  });

  it("lets users type over date segments when the field has a minimum date", async () => {
    const user = userEvent.setup();

    function DateHarness() {
      const [value, setValue] = useState("2026-08-26");
      return (
        <>
          <ClinicDateField id="clinic-date" label="Ngày khám" min="2026-08-26" onChange={setValue} value={value} />
          <output aria-label="Ngày đã chọn">{value}</output>
        </>
      );
    }

    renderWithProviders(<DateHarness />);

    const daySegment = screen.getByRole("spinbutton", { name: /^Ngày,/ });
    await user.click(daySegment);
    await user.keyboard("27");

    expect(screen.getByLabelText("Ngày đã chọn")).toHaveTextContent("2026-08-27");

    const monthSegment = screen.getByRole("spinbutton", { name: /^Tháng,/ });
    await user.click(monthSegment);
    await user.keyboard("09");

    expect(screen.getByLabelText("Ngày đã chọn")).toHaveTextContent("2026-09-27");

    const yearSegment = screen.getByRole("spinbutton", { name: /^Năm,/ });
    await user.click(yearSegment);
    await user.keyboard("2027");

    expect(screen.getByLabelText("Ngày đã chọn")).toHaveTextContent("2027-09-27");
  });
});
