import { z } from "zod";
import type { ScopeItem } from "@/features/scope-briefs/types";
import type {
  ClarificationQuestion,
  ClarificationCategory,
  ClarificationPriority,
} from "@/features/clarifications/types";

// Enum tuples are restated locally (rather than value-imported from the schema
// module) so this helper stays type-only against "@/" paths — the convention that
// keeps it loadable by the node --experimental-strip-types test runner.
const CATEGORY_VALUES = [
  "business",
  "scope",
  "integration",
  "nonFunctional",
  "timeline",
  "responsibility",
] as const satisfies readonly ClarificationCategory[];

const PRIORITY_VALUES = [
  "Critical",
  "High",
  "Medium",
  "Low",
] as const satisfies readonly ClarificationPriority[];

export const clarificationResponseSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string().trim().min(1),
      category: z.enum(CATEGORY_VALUES),
      priority: z.enum(PRIORITY_VALUES),
      cause: z.string().trim().min(1),
      linkedItemIndex: z.number().int().nullable(),
    }),
  ),
});

export type ClarificationResponse = z.infer<typeof clarificationResponseSchema>;

export function parseClarificationResponse(rawText: string): ClarificationResponse | null {
  try {
    return clarificationResponseSchema.parse(JSON.parse(rawText));
  } catch {
    return null;
  }
}

export function mapClarificationQuestions(
  response: ClarificationResponse,
  items: ScopeItem[],
): ClarificationQuestion[] {
  return response.questions.map((q) => ({
    id: crypto.randomUUID(),
    question: q.question,
    category: q.category,
    priority: q.priority,
    cause: q.cause,
    linkedItemId:
      q.linkedItemIndex !== null ? (items[q.linkedItemIndex - 1]?.id ?? null) : null,
  }));
}

// Categories whose unreviewed items carry commitment risk (mirrors
// CRITICAL_CATEGORIES in scope-briefs/confidence.ts; restated to keep this helper
// type-only against "@/" paths for the test runner).
const CRITICAL_CATEGORIES: readonly ScopeItem["category"][] = [
  "risk",
  "openQuestion",
  "constraint",
  "integration",
];

/**
 * Selects the scope items that should seed clarification questions:
 * unresolved (non-rejected) items that are in a critical category and still
 * pending/flagged, any unanswered open question, or any active item that lacks a
 * Source Reference (empty sourceContextItemIds). [PRD FR-9 "missing evidence"]
 */
export function selectCandidateItems(items: ScopeItem[]): ScopeItem[] {
  return items.filter((item) => {
    if (item.reviewStatus === "rejected") return false;
    const unresolved = item.reviewStatus === "pending" || item.reviewStatus === "flagged";
    const isCriticalCategory = CRITICAL_CATEGORIES.includes(item.category);
    const isOpenQuestion = item.category === "openQuestion";
    const missingEvidence = item.sourceContextItemIds.length === 0;
    return (unresolved && isCriticalCategory) || (isOpenQuestion && unresolved) || missingEvidence;
  });
}
