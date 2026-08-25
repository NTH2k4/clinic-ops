export type SegmentedControlOption<T extends string> = {
  label: string;
  value: T;
};

export type SegmentedControlProps<T extends string> = {
  value: T;
  options: Array<SegmentedControlOption<T>>;
  onChange: (value: T) => void;
  label?: string;
};

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  label = "Chọn chế độ hiển thị",
}: SegmentedControlProps<T>) {
  return (
    <div aria-label={label} className="inline-flex rounded-md border border-border bg-surface-muted p-1">
      {options.map((option) => {
        const isSelected = option.value === value;

        return (
          <button
            aria-pressed={isSelected}
            className={`h-9 min-w-16 rounded-sm px-3 text-sm font-medium transition-colors ${
              isSelected ? "bg-surface text-primary shadow-panel" : "text-text-muted hover:text-text"
            }`}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
