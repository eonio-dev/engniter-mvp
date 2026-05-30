import assert from "node:assert/strict";
import test from "node:test";

import {
  SessionVerificationError,
  verifyCurrentSession,
} from "./session-verification.ts";

test("verifyCurrentSession returns null when no session cookie is present", async () => {
  const session = await verifyCurrentSession(undefined, async () => {
    throw new Error("should not run");
  });

  assert.equal(session, null);
});

test("verifyCurrentSession normalizes decoded claims into an app session", async () => {
  const session = await verifyCurrentSession("session-cookie", async () => ({
    sub: "user-123",
    email: "seller@engniter.com",
    name: "Seller",
    picture: "https://example.com/avatar.png",
    email_verified: true,
    roles: ["operator"],
  }) as never);

  assert.deepEqual(session, {
    uid: "user-123",
    email: "seller@engniter.com",
    displayName: "Seller",
    photoUrl: "https://example.com/avatar.png",
    emailVerified: true,
    roles: ["operator"],
  });
});

test("verifyCurrentSession throws a SessionVerificationError on verification failure", async () => {
  await assert.rejects(
    verifyCurrentSession("session-cookie", async () => {
      throw new Error("verification failed");
    }),
    SessionVerificationError,
  );
});
