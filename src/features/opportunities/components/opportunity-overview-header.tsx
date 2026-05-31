import type { Opportunity } from "@/features/opportunities/types";

type OpportunityOverviewHeaderProps = {
  opportunity: Opportunity;
};

export function OpportunityOverviewHeader({
  opportunity,
}: OpportunityOverviewHeaderProps) {
  return (
    <div className="opportunity-header">
      <div className="opportunity-title">
        <h1>{opportunity.title}</h1>
        <div className="chips">
          <span className="chip">{opportunity.status}</span>
          <span className="chip">Owner · {opportunity.technicalOwner}</span>
          {opportunity.proposalDeadline && (
            <span className="chip">
              Deadline · {opportunity.proposalDeadline}
            </span>
          )}
        </div>
      </div>

      {(opportunity.clientName ||
        opportunity.projectType ||
        opportunity.estimatedValue) && (
        <div className="opportunity-meta-grid">
          {opportunity.clientName && (
            <div className="meta-card">
              <strong>Client</strong>
              <div className="meta-value">{opportunity.clientName}</div>
            </div>
          )}
          {opportunity.projectType && (
            <div className="meta-card">
              <strong>Project type</strong>
              <div className="meta-value">{opportunity.projectType}</div>
            </div>
          )}
          {opportunity.estimatedValue && (
            <div className="meta-card">
              <strong>Estimated value</strong>
              <div className="meta-value">{opportunity.estimatedValue}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
