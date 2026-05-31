import { SessionVerificationError } from "../features/auth/server/session-verification.js";

export async function getHomeSession<T>(
  loadCurrentUser: () => Promise<T | null>,
) {
  try {
    return await loadCurrentUser();
  } catch (error) {
    if (error instanceof SessionVerificationError) {
      return null;
    }

    throw error;
  }
}
