import type { NoPromiseOverride } from "@/features/scope-briefs/types";
import type { NoPromiseBlocker } from "@/features/scope-briefs/confidence";
import { NoPromiseOverrideControl } from "./no-promise-override-control";

type Props = {
  scopeBriefId: string;
  blocked: boolean;
  blockers: NoPromiseBlocker[];
  override: NoPromiseOverride | null;
  showControls?: boolean;
};

export function NoPromiseBanner({
  scopeBriefId,
  blocked,
  blockers,
  override,
  showControls = true,
}: Props) {
  if (!blocked) return null;

  return (
    <div className="warning-banner no-promise-banner" role="alert">
      <p className="no-promise-banner-title">
        ⚠ Not ready to promise — unresolved commitment risks
      </p>
      <ul className="no-promise-blockers" role="list">
        {blockers.map((b) => (
          <li key={`${b.itemId}-${b.category}`}>{b.message}</li>
        ))}
      </ul>

      {override ? (
        <div className="no-promise-override-notice" role="status">
          <p>
            Gate overridden by an authorized user on{" "}
            {new Date(override.overriddenAt).toLocaleString()}.
          </p>
          <p className="no-promise-override-reason">“{override.reason}”</p>
        </div>
      ) : null}

      {showControls ? (
        <NoPromiseOverrideControl
          scopeBriefId={scopeBriefId}
          hasOverride={override !== null}
        />
      ) : null}
    </div>
  );
}
