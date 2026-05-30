import test from "node:test";
import assert from "node:assert/strict";

import { normalizeRoles, toAppSession } from "./session.ts";

test("normalizeRoles supports strings and arrays", () => {
  assert.deepEqual(normalizeRoles("admin"), ["admin"]);
  assert.deepEqual(normalizeRoles(["seller", "", 42]), ["seller"]);
  assert.deepEqual(normalizeRoles(undefined), []);
});

test("toAppSession normalizes decoded token claims", () => {
  assert.deepEqual(
    toAppSession({
      sub: "user-123",
      email: "seller@engniter.com",
      name: "Seller",
      picture: "https://example.com/avatar.png",
      email_verified: true,
      roles: ["seller"],
    }),
    {
      uid: "user-123",
      email: "seller@engniter.com",
      displayName: "Seller",
      photoUrl: "https://example.com/avatar.png",
      emailVerified: true,
      roles: ["seller"],
    },
  );
});
