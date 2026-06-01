import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/features/auth/server/require-role";
import { getOpportunity } from "@/features/opportunities/server/repository";
import { getJob } from "@/features/jobs/server/repository";
import { getLatestScopeBriefForOpportunity } from "@/features/scope-briefs/server/repository";
import { listContextItemsChronological } from "@/features/context-packages/server/repository";
import type { ContextItem } from "@/features/context-packages/types";
import { JobStatusPanel } from "@/features/scope-briefs/components/job-status-panel";
import { ScopeBriefPanel } from "@/features/scope-briefs/components/scope-brief-panel";
import { FitMismatchBanner } from "@/features/scope-briefs/components/fit-mismatch-banner";
import { RunAnalysisButton } from "@/features/scope-briefs/components/run-analysis-button";
import type { JobStatus } from "@/features/jobs/types";

type Props = {
  params: Promise<{ opportunityId: string }>;
  searchParams: Promise<{ jobId?: string }>;
};

export default async function ScopeBriefPage({ params, searchParams }: Props) {
  const { opportunityId } = await params;
  const { jobId } = await searchParams;
  const session = await requireRole();

  const opportunity = await getOpportunity(opportunityId);
  if (!opportunity || opportunity.createdByUserId !== session.uid) {
    notFound();
  }

  const rawJob = jobId ? await getJob(jobId) : null;
  // Validate job belongs to this opportunity and this user
  const activeJob =
    rawJob &&
    rawJob.opportunityId === opportunityId &&
    rawJob.createdByUserId === session.uid
      ? rawJob
      : null;

  const scopeBrief = await getLatestScopeBriefForOpportunity(opportunityId);

  let contextItemsRecord: Record<string, ContextItem> = {};
  if (scopeBrief && !scopeBrief.sparseInput) {
    try {
      const contextItems = await listContextItemsChronological(opportunityId);
      contextItemsRecord = Object.fromEntries(contextItems.map((item) => [item.id, item]));
    } catch {
      // Non-fatal: drawer shows "Source unavailable" if items can't be fetched
    }
  }

  const isActive =
    activeJob &&
    (activeJob.status === "queued" || activeJob.status === "running");

  const showRetry = !isActive && (!scopeBrief || scopeBrief.sparseInput);

  return (
    <main className="workspace-shell">
      <header className="workspace-header">
        <p className="eyebrow">
          <Link href="/opportunities">Opportunities</Link> /{" "}
          <Link href={`/opportunities/${opportunityId}`}>{opportunity.title}</Link> / Scope Brief
        </p>
        <h1>Scope Brief</h1>
      </header>

      {isActive && activeJob && (
        <JobStatusPanel
          jobId={activeJob.id}
          initialStatus={activeJob.status as JobStatus}
        />
      )}

      {activeJob?.status === "failed" && (
        <div className="error-state" role="alert">
          <p>Analysis failed: {activeJob.errorMessage ?? "Unknown error."}</p>
          <Link href={`/opportunities/${opportunityId}/context-package`} className="secondary-link">
            Back to Context Package
          </Link>
        </div>
      )}

      {scopeBrief?.sparseInput && !isActive && (
        <div className="warning-banner" role="alert">
          Context Package is too thin for trustworthy extraction. Add more source material before running analysis.{" "}
          <Link href={`/opportunities/${opportunityId}/context-package`} className="secondary-link">
            Go to Context Package
          </Link>
        </div>
      )}

      {scopeBrief && !scopeBrief.sparseInput && (
        <>
          {opportunity.fitCriteria && (
            <FitMismatchBanner
              scopeBriefId={scopeBrief.id}
              mismatches={scopeBrief.fitMismatches}
              fitCheckedAt={scopeBrief.fitCheckedAt}
              items={scopeBrief.items}
              hasFitCriteria
            />
          )}
          <ScopeBriefPanel scopeBrief={scopeBrief} scopeBriefId={scopeBrief.id} contextItemsRecord={contextItemsRecord} />
          <p className="workspace-copy">
            <Link href={`/opportunities/${opportunityId}/clarifications`} className="secondary-link">
              Generate or review the Clarification Packet →
            </Link>
          </p>
        </>
      )}

      {showRetry && (
        <div className="workspace-panel">
          {!scopeBrief && <p className="workspace-copy">No analysis run yet.</p>}
          <RunAnalysisButton opportunityId={opportunityId} />
        </div>
      )}
    </main>
  );
}
