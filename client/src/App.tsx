import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { AuthPage } from "./components/AuthPage";
import { Toast } from "./components/Toast";
import { TodoTree } from "./components/TodoTree";
import { useAuth } from "./context/AuthContext";
import { useCollapsedState } from "./hooks/useCollapsed";
import { useShowCompleted } from "./hooks/useShowCompleted";
import { useToast } from "./hooks/useToast";
import { useTodos } from "./hooks/useTodos";
import { useTodoSync } from "./hooks/useTodoSync";
import { TodoDragProvider, useTreeDragDrop } from "./hooks/useTreeDragDrop";
import type { DropPreview } from "./lib/moveUtils";
import {
  countCompleted,
  filterCompleted,
  filterBySearch,
  collectExpandIdsForSearch,
  buildDirectChildProgressMap,
  type TodoNode,
} from "./lib/treeUtils";

export default function App() {
  const { user, loading: authLoading, logout } = useAuth();
  const listRef = useRef<HTMLDivElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);
  const { message, showToast, dismissToast } = useToast();
  const [newTitle, setNewTitle] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrollToTodoId, setScrollToTodoId] = useState<string | null>(null);
  const { tree, loading, error, create, update, remove, moveTodo, syncRemote } =
    useTodos(
      (message, failedInput) => {
        showToast(message);
        if (failedInput?.title) setNewTitle(failedInput.title);
      },
      user?.id,
      setScrollToTodoId
    );

  useTodoSync({
    userId: user?.id,
    onSync: syncRemote,
    onRemoteChange: () => showToast("Updated from another device"),
  });
  const { isCollapsed, toggle, expand } = useCollapsedState();
  const { showCompleted, toggle: toggleShowCompleted } = useShowCompleted();

  const findNode = useCallback((nodes: TodoNode[], id: string): TodoNode | undefined => {
    for (const n of nodes) {
      if (n._id === id) return n;
      const found = findNode(n.children, id);
      if (found) return found;
    }
    return undefined;
  }, []);

  const handleExpandParent = useCallback(
    (parentId: string) => {
      if (isCollapsed(parentId)) toggle(parentId);
    },
    [isCollapsed, toggle]
  );

  const handleMove = useCallback(
    (dragId: string, preview: DropPreview) => moveTodo(dragId, preview),
    [moveTodo]
  );

  const drag = useTreeDragDrop({
    tree,
    scrollContainerRef: listRef,
    onMove: handleMove,
    onExpandParent: handleExpandParent,
    findNode: (id) => findNode(tree, id),
  });

  const visibleTree = useMemo(() => {
    const base = showCompleted ? tree : filterCompleted(tree);
    return filterBySearch(base, isSearchMode ? searchQuery : "");
  }, [tree, showCompleted, isSearchMode, searchQuery]);

  const searchHighlightQuery = useMemo(
    () => (isSearchMode ? searchQuery.trim() : ""),
    [isSearchMode, searchQuery]
  );

  const treeEmptyMessage = useMemo(() => {
    if (isSearchMode && searchQuery.trim()) {
      return "No tasks match your search.";
    }
    return "No tasks yet. Add one above.";
  }, [isSearchMode, searchQuery]);
  const completedCount = useMemo(() => countCompleted(tree), [tree]);
  const childProgressMap = useMemo(() => buildDirectChildProgressMap(tree), [tree]);

  useEffect(() => {
    if (!isSearchMode || !searchQuery.trim()) return;
    const base = showCompleted ? tree : filterCompleted(tree);
    const filtered = filterBySearch(base, searchQuery);
    for (const id of collectExpandIdsForSearch(filtered)) {
      if (isCollapsed(id)) expand(id);
    }
  }, [searchQuery, isSearchMode]);

  const handleAddRoot = (e: FormEvent) => {
    e.preventDefault();
    if (isSearchMode) return;
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    setNewTitle("");
    create({ title: trimmed });
  };

  const toggleSearchMode = () => {
    setIsSearchMode((prev) => {
      if (prev) setSearchQuery("");
      return !prev;
    });
    requestAnimationFrame(() => headerInputRef.current?.focus());
  };

  const handleHeaderKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape" && isSearchMode) {
      setIsSearchMode(false);
      setSearchQuery("");
    }
  };

  const handleUpdate = async (
    id: string,
    data: { title?: string; notes?: string; emoji?: string; completed?: boolean; dueAt?: string | null }
  ) => {
    await update(id, data);
  };

  const handleCreateChild = (parentId: string, title: string) => {
    if (isCollapsed(parentId)) toggle(parentId);
    create({ title, parentId });
  };

  const handleDelete = async (id: string, hasChildren: boolean) => {
    if (hasChildren && !window.confirm("Delete this task and all sub-tasks?")) return;
    await remove(id);
  };

  if (authLoading) {
    return (
      <div className="flex h-dvh items-center justify-center text-zinc-500">Loading...</div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="mx-auto flex h-dvh max-w-2xl flex-col overflow-hidden px-4 py-6 sm:py-10">
      <header className="mb-6 flex shrink-0 items-baseline justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-medium text-zinc-100">Todos</h1>
          <p className="truncate text-sm text-zinc-500">{user.email}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {completedCount > 0 && (
            <button
              type="button"
              onClick={toggleShowCompleted}
              className="text-sm text-zinc-500 hover:text-zinc-300"
            >
              {showCompleted ? "Hide done" : `Show done (${completedCount})`}
            </button>
          )}
          <button
            type="button"
            onClick={() => logout()}
            className="text-sm text-zinc-500 hover:text-zinc-300"
          >
            Sign out
          </button>
        </div>
      </header>

      <form onSubmit={handleAddRoot} className="mb-4 flex shrink-0 gap-2">
        <div className="relative min-w-0 flex-1">
          <button
            type="button"
            onClick={toggleSearchMode}
            aria-pressed={isSearchMode}
            aria-label={isSearchMode ? "Back to add task" : "Search tasks"}
            className={`absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded p-0.5 transition-colors ${
              isSearchMode
                ? "text-violet-400 hover:text-violet-300"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path
                d="M20 20L16.5 16.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <input
            ref={headerInputRef}
            value={isSearchMode ? searchQuery : newTitle}
            onChange={(e) =>
              isSearchMode ? setSearchQuery(e.target.value) : setNewTitle(e.target.value)
            }
            onKeyDown={handleHeaderKeyDown}
            placeholder={isSearchMode ? "Search tasks..." : "Add a task..."}
            className={`todo-header-input w-full rounded-lg bg-zinc-900 py-3 pl-10 pr-4 text-base text-zinc-100 outline-none ring-1 transition-[box-shadow] duration-200 ease-out ${
              isSearchMode
                ? "ring-violet-600 focus:ring-violet-500"
                : "ring-zinc-800 focus:ring-zinc-600"
            }`}
          />
        </div>
        <button
          type="submit"
          disabled={isSearchMode}
          className="shrink-0 rounded-lg bg-zinc-100 px-4 py-3 text-base font-medium text-zinc-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add
        </button>
      </form>

      <div
        ref={listRef}
        className="todo-scroll min-h-0 flex-1 overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        {loading && <p className="text-zinc-500">Loading...</p>}
        {error && <p className="text-red-400">{error}</p>}

        {!loading && !error && (
          <TodoDragProvider drag={drag}>
            <TodoTree
              nodes={visibleTree}
              scrollContainerRef={listRef}
              scrollToTodoId={scrollToTodoId}
              onScrolledToTodo={() => setScrollToTodoId(null)}
              childProgressMap={childProgressMap}
              activeId={drag.activeId}
              dropPreview={drag.dropPreview}
              dragRowHeight={drag.dragRowHeight}
              onUpdate={handleUpdate}
              onCreate={handleCreateChild}
              onDelete={handleDelete}
              isCollapsed={isCollapsed}
              toggleCollapsed={toggle}
              searchHighlightQuery={searchHighlightQuery}
              emptyMessage={treeEmptyMessage}
            />
          </TodoDragProvider>
        )}
      </div>

      <Toast message={message} onDismiss={dismissToast} />
    </div>
  );
}
