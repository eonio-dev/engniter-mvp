import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseFitMismatchResponse,
  mapFitMismatches,
} from "./fit-mismatch.helpers.ts";
import type { ScopeItem } from "../../features/scope-briefs/types.ts";

function item(id: string): ScopeItem {
  return {
    id,
    category: "functionalRequirement",
    content: "content",
    inferred: false,
    reviewStatus: "accepted",
    sourceContextItemIds: [],
    editedContent: null,
  };
}

describe("parseFitMismatchResponse", () => {
  it("parses a valid response", () => {
    const raw = JSON.stringify({
      mismatches: [
        { criterion: "Budget under 10k", conflictingItemIndex: 2, reason: "Scope exceeds budget." },
      ],
    });
    const parsed = parseFitMismatchResponse(raw);
    assert.ok(parsed);
    assert.equal(parsed?.mismatches.length, 1);
  });

  it("parses an empty mismatch list", () => {
    const parsed = parseFitMismatchResponse(JSON.stringify({ mismatches: [] }));
    assert.ok(parsed);
    assert.equal(parsed?.mismatches.length, 0);
  });

  it("accepts a null conflictingItemIndex", () => {
    const raw = JSON.stringify({
      mismatches: [{ criterion: "Timeline", conflictingItemIndex: null, reason: "General concern." }],
    });
    const parsed = parseFitMismatchResponse(raw);
    assert.equal(parsed?.mismatches[0]?.conflictingItemIndex, null);
  });

  it("returns null for invalid JSON", () => {
    assert.equal(parseFitMismatchResponse("not json"), null);
  });

  it("returns null when schema does not match", () => {
    assert.equal(parseFitMismatchResponse(JSON.stringify({ foo: "bar" })), null);
  });

  it("returns null for empty string", () => {
    assert.equal(parseFitMismatchResponse(""), null);
  });
});

describe("mapFitMismatches", () => {
  const items = [item("item_A"), item("item_B"), item("item_C")];

  it("maps a 1-based index to the scope item id", () => {
    const result = mapFitMismatches(
      { mismatches: [{ criterion: "Budget", conflictingItemIndex: 2, reason: "Too costly." }] },
      items,
    );
    assert.equal(result[0]?.conflictingItemId, "item_B");
  });

  it("keeps conflictingItemId null when index is null", () => {
    const result = mapFitMismatches(
      { mismatches: [{ criterion: "Timeline", conflictingItemIndex: null, reason: "Vague." }] },
      items,
    );
    assert.equal(result[0]?.conflictingItemId, null);
  });

  it("falls back to null for out-of-range indices", () => {
    const result = mapFitMismatches(
      { mismatches: [{ criterion: "X", conflictingItemIndex: 99, reason: "Bad index." }] },
      items,
    );
    assert.equal(result[0]?.conflictingItemId, null);
  });

  it("preserves criterion and reason", () => {
    const result = mapFitMismatches(
      { mismatches: [{ criterion: "Budget", conflictingItemIndex: 1, reason: "Too costly." }] },
      items,
    );
    assert.deepEqual(result[0], {
      criterion: "Budget",
      conflictingItemId: "item_A",
      reason: "Too costly.",
    });
  });

  it("maps an empty list to an empty array", () => {
    assert.deepEqual(mapFitMismatches({ mismatches: [] }, items), []);
  });
});
