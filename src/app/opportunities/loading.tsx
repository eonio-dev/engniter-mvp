export default function OpportunitiesLoading() {
  return (
    <main className="workspace-shell">
      <header className="workspace-header">
        <div className="workspace-brand">
          <p className="eyebrow">Engniter Workspace</p>
          <div className="skeleton skeleton-title" aria-hidden="true" />
        </div>
      </header>

      <section
        className="workspace-content"
        aria-busy="true"
        aria-label="Loading opportunities"
      >
        <div className="skeleton skeleton-row" aria-hidden="true" />
        <div className="skeleton skeleton-row" aria-hidden="true" />
        <div className="skeleton skeleton-row" aria-hidden="true" />
      </section>
    </main>
  );
}
