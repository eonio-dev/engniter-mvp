import { hasAllowedEmailDomain } from "../../../lib/config/firebase-project.js";
import type { AppSession } from "../schemas/session.js";

type AccessSession = Pick<AppSession, "email" | "roles">;

export function hasRequiredRole(
  session: Pick<AccessSession, "roles">,
  allowedRoles?: string[],
) {
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  return allowedRoles.some((role) => session.roles.includes(role));
}

export function canAccessProtectedArea(session: AccessSession, allowedRoles?: string[]) {
  return hasAllowedEmailDomain(session.email) && hasRequiredRole(session, allowedRoles);
}
