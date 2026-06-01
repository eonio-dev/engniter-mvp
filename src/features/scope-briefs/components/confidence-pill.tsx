import type { ScopeConfidence } from "@/features/scope-briefs/types";

const CONFIDENCE_CHIP: Record<ScopeConfidence, string> = {
  Low: "chip-warning",
  Medium: "chip-trust",
  High: "chip-success",
};

const CONFIDENCE_REASON: Record<ScopeConfidence, string> = {
  Low: "Not ready to commit — sparse input or unresolved critical items remain.",
  Medium: "Some items still need review before this scope is firm.",
  High: "Every active item is reviewed — scope is ready to advance.",
};

type Props = {
  confidence: ScopeConfidence;
};

export function ConfidencePill({ confidence }: Props) {
  return (
    <span className="confidence-pill">
      <span
        className={`chip ${CONFIDENCE_CHIP[confidence]}`}
        aria-label={`Scope Confidence: ${confidence}`}
      >
        Scope Confidence · {confidence}
      </span>
      <span className="confidence-pill-reason">{CONFIDENCE_REASON[confidence]}</span>
    </span>
  );
}
