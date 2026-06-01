import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { jobSchema, createJobSchema } from "./job.ts";

describe("jobSchema", () => {
  it("accepts valid job", () => {
    const r = jobSchema.safeParse({
      id: "job_1",
      type: "extract-context-package",
      opportunityId: "opp_1",
      status: "queued",
      createdByUserId: "uid_1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      errorCode: null,
      errorMessage: null,
      resultRef: null,
    });
    assert.ok(r.success, JSON.stringify(r.error?.issues));
  });

  it("rejects invalid status", () => {
    const r = jobSchema.safeParse({
      id: "job_1",
      type: "extract-context-package",
      opportunityId: "opp_1",
      status: "pending",
      createdByUserId: "uid_1",
      createdAt: "",
      updatedAt: "",
      errorCode: null,
      errorMessage: null,
      resultRef: null,
    });
    assert.ok(!r.success);
  });

  it("accepts all valid statuses", () => {
    for (const status of ["queued", "running", "succeeded", "failed"] as const) {
      const r = jobSchema.safeParse({
        id: "j",
        type: "extract-context-package",
        opportunityId: "o",
        status,
        createdByUserId: "u",
        createdAt: "",
        updatedAt: "",
        errorCode: null,
        errorMessage: null,
        resultRef: null,
      });
      assert.ok(r.success, `status ${status} should be valid`);
    }
  });
});

describe("createJobSchema", () => {
  it("accepts valid create input", () => {
    const r = createJobSchema.safeParse({
      opportunityId: "opp_1",
      type: "extract-context-package",
    });
    assert.ok(r.success);
  });

  it("rejects missing opportunityId", () => {
    const r = createJobSchema.safeParse({ type: "extract-context-package" });
    assert.ok(!r.success);
  });
});
