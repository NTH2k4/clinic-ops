import { CalendarDays } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatClinicDateDraft, formatDateInputValue, parseClinicDateInput } from "../lib/dateTime";

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

function isInsideRange(value: string, min?: string, max?: string) {
  if (min && value < min) return false;
  if (max && value > max) return false;
  return true;
}

export function ClinicDateField({ id, label, value, onChange, min, max, labelClassName = "block text-sm font-medium text-text", controlClassName = "", inputClassName = "" }: ClinicDateFieldProps) {
  const pickerRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(() => formatDateInputValue(value));
  const [error, setError] = useState("");

  useEffect(() => {
    setDraft(formatDateInputValue(value));
    setError("");
  }, [value]);

  function commitDraft(rawValue: string) {
    const nextDraft = formatClinicDateDraft(rawValue);
    setDraft(nextDraft);
    setError("");
    const parsed = parseClinicDateInput(nextDraft);
    if (!parsed) return;
    if (!isInsideRange(parsed, min, max)) {
      setError("Ngày nằm ngoài khoảng cho phép.");
      return;
    }
    onChange(parsed);
  }

  function openPicker() {
    const picker = pickerRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
    if (!picker) return;
    if (typeof picker.showPicker === "function") {
      picker.showPicker();
      return;
    }
    picker.click();
  }

  function restoreOnBlur() {
    const parsed = parseClinicDateInput(draft);
    if (!draft || !parsed) {
      setDraft(formatDateInputValue(value));
      setError(draft ? "Ngày không hợp lệ. Dùng định dạng dd/MM/yyyy." : "");
      return;
    }
    if (!isInsideRange(parsed, min, max)) {
      setDraft(formatDateInputValue(value));
      setError("Ngày nằm ngoài khoảng cho phép.");
    }
  }

  return (
    <div>
      <label className={labelClassName} htmlFor={id}>{label}</label>
      <div className={`relative mt-1 ${controlClassName}`}>
        <input
          className={`h-11 w-full rounded-md border border-border bg-surface px-3 pr-10 text-sm text-text ${inputClassName}`}
          id={id}
          inputMode="numeric"
          onBlur={restoreOnBlur}
          onChange={(event) => commitDraft(event.target.value)}
          placeholder="dd/mm/yyyy"
          value={draft}
        />
        <button aria-label={`Mở lịch ${label}`} className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-text-muted hover:bg-surface-muted hover:text-text" onClick={openPicker} type="button">
          <CalendarDays aria-hidden="true" size={17} />
        </button>
        <input
          aria-hidden="true"
          className="sr-only"
          max={max}
          min={min}
          onChange={(event) => {
            if (event.target.value) onChange(event.target.value);
          }}
          ref={pickerRef}
          tabIndex={-1}
          type="date"
          value={value}
        />
      </div>
      {error ? <p className="mt-1 text-xs text-danger" role="alert">{error}</p> : null}
    </div>
  );
}
