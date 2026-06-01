import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateClarificationPacketSchema } from "../schemas/clarification.ts";

describe("generateClarificationPacketAction input validation", () => {
  it("accepts a valid scopeBriefId", () => {
    const r = generateClarificationPacketSchema.safeParse({ scopeBriefId: "sb_1" });
    assert.ok(r.success);
    assert.equal(r.data?.scopeBriefId, "sb_1");
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
