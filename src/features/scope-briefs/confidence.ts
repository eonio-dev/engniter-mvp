import type {
  ScopeBrief,
  ScopeCategory,
  ScopeConfidence,
} from "@/features/scope-briefs/schemas/scope-brief";

export const CRITICAL_CATEGORIES = ["risk", "openQuestion", "constraint", "integration"] as const;

export type NoPromiseBlocker = {
  type: "sparse-input" | "empty-scope" | "unreviewed-critical" | "flagged-item";
  message: string;
  itemId?: string;
  category?: ScopeCategory;
};

const CATEGORY_NOUNS: Record<ScopeCategory, string> = {
  goal: "goal",
  functionalRequirement: "functional requirement",
  nonFunctionalRequirement: "non-functional requirement",
  integration: "integration",
  constraint: "constraint",
  risk: "risk",
  assumption: "assumption",
  exclusion: "exclusion",
  openQuestion: "open question",
};

function isCriticalCategory(category: ScopeCategory): boolean {
  return (CRITICAL_CATEGORIES as readonly string[]).includes(category);
}

function getActiveItems(items: ScopeBrief["items"]): ScopeBrief["items"] {
  return items.filter((item) => item.reviewStatus !== "rejected");
}

function getUnresolvedCritical(activeItems: ScopeBrief["items"]): ScopeBrief["items"] {
  return activeItems.filter(
    (item) =>
      item.reviewStatus === "flagged" ||
      (item.reviewStatus === "pending" && isCriticalCategory(item.category)),
  );
}

export function evaluateScopeConfidence(
  brief: Pick<ScopeBrief, "sparseInput" | "items">,
): ScopeConfidence {
  const activeItems = getActiveItems(brief.items);

  // Low: sparse input, nothing to evaluate, or an entirely unreviewed brief.
  if (brief.sparseInput || activeItems.length === 0) return "Low";
  if (activeItems.every((item) => item.reviewStatus === "pending")) return "Low";

  // Low: any unresolved critical issue still blocks confidence.
  if (getUnresolvedCritical(activeItems).length > 0) return "Low";

  // High requires every active item to have completed review; otherwise Medium.
  if (activeItems.some((item) => item.reviewStatus === "pending")) return "Medium";
  return "High";
}

export function evaluateNoPromiseGate(
  brief: Pick<ScopeBrief, "sparseInput" | "items">,
): { blocked: boolean; blockers: NoPromiseBlocker[] } {
  const activeItems = getActiveItems(brief.items);
  const blockers: NoPromiseBlocker[] = [];

  if (brief.sparseInput) {
    blockers.push({
      type: "sparse-input",
      message:
        "The Context Package is too sparse for a trustworthy scope — external commitment is unsafe.",
    });
  } else if (activeItems.length === 0) {
    blockers.push({
      type: "empty-scope",
      message:
        "There is no active scope to commit to — every item has been rejected or none were extracted.",
    });
  }

  for (const item of activeItems) {
    if (item.reviewStatus === "pending" && isCriticalCategory(item.category)) {
      blockers.push({
        type: "unreviewed-critical",
        itemId: item.id,
        category: item.category,
        message: `Unreviewed ${CATEGORY_NOUNS[item.category]} still needs a decision before committing.`,
      });
    }
  }

  for (const item of activeItems) {
    if (item.reviewStatus === "flagged") {
      blockers.push({
        type: "flagged-item",
        itemId: item.id,
        category: item.category,
        message: `A flagged ${CATEGORY_NOUNS[item.category]} still needs resolution before committing.`,
      });
    }
  }

  return { blocked: blockers.length > 0, blockers };
}

export function canGenerateExternalArtifacts(
  brief: Pick<ScopeBrief, "sparseInput" | "items" | "noPromiseOverride">,
): { allowed: boolean; reason?: string } {
  const gate = evaluateNoPromiseGate(brief);
  if (!gate.blocked || brief.noPromiseOverride != null) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: gate.blockers[0]?.message ?? "Unresolved no-promise blockers remain.",
  };
}

export function canApproveScopeBrief(
  brief: Pick<ScopeBrief, "sparseInput" | "items" | "noPromiseOverride">,
): { allowed: boolean; reason?: string } {
  if (brief.items.length === 0) {
    return { allowed: false, reason: "There are no items to approve." };
  }

  const activeItems = getActiveItems(brief.items);
  if (activeItems.length === 0) {
    return {
      allowed: false,
      reason: "Every item has been rejected — there is nothing to approve.",
    };
  }

  const pendingCount = brief.items.filter((item) => item.reviewStatus === "pending").length;
  if (pendingCount > 0) {
    return { allowed: false, reason: `${pendingCount} item(s) still need review.` };
  }

  // Align approval with the no-promise gate (Story 2.4): a brief that still carries
  // unresolved commitment risk (e.g. flagged items) must not be approved unless an
  // audited no-promise override is in place.
  const gate = evaluateNoPromiseGate(brief);
  if (gate.blocked && brief.noPromiseOverride == null) {
    return {
      allowed: false,
      reason: gate.blockers[0]?.message ?? "Unresolved commitment blockers remain.",
    };
  }

  return { allowed: true };
}
