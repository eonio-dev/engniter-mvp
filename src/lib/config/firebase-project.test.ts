import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_REDIRECT_PATH,
  getAllowedEmailDomains,
  getSafeRedirectPath,
  hasAllowedEmailDomain,
} from "./firebase-project.ts";

test("getAllowedEmailDomains normalizes comma-separated domains", () => {
  assert.deepEqual(getAllowedEmailDomains(" Engniter.com, example.org "), [
    "engniter.com",
    "example.org",
  ]);
});

test("hasAllowedEmailDomain denies unknown email domains", () => {
  assert.equal(hasAllowedEmailDomain("seller@outside.dev", ["engniter.com"]), false);
  assert.equal(hasAllowedEmailDomain("seller@engniter.com", ["engniter.com"]), true);
});

test("hasAllowedEmailDomain fails closed when no allowed domains are configured", () => {
  assert.equal(hasAllowedEmailDomain("seller@engniter.com", []), false);
});

test("getSafeRedirectPath only accepts local application paths", () => {
  assert.equal(getSafeRedirectPath("/opportunities/123"), "/opportunities/123");
  assert.equal(getSafeRedirectPath("https://example.com"), DEFAULT_REDIRECT_PATH);
  assert.equal(getSafeRedirectPath("//bad.example"), DEFAULT_REDIRECT_PATH);
});
