import assert from "node:assert/strict";
import test from "node:test";

import { SessionVerificationError } from "../features/auth/server/session-verification.ts";
import { getHomeSession } from "./home-session.ts";

test("getHomeSession returns the current user when session verification succeeds", async () => {
  const session = await getHomeSession(async () => ({ email: "seller@engniter.com" }));

  assert.deepEqual(session, { email: "seller@engniter.com" });
});

test("getHomeSession treats invalid session verification as signed-out state", async () => {
  const session = await getHomeSession(async () => {
    throw new SessionVerificationError("invalid session");
  });

  assert.equal(session, null);
});

test("getHomeSession rethrows errors that only spoof the SessionVerificationError name", async () => {
  await assert.rejects(
    getHomeSession(async () => {
      const error = new Error("spoofed");
      error.name = "SessionVerificationError";
      throw error;
    }),
    /spoofed/,
  );
});

test("getHomeSession rethrows unexpected errors", async () => {
  await assert.rejects(
    getHomeSession(async () => {
      throw new Error("boom");
    }),
    /boom/,
  );
});
