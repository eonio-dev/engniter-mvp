import Link from "next/link";
import type { Opportunity } from "@/features/opportunities/types";

type OpportunityListProps = {
  opportunities: Opportunity[];
};

export function OpportunityList({ opportunities }: OpportunityListProps) {
  if (opportunities.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-state-text">No Opportunities yet.</p>
        <Link href="/opportunities/new" className="primary-button">
          New Opportunity
        </Link>
      </div>
    );
  }

  return (
    <ul className="opportunity-list" role="list">
      {opportunities.map((opp) => (
        <li key={opp.id} className="opportunity-row">
          <Link href={`/opportunities/${opp.id}`} className="opportunity-row-link">
            <div className="opportunity-row-main">
              <span className="opportunity-row-title">{opp.title}</span>
              <span className="opportunity-row-owner">
                Owner · {opp.technicalOwner}
              </span>
            </div>
            <div className="opportunity-row-meta">
              <span className="chip">{opp.status}</span>
              {opp.proposalDeadline && (
                <span className="opportunity-row-deadline">
                  Deadline {opp.proposalDeadline}
                </span>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
