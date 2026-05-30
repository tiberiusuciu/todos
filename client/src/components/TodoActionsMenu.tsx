import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";

const MENU_W = 160;
const GAP = 4;

type Position = { top: number; left: number };

function computePosition(trigger: HTMLElement): Position {
  const rect = trigger.getBoundingClientRect();
  const left = Math.min(
    Math.max(rect.right - MENU_W, GAP),
    window.innerWidth - MENU_W - GAP
  );
  const top = rect.bottom + GAP;
  return { top, left };
}

type Props = {
  disabled?: boolean;
  scrollContainerRef?: RefObject<HTMLElement | null>;
  onAddSubtask: () => void;
  onDelete: () => void;
};

function MenuDotsIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
      <circle cx="5" cy="2" r="0.9" />
      <circle cx="5" cy="5" r="0.9" />
      <circle cx="5" cy="8" r="0.9" />
    </svg>
  );
}

export function TodoActionsMenu({
  disabled,
  scrollContainerRef,
  onAddSubtask,
  onDelete,
}: Props) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const updatePosition = () => {
    if (triggerRef.current) {
      setPosition(computePosition(triggerRef.current));
    }
  };

  useLayoutEffect(() => {
    if (open) updatePosition();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const scrollEl = scrollContainerRef?.current;
    const onScrollOrResize = () => updatePosition();

    scrollEl?.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      scrollEl?.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, scrollContainerRef]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const menuPortal =
    open &&
    createPortal(
      <div
        ref={containerRef}
        className="fixed z-50 w-40 overflow-hidden rounded-md bg-zinc-900 py-1 shadow-lg ring-1 ring-zinc-700"
        style={{ top: position.top, left: position.left }}
        role="menu"
      >
        <button
          type="button"
          role="menuitem"
          className="block w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800"
          onClick={() => {
            onAddSubtask();
            setOpen(false);
          }}
        >
          Add sub-task
        </button>
        <button
          type="button"
          role="menuitem"
          className="block w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-950/60"
          onClick={() => {
            onDelete();
            setOpen(false);
          }}
        >
          Delete task
        </button>
      </div>,
      document.body
    );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="todo-actions-menu-trigger"
        aria-label="Task actions"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MenuDotsIcon />
      </button>
      {menuPortal}
    </>
  );
}
