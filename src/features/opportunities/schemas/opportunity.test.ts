import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createOpportunitySchema,
  updateOpportunitySchema,
  opportunitySchema,
} from "./opportunity.ts";

describe("opportunitySchema", () => {
  it("accepts valid full document", () => {
    const result = opportunitySchema.safeParse({
      id: "opp_1",
      title: "Acme Identity Modernization",
      technicalOwner: "Marcos",
      clientName: "Acme Bank",
      projectType: "Identity migration",
      estimatedValue: "$180k",
      proposalDeadline: "2026-06-12",
      fitCriteria: "Azure AD, Okta preferred",
      status: "active",
      createdByUserId: "uid_123",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    assert.ok(result.success);
  });

  it("accepts document with only required fields and nulls for optional", () => {
    const result = opportunitySchema.safeParse({
      id: "opp_2",
      title: "Minimal Opportunity",
      technicalOwner: "Ana",
      clientName: null,
      projectType: null,
      estimatedValue: null,
      proposalDeadline: null,
      fitCriteria: null,
      status: "active",
      createdByUserId: "uid_456",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    assert.ok(result.success);
  });
});

describe("createOpportunitySchema", () => {
  it("accepts valid create input with required fields only", () => {
    const result = createOpportunitySchema.safeParse({
      title: "New Opportunity",
      technicalOwner: "Priya",
    });
    assert.ok(result.success);
  });

  it("accepts valid create input with all optional fields", () => {
    const result = createOpportunitySchema.safeParse({
      title: "Full Opportunity",
      technicalOwner: "Marcos",
      clientName: "ACME Corp",
      projectType: "Cloud migration",
      estimatedValue: "$500k",
      proposalDeadline: "2026-08-01",
      fitCriteria: "Must use AWS. No legacy COBOL.",
    });
    assert.ok(result.success);
  });

  it("rejects missing title", () => {
    const result = createOpportunitySchema.safeParse({
      technicalOwner: "Marcos",
    });
    assert.ok(!result.success);
    const codes = result.error.issues.map((i) => i.path[0]);
    assert.ok(codes.includes("title"));
  });

  it("rejects empty title", () => {
    const result = createOpportunitySchema.safeParse({
      title: "",
      technicalOwner: "Marcos",
    });
    assert.ok(!result.success);
  });

  it("rejects missing technicalOwner", () => {
    const result = createOpportunitySchema.safeParse({
      title: "Opportunity",
    });
    assert.ok(!result.success);
    const codes = result.error.issues.map((i) => i.path[0]);
    assert.ok(codes.includes("technicalOwner"));
  });

  it("rejects empty technicalOwner", () => {
    const result = createOpportunitySchema.safeParse({
      title: "Opportunity",
      technicalOwner: "",
    });
    assert.ok(!result.success);
  });

  it("passes through unknown optional fields as undefined", () => {
    const result = createOpportunitySchema.safeParse({
      title: "Opportunity",
      technicalOwner: "Marcos",
      clientName: "ACME",
    });
    assert.ok(result.success);
    assert.equal(result.data.clientName, "ACME");
  });
});

describe("updateOpportunitySchema", () => {
  it("accepts valid update with opportunityId and changed fields", () => {
    const result = updateOpportunitySchema.safeParse({
      opportunityId: "opp_123",
      title: "Updated Title",
      technicalOwner: "Priya",
    });
    assert.ok(result.success);
  });

  it("rejects missing opportunityId", () => {
    const result = updateOpportunitySchema.safeParse({
      title: "Updated Title",
      technicalOwner: "Priya",
    });
    assert.ok(!result.success);
  });

  it("rejects empty opportunityId", () => {
    const result = updateOpportunitySchema.safeParse({
      opportunityId: "",
      title: "Updated Title",
      technicalOwner: "Priya",
    });
    assert.ok(!result.success);
  });

  it("rejects empty title if provided", () => {
    const result = updateOpportunitySchema.safeParse({
      opportunityId: "opp_123",
      title: "",
      technicalOwner: "Priya",
    });
    assert.ok(!result.success);
  });

  it("rejects empty technicalOwner if provided", () => {
    const result = updateOpportunitySchema.safeParse({
      opportunityId: "opp_123",
      title: "Title",
      technicalOwner: "",
    });
    assert.ok(!result.success);
  });

  it("accepts partial update with only opportunityId and title", () => {
    const result = updateOpportunitySchema.safeParse({
      opportunityId: "opp_123",
      title: "New Title",
    });
    assert.ok(result.success);
  });

  it("accepts null for optional fields to clear them", () => {
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
  });
});
