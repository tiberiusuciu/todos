import { describe, expect, it } from "vitest";
import type { TodoNode } from "./api";
import { collectExpandIdsForSearch, filterBySearch } from "./treeUtils";

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
