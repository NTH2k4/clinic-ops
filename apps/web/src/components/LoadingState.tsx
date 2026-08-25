import { Loader2 } from "lucide-react";

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-muted">
      <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin text-primary" />
      <span>{label}</span>
    </div>
  );
}
