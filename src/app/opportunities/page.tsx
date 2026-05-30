import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { requireRole } from "@/features/auth/server/require-role";

export default async function OpportunitiesPage() {
  const session = await requireRole({ redirectTo: "/opportunities" });

  return (
    <main className="workspace-shell">
      <header className="workspace-header">
        <div className="workspace-brand">
          <p className="eyebrow">Engniter Workspace</p>
          <h1>Protected opportunities</h1>
          <p className="workspace-copy">
            Authenticated baseline shell for Epic 1 follow-on stories.
          </p>
        </div>
        <div className="toolbar-actions">
          <span className="workspace-badge">
            {session.email ?? session.displayName ?? "Authenticated user"}
          </span>
          <SignOutButton />
        </div>
      </header>

      <section className="workspace-grid">
        <div className="workspace-column">
          <h2>Opportunity pipeline</h2>
          <p className="muted-text">
            This placeholder route is intentionally minimal: it proves the protected
            shell, routing, and baseline layout without front-loading the full
            Opportunity data model before Stories 1.2-1.4.
          </p>
          <div className="workspace-list">
            <article className="workspace-card">
              <div className="workspace-meta">
                <span className="status-chip">Ready for Story 1.2</span>
                <span className="status-chip">Secure route</span>
              </div>
              <h3>Opportunity metadata workspace</h3>
              <p>
                Core metadata forms, fit criteria, and technical owner workflows land
                here next.
              </p>
            </article>
            <article className="workspace-card">
              <div className="workspace-meta">
                <span className="status-chip">Ready for Story 1.3</span>
                <span className="status-chip">Context package</span>
              </div>
              <h3>Context package ingestion</h3>
              <p>
                File uploads, text paste, and source metadata scaffolding will extend
                this shell in the next story.
              </p>
            </article>
          </div>
        </div>

        <aside className="workspace-panel">
          <div className="stack">
            <h2>Current access context</h2>
            <p className="workspace-copy">
              Authenticated users can reach this route only when the secure session
              cookie is present and the configured server-side access check passes.
            </p>
            <div className="workspace-meta">
              <span className="status-chip">
                Email verified: {session.emailVerified ? "Yes" : "No"}
              </span>
              <span className="status-chip">
                Roles: {session.roles.length > 0 ? session.roles.join(", ") : "Not set"}
              </span>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
