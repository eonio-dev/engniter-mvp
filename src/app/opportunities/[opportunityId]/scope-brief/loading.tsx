export default function ScopeBriefLoading() {
  return (
    <main className="workspace-shell">
      <header className="workspace-header">
        <div className="skeleton skeleton-breadcrumb" aria-hidden="true" />
        <div className="skeleton skeleton-title" aria-hidden="true" />
      </header>
      <section
        className="workspace-content"
        aria-busy="true"
        aria-label="Loading Scope Brief"
      >
        <div className="skeleton skeleton-row" aria-hidden="true" />
        <div className="skeleton skeleton-row" aria-hidden="true" />
        <div className="skeleton skeleton-row" aria-hidden="true" />
      </section>
    </main>
  );
}
