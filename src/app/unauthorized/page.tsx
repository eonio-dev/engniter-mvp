import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="auth-shell">
      <section className="state-panel">
        <div className="stack">
          <p className="eyebrow">Unauthorized</p>
          <h1>Workspace access was denied.</h1>
          <p className="state-copy">
            Your account authenticated successfully, but it does not currently meet
            the required role or access context for this protected area.
          </p>
        </div>
        <div className="stack">
          <p className="error-banner">
            Ask a workspace administrator to confirm your approved domain or role
            assignment before retrying.
          </p>
        </div>
        <div className="state-links">
          <Link className="primary-button" href="/sign-in">
            Return to sign-in
          </Link>
          <Link className="secondary-button" href="/">
            Go to overview
          </Link>
        </div>
      </section>
    </main>
  );
}
