import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { deriveQuestionStatus, summarizeClarificationPacket } from "./status.ts";

type Item = { id: string; reviewStatus: string };

function brief(items: Item[]) {
  return { items: items as unknown as never[] } as { items: never[] };
}

function question(linkedItemId: string | null, priority = "Medium") {
  return {
    id: `q_${linkedItemId ?? "none"}`,
    question: "Q?",
    category: "scope" as const,
    priority: priority as never,
    cause: "because",
    linkedItemId,
  };
}

describe("deriveQuestionStatus", () => {
  for (const status of ["accepted", "edited", "rejected"]) {
    it(`returns "resolved" when the linked item is ${status}`, () => {
      const result = deriveQuestionStatus(
        question("item_1"),
        brief([{ id: "item_1", reviewStatus: status }]),
      );
      assert.equal(result, "resolved");
    });
  }

  for (const status of ["pending", "flagged"]) {
    it(`returns "open" when the linked item is ${status}`, () => {
      const result = deriveQuestionStatus(
        question("item_1"),
        brief([{ id: "item_1", reviewStatus: status }]),
      );
      assert.equal(result, "open");
    });
  }

  it("returns \"open\" when linkedItemId is null", () => {
    const result = deriveQuestionStatus(
      question(null),
      brief([{ id: "item_1", reviewStatus: "accepted" }]),
    );
    assert.equal(result, "open");
  });

  it("returns \"open\" when the linked item no longer exists in the brief", () => {
    const result = deriveQuestionStatus(
      question("missing"),
      brief([{ id: "item_1", reviewStatus: "accepted" }]),
    );
    assert.equal(result, "open");
  });
});

describe("summarizeClarificationPacket", () => {
  it("sorts questions Critical -> High -> Medium -> Low, preserving generation order within a priority", () => {
    const packet = {
      questions: [
        { ...question(null, "Low"), id: "low" },
        { ...question(null, "Critical"), id: "crit1" },
        { ...question(null, "Medium"), id: "med" },
        { ...question(null, "Critical"), id: "crit2" },
        { ...question(null, "High"), id: "high" },
      ],
    };
    const summary = summarizeClarificationPacket(packet, brief([]));
    assert.deepEqual(
      summary.questions.map((q) => q.id),
      ["crit1", "crit2", "high", "med", "low"],
    );
  });

  it("reports isCleared=true for an empty packet", () => {
    const summary = summarizeClarificationPacket({ questions: [] }, brief([]));
    assert.equal(summary.openCount, 0);
    assert.equal(summary.isCleared, true);
  });

  it("reports isCleared=true when every question is resolved", () => {
    const packet = { questions: [question("item_1"), question("item_2")] };
    const summary = summarizeClarificationPacket(
      packet,
      brief([
        { id: "item_1", reviewStatus: "accepted" },
        { id: "item_2", reviewStatus: "rejected" },
      ]),
    );
    assert.equal(summary.openCount, 0);
    assert.equal(summary.isCleared, true);
  });

  it("reports isCleared=false and counts open questions when blockers remain", () => {
    const packet = { questions: [question("item_1"), question("item_2")] };
    const summary = summarizeClarificationPacket(
      packet,
      brief([
        { id: "item_1", reviewStatus: "accepted" },
        { id: "item_2", reviewStatus: "pending" },
      ]),
    );
    assert.equal(summary.openCount, 1);
    assert.equal(summary.isCleared, false);
  });
});
