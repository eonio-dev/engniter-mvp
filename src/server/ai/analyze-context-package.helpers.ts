import type { ContextItem } from "@/features/context-packages/types";

export function mapSourceIndices(
  indices: string[],
  items: ContextItem[],
): string[] {
  return indices
    .map((strIdx) => items[parseInt(strIdx, 10) - 1]?.id ?? null)
    .filter((id): id is string => id !== null);
}

export function isSparseInput(items: ContextItem[]): boolean {
  if (items.length < 2) return true;
  const totalChars = items.reduce(
    (sum, item) => sum + (item.content?.length ?? 0),
    0,
  );
  return totalChars < 200;
}
