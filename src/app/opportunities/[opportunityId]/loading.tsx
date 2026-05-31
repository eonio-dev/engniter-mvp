export default function OpportunityLoading() {
  return (
    <main className="workspace-shell">
      <header className="workspace-header">
        <div className="workspace-brand">
          <div className="skeleton skeleton-breadcrumb" aria-hidden="true" />
          <div className="skeleton skeleton-title" aria-hidden="true" />
          <div className="skeleton skeleton-chips" aria-hidden="true" />
        </div>
      </header>

      <section className="workspace-panel" aria-busy="true" aria-label="Loading opportunity">
        <div className="skeleton skeleton-meta-grid" aria-hidden="true" />
      </section>
    </main>
  );
}
