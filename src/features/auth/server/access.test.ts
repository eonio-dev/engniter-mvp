import assert from "node:assert/strict";
import test from "node:test";

import { canAccessProtectedArea, hasRequiredRole } from "./access.ts";

test("hasRequiredRole allows access when no roles are required", () => {
  assert.equal(hasRequiredRole({ roles: [] }), true);
});

test("hasRequiredRole requires at least one matching role", () => {
  assert.equal(hasRequiredRole({ roles: ["operator"] }, ["founder", "operator"]), true);
  assert.equal(hasRequiredRole({ roles: ["viewer"] }, ["founder", "operator"]), false);
});

test("canAccessProtectedArea requires both an allowed domain and role access", () => {
  process.env.AUTH_ALLOWED_EMAIL_DOMAINS = "engniter.com";

  assert.equal(
    canAccessProtectedArea(
      { email: "seller@outside.dev", roles: ["operator"] },
      ["operator"],
    ),
    false,
  );
  assert.equal(
    canAccessProtectedArea(
      { email: "seller@engniter.com", roles: ["operator"] },
      ["operator"],
    ),
    true,
  );

  delete process.env.AUTH_ALLOWED_EMAIL_DOMAINS;
});
