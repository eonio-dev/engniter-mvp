export function getItemLabel(index: number, total: number): string {
  if (total <= 1) return "";
  return index === 0 ? "Original" : "";
}

export function formatItemTimestamp(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
