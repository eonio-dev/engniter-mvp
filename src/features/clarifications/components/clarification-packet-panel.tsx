import { ClarificationRow } from "@/features/clarifications/components/clarification-row";
import { GenerateClarificationPacketButton } from "@/features/clarifications/components/generate-clarification-packet-button";
import type { ClarificationPacketSummary } from "@/features/clarifications/status";

type Props = {
  scopeBriefId: string;
  scopeBriefHref: string;
  generatedAt: string | null;
  summary: ClarificationPacketSummary | null;
};

function formatTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function ClarificationPacketPanel({
  scopeBriefId,
  scopeBriefHref,
  generatedAt,
  summary,
}: Props) {
  const hasPacket = summary !== null;
  const isCleared = summary?.isCleared ?? false;

  return (
    <section className="workspace-panel clarification-panel" aria-label="Clarification Packet">
      <div className="clarification-panel-header">
        <h2 className="section-title">Clarification Packet</h2>
        <GenerateClarificationPacketButton
          scopeBriefId={scopeBriefId}
          label={hasPacket ? "Regenerate clarifications" : "Generate clarifications"}
        />
      </div>

      {generatedAt && (
        <p className="clarification-panel-meta">Generated {formatTimestamp(generatedAt)}</p>
      )}

      {!hasPacket && (
        <p className="info-banner">
          No Clarification Packet yet. Generate one to surface the questions a buyer or
          stakeholder must answer before this engagement can move forward.
        </p>
      )}

      {hasPacket && summary.questions.length === 0 && (
        <p className="info-banner">
          No clarifications needed — the reviewed Scope Brief left no open gaps to resolve.
        </p>
      )}

      {hasPacket && summary.questions.length > 0 && (
        <>
          {isCleared ? (
            <p className="info-banner">
              All clarifications resolved. Every linked Scope Brief item has been acted on.
            </p>
          ) : (
            <p className="warning-banner">
              {summary.openCount} open clarification{summary.openCount === 1 ? "" : "s"} still
              need answers before this engagement is de-risked.
            </p>
          )}
          <ul className="clarification-list">
            {summary.questions.map((question) => (
              <ClarificationRow
                key={question.id}
                question={question}
                scopeBriefHref={scopeBriefHref}
              />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
