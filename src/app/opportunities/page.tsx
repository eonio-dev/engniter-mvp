import Link from "next/link";
import { requireRole } from "@/features/auth/server/require-role";
import { listOpportunitiesByUser } from "@/features/opportunities/server/repository";
import { OpportunityList } from "@/features/opportunities/components/opportunity-list";
import { SignOutButton } from "@/features/auth/components/sign-out-button";

export default async function OpportunitiesPage() {
  const session = await requireRole({ redirectTo: "/opportunities" });

  let opportunities: Awaited<ReturnType<typeof listOpportunitiesByUser>> = [];
  let loadError = false;

  try {
    opportunities = await listOpportunitiesByUser(session.uid);
  } catch {
    loadError = true;
  }

  return (
    <main className="workspace-shell">
      <header className="workspace-header">
        <div className="workspace-brand">
          <p className="eyebrow">Engniter Workspace</p>
          <h1>Opportunities</h1>
        </div>
        <div className="toolbar-actions">
          <Link href="/opportunities/new" className="primary-button">
            New Opportunity
          </Link>
          <span className="workspace-badge">
            {session.email ?? session.displayName ?? "Authenticated user"}
          </span>
          <SignOutButton />
        </div>
      </header>

      <section className="workspace-content">
        {loadError ? (
          <div className="error-state" role="alert">
            <p>Opportunities could not be loaded.</p>
            <Link href="/opportunities" className="secondary-link">
              Try again
            </Link>
          </div>
        ) : (
          <OpportunityList opportunities={opportunities} />
        )}
      </section>
    </main>
  );
}
