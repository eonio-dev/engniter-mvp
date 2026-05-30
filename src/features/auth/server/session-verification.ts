import type { DecodedIdToken } from "firebase-admin/auth";

import { type AppSession, toAppSession } from "../schemas/session.js";

type VerifySessionCookie = (
  sessionCookie: string,
  checkRevoked: boolean,
) => Promise<DecodedIdToken>;

export class SessionVerificationError extends Error {
  constructor(message = "Failed to verify session cookie.", options?: ErrorOptions) {
    super(message, options);
    this.name = "SessionVerificationError";
  }
}

export async function verifyCurrentSession(
  sessionCookie: string | undefined,
  verifySessionCookie: VerifySessionCookie,
): Promise<AppSession | null> {
  if (!sessionCookie) {
    return null;
  }

  try {
    const decoded = await verifySessionCookie(sessionCookie, true);

    return toAppSession(decoded);
  } catch (error) {
    throw new SessionVerificationError(undefined, { cause: error });
  }
}
