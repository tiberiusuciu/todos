import { useCallback, useEffect, useRef, useState } from "react";

export type ToastItem = {
  id: string;
  message: string;
  onUndo?: () => void;
  variant: "default" | "success";
};

const DISMISS_MS = 4000;
const UNDO_DISMISS_MS = 8000;
const MAX_TOASTS = 3;

export type ShowToastOptions = {
  onUndo?: () => void;
  durationMs?: number;
  variant?: "default" | "success";
};

function nextToastId() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (msg: string, options?: ShowToastOptions) => {
      const id = nextToastId();
      const hasUndo = !!options?.onUndo;
      const duration =
        options?.durationMs ?? (hasUndo ? UNDO_DISMISS_MS : DISMISS_MS);
      const variant =
        options?.variant ?? (hasUndo ? "success" : "default");

      const item: ToastItem = {
        id,
        message: msg,
        variant,
        onUndo: options?.onUndo
          ? () => {
              removeToast(id);
              options.onUndo!();
            }
          : undefined,
      };

      setToasts((prev) => {
        const next = [...prev, item];
        if (next.length <= MAX_TOASTS) return next;
        const [dropped, ...rest] = next;
        const droppedTimer = timersRef.current.get(dropped.id);
        if (droppedTimer) {
          clearTimeout(droppedTimer);
          timersRef.current.delete(dropped.id);
        }
        return rest;
      });

      const timer = setTimeout(() => removeToast(id), duration);
      timersRef.current.set(id, timer);
    },
    [removeToast]
  );

  useEffect(
    () => () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current.clear();
    },
    []
  );

  return { toasts, showToast, dismissToast: removeToast };
}
