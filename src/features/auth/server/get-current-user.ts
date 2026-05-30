import { cookies } from "next/headers";

import { SESSION_COOKIE_NAME } from "@/lib/config/firebase-project";
import { getAdminAuth } from "@/lib/firebase/admin";
import { type AppSession } from "@/features/auth/schemas/session";
import { verifyCurrentSession } from "@/features/auth/server/session-verification";

export async function getCurrentUser(): Promise<AppSession | null> {
  const sessionCookie = (await cookies()).get(SESSION_COOKIE_NAME)?.value;

  return verifyCurrentSession(sessionCookie, (cookie, checkRevoked) =>
    getAdminAuth().verifySessionCookie(cookie, checkRevoked),
  );
}
