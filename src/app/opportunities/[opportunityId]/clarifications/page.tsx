import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/features/auth/server/require-role";
import { getOpportunity } from "@/features/opportunities/server/repository";
import { getLatestScopeBriefForOpportunity } from "@/features/scope-briefs/server/repository";
import { getLatestClarificationPacketForBrief } from "@/features/clarifications/server/repository";
import { summarizeClarificationPacket } from "@/features/clarifications/status";
import { ClarificationPacketPanel } from "@/features/clarifications/components/clarification-packet-panel";

type Props = {
  params: Promise<{ opportunityId: string }>;
};

export default async function ClarificationsPage({ params }: Props) {
  const { opportunityId } = await params;
  const session = await requireRole();

  const opportunity = await getOpportunity(opportunityId);
  if (!opportunity || opportunity.createdByUserId !== session.uid) {
    notFound();
  }

  const scopeBrief = await getLatestScopeBriefForOpportunity(opportunityId);
  const scopeBriefHref = `/opportunities/${opportunityId}/scope-brief`;
  const contextPackageHref = `/opportunities/${opportunityId}/context-package`;

  const canClarify = scopeBrief !== null && !scopeBrief.sparseInput;

  const packet = canClarify
    ? await getLatestClarificationPacketForBrief(scopeBrief.id)
    : null;
  const summary =
    packet && scopeBrief ? summarizeClarificationPacket(packet, scopeBrief) : null;

  return (
    <main className="workspace-shell">
      <header className="workspace-header">
        <p className="eyebrow">
          <Link href="/opportunities">Opportunities</Link> /{" "}
          <Link href={`/opportunities/${opportunityId}`}>{opportunity.title}</Link> / Clarifications
        </p>
        <h1>Clarifications</h1>
      </header>

      {!canClarify ? (
        scopeBrief?.sparseInput ? (
          <div className="warning-banner" role="alert">
            The Context Package is too sparse for trustworthy clarifications. Add more source
            material before generating clarifications.{" "}
            <Link href={contextPackageHref} className="secondary-link">
              Go to Context Package
            </Link>
          </div>
        ) : (
          <div className="warning-banner" role="alert">
            A Scope Brief is required before clarifications can be generated.{" "}
            <Link href={scopeBriefHref} className="secondary-link">
              Go to Scope Brief
            </Link>
          </div>
        )
      ) : (
        <ClarificationPacketPanel
          scopeBriefId={scopeBrief.id}
          scopeBriefHref={scopeBriefHref}
          generatedAt={packet?.generatedAt ?? null}
          summary={summary}
        />
      )}
    </main>
  );
}
