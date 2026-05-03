"use client";

export default function ConfirmDialog({
  open,
  title = "ማረጋገጫ",
  message = "እርግጠኛ ነዎት?",
  confirmLabel = "አረጋግጥ",
  cancelLabel = "ተው",
  onConfirm,
  onCancel,
  isLoading = false,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        aria-hidden="true"
        onClick={onCancel}
        className="absolute inset-0 bg-black/40"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className="relative w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-800"
      >
        <h2
          id="confirm-dialog-title"
          className="text-sm font-semibold text-gray-900 dark:text-gray-100"
        >
          {title}
        </h2>
        <p
          id="confirm-dialog-message"
          className="mt-2 text-xs text-gray-600 dark:text-gray-400"
        >
          {message}
        </p>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            data-testid="confirm-dialog-cancel"
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            data-testid="confirm-dialog-confirm"
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-70"
            disabled={isLoading}
          >
            {isLoading ? "በመሰረዝ ላይ..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
