import { useState } from "react";

const STORAGE_KEY = "todo-show-completed";

function loadShowCompleted(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return true;
    return raw === "true";
  } catch {
    return true;
  }
}

export function useShowCompleted() {
  const [showCompleted, setShowCompleted] = useState(loadShowCompleted);

  const toggle = () => {
    setShowCompleted((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  return { showCompleted, toggle };
}
