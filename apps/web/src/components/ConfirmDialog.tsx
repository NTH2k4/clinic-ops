import { useId } from "react";

type ConfirmDialogProps = {
  confirmLabel?: string;
  description: string;
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
};

export function ConfirmDialog({
  confirmLabel = "Xác nhận",
  description,
  isOpen,
  onCancel,
  onConfirm,
  title,
}: ConfirmDialogProps) {
  const descriptionId = useId();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" role="presentation">
      <section aria-describedby={descriptionId} aria-modal="true" aria-label={title} className="w-full max-w-md rounded-lg bg-surface p-5 shadow-2xl" role="dialog">
        <h2 className="text-lg font-semibold text-text">{title}</h2>
        <p className="mt-2 text-sm text-text-muted" id={descriptionId}>{description}</p>
        <div className="mt-5 flex justify-end gap-3">
          <button className="h-10 rounded-md border border-border px-3 text-sm font-semibold text-text hover:bg-surface-muted" onClick={onCancel} type="button">Quay lại</button>
          <button className="h-10 rounded-md bg-danger px-3 text-sm font-semibold text-white hover:bg-red-700" onClick={onConfirm} type="button">{confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}
