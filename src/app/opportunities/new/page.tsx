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

      <section className="workspace-content">
        <div className="form-panel">
          <OpportunityMetadataForm mode="create" action={handleCreate} />
        </div>
      </section>
    </main>
  );
}
