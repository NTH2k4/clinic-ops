export function MetricCard({
  label,
  value,
  helper,
  tone = "neutral",
  trend,
}: {
  label: string;
  value: string | number;
  helper?: string;
  tone?: "neutral" | "primary" | "accent" | "success" | "warning" | "danger";
  trend?: string;
}) {
  const toneStyles = {
    neutral: "from-slate-50 to-white text-text-muted",
    primary: "from-teal-50 to-white text-primary",
    accent: "from-blue-50 to-white text-accent",
    success: "from-emerald-50 to-white text-success",
    warning: "from-amber-50 to-white text-warning",
    danger: "from-red-50 to-white text-danger",
  } as const;

  return (
    <section className={`rounded-lg border border-border bg-gradient-to-br p-4 shadow-panel ${toneStyles[tone]}`}>
      <div className="flex min-h-6 items-start justify-between gap-3">
        <p className="text-sm font-medium text-text-muted">{label}</p>
        {trend ? <span className="rounded-sm border border-current/20 bg-white/75 px-2 py-0.5 text-xs font-semibold">{trend}</span> : null}
      </div>
      <p className="mt-2 text-2xl font-semibold leading-8 text-text">{value}</p>
      {helper ? <p className="mt-2 text-sm text-text-muted">{helper}</p> : null}
    </section>
  );
}
