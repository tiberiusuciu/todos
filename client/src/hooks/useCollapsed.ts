import { useState } from "react";

const STORAGE_KEY = "todo-collapsed";

function loadCollapsed(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveCollapsed(set: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

export function useCollapsedState() {
  const [collapsed, setCollapsed] = useState<Set<string>>(() => loadCollapsed());

  const isCollapsed = (id: string) => collapsed.has(id);

  const toggle = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveCollapsed(next);
      return next;
    });
  };

  const expand = (id: string) => {
    setCollapsed((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      saveCollapsed(next);
      return next;
    });
  };

  return { isCollapsed, toggle, expand };
}
