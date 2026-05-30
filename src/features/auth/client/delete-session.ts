export async function deleteServerSession(
  fetchFn: typeof fetch = fetch,
  resource = "/api/auth/session",
) {
  const response = await fetchFn(resource, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Unable to clear the secure session.");
  }
}
