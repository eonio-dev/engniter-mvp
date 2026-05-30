import assert from "node:assert/strict";
import test from "node:test";

import { getProtectedRouteRedirectUrl } from "./protected-route.ts";

test("getProtectedRouteRedirectUrl redirects unauthenticated opportunity requests", () => {
  const redirectUrl = getProtectedRouteRedirectUrl(
    "/opportunities/123",
    "https://engniter.dev/opportunities/123",
  );

  assert.equal(
    redirectUrl?.toString(),
    "https://engniter.dev/sign-in?redirectTo=%2Fopportunities%2F123",
  );
});

test("getProtectedRouteRedirectUrl allows authenticated opportunity requests through", () => {
  assert.equal(
    getProtectedRouteRedirectUrl(
      "/opportunities/123",
      "https://engniter.dev/opportunities/123",
      "session-cookie",
    ),
    null,
  );
});

test("getProtectedRouteRedirectUrl ignores public routes", () => {
  assert.equal(
    getProtectedRouteRedirectUrl("/", "https://engniter.dev/"),
    null,
  );
});
