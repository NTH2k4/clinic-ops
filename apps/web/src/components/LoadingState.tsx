import { Loader2 } from "lucide-react";

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-muted" role="status">
      <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin text-primary" />
      <span>{label}</span>
    </div>
  );
}

export function ShimmerBlock({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`block animate-pulse rounded-md bg-surface-muted ${className}`} />;
}

export function ShimmerList({ label, rows = 4 }: { label: string; rows?: number }) {
  return (
    <div aria-label={label} className="space-y-3" role="status">
      {Array.from({ length: rows }, (_, index) => (
        <div className="rounded-lg border border-border bg-surface p-4 shadow-panel" key={index}>
          <ShimmerBlock className="h-4 w-2/5" />
          <ShimmerBlock className="mt-3 h-3 w-3/4" />
          <ShimmerBlock className="mt-2 h-3 w-1/2" />
        </div>
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function ShimmerGrid({ label, items = 6 }: { label: string; items?: number }) {
  return (
    <div aria-label={label} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" role="status">
      {Array.from({ length: items }, (_, index) => (
        <div className="rounded-lg border border-border bg-surface p-5 shadow-panel" key={index}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <ShimmerBlock className="h-3 w-24" />
              <ShimmerBlock className="mt-3 h-4 w-3/4" />
            </div>
            <ShimmerBlock className="size-10 shrink-0" />
          </div>
          <ShimmerBlock className="mt-5 h-3 w-full" />
          <ShimmerBlock className="mt-2 h-3 w-5/6" />
          <ShimmerBlock className="mt-6 h-10 w-full" />
        </div>
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}
