import assert from "node:assert/strict";
import test from "node:test";

import { deleteServerSession } from "./delete-session.ts";

test("deleteServerSession resolves when the session endpoint succeeds", async () => {
  let capturedMethod = "";

  await deleteServerSession(async (_resource, init) => {
    capturedMethod = init?.method ?? "";

    return new Response(null, { status: 200 });
  });

  assert.equal(capturedMethod, "DELETE");
});

test("deleteServerSession throws when the session endpoint fails", async () => {
  await assert.rejects(
    deleteServerSession(async () => new Response(null, { status: 500 })),
    /Unable to clear the secure session\./,
  );
});
