import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/features/auth/server/require-role";
import { getOpportunity } from "@/features/opportunities/server/repository";
import { listContextItemsChronological } from "@/features/context-packages/server/repository";
import { OpportunityOverviewHeader } from "@/features/opportunities/components/opportunity-overview-header";
import { OpportunityMetadataForm } from "@/features/opportunities/components/opportunity-metadata-form";
import { updateOpportunityAction } from "@/features/opportunities/server/actions";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ opportunityId: string }>;
};

async function handleUpdate(
  opportunityId: string,
  formData: unknown,
): Promise<{ data: { opportunityId: string } } | { error: { code: string; message: string } }> {
  "use server";
  const input = typeof formData === "object" && formData !== null
    ? { ...(formData as Record<string, unknown>), opportunityId }
    : { opportunityId };
  const result = await updateOpportunityAction(input);
  if ("data" in result) {
    redirect(`/opportunities/${opportunityId}`);
  }
  return result;
}

export default async function OpportunityPage({ params }: Props) {
  const { opportunityId } = await params;
  await requireRole();

  const opportunity = await getOpportunity(opportunityId);
  if (!opportunity) {
    notFound();
  }

  const contextItems = await listContextItemsChronological(opportunityId);
  const boundUpdate = handleUpdate.bind(null, opportunityId);

  return (
    <main className="workspace-shell">
      <header className="workspace-header">
        <p className="eyebrow">
          <Link href="/opportunities">Opportunities</Link>
        </p>
        <OpportunityOverviewHeader opportunity={opportunity} />
      </header>

      <nav className="workspace-nav-tabs" aria-label="Opportunity sections">
        <Link
          href={`/opportunities/${opportunityId}/context-package`}
          className="nav-tab"
        >
          Context Package
        </Link>
      </nav>

      <div className="workspace-grid">
        <div className="workspace-column">
          {opportunity.fitCriteria && (
            <section className="workspace-panel">
              <h2 className="section-title">Internal fit criteria</h2>
              <p className="fit-criteria-text">{opportunity.fitCriteria}</p>
            </section>
          )}

          <section className="workspace-panel">
            <h2 className="section-title">Edit metadata</h2>
            <div className="form-panel">
              <OpportunityMetadataForm
                mode="edit"
                opportunityId={opportunityId}
                action={boundUpdate}
                initialValues={opportunity}
              />
            </div>
          </section>
        </div>

        <aside className="workspace-panel workspace-aside">
          <h2 className="section-title">Workflow status</h2>
          <div className="workflow-summary">
            <div className="workflow-summary-row">
              <strong>Context Package</strong>
              <div className="workflow-summary-detail">
                {contextItems.length === 0
                  ? "No items yet"
                  : `${contextItems.length} item${contextItems.length === 1 ? "" : "s"} attached`}
              </div>
            </div>
          </div>
          <Link
            href={`/opportunities/${opportunityId}/context-package`}
            className="secondary-link"
          >
            View Context Package →
          </Link>
        </aside>
      </div>
    </main>
  );
}
