import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getItemLabel } from "./context-package-history-table.helpers.ts";

describe("getItemLabel", () => {
  it("returns 'Original' for index 0 when multiple items", () => {
    assert.equal(getItemLabel(0, 3), "Original");
  });

  it("returns empty string for index 1+ when multiple items", () => {
    assert.equal(getItemLabel(1, 3), "");
    assert.equal(getItemLabel(2, 3), "");
  });

  it("returns empty string for index 0 when only 1 item total", () => {
    assert.equal(getItemLabel(0, 1), "");
  });

  it("returns empty string for index 0 when 0 items (edge case)", () => {
    assert.equal(getItemLabel(0, 0), "");
  });

  it("returns 'Original' for first of exactly 2 items", () => {
    assert.equal(getItemLabel(0, 2), "Original");
    assert.equal(getItemLabel(1, 2), "");
  });
});
