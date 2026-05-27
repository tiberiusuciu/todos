type Props = {
  message: string | null;
  onDismiss: () => void;
};

export function Toast({ message, onDismiss }: Props) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-6 left-1/2 z-50 max-w-sm -translate-x-1/2 rounded-lg bg-zinc-800 px-4 py-3 text-sm text-zinc-100 shadow-lg ring-1 ring-zinc-700"
    >
      <div className="flex items-center gap-3">
        <span className="flex-1">{message}</span>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-zinc-400 hover:text-zinc-200"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
