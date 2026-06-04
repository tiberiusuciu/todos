import { describe, expect, it } from "vitest";
import type { TodoNode } from "./api";
import {
  collectExpandIdsForSearch,
  collectParentIds,
  filterBySearch,
  nodeSearchMatches,
} from "./treeUtils";

function node(
  partial: Partial<TodoNode> & Pick<TodoNode, "_id" | "title">,
  children: TodoNode[] = []
): TodoNode {
  return {
    notes: "",
    emoji: "",
    completed: false,
    parentId: null,
    order: 0,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    dueAt: null,
    children,
    ...partial,
  };
}

describe("filterBySearch", () => {
  const tree: TodoNode[] = [
    node({ _id: "a", title: "Buy groceries" }),
    node(
      { _id: "b", title: "Work" },
      [node({ _id: "b1", title: "Deploy app" }), node({ _id: "b2", title: "Review PR", notes: "urgent fix" })]
    ),
  ];

  it("returns nodes unchanged when query is empty", () => {
    expect(filterBySearch(tree, "")).toEqual(tree);
    expect(filterBySearch(tree, "   ")).toEqual(tree);
  });

  it("matches title at root", () => {
    const result = filterBySearch(tree, "groceries");
    expect(result).toHaveLength(1);
    expect(result[0]._id).toBe("a");
  });

  it("keeps all children when parent matches", () => {
    const result = filterBySearch(tree, "work");
    expect(result).toHaveLength(1);
    expect(result[0]._id).toBe("b");
    expect(result[0].children).toHaveLength(2);
    expect(result[0].children.map((c) => c._id)).toEqual(["b1", "b2"]);
  });

  it("keeps parent when nested child matches", () => {
    const result = filterBySearch(tree, "deploy");
    expect(result).toHaveLength(1);
    expect(result[0]._id).toBe("b");
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children[0]._id).toBe("b1");
  });

  it("matches notes", () => {
    const result = filterBySearch(tree, "urgent");
    expect(result).toHaveLength(1);
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children[0]._id).toBe("b2");
  });

  it("prunes non-matching branches", () => {
    expect(filterBySearch(tree, "zzz")).toEqual([]);
  });
});

describe("nodeSearchMatches", () => {
  const n = node({ _id: "a", title: "Buy groceries", notes: "urgent fix" });

  it("returns no matches for empty query", () => {
    expect(nodeSearchMatches(n, "")).toEqual({ title: false, notes: false });
  });

  it("matches title only", () => {
    expect(nodeSearchMatches(n, "groceries")).toEqual({ title: true, notes: false });
  });

  it("matches notes only", () => {
    expect(nodeSearchMatches(n, "urgent")).toEqual({ title: false, notes: true });
  });

  it("matches both fields independently", () => {
    expect(nodeSearchMatches(n, "buy")).toEqual({ title: true, notes: false });
    expect(nodeSearchMatches(n, "fix")).toEqual({ title: false, notes: true });
  });
});

describe("collectParentIds", () => {
  it("collects ids of all nodes with children", () => {
    const tree: TodoNode[] = [
      node(
        { _id: "a", title: "Root" },
        [
          node({ _id: "a1", title: "Child" }),
          node(
            { _id: "a2", title: "Branch" },
            [node({ _id: "a2a", title: "Leaf" })]
          ),
        ]
      ),
    ];
    expect(collectParentIds(tree)).toEqual(["a", "a2"]);
  });
});

describe("collectExpandIdsForSearch", () => {
  it("collects ids of nodes with children in filtered tree", () => {
    const filtered: TodoNode[] = [
      node(
        { _id: "b", title: "Work" },
        [node({ _id: "b1", title: "Deploy app" })]
      ),
    ];
    expect(collectExpandIdsForSearch(filtered)).toEqual(new Set(["b"]));
  });
});
