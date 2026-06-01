import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CRITICAL_CATEGORIES,
  evaluateScopeConfidence,
  evaluateNoPromiseGate,
  canGenerateExternalArtifacts,
} from "./confidence.ts";
import type { ScopeBrief, ScopeItem, ReviewStatus, ScopeCategory } from "./schemas/scope-brief.ts";

let counter = 0;
function item(
  category: ScopeCategory,
  reviewStatus: ReviewStatus,
): ScopeItem {
  counter += 1;
  return {
    id: `item_${counter}`,
    category,
    content: `content ${counter}`,
    inferred: false,
    reviewStatus,
    sourceContextItemIds: [],
    editedContent: null,
  };
}

function brief(
  partial: Partial<Pick<ScopeBrief, "sparseInput" | "items" | "noPromiseOverride">>,
): Pick<ScopeBrief, "sparseInput" | "items" | "noPromiseOverride"> {
  return {
    sparseInput: partial.sparseInput ?? false,
    items: partial.items ?? [],
    noPromiseOverride: partial.noPromiseOverride ?? null,
  };
}

describe("evaluateScopeConfidence", () => {
  it("returns Low when input is sparse regardless of items", () => {
    const b = brief({ sparseInput: true, items: [item("goal", "accepted")] });
    assert.equal(evaluateScopeConfidence(b), "Low");
  });

  it("returns Low when there are no active items", () => {
    assert.equal(evaluateScopeConfidence(brief({ items: [] })), "Low");
    // all rejected -> no active items
    assert.equal(
      evaluateScopeConfidence(brief({ items: [item("goal", "rejected")] })),
      "Low",
    );
  });

  it("returns Low for an entirely unreviewed (all-pending) brief", () => {
    const b = brief({
      items: [item("goal", "pending"), item("functionalRequirement", "pending")],
    });
    assert.equal(evaluateScopeConfidence(b), "Low");
  });

  it("returns Medium when some reviewed and only non-critical pending remain", () => {
    const b = brief({
      items: [item("goal", "accepted"), item("functionalRequirement", "pending")],
    });
    assert.equal(evaluateScopeConfidence(b), "Medium");
  });

  it("returns High when every active item is accepted/edited with no flags", () => {
    const b = brief({
      items: [item("goal", "accepted"), item("functionalRequirement", "edited")],
    });
    assert.equal(evaluateScopeConfidence(b), "High");
  });

  it("returns Low when a pending critical (risk) remains, even with other reviewed items", () => {
    const b = brief({
      items: [item("goal", "accepted"), item("risk", "pending")],
    });
    assert.equal(evaluateScopeConfidence(b), "Low");
  });

  it("returns Low when any item is flagged, even a non-critical category", () => {
    const b = brief({
      items: [item("goal", "flagged"), item("functionalRequirement", "accepted")],
    });
    assert.equal(evaluateScopeConfidence(b), "Low");
  });

  it("ignores rejected critical items when computing confidence", () => {
    const b = brief({
      items: [item("risk", "rejected"), item("goal", "accepted")],
    });
    assert.equal(evaluateScopeConfidence(b), "High");
  });
});

describe("evaluateNoPromiseGate", () => {
  it("is not blocked when all active items are resolved and not sparse", () => {
    const b = brief({ items: [item("goal", "accepted"), item("risk", "accepted")] });
    const gate = evaluateNoPromiseGate(b);
    assert.equal(gate.blocked, false);
    assert.equal(gate.blockers.length, 0);
  });

  it("blocks on sparse input with a sparse-input blocker", () => {
    const gate = evaluateNoPromiseGate(brief({ sparseInput: true }));
    assert.equal(gate.blocked, true);
    assert.equal(gate.blockers[0]?.type, "sparse-input");
  });

  it("blocks on a pending critical item and names it", () => {
    const b = brief({ items: [item("openQuestion", "pending")] });
    const gate = evaluateNoPromiseGate(b);
    assert.equal(gate.blocked, true);
    assert.equal(gate.blockers[0]?.type, "unreviewed-critical");
    assert.ok(gate.blockers[0]?.itemId);
    assert.match(gate.blockers[0]!.message, /open question/);
  });

  it("blocks on a flagged item of any category", () => {
    const b = brief({ items: [item("goal", "flagged")] });
    const gate = evaluateNoPromiseGate(b);
    assert.equal(gate.blocked, true);
    assert.equal(gate.blockers[0]?.type, "flagged-item");
  });

  it("does not block on pending non-critical items", () => {
    const b = brief({ items: [item("goal", "pending")] });
    const gate = evaluateNoPromiseGate(b);
    assert.equal(gate.blocked, false);
  });

  it("ignores rejected critical items", () => {
    const b = brief({ items: [item("risk", "rejected"), item("goal", "accepted")] });
    const gate = evaluateNoPromiseGate(b);
    assert.equal(gate.blocked, false);
  });

  it("blocks an empty (all-rejected) non-sparse brief as having no active scope", () => {
    const b = brief({ items: [item("risk", "rejected")] });
    const gate = evaluateNoPromiseGate(b);
    assert.equal(gate.blocked, true);
    assert.equal(gate.blockers[0]?.type, "empty-scope");
  });
});

describe("canGenerateExternalArtifacts", () => {
  it("allows generation when not blocked", () => {
    const b = brief({ items: [item("goal", "accepted")] });
    assert.equal(canGenerateExternalArtifacts(b).allowed, true);
  });

  it("disallows generation when blocked and no override, with a reason", () => {
    const b = brief({ items: [item("risk", "pending")] });
    const result = canGenerateExternalArtifacts(b);
    assert.equal(result.allowed, false);
    assert.ok(result.reason);
  });

  it("override flips generation to allowed while the gate stays blocked", () => {
    const b = brief({
      items: [item("risk", "pending")],
      noPromiseOverride: {
        overriddenByUserId: "user_1",
        overriddenAt: "2026-05-31T00:00:00.000Z",
        reason: "Client accepts the risk in writing.",
      },
    });
    assert.equal(canGenerateExternalArtifacts(b).allowed, true);
    assert.equal(evaluateNoPromiseGate(b).blocked, true);
  });
});

describe("CRITICAL_CATEGORIES", () => {
  it("contains the four commitment-risk categories", () => {
    assert.deepEqual(
      [...CRITICAL_CATEGORIES].sort(),
      ["constraint", "integration", "openQuestion", "risk"].sort(),
    );
  });
});
