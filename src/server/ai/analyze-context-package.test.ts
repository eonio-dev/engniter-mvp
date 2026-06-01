import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isSparseInput, mapSourceIndices } from "./analyze-context-package.helpers.ts";
import type { ContextItem } from "../../features/context-packages/types.ts";

describe("isSparseInput", () => {
  it("returns true when fewer than 2 items", () => {
    assert.equal(isSparseInput([]), true);
    assert.equal(isSparseInput([{ content: "x" } as ContextItem]), true);
  });

  it("returns true when total content < 200 chars", () => {
    const items = [
      { content: "short" } as ContextItem,
      { content: "also short" } as ContextItem,
    ];
    assert.equal(isSparseInput(items), true);
  });

  it("returns false when 2+ items with sufficient content", () => {
    const longContent = "a".repeat(150);
    const items = [
      { content: longContent } as ContextItem,
      { content: longContent } as ContextItem,
    ];
    assert.equal(isSparseInput(items), false);
  });

  it("counts null content as 0 chars", () => {
    const items = [
      { content: null } as unknown as ContextItem,
      { content: null } as unknown as ContextItem,
    ];
    assert.equal(isSparseInput(items), true);
  });
});

describe("mapSourceIndices", () => {
  const items = [
    { id: "ctx_A", content: "a" } as ContextItem,
    { id: "ctx_B", content: "b" } as ContextItem,
    { id: "ctx_C", content: "c" } as ContextItem,
  ];

  it("maps 1-based string indices to Firestore IDs", () => {
    assert.deepEqual(mapSourceIndices(["1", "2"], items), ["ctx_A", "ctx_B"]);
  });

  it("maps a single index", () => {
    assert.deepEqual(mapSourceIndices(["3"], items), ["ctx_C"]);
  });

  it("returns empty array for empty indices", () => {
    assert.deepEqual(mapSourceIndices([], items), []);
  });

  it("skips out-of-range indices silently", () => {
    assert.deepEqual(mapSourceIndices(["0", "4", "99"], items), []);
  });

  it("handles mixed valid and invalid indices", () => {
    assert.deepEqual(mapSourceIndices(["1", "99", "2"], items), ["ctx_A", "ctx_B"]);
  });
});
