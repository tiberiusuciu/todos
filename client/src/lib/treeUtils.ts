import type { Todo, TodoNode } from "./api";

export type { TodoNode };

export function buildTree(flat: Todo[]): TodoNode[] {
  const map = new Map<string, TodoNode>();
  const roots: TodoNode[] = [];

  for (const todo of flat) {
    map.set(todo._id, { ...todo, children: [] });
  }

  for (const todo of flat) {
    const node = map.get(todo._id)!;
    if (todo.parentId && map.has(todo.parentId)) {
      map.get(todo.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (nodes: TodoNode[]) => {
    nodes.sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
    nodes.forEach((n) => sortNodes(n.children));
  };

  sortNodes(roots);
  return roots;
}

export function flattenTree(nodes: TodoNode[]): Todo[] {
  const out: Todo[] = [];
  function walk(list: TodoNode[]) {
    for (const node of list) {
      const { children, ...todo } = node;
      out.push(todo);
      walk(children);
    }
  }
  walk(nodes);
  return out;
}

export function hasChildren(node: TodoNode): boolean {
  return node.children.length > 0;
}

export function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

function matchesSearchQuery(node: TodoNode, normalizedQuery: string): boolean {
  return (
    node.title.toLowerCase().includes(normalizedQuery) ||
    node.notes.toLowerCase().includes(normalizedQuery)
  );
}

export function nodeSearchMatches(
  node: TodoNode,
  query: string
): { title: boolean; notes: boolean } {
  const normalizedQuery = normalizeSearchQuery(query);
  if (!normalizedQuery) return { title: false, notes: false };
  return {
    title: node.title.toLowerCase().includes(normalizedQuery),
    notes: node.notes.toLowerCase().includes(normalizedQuery),
  };
}

export function filterBySearch(nodes: TodoNode[], query: string): TodoNode[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return nodes;

  const result: TodoNode[] = [];
  for (const node of nodes) {
    const selfMatches = matchesSearchQuery(node, normalizedQuery);
    const children = selfMatches
      ? node.children
      : filterBySearch(node.children, query);
    if (selfMatches || children.length > 0) {
      result.push({ ...node, children });
    }
  }
  return result;
}

export function collectParentIds(nodes: TodoNode[]): string[] {
  const ids: string[] = [];
  function walk(list: TodoNode[]) {
    for (const node of list) {
      if (node.children.length > 0) {
        ids.push(node._id);
        walk(node.children);
      }
    }
  }
  walk(nodes);
  return ids;
}

export function collectExpandIdsForSearch(nodes: TodoNode[]): Set<string> {
  return new Set(collectParentIds(nodes));
}

export function filterCompleted(nodes: TodoNode[]): TodoNode[] {
  const result: TodoNode[] = [];

  for (const node of nodes) {
    const children = filterCompleted(node.children);
    if (node.completed) {
      result.push(...children);
    } else {
      result.push({ ...node, children });
    }
  }

  return result;
}

export function countCompleted(nodes: TodoNode[]): number {
  let count = 0;
  for (const node of nodes) {
    if (node.completed) count++;
    count += countCompleted(node.children);
  }
  return count;
}

export function isDescendant(nodes: TodoNode[], ancestorId: string, nodeId: string): boolean {
  function containsDescendant(list: TodoNode[]): boolean {
    for (const n of list) {
      if (n._id === nodeId) return true;
      if (containsDescendant(n.children)) return true;
    }
    return false;
  }

  function findAncestor(list: TodoNode[]): TodoNode | null {
    for (const n of list) {
      if (n._id === ancestorId) return n;
      const found = findAncestor(n.children);
      if (found) return found;
    }
    return null;
  }

  const ancestor = findAncestor(nodes);
  return ancestor ? containsDescendant(ancestor.children) : false;
}

export type DirectChildProgress = { done: number; total: number };

export function buildDirectChildProgressMap(
  nodes: TodoNode[]
): Map<string, DirectChildProgress> {
  const map = new Map<string, DirectChildProgress>();

  function walk(list: TodoNode[]) {
    for (const node of list) {
      if (node.children.length > 0) {
        map.set(node._id, {
          done: node.children.filter((c) => c.completed).length,
          total: node.children.length,
        });
      }
      walk(node.children);
    }
  }

  walk(nodes);
  return map;
}
