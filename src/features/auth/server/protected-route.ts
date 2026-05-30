import {
  DEFAULT_REDIRECT_PATH,
  getSafeRedirectPath,
} from "../../../lib/config/firebase-project.js";

export function getProtectedRouteRedirectUrl(
  pathname: string,
  requestUrl: string,
  sessionCookie?: string,
) {
  if (!pathname.startsWith("/opportunities") || sessionCookie) {
    return null;
  }

  const signInUrl = new URL("/sign-in", requestUrl);
  signInUrl.searchParams.set(
    "redirectTo",
    getSafeRedirectPath(pathname || DEFAULT_REDIRECT_PATH),
  );

  return signInUrl;
}
