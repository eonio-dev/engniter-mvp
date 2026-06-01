import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/features/auth/server/require-role";
import { getOpportunity } from "@/features/opportunities/server/repository";
import { listContextItems } from "@/features/context-packages/server/repository";
import { ContextPackageHistoryTable } from "@/features/context-packages/components/context-package-history-table";
import { ContextPackageUploadForm } from "@/features/context-packages/components/context-package-upload-form";
import { RunAnalysisButton } from "@/features/scope-briefs/components/run-analysis-button";

type Props = {
  params: Promise<{ opportunityId: string }>;
};

export default async function ContextPackagePage({ params }: Props) {
  const { opportunityId } = await params;
  await requireRole();

  const opportunity = await getOpportunity(opportunityId);
  if (!opportunity) {
    notFound();
  }

  const latestItems = await listContextItems(opportunityId);
  const chronologicalItems = [...latestItems].reverse();

  return (
    <main className="workspace-shell">
      <header className="workspace-header">
        <p className="eyebrow">
          <Link href="/opportunities">Opportunities</Link> /{" "}
          <Link href={`/opportunities/${opportunityId}`}>{opportunity.title}</Link> / Context Package
        </p>
        <h1>Context Package</h1>
      </header>

      <div className="workspace-grid">
        <section className="workspace-column">
          <h2 className="section-title">Context history</h2>
          <ContextPackageHistoryTable items={chronologicalItems} />
        </section>

        <section className="workspace-column">
          <h2 className="section-title">Add to this package</h2>
          <ContextPackageUploadForm
            opportunityId={opportunityId}
            initialItems={latestItems}
          />
          {latestItems.length > 0 && (
            <div className="run-analysis-section">
              <h2 className="section-title">Analysis</h2>
              <p className="workspace-copy">
                Run AI analysis to generate a draft Scope Brief from this Context Package.
              </p>
              <RunAnalysisButton opportunityId={opportunityId} />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
