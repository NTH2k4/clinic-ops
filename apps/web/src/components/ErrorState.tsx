import { AlertCircle } from "lucide-react";

export function ErrorState({ title, description }: { title: string; description: string }) {
  return (
    <section role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-danger">
      <div className="flex items-start gap-3">
        <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-red-700">{description}</p>
        </div>
      </div>
    </section>
  );
}
