import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  clarificationQuestionSchema,
  clarificationPacketSchema,
  generateClarificationPacketSchema,
  CLARIFICATION_CATEGORIES,
  CLARIFICATION_PRIORITIES,
} from "./clarification.ts";

const validQuestion = {
  id: "q_1",
  question: "Which auth provider must we integrate with?",
  category: "integration" as const,
  priority: "Critical" as const,
  cause: "No integration target is named, blocking feasibility assessment.",
  linkedItemId: "item_1",
};

describe("clarificationQuestionSchema", () => {
  it("accepts a valid question", () => {
    const r = clarificationQuestionSchema.safeParse(validQuestion);
    assert.ok(r.success, JSON.stringify(r.error?.issues));
  });

  it("accepts a null linkedItemId", () => {
    const r = clarificationQuestionSchema.safeParse({ ...validQuestion, linkedItemId: null });
    assert.ok(r.success);
  });

  it("rejects an unknown category", () => {
    const r = clarificationQuestionSchema.safeParse({ ...validQuestion, category: "unknown" });
    assert.ok(!r.success);
  });

  it("rejects an unknown priority", () => {
    const r = clarificationQuestionSchema.safeParse({ ...validQuestion, priority: "Urgent" });
    assert.ok(!r.success);
  });

  it("rejects empty question text", () => {
    const r = clarificationQuestionSchema.safeParse({ ...validQuestion, question: "" });
    assert.ok(!r.success);
  });

  it("rejects empty cause", () => {
    const r = clarificationQuestionSchema.safeParse({ ...validQuestion, cause: "" });
    assert.ok(!r.success);
  });

  it("accepts every category and priority enum value", () => {
    for (const category of CLARIFICATION_CATEGORIES) {
      for (const priority of CLARIFICATION_PRIORITIES) {
        const r = clarificationQuestionSchema.safeParse({ ...validQuestion, category, priority });
        assert.ok(r.success, `category ${category} / priority ${priority} should be valid`);
      }
    }
  });
});

describe("clarificationPacketSchema", () => {
  it("accepts a valid packet", () => {
    const r = clarificationPacketSchema.safeParse({
      id: "pkt_1",
      opportunityId: "opp_1",
      scopeBriefId: "sb_1",
      scopeBriefVersion: 1,
      generatedAt: new Date().toISOString(),
      questions: [validQuestion],
    });
    assert.ok(r.success, JSON.stringify(r.error?.issues));
  });

  it("accepts an empty questions array (cleared packet)", () => {
    const r = clarificationPacketSchema.safeParse({
      id: "pkt_1",
      opportunityId: "opp_1",
      scopeBriefId: "sb_1",
      scopeBriefVersion: 2,
      generatedAt: new Date().toISOString(),
      questions: [],
    });
    assert.ok(r.success);
  });

  it("rejects a version below 1", () => {
    const r = clarificationPacketSchema.safeParse({
      id: "pkt_1",
      opportunityId: "opp_1",
      scopeBriefId: "sb_1",
      scopeBriefVersion: 0,
      generatedAt: "",
      questions: [],
    });
    assert.ok(!r.success);
  });
});

describe("generateClarificationPacketSchema", () => {
  it("accepts a valid input", () => {
    const r = generateClarificationPacketSchema.safeParse({ scopeBriefId: "sb_1" });
    assert.ok(r.success);
  });

  it("rejects a missing scopeBriefId", () => {
    const r = generateClarificationPacketSchema.safeParse({});
    assert.ok(!r.success);
  });

  it("rejects an empty scopeBriefId", () => {
    const r = generateClarificationPacketSchema.safeParse({ scopeBriefId: "" });
    assert.ok(!r.success);
  });
});
