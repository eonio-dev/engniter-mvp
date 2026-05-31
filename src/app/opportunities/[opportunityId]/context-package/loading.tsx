export default function ContextPackageLoading() {
  return (
    <main className="workspace-shell">
      <header className="workspace-header">
        <div className="skeleton skeleton-breadcrumb" aria-hidden="true" />
        <div className="skeleton skeleton-title" aria-hidden="true" />
      </header>
      <div className="workspace-grid" aria-busy="true" aria-label="Loading Context Package">
        <section className="workspace-column">
          <div className="skeleton skeleton-section-title" aria-hidden="true" />
          <div className="skeleton skeleton-row" aria-hidden="true" />
          <div className="skeleton skeleton-row" aria-hidden="true" />
          <div className="skeleton skeleton-row" aria-hidden="true" />
        </section>
        <section className="workspace-column">
          <div className="skeleton skeleton-section-title" aria-hidden="true" />
          <div className="skeleton skeleton-tabs" aria-hidden="true" />
          <div className="skeleton skeleton-form" aria-hidden="true" />
        </section>
      </div>
    </main>
  );
}
