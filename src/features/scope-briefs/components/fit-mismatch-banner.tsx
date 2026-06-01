import type { FitMismatch, ScopeItem } from "@/features/scope-briefs/types";
import { RecheckFitButton } from "./recheck-fit-button";

type Props = {
  scopeBriefId: string;
  mismatches: FitMismatch[];
  fitCheckedAt: string | null;
  items?: ScopeItem[];
  hasFitCriteria?: boolean;
  showRecheck?: boolean;
};

export function FitMismatchBanner({
  scopeBriefId,
  mismatches,
  fitCheckedAt,
  items = [],
  hasFitCriteria = true,
  showRecheck = true,
}: Props) {
  const hasMismatches = mismatches.length > 0;

  // Nothing to show when there are no criteria to check against and no check has run.
  if (!hasMismatches && !fitCheckedAt && !hasFitCriteria) return null;

  const itemsById = new Map(items.map((i) => [i.id, i]));

  return (
    <div
      className={`fit-mismatch-banner ${hasMismatches ? "warning-banner" : "info-banner"}`}
      role={hasMismatches ? "alert" : "status"}
    >
      <p className="fit-mismatch-title">
        {hasMismatches
          ? `⚠ ${mismatches.length} possible fit mismatch${mismatches.length === 1 ? "" : "es"}`
          : fitCheckedAt
            ? "✓ No fit mismatches detected"
            : "Fit not yet checked"}
      </p>

      {hasMismatches && (
        <ul className="fit-mismatch-list" role="list">
          {mismatches.map((m, i) => {
            const conflictingItem = m.conflictingItemId
              ? itemsById.get(m.conflictingItemId)
              : undefined;
            const itemLabel = conflictingItem
              ? (conflictingItem.editedContent ?? conflictingItem.content)
              : null;
            return (
              <li key={`${m.criterion}-${i}`}>
                <span className="fit-mismatch-criterion">{m.criterion}</span>
                {": "}
                {m.reason}
                {itemLabel && (
                  <span className="fit-mismatch-conflicting-item">
                    {" "}
                    (conflicts with: “{itemLabel}”)
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {fitCheckedAt && (
        <p className="fit-mismatch-checked-at">
          Last checked {new Date(fitCheckedAt).toLocaleString()}
        </p>
      )}

      {showRecheck && hasFitCriteria && <RecheckFitButton scopeBriefId={scopeBriefId} />}
    </div>
  );
}
