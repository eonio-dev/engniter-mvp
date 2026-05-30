import { redirect } from "next/navigation";

import { canAccessProtectedArea } from "@/features/auth/server/access";
import { requireSession } from "@/features/auth/server/require-session";

type RequireRoleOptions = {
  redirectTo?: string;
  allowedRoles?: string[];
};

export async function requireRole(options: RequireRoleOptions = {}) {
  const session = await requireSession(options.redirectTo);

  if (!canAccessProtectedArea(session, options.allowedRoles)) {
    redirect("/unauthorized");
  }

  return session;
}
