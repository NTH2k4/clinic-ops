import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { parseDate } from "@internationalized/date";
import type { ReactNode } from "react";
import {
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  DateInput,
  DatePicker,
  DateSegment,
  Dialog,
  Group,
  Heading,
  I18nProvider,
  Label,
  Popover,
} from "react-aria-components";

type ClinicDateFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  labelClassName?: string;
  controlClassName?: string;
  inputClassName?: string;
};

function toCalendarDate(value: string | undefined) {
  return value ? parseDate(value) : undefined;
}

function formatSegmentText(type: string, defaultChildren: ReactNode) {
  if ((type !== "day" && type !== "month") || typeof defaultChildren !== "string" || defaultChildren.length !== 1 || !/\d/.test(defaultChildren)) {
    return defaultChildren;
  }
  return defaultChildren.padStart(2, "0");
}

export function ClinicDateField({ id, label, value, onChange, min, max, labelClassName = "block text-sm font-medium text-text", controlClassName = "", inputClassName = "" }: ClinicDateFieldProps) {
  return (
    <I18nProvider locale="vi-VN">
      <div className="[&>input[type=date]]:hidden">
        <DatePicker
          aria-label={label}
          maxValue={toCalendarDate(max)}
          minValue={toCalendarDate(min)}
          onChange={(nextDate) => {
            if (!nextDate) return;
            const nextValue = nextDate.toString();
            if (min && nextValue < min) return;
            if (max && nextValue > max) return;
            onChange(nextValue);
          }}
          value={toCalendarDate(value)}
        >
          <Label className={labelClassName}>{label}</Label>
          <Group className={`mt-1 flex h-11 w-full items-center rounded-md border border-border bg-surface text-sm text-text focus-within:border-border-strong focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent ${controlClassName}`}>
            <DateInput className={`flex min-w-0 flex-1 items-center gap-0.5 px-3 ${inputClassName}`} data-field-id={id}>
              {(segment) => (
                <DateSegment
                  className="rounded-sm px-0.5 py-1 tabular-nums text-text outline-none focus:bg-accent-soft focus:text-accent data-[placeholder]:text-text-muted"
                  segment={segment}
                >
                  {({ defaultChildren, type }) => formatSegmentText(type, defaultChildren)}
                </DateSegment>
              )}
            </DateInput>
            <Button aria-label={`Mở lịch ${label}`} className="mr-2 inline-flex size-8 shrink-0 items-center justify-center rounded-md text-text-muted hover:bg-surface-muted hover:text-text">
              <CalendarDays aria-hidden="true" size={17} />
            </Button>
          </Group>
          <Popover className="z-50 rounded-lg border border-border bg-surface shadow-panel">
            <Dialog className="p-3">
              <Calendar className="w-72">
                <header className="mb-3 flex items-center justify-between gap-2">
                  <Button className="inline-flex size-8 items-center justify-center rounded-md border border-border text-text hover:bg-surface-muted" slot="previous">
                    <ChevronLeft aria-hidden="true" size={16} />
                  </Button>
                  <Heading className="text-sm font-semibold text-text" />
                  <Button className="inline-flex size-8 items-center justify-center rounded-md border border-border text-text hover:bg-surface-muted" slot="next">
                    <ChevronRight aria-hidden="true" size={16} />
                  </Button>
                </header>
                <CalendarGrid className="w-full border-separate border-spacing-1">
                  <CalendarGridHeader>
                    {(day) => <CalendarHeaderCell className="text-xs font-medium text-text-muted">{day}</CalendarHeaderCell>}
                  </CalendarGridHeader>
                  <CalendarGridBody>
                    {(date) => (
                      <CalendarCell
                        className="size-9 rounded-md text-center text-sm leading-9 text-text outline-none data-[disabled]:cursor-not-allowed data-[disabled]:text-text-muted data-[focus-visible]:outline data-[focus-visible]:outline-2 data-[focus-visible]:outline-accent data-[outside-month]:text-text-muted data-[pressed]:bg-surface-muted data-[selected]:bg-primary data-[selected]:font-semibold data-[selected]:text-white"
                        date={date}
                      />
                    )}
                  </CalendarGridBody>
                </CalendarGrid>
              </Calendar>
            </Dialog>
          </Popover>
        </DatePicker>
      </div>
    </I18nProvider>
  );
}
