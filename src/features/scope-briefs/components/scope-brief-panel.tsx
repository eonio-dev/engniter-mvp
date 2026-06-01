import type { ScopeBrief, ScopeCategory } from "@/features/scope-briefs/types";
import type { ContextItem } from "@/features/context-packages/types";
import { SCOPE_CATEGORIES } from "@/features/scope-briefs/schemas/scope-brief";
import { evaluateScopeConfidence, evaluateNoPromiseGate } from "@/features/scope-briefs/confidence";
import { ScopeItemCard } from "./scope-item-card";
import { ApproveScopeBriefButton } from "./approve-scope-brief-button";
import { ConfidencePill } from "./confidence-pill";
import { NoPromiseBanner } from "./no-promise-banner";

const CATEGORY_LABELS: Record<ScopeCategory, string> = {
  goal: "Goals",
  functionalRequirement: "Functional Requirements",
  nonFunctionalRequirement: "Non-Functional Requirements",
  integration: "Integrations",
  constraint: "Constraints",
  risk: "Risks",
  assumption: "Assumptions",
  exclusion: "Exclusions",
  openQuestion: "Open Questions",
};

type Props = {
  scopeBrief: ScopeBrief;
  scopeBriefId: string;
  contextItemsRecord: Record<string, ContextItem>;
};

export function ScopeBriefPanel({ scopeBrief, scopeBriefId, contextItemsRecord }: Props) {
  const itemsByCategory = SCOPE_CATEGORIES.reduce<Record<ScopeCategory, typeof scopeBrief.items>>(
    (acc, cat) => {
      acc[cat] = scopeBrief.items.filter((item) => item.category === cat);
      return acc;
    },
    {} as Record<ScopeCategory, typeof scopeBrief.items>,
  );

  const confidence = evaluateScopeConfidence({
    sparseInput: scopeBrief.sparseInput,
    items: scopeBrief.items,
  });
  const gate = evaluateNoPromiseGate({
    sparseInput: scopeBrief.sparseInput,
    items: scopeBrief.items,
  });

  const totalItems = scopeBrief.items.length;
  const reviewedCount = scopeBrief.items.filter((i) => i.reviewStatus !== "pending").length;
  const pendingCount = totalItems - reviewedCount;

  return (
    <div className="scope-brief-panel">
      <div className="scope-brief-meta">
        <ConfidencePill confidence={confidence} />
        <span className="scope-brief-version">Version {scopeBrief.version}</span>
      </div>

      <NoPromiseBanner
        scopeBriefId={scopeBriefId}
        blocked={gate.blocked}
        blockers={gate.blockers}
        override={scopeBrief.noPromiseOverride}
      />

      <div className="scope-brief-review-progress">
        <p className="scope-brief-review-progress-label">
          {reviewedCount} of {totalItems} items reviewed
        </p>
        <progress
          className="scope-brief-progress"
          value={reviewedCount}
          max={Math.max(totalItems, 1)}
          aria-valuenow={reviewedCount}
          aria-valuemax={Math.max(totalItems, 1)}
          aria-label="Review progress"
        />
      </div>

      {SCOPE_CATEGORIES.map((cat) => {
        const items = itemsByCategory[cat];
        if (!items || items.length === 0) return null;
        return (
          <section key={cat} className="scope-section">
            <h3 className="section-title">{CATEGORY_LABELS[cat]}</h3>
            <ul className="scope-items-list" role="list">
              {items.map((item) => (
                <li key={item.id} className="scope-items-li">
                  <ScopeItemCard
                    item={item}
                    scopeBriefId={scopeBriefId}
                    contextItemsRecord={contextItemsRecord}
                  />
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <ApproveScopeBriefButton
        scopeBriefId={scopeBriefId}
        pendingCount={pendingCount}
        currentStatus={scopeBrief.status}
      />
    </div>
  );
}
