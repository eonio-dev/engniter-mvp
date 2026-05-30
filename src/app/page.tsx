import Link from "next/link";
import { redirect } from "next/navigation";

import { getHomeSession } from "@/app/home-session";
import { getCurrentUser } from "@/features/auth/server/get-current-user";
import { hasAllowedEmailDomain } from "@/lib/config/firebase-project";

export default async function Home() {
  const session = await getHomeSession(() => getCurrentUser());

  if (session && hasAllowedEmailDomain(session.email)) {
    redirect("/opportunities");
  }

  return (
    <main className="marketing-shell">
      <section className="hero-panel">
        <p className="eyebrow">Engniter MVP</p>
        <h1>Secure opportunity intake starts here.</h1>
        <p className="hero-copy">
          This workspace initializes the Firebase App Hosting foundation, Google
          sign-in, and protected route shell required for the MVP intake flow.
        </p>
        <div className="hero-actions">
          <Link className="primary-button" href="/sign-in">
            Sign in with Google
          </Link>
          <Link className="secondary-button" href="/unauthorized">
            View unauthorized state
          </Link>
        </div>
      </section>
    </main>
  );
}
