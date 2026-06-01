import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseClarificationResponse,
  mapClarificationQuestions,
  selectCandidateItems,
} from "./generate-clarification-packet.helpers.ts";
import type { ScopeItem } from "../../features/scope-briefs/types.ts";

function item(id: string): ScopeItem {
  return {
    id,
    category: "risk",
    content: "content",
    inferred: false,
    reviewStatus: "pending",
    sourceContextItemIds: [],
    editedContent: null,
  };
}

const validQuestion = {
  question: "Which compliance regime applies?",
  category: "nonFunctional",
  priority: "High",
  cause: "No security/compliance posture is stated.",
  linkedItemIndex: 1,
};

describe("parseClarificationResponse", () => {
  it("parses a valid response", () => {
    const parsed = parseClarificationResponse(JSON.stringify({ questions: [validQuestion] }));
    assert.ok(parsed);
    assert.equal(parsed?.questions.length, 1);
  });

  it("parses an empty questions list", () => {
    const parsed = parseClarificationResponse(JSON.stringify({ questions: [] }));
    assert.ok(parsed);
    assert.equal(parsed?.questions.length, 0);
  });

  it("accepts a null linkedItemIndex", () => {
    const parsed = parseClarificationResponse(
      JSON.stringify({ questions: [{ ...validQuestion, linkedItemIndex: null }] }),
    );
    assert.equal(parsed?.questions[0]?.linkedItemIndex, null);
  });

  it("returns null for invalid JSON", () => {
    assert.equal(parseClarificationResponse("not json"), null);
  });

  it("returns null when the schema does not match", () => {
    assert.equal(parseClarificationResponse(JSON.stringify({ foo: "bar" })), null);
  });

  it("returns null for an unknown category", () => {
    assert.equal(
      parseClarificationResponse(
        JSON.stringify({ questions: [{ ...validQuestion, category: "unknown" }] }),
      ),
      null,
    );
  });

  it("returns null for an unknown priority", () => {
    assert.equal(
      parseClarificationResponse(
        JSON.stringify({ questions: [{ ...validQuestion, priority: "Urgent" }] }),
      ),
      null,
    );
  });

  it("returns null for empty string", () => {
    assert.equal(parseClarificationResponse(""), null);
  });
});

describe("mapClarificationQuestions", () => {
  const items = [item("item_A"), item("item_B"), item("item_C")];

  it("maps a 1-based linkedItemIndex to the scope item id", () => {
    const result = mapClarificationQuestions(
      { questions: [{ ...validQuestion, linkedItemIndex: 2 }] },
      items,
    );
    assert.equal(result[0]?.linkedItemId, "item_B");
  });

  it("keeps linkedItemId null when index is null", () => {
    const result = mapClarificationQuestions(
      { questions: [{ ...validQuestion, linkedItemIndex: null }] },
      items,
    );
    assert.equal(result[0]?.linkedItemId, null);
  });

  it("falls back to null for out-of-range indices", () => {
    const result = mapClarificationQuestions(
      { questions: [{ ...validQuestion, linkedItemIndex: 99 }] },
      items,
    );
    assert.equal(result[0]?.linkedItemId, null);
  });

  it("assigns a non-empty id and preserves content fields", () => {
    const result = mapClarificationQuestions(
      { questions: [{ ...validQuestion, linkedItemIndex: 1 }] },
      items,
    );
    assert.ok(result[0]);
    assert.equal(typeof result[0]?.id, "string");
    assert.ok((result[0]?.id.length ?? 0) > 0);
    assert.equal(result[0]?.question, validQuestion.question);
    assert.equal(result[0]?.category, validQuestion.category);
    assert.equal(result[0]?.priority, validQuestion.priority);
    assert.equal(result[0]?.cause, validQuestion.cause);
    assert.equal(result[0]?.linkedItemId, "item_A");
  });

  it("maps an empty list to an empty array", () => {
    assert.deepEqual(mapClarificationQuestions({ questions: [] }, items), []);
  });
});

describe("selectCandidateItems", () => {
  function make(overrides: Partial<ScopeItem>): ScopeItem {
    return { ...item("x"), ...overrides };
  }

  it("includes a pending critical-category item", () => {
    const i = make({ id: "r1", category: "risk", reviewStatus: "pending", sourceContextItemIds: ["1"] });
    assert.deepEqual(selectCandidateItems([i]).map((x) => x.id), ["r1"]);
  });

  it("includes a flagged integration item", () => {
    const i = make({ id: "n1", category: "integration", reviewStatus: "flagged", sourceContextItemIds: ["1"] });
    assert.deepEqual(selectCandidateItems([i]).map((x) => x.id), ["n1"]);
  });

  it("includes any active item missing a Source Reference", () => {
    const i = make({ id: "g1", category: "goal", reviewStatus: "accepted", sourceContextItemIds: [] });
    assert.deepEqual(selectCandidateItems([i]).map((x) => x.id), ["g1"]);
  });

  it("includes an unresolved open question", () => {
    const i = make({ id: "oq1", category: "openQuestion", reviewStatus: "pending", sourceContextItemIds: ["1"] });
    assert.deepEqual(selectCandidateItems([i]).map((x) => x.id), ["oq1"]);
  });

  it("excludes rejected items even when they would otherwise qualify", () => {
    const i = make({ id: "r2", category: "risk", reviewStatus: "rejected", sourceContextItemIds: [] });
    assert.deepEqual(selectCandidateItems([i]), []);
  });

  it("excludes an accepted, well-evidenced, non-critical item", () => {
    const i = make({ id: "f1", category: "functionalRequirement", reviewStatus: "accepted", sourceContextItemIds: ["1"] });
    assert.deepEqual(selectCandidateItems([i]), []);
  });

  it("excludes an accepted critical item that has evidence (already resolved)", () => {
    const i = make({ id: "r3", category: "risk", reviewStatus: "accepted", sourceContextItemIds: ["1"] });
    assert.deepEqual(selectCandidateItems([i]), []);
  });
});
