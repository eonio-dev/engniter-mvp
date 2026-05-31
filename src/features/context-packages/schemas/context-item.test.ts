import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  contextItemSchema,
  addTextItemSchema,
  addNoteItemSchema,
  addFileItemSchema,
} from "./context-item.ts";

describe("contextItemSchema", () => {
  it("accepts valid file item", () => {
    const r = contextItemSchema.safeParse({
      id: "item_1",
      opportunityId: "opp_1",
      sourceType: "file",
      uploaderId: "uid_1",
      title: "RFP.pdf",
      content: null,
      storageRef: "opportunities/opp_1/context-items/item_1/RFP.pdf",
      storageBucket: "my-project.appspot.com",
      mimeType: "application/pdf",
      sizeBytes: 102400,
      createdAt: new Date().toISOString(),
    });
    assert.ok(r.success, JSON.stringify(r.error?.issues));
  });

  it("accepts valid text item", () => {
    const r = contextItemSchema.safeParse({
      id: "item_2",
      opportunityId: "opp_1",
      sourceType: "text",
      uploaderId: "uid_1",
      title: "Pasted text",
      content: "Discovery call notes...",
      storageRef: null,
      storageBucket: null,
      mimeType: null,
      sizeBytes: null,
      createdAt: new Date().toISOString(),
    });
    assert.ok(r.success, JSON.stringify(r.error?.issues));
  });

  it("accepts valid note item", () => {
    const r = contextItemSchema.safeParse({
      id: "item_3",
      opportunityId: "opp_1",
      sourceType: "note",
      uploaderId: "uid_1",
      title: "Commercial briefing",
      content: "Budget is $200k",
      storageRef: null,
      storageBucket: null,
      mimeType: null,
      sizeBytes: null,
      createdAt: new Date().toISOString(),
    });
    assert.ok(r.success);
  });

  it("rejects unknown sourceType", () => {
    const r = contextItemSchema.safeParse({
      id: "item_4",
      opportunityId: "opp_1",
      sourceType: "video",
      uploaderId: "uid_1",
      title: "X",
      content: null,
      storageRef: null,
      storageBucket: null,
      mimeType: null,
      sizeBytes: null,
      createdAt: new Date().toISOString(),
    });
    assert.ok(!r.success);
  });

  it("rejects missing uploaderId", () => {
    const r = contextItemSchema.safeParse({
      id: "item_5",
      opportunityId: "opp_1",
      sourceType: "text",
      title: "X",
      content: "y",
      storageRef: null,
      storageBucket: null,
      mimeType: null,
      sizeBytes: null,
      createdAt: new Date().toISOString(),
    });
    assert.ok(!r.success);
  });
});

describe("addTextItemSchema", () => {
  it("accepts valid text input", () => {
    const r = addTextItemSchema.safeParse({
      opportunityId: "opp_1",
      content: "Discovery notes",
    });
    assert.ok(r.success);
    assert.equal(r.data?.title, "Pasted text");
  });

  it("accepts custom title", () => {
    const r = addTextItemSchema.safeParse({
      opportunityId: "opp_1",
      title: "Sales thread",
      content: "...",
    });
    assert.ok(r.success);
    assert.equal(r.data?.title, "Sales thread");
  });

  it("rejects empty content", () => {
    const r = addTextItemSchema.safeParse({
      opportunityId: "opp_1",
      content: "",
    });
    assert.ok(!r.success);
  });

  it("rejects missing opportunityId", () => {
    const r = addTextItemSchema.safeParse({ content: "notes" });
    assert.ok(!r.success);
  });
});

describe("addNoteItemSchema", () => {
  it("accepts valid note input", () => {
    const r = addNoteItemSchema.safeParse({
      opportunityId: "opp_1",
      title: "Commercial briefing",
      content: "Budget constraints apply",
    });
    assert.ok(r.success);
  });

  it("rejects missing title", () => {
    const r = addNoteItemSchema.safeParse({
      opportunityId: "opp_1",
      content: "x",
    });
    assert.ok(!r.success);
  });

  it("rejects empty title", () => {
    const r = addNoteItemSchema.safeParse({
      opportunityId: "opp_1",
      title: "",
      content: "x",
    });
    assert.ok(!r.success);
  });

  it("rejects empty content", () => {
    const r = addNoteItemSchema.safeParse({
      opportunityId: "opp_1",
      title: "Note",
      content: "",
    });
    assert.ok(!r.success);
  });
});

describe("addFileItemSchema", () => {
  it("accepts valid file metadata", () => {
    const r = addFileItemSchema.safeParse({
      opportunityId: "opp_1",
      title: "RFP.pdf",
      storageRef: "opportunities/opp_1/context-items/item_1/RFP.pdf",
      storageBucket: "my-project.appspot.com",
      mimeType: "application/pdf",
      sizeBytes: 102400,
    });
    assert.ok(r.success);
  });

  it("rejects missing storageRef", () => {
    const r = addFileItemSchema.safeParse({
      opportunityId: "opp_1",
      title: "RFP.pdf",
      storageBucket: "bucket",
      mimeType: "application/pdf",
      sizeBytes: 100,
    });
    assert.ok(!r.success);
  });

  it("rejects negative sizeBytes", () => {
    const r = addFileItemSchema.safeParse({
      opportunityId: "opp_1",
      title: "RFP.pdf",
      storageRef: "path/file.pdf",
      storageBucket: "bucket",
      mimeType: "application/pdf",
      sizeBytes: -1,
    });
    assert.ok(!r.success);
  });
});
