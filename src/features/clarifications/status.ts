import type { ScopeBrief } from "@/features/scope-briefs/schemas/scope-brief";
import type {
  ClarificationQuestion,
  ClarificationPacket,
  ClarificationStatus,
  ClarificationPriority,
} from "./schemas/clarification";

const PRIORITY_RANK: Record<ClarificationPriority, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

const RESOLVED_REVIEW_STATUSES = ["accepted", "edited", "rejected"] as const;

export type ClarificationQuestionWithStatus = ClarificationQuestion & {
  status: ClarificationStatus;
};

export type ClarificationPacketSummary = {
  questions: ClarificationQuestionWithStatus[];
  openCount: number;
  isCleared: boolean;
};

/**
 * Derives a clarification question's status from the CURRENT scope brief review state.
 * A question is "resolved" once its linked scope item has been acted on
 * (accepted, edited, or rejected); otherwise it remains "open".
 */
export function deriveQuestionStatus(
  question: Pick<ClarificationQuestion, "linkedItemId">,
  brief: Pick<ScopeBrief, "items">,
): ClarificationStatus {
  if (question.linkedItemId == null) return "open";
  const item = brief.items.find((i) => i.id === question.linkedItemId);
  if (!item) return "open";
  return (RESOLVED_REVIEW_STATUSES as readonly string[]).includes(item.reviewStatus)
    ? "resolved"
    : "open";
}

export function summarizeClarificationPacket(
  packet: Pick<ClarificationPacket, "questions">,
  brief: Pick<ScopeBrief, "items">,
): ClarificationPacketSummary {
  const questions: ClarificationQuestionWithStatus[] = packet.questions
    .map((question) => ({ ...question, status: deriveQuestionStatus(question, brief) }))
    .map((question, index) => ({ question, index }))
    .sort((a, b) => {
      const byPriority = PRIORITY_RANK[a.question.priority] - PRIORITY_RANK[b.question.priority];
      return byPriority !== 0 ? byPriority : a.index - b.index;
    })
    .map(({ question }) => question);

  const openCount = questions.filter((q) => q.status === "open").length;

  return {
    questions,
    openCount,
    isCleared: questions.length === 0 || openCount === 0,
  };
}
