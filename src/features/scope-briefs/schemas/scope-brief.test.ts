import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { scopeItemSchema, scopeBriefSchema, SCOPE_CATEGORIES } from "./scope-brief.ts";

describe("scopeItemSchema", () => {
  it("accepts valid item", () => {
    const r = scopeItemSchema.safeParse({
      id: "item_1",
      category: "goal",
      content: "Migrate identity provider",
      inferred: false,
      reviewStatus: "pending",
      sourceContextItemIds: ["1", "2"],
      editedContent: null,
    });
    assert.ok(r.success, JSON.stringify(r.error?.issues));
  });

  it("rejects unknown category", () => {
    const r = scopeItemSchema.safeParse({
      id: "item_1",
      category: "unknown",
      content: "x",
      inferred: false,
      reviewStatus: "pending",
      sourceContextItemIds: [],
      editedContent: null,
    });
    assert.ok(!r.success);
  });

  it("rejects empty content", () => {
    const r = scopeItemSchema.safeParse({
      id: "item_1",
      category: "goal",
      content: "",
      inferred: false,
      reviewStatus: "pending",
      sourceContextItemIds: [],
      editedContent: null,
    });
    assert.ok(!r.success);
  });

  it("all SCOPE_CATEGORIES are valid category values", () => {
    for (const cat of SCOPE_CATEGORIES) {
      const r = scopeItemSchema.safeParse({
        id: "x",
        category: cat,
        content: "test",
        inferred: false,
        reviewStatus: "pending",
        sourceContextItemIds: [],
        editedContent: null,
      });
      assert.ok(r.success, `category ${cat} should be valid`);
    }
  });
});

describe("scopeBriefSchema", () => {
  it("accepts valid scope brief", () => {
    const r = scopeBriefSchema.safeParse({
      id: "sb_1",
      opportunityId: "opp_1",
      jobId: "job_1",
      version: 1,
      status: "draft",
      scopeConfidence: "Medium",
      sparseInput: false,
      items: [],
      createdAt: new Date().toISOString(),
      createdByJobId: "job_1",
    });
    assert.ok(r.success, JSON.stringify(r.error?.issues));
  });

  it("rejects invalid scopeConfidence", () => {
    const r = scopeBriefSchema.safeParse({
      id: "sb_1",
      opportunityId: "opp_1",
      jobId: "job_1",
      version: 1,
      status: "draft",
      scopeConfidence: "Unknown",
      sparseInput: false,
      items: [],
      createdAt: "",
      createdByJobId: "job_1",
    });
    assert.ok(!r.success);
  });

  it("rejects version 0", () => {
    const r = scopeBriefSchema.safeParse({
      id: "sb_1",
      opportunityId: "opp_1",
      jobId: "job_1",
      version: 0,
      status: "draft",
      scopeConfidence: "Low",
      sparseInput: false,
      items: [],
      createdAt: "",
      createdByJobId: "job_1",
    });
    assert.ok(!r.success);
  });
});
