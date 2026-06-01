import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  updateScopeItemSchema,
  approveScopeSchema,
  overrideNoPromiseSchema,
  scopeBriefRefSchema,
} from "../schemas/scope-brief.ts";

describe("updateScopeItemAction input validation", () => {
  it("accepts valid accepted-status input", () => {
    const r = updateScopeItemSchema.safeParse({
      scopeBriefId: "sb_1",
      itemId: "item_1",
      reviewStatus: "accepted",
    });
    assert.ok(r.success);
  });

  it("accepts edited status with editedContent", () => {
    const r = updateScopeItemSchema.safeParse({
      scopeBriefId: "sb_1",
      itemId: "item_1",
      reviewStatus: "edited",
      editedContent: "Refined scope item text",
    });
    assert.ok(r.success);
    assert.equal(r.data?.editedContent, "Refined scope item text");
  });

  it("rejects missing scopeBriefId", () => {
    const r = updateScopeItemSchema.safeParse({
      itemId: "item_1",
      reviewStatus: "accepted",
    });
    assert.ok(!r.success);
  });

  it("rejects missing itemId", () => {
    const r = updateScopeItemSchema.safeParse({
      scopeBriefId: "sb_1",
      reviewStatus: "accepted",
    });
    assert.ok(!r.success);
  });

  it("rejects empty scopeBriefId", () => {
    const r = updateScopeItemSchema.safeParse({
      scopeBriefId: "",
      itemId: "item_1",
      reviewStatus: "accepted",
    });
    assert.ok(!r.success);
  });

  it("rejects unknown reviewStatus", () => {
    const r = updateScopeItemSchema.safeParse({
      scopeBriefId: "sb_1",
      itemId: "item_1",
      reviewStatus: "maybe",
    });
    assert.ok(!r.success);
  });
});

describe("approveScopeBriefAction input validation", () => {
  it("accepts valid scopeBriefId", () => {
    const r = approveScopeSchema.safeParse({ scopeBriefId: "sb_1" });
    assert.ok(r.success);
  });

  it("rejects missing scopeBriefId", () => {
    const r = approveScopeSchema.safeParse({});
    assert.ok(!r.success);
  });

  it("rejects empty scopeBriefId", () => {
    const r = approveScopeSchema.safeParse({ scopeBriefId: "" });
    assert.ok(!r.success);
  });
});

describe("overrideNoPromiseGateAction input validation", () => {
  it("accepts a scopeBriefId with a reason", () => {
    const r = overrideNoPromiseSchema.safeParse({
      scopeBriefId: "sb_1",
      reason: "Client accepts the open risks in writing.",
    });
    assert.ok(r.success);
  });

  it("rejects a missing reason", () => {
    const r = overrideNoPromiseSchema.safeParse({ scopeBriefId: "sb_1" });
    assert.ok(!r.success);
  });

  it("rejects an empty reason", () => {
    const r = overrideNoPromiseSchema.safeParse({ scopeBriefId: "sb_1", reason: "" });
    assert.ok(!r.success);
  });

  it("rejects a missing scopeBriefId", () => {
    const r = overrideNoPromiseSchema.safeParse({ reason: "Acknowledged." });
    assert.ok(!r.success);
  });
});

describe("clearNoPromiseOverrideAction / recheckFitMismatchAction input validation", () => {
  it("accepts a valid scopeBriefId", () => {
    const r = scopeBriefRefSchema.safeParse({ scopeBriefId: "sb_1" });
    assert.ok(r.success);
  });

  it("rejects an empty scopeBriefId", () => {
    const r = scopeBriefRefSchema.safeParse({ scopeBriefId: "" });
    assert.ok(!r.success);
  });
});
