import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import EmojiPicker, { Theme, type EmojiClickData } from "emoji-picker-react";

const PICKER_W = 300;
const PICKER_H = 380;
const GAP = 8;

type Position = { top: number; left: number };

function computePosition(trigger: HTMLElement): Position {
  const rect = trigger.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const openAbove = spaceBelow < PICKER_H + GAP;
  const top = openAbove ? rect.top - PICKER_H - GAP : rect.bottom + GAP;
  const left = Math.min(
    Math.max(rect.left, GAP),
    window.innerWidth - PICKER_W - GAP
  );
  return { top: Math.max(GAP, top), left };
}

type Props = {
  emoji: string;
  loading?: boolean;
  scrollContainerRef?: RefObject<HTMLElement | null>;
  onSelect: (emoji: string) => void;
};

export function EmojiPickerPopover({ emoji, loading, scrollContainerRef, onSelect }: Props) {
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

  const handleSelect = (data: EmojiClickData) => {
    onSelect(data.emoji);
    setOpen(false);
  };

  const pickerPortal =
    open &&
    !loading &&
    createPortal(
      <div
        ref={containerRef}
        className="fixed z-50"
        style={{ top: position.top, left: position.left }}
      >
        <EmojiPicker
          theme={Theme.DARK}
          onEmojiClick={handleSelect}
          width={PICKER_W}
          height={PICKER_H}
          searchPlaceholder="Search emoji..."
        />
      </div>,
      document.body
    );

  return (
    <>
      <div className="relative shrink-0">
        {loading ? (
          <div
            className="h-6 w-6 animate-pulse rounded bg-zinc-700"
            aria-label="Loading emoji"
          />
        ) : (
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-6 w-6 items-center justify-center rounded text-base hover:bg-zinc-800"
            aria-label="Change emoji"
            aria-expanded={open}
          >
            {emoji || "📋"}
          </button>
        )}
      </div>
      {pickerPortal}
    </>
  );
}
