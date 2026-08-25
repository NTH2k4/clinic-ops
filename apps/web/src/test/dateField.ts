import { screen, within } from "@testing-library/react";
import type userEvent from "@testing-library/user-event";
import { expect } from "vitest";

type UserEvent = ReturnType<typeof userEvent.setup>;
type DateSegmentType = "day" | "month" | "year";

function getClinicDateGroup(label: string) {
  const groups = screen.getAllByRole("group");
  const group = groups.find((candidate) => candidate.getAttribute("aria-label") === label && candidate.querySelector('[data-type="day"]'));
  if (!group) throw new Error(`Could not find clinic date field for "${label}"`);
  return group;
}

export function getClinicDateSegment(label: string, type: DateSegmentType): HTMLElement {
  const segment = getClinicDateGroup(label).querySelector(`[data-type="${type}"]`);
  if (!(segment instanceof HTMLElement)) throw new Error(`Could not find ${type} segment for "${label}"`);
  return segment;
}

export function expectClinicDateField(label: string, expected: { day: number; month: number; year: number }) {
  const group = within(getClinicDateGroup(label));
  expect(group.getByRole("spinbutton", { name: /^Ngày,/ })).toHaveAttribute("aria-valuenow", String(expected.day));
  expect(group.getByRole("spinbutton", { name: /^Tháng,/ })).toHaveAttribute("aria-valuenow", String(expected.month));
  expect(group.getByRole("spinbutton", { name: /^Năm,/ })).toHaveAttribute("aria-valuenow", String(expected.year));
}

export async function setClinicDateDay(user: UserEvent, label: string, targetDay: number) {
  const daySegment = getClinicDateSegment(label, "day");
  await user.click(daySegment);

  let currentDay = Number(daySegment.getAttribute("aria-valuenow"));
  const key = targetDay > currentDay ? "{ArrowUp}" : "{ArrowDown}";
  while (currentDay !== targetDay) {
    await user.keyboard(key);
    currentDay += targetDay > currentDay ? 1 : -1;
  }
}
