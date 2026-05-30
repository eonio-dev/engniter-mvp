import assert from "node:assert/strict";
import test from "node:test";

import {
  createSessionDeletionResponse,
  createSessionResponse,
  SESSION_MAX_AGE_MS,
} from "./session-response.ts";

test("createSessionResponse rejects missing ID tokens", async () => {
  const response = await createSessionResponse(undefined, {
    verifyIdToken: async () => {
      throw new Error("should not run");
    },
    createSessionCookie: async () => {
      throw new Error("should not run");
    },
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Missing Firebase ID token." });
});

test("createSessionResponse creates an httpOnly session cookie", async () => {
  let verifiedToken = "";
  let cookieToken = "";
  let expiresIn = 0;

  const response = await createSessionResponse("id-token-123", {
    verifyIdToken: async (idToken) => {
      verifiedToken = idToken;

      return { sub: "user-1" } as never;
    },
    createSessionCookie: async (idToken, options) => {
      cookieToken = idToken;
      expiresIn = options.expiresIn;

      return "session-cookie-value";
    },
  });

  assert.equal(response.status, 200);
  assert.equal(verifiedToken, "id-token-123");
  assert.equal(cookieToken, "id-token-123");
  assert.equal(expiresIn, SESSION_MAX_AGE_MS);
  assert.match(response.headers.get("set-cookie") ?? "", /__engniter_session=session-cookie-value/);
});

test("createSessionDeletionResponse expires the secure session cookie", () => {
  const response = createSessionDeletionResponse();

  assert.equal(response.status, 200);
  assert.match(response.headers.get("set-cookie") ?? "", /__engniter_session=/);
  assert.match(response.headers.get("set-cookie") ?? "", /Expires=Thu, 01 Jan 1970 00:00:00 GMT/);
});
