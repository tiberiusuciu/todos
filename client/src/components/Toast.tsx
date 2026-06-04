import type { ToastItem } from "../hooks/useToast";

type Props = {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
};

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" className="text-emerald-500/80" />
      <path
        d="M5 8.2L7.1 10.3L11.2 6.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-emerald-400"
      />
    </svg>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const isSuccess = toast.variant === "success";

  return (
    <div
      role="alert"
      className={`flex w-full max-w-sm items-center gap-3 rounded-lg px-4 py-3 text-sm shadow-lg ${
        isSuccess
          ? "bg-zinc-800/95 text-zinc-100 ring-1 ring-emerald-600/35"
          : "bg-zinc-800 text-zinc-100 ring-1 ring-zinc-700"
      }`}
    >
      {isSuccess && <CheckIcon />}
      <span className="min-w-0 flex-1">{toast.message}</span>
      {toast.onUndo && (
        <button
          type="button"
          onClick={toast.onUndo}
          className={`shrink-0 font-medium ${
            isSuccess ? "text-emerald-300 hover:text-emerald-200" : "text-zinc-100 hover:text-white"
          }`}
        >
          Undo
        </button>
      )}
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-zinc-400 hover:text-zinc-200"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

export function Toast({ toasts, onDismiss }: Props) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-6 left-1/2 z-50 flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastCard toast={t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
