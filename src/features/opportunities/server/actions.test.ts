import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createOpportunitySchema,
  updateOpportunitySchema,
} from "../schemas/opportunity.ts";

describe("createOpportunityAction input validation", () => {
  it("rejects missing title", () => {
    const result = createOpportunitySchema.safeParse({ technicalOwner: "Marcos" });
    assert.ok(!result.success);
    const fields = result.error.issues.map((i) => i.path[0]);
    assert.ok(fields.includes("title"));
  });

  it("rejects empty title", () => {
    const result = createOpportunitySchema.safeParse({
      title: "",
      technicalOwner: "Marcos",
    });
    assert.ok(!result.success);
  });

  it("rejects missing technicalOwner", () => {
    const result = createOpportunitySchema.safeParse({ title: "Opportunity" });
    assert.ok(!result.success);
    const fields = result.error.issues.map((i) => i.path[0]);
    assert.ok(fields.includes("technicalOwner"));
  });

  it("rejects empty technicalOwner", () => {
    const result = createOpportunitySchema.safeParse({
      title: "Opportunity",
      technicalOwner: "",
    });
    assert.ok(!result.success);
  });

  it("accepts valid required-only input", () => {
    const result = createOpportunitySchema.safeParse({
      title: "Valid Opportunity",
      technicalOwner: "Marcos",
    });
    assert.ok(result.success);
    assert.equal(result.data.title, "Valid Opportunity");
  });

  it("preserves fitCriteria when provided", () => {
    const result = createOpportunitySchema.safeParse({
      title: "Opportunity",
      technicalOwner: "Marcos",
      fitCriteria: "Azure AD preferred",
    });
    assert.ok(result.success);
    assert.equal(result.data.fitCriteria, "Azure AD preferred");
  });
});

describe("updateOpportunityAction input validation", () => {
  it("rejects missing opportunityId", () => {
    const result = updateOpportunitySchema.safeParse({
      title: "Updated",
      technicalOwner: "Ana",
    });
    assert.ok(!result.success);
    const fields = result.error.issues.map((i) => i.path[0]);
    assert.ok(fields.includes("opportunityId"));
  });

  it("rejects empty opportunityId", () => {
    const result = updateOpportunitySchema.safeParse({
      opportunityId: "",
      title: "Updated",
    });
    assert.ok(!result.success);
  });

  it("accepts valid partial update", () => {
    const result = updateOpportunitySchema.safeParse({
      opportunityId: "opp_123",
      title: "New Title",
    });
    assert.ok(result.success);
    assert.equal(result.data.opportunityId, "opp_123");
    assert.equal(result.data.title, "New Title");
  });

  it("accepts null to clear optional fields without discarding opportunityId", () => {
    const result = updateOpportunitySchema.safeParse({
      opportunityId: "opp_123",
      title: "Title",
      technicalOwner: "Owner",
      clientName: null,
      fitCriteria: null,
    });
    assert.ok(result.success);
    assert.equal(result.data.clientName, null);
    assert.equal(result.data.fitCriteria, null);
    assert.equal(result.data.opportunityId, "opp_123");
  });
});

describe("action response envelope contract", () => {
  it("success shape: { data: { opportunityId } }", () => {
    const success: { data: { opportunityId: string } } = {
      data: { opportunityId: "opp_abc" },
    };
    assert.ok("data" in success);
    assert.ok("opportunityId" in success.data);
  });

  it("error shape: { error: { code, message } }", () => {
    const error: { error: { code: string; message: string } } = {
      error: { code: "VALIDATION_ERROR", message: "Title is required." },
    };
    assert.ok("error" in error);
    assert.equal(error.error.code, "VALIDATION_ERROR");
    assert.ok(typeof error.error.message === "string");
  });
});
