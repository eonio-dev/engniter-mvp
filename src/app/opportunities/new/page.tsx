import Link from "next/link";
import { requireRole } from "@/features/auth/server/require-role";
import { OpportunityMetadataForm } from "@/features/opportunities/components/opportunity-metadata-form";
import { createOpportunityAction } from "@/features/opportunities/server/actions";
import { redirect } from "next/navigation";

async function handleCreate(
  formData: unknown,
): Promise<{ data: { opportunityId: string } } | { error: { code: string; message: string } }> {
  "use server";
  const result = await createOpportunityAction(formData);
  if ("data" in result) {
    redirect(`/opportunities/${result.data.opportunityId}`);
  }
  return result;
}

export default async function NewOpportunityPage() {
  await requireRole();

  return (
    <main className="workspace-shell">
      <header className="workspace-header">
        <div className="workspace-brand">
          <p className="eyebrow">
            <Link href="/opportunities">Opportunities</Link> / New
          </p>
          <h1>New Opportunity</h1>
        </div>
      </header>

      <div className="workspace-grid">
        <section className="workspace-panel workspace-column">
          <div>
            <h2 className="section-title">Opportunity metadata</h2>
            <p className="section-copy">
              Start with clean metadata. Better inputs here improve context package, scope brief,
              and clarification quality later.
            </p>
          </div>
          <div className="form-panel">
            <OpportunityMetadataForm mode="create" action={handleCreate} />
          </div>
        </section>

        <aside className="workspace-panel workspace-aside">
          <div>
            <h2 className="section-title">What good looks like</h2>
            <p className="section-copy">
              Keep entries short, concrete, and decision-friendly.
            </p>
          </div>
          <ul className="helper-list">
            <li>Use client-facing title team can recognize fast.</li>
            <li>Add owner who can answer delivery and architecture questions.</li>
            <li>Document fit constraints that should block weak opportunities early.</li>
          </ul>
        </aside>
      </div>
    </main>
  );
}
