"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup } from "firebase/auth";

import { getSafeRedirectPath } from "@/lib/config/firebase-project";
import {
  getClientAuth,
  getGoogleProvider,
  isFirebaseClientConfigured,
} from "@/lib/firebase/client-app";

type GoogleSignInButtonProps = {
  redirectTo?: string;
};

export function GoogleSignInButton({ redirectTo }: GoogleSignInButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const returnTo = getSafeRedirectPath(redirectTo);
  const isConfigured = isFirebaseClientConfigured();

  async function handleSignIn() {
    if (!isConfigured || pending) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      const credential = await signInWithPopup(getClientAuth(), getGoogleProvider());
      const idToken = await credential.user.getIdToken();
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "Unable to create a secure session.");
      }

      router.replace(returnTo);
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Google sign-in failed. Try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="stack">
      <button
        className="primary-button"
        onClick={handleSignIn}
        type="button"
        disabled={!isConfigured || pending}
      >
        {pending ? "Signing in..." : "Continue with Google"}
      </button>
      {!isConfigured ? (
        <p className="error-banner">
          Firebase client environment values are missing. Add the public Firebase
          keys from <code>.env.example</code> before trying to sign in.
        </p>
      ) : null}
      {error ? <p className="error-banner">{error}</p> : null}
    </div>
  );
}
