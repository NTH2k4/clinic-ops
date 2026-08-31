import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type PasswordFieldProps = {
  autoComplete: string;
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  minLength?: number;
  pattern?: string;
  required?: boolean;
  title?: string;
};

function lowercaseFirst(value: string) {
  return value ? `${value[0].toLocaleLowerCase("vi-VN")}${value.slice(1)}` : value;
}

export function PasswordField({
  autoComplete,
  id,
  label,
  minLength,
  onBlur,
  onChange,
  pattern,
  required = false,
  title,
  value,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const fieldName = lowercaseFirst(label);

  return (
    <div className="grid gap-1 text-sm font-medium text-text">
      <label htmlFor={id}>{label}</label>
      <span className="relative block">
        <input
          autoComplete={autoComplete}
          className="h-11 w-full rounded-md border border-border bg-surface px-3 pr-11 text-text transition-colors hover:border-border-strong focus:border-accent"
          id={id}
          minLength={minLength}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
          pattern={pattern}
          required={required}
          title={title}
          type={isVisible ? "text" : "password"}
          value={value}
        />
        <button
          aria-label={isVisible ? `Ẩn ${fieldName}` : `Hiện ${fieldName}`}
          className="absolute inset-y-1 right-1 flex size-9 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-muted hover:text-text focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1"
          onClick={() => setIsVisible((visible) => !visible)}
          type="button"
        >
          {isVisible ? <EyeOff aria-hidden="true" size={17} /> : <Eye aria-hidden="true" size={17} />}
        </button>
      </span>
    </div>
  );
}
