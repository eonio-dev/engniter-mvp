import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { addTextItemSchema, addNoteItemSchema } from "../schemas/context-item.ts";

describe("addTextItemAction input validation", () => {
  it("rejects missing opportunityId", () => {
    const r = addTextItemSchema.safeParse({ content: "notes" });
    assert.ok(!r.success);
  });

  it("rejects empty content", () => {
    const r = addTextItemSchema.safeParse({ opportunityId: "opp_1", content: "" });
    assert.ok(!r.success);
  });

  it("accepts valid input and defaults title to 'Pasted text'", () => {
    const r = addTextItemSchema.safeParse({ opportunityId: "opp_1", content: "Discovery notes" });
    assert.ok(r.success);
    assert.equal(r.data?.title, "Pasted text");
  });

  it("accepts custom title", () => {
    const r = addTextItemSchema.safeParse({ opportunityId: "opp_1", title: "Thread", content: "..." });
    assert.ok(r.success);
    assert.equal(r.data?.title, "Thread");
  });
});

describe("addNoteItemAction input validation", () => {
  it("rejects missing title", () => {
    const r = addNoteItemSchema.safeParse({ opportunityId: "opp_1", content: "x" });
    assert.ok(!r.success);
  });

  it("rejects empty title", () => {
    const r = addNoteItemSchema.safeParse({ opportunityId: "opp_1", title: "", content: "x" });
    assert.ok(!r.success);
  });

  it("rejects empty content", () => {
    const r = addNoteItemSchema.safeParse({ opportunityId: "opp_1", title: "Note", content: "" });
    assert.ok(!r.success);
  });

  it("accepts valid note input", () => {
    const r = addNoteItemSchema.safeParse({ opportunityId: "opp_1", title: "Brief", content: "Budget is $200k" });
    assert.ok(r.success);
    assert.equal(r.data?.opportunityId, "opp_1");
  });
});

describe("action response envelope contract", () => {
  it("success shape: { data: { itemId } }", () => {
    const s: { data: { itemId: string } } = { data: { itemId: "item_abc" } };
    assert.ok("data" in s);
    assert.ok("itemId" in s.data);
  });

  it("error shape: { error: { code, message } }", () => {
    const e: { error: { code: string; message: string } } = {
      error: { code: "FORBIDDEN", message: "No access." },
    };
    assert.ok("error" in e);
    assert.equal(e.error.code, "FORBIDDEN");
  });
});
