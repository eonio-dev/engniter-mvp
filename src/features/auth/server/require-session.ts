import { redirect } from "next/navigation";

import { getSafeRedirectPath } from "@/lib/config/firebase-project";
import { getCurrentUser } from "@/features/auth/server/get-current-user";
import { SessionVerificationError } from "@/features/auth/server/session-verification";

export async function requireSession(redirectTo?: string) {
  let session;

  try {
    session = await getCurrentUser();
  } catch (error) {
    const target = getSafeRedirectPath(redirectTo);

    if (error instanceof SessionVerificationError) {
      console.error("Session verification failed.", error);
      redirect(`/sign-in?redirectTo=${encodeURIComponent(target)}&error=session-invalid`);
    }

    throw error;
  }

  if (!session) {
    const target = getSafeRedirectPath(redirectTo);
    redirect(`/sign-in?redirectTo=${encodeURIComponent(target)}`);
  }

  return session;
}
