export function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper?: string;
}) {
  return (
    <section className="rounded-lg border border-border bg-surface p-4 shadow-panel">
      <p className="text-sm font-medium text-text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold leading-8 text-text">{value}</p>
      {helper ? <p className="mt-2 text-sm text-text-muted">{helper}</p> : null}
    </section>
  );
}
