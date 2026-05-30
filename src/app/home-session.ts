export async function getHomeSession<T>(
  loadCurrentUser: () => Promise<T | null>,
) {
  try {
    return await loadCurrentUser();
  } catch (error) {
    if (error instanceof Error && error.name === "SessionVerificationError") {
      return null;
    }

    throw error;
  }
}
