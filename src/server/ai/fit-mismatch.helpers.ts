import { z } from "zod";
import type { ScopeItem, FitMismatch } from "@/features/scope-briefs/types";

export const fitMismatchResponseSchema = z.object({
  mismatches: z.array(
    z.object({
      criterion: z.string().min(1),
      conflictingItemIndex: z.number().int().nullable(),
      reason: z.string().min(1),
    }),
  ),
});

export type FitMismatchResponse = z.infer<typeof fitMismatchResponseSchema>;

export function parseFitMismatchResponse(rawText: string): FitMismatchResponse | null {
  try {
    return fitMismatchResponseSchema.parse(JSON.parse(rawText));
  } catch {
    return null;
  }
}

export function mapFitMismatches(
  response: FitMismatchResponse,
  items: ScopeItem[],
): FitMismatch[] {
  return response.mismatches.map((m) => ({
    criterion: m.criterion,
    conflictingItemId:
      m.conflictingItemIndex !== null
        ? (items[m.conflictingItemIndex - 1]?.id ?? null)
        : null,
    reason: m.reason,
  }));
}
