import Link from "next/link";
import type {
  ClarificationCategory,
  ClarificationPriority,
} from "@/features/clarifications/schemas/clarification";
import type { ClarificationQuestionWithStatus } from "@/features/clarifications/status";

type Props = {
  question: ClarificationQuestionWithStatus;
  scopeBriefHref: string;
};

const CATEGORY_LABELS: Record<ClarificationCategory, string> = {
  business: "Business",
  scope: "Scope",
  integration: "Integration",
  nonFunctional: "Non-functional",
  timeline: "Timeline",
  responsibility: "Responsibility",
};

const PRIORITY_CHIP: Record<ClarificationPriority, string> = {
  Critical: "chip-danger",
  High: "chip-warning",
  Medium: "chip-trust",
  Low: "chip-muted",
};

export function ClarificationRow({ question, scopeBriefHref }: Props) {
  const isResolved = question.status === "resolved";

  return (
    <li className={`clarification-row${isResolved ? " clarification-row-resolved" : ""}`}>
      <div className="clarification-row-chips">
        <span className={`chip ${PRIORITY_CHIP[question.priority]}`}>{question.priority}</span>
        <span className="chip chip-muted">{CATEGORY_LABELS[question.category]}</span>
        {isResolved ? (
          <span className="chip chip-success">Resolved</span>
        ) : (
          <span className="chip chip-warning">Open</span>
        )}
      </div>

      <p className="clarification-row-question">{question.question}</p>
      <p className="clarification-row-cause">{question.cause}</p>

      {question.linkedItemId && (
        <Link
          href={`${scopeBriefHref}#scope-item-${question.linkedItemId}`}
          className="source-link"
        >
          View linked Scope Brief item
        </Link>
      )}
    </li>
  );
}
