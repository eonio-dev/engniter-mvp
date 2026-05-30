import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/config/firebase-project";
import { getProtectedRouteRedirectUrl } from "@/features/auth/server/protected-route";

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const redirectUrl = getProtectedRouteRedirectUrl(
    request.nextUrl.pathname,
    request.url,
    sessionCookie,
  );

  if (redirectUrl) {
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/opportunities/:path*"],
};
