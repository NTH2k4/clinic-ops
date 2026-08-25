import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { LoadingState } from "./LoadingState";
import { MetricCard } from "./MetricCard";
import { SegmentedControl } from "./SegmentedControl";
import { StatusBadge } from "./StatusBadge";
import { renderWithProviders } from "../test/render";
import type { AppointmentStatus } from "../types/models";

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
});
