export default function ClarificationsLoading() {
  return (
    <main className="workspace-shell">
      <header className="workspace-header">
        <p className="eyebrow">Engniter Workspace</p>
        <div className="skeleton skeleton-title" aria-hidden="true" />
      </header>

      <section
        className="workspace-content"
        aria-busy="true"
        aria-label="Loading clarifications"
      >
        <div className="skeleton skeleton-row" aria-hidden="true" />
        <div className="skeleton skeleton-row" aria-hidden="true" />
        <div className="skeleton skeleton-row" aria-hidden="true" />
      </section>
    </main>
  );
}
