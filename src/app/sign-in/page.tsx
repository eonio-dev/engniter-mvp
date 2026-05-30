import Link from "next/link";

import { GoogleSignInButton } from "@/features/auth/components/google-sign-in-button";
import { getSafeRedirectPath } from "@/lib/config/firebase-project";

type SignInPageProps = {
  searchParams?: Promise<{
    error?: string;
    redirectTo?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const redirectTo = getSafeRedirectPath(resolvedSearchParams?.redirectTo);
  const hasSessionError = resolvedSearchParams?.error === "session-invalid";

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="stack">
          <p className="eyebrow">Secure workspace access</p>
          <h1>Sign in to the Engniter opportunity workspace.</h1>
          <p className="auth-copy">
            Use Google sign-in to access protected opportunity routes. Session
            creation is handled server-side, and access is constrained by trusted
            server checks plus Firebase rules.
          </p>
        </div>
        <div className="stack">
          <p className="field-note">
            Access is limited to approved workspace members and configured email
            domains.
          </p>
          {hasSessionError ? (
            <p className="field-note" role="status">
              Your previous session could not be verified. Please sign in again.
            </p>
          ) : null}
          <GoogleSignInButton redirectTo={redirectTo} />
        </div>
        <div className="state-links">
          <Link className="secondary-button" href="/">
            Back to overview
          </Link>
        </div>
      </section>
    </main>
  );
}
