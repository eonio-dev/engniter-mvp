"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";

import { deleteServerSession } from "@/features/auth/client/delete-session";
import { getClientAuth, isFirebaseClientConfigured } from "@/lib/firebase/client-app";

export function SignOutButton() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    if (pending) {
      return;
    }

    setPending(true);
    setErrorMessage(null);

    try {
      await deleteServerSession();

      if (isFirebaseClientConfigured()) {
        await signOut(getClientAuth());
      }

      router.replace("/sign-in");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to sign out right now.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="stack">
      <button className="secondary-button" type="button" onClick={handleSignOut}>
        {pending ? "Signing out..." : "Sign out"}
      </button>
      {errorMessage ? (
        <p className="field-note" role="status">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
