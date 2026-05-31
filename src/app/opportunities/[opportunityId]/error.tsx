"use client";

import Link from "next/link";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function OpportunityError({ error, reset }: ErrorProps) {
  return (
    <main className="workspace-shell">
      <section className="workspace-panel">
        <h1>Opportunity unavailable</h1>
        <p className="workspace-copy">
          This Opportunity could not be loaded. It may have been deleted or your
          access may have changed.
        </p>
        <div className="toolbar-actions">
          <button type="button" className="primary-button" onClick={reset}>
            Try again
          </button>
          <Link href="/opportunities" className="secondary-link">
            Back to Opportunities
          </Link>
        </div>
      </section>
    </main>
  );
}
