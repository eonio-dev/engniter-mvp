import assert from "node:assert/strict";
import test from "node:test";

import { getHomeSession } from "./home-session.ts";

test("getHomeSession returns the current user when session verification succeeds", async () => {
  const session = await getHomeSession(async () => ({ email: "seller@engniter.com" }));

  assert.deepEqual(session, { email: "seller@engniter.com" });
});

test("getHomeSession treats invalid session verification as signed-out state", async () => {
  const error = new Error("invalid session");
  error.name = "SessionVerificationError";

  const session = await getHomeSession(async () => {
    throw error;
  });

  assert.equal(session, null);
});

test("getHomeSession rethrows unexpected errors", async () => {
  await assert.rejects(
    getHomeSession(async () => {
      throw new Error("boom");
    }),
    /boom/,
  );
});
