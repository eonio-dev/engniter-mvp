"use client";

import { useState } from "react";
import type { ContextItem } from "@/features/context-packages/types";
import { ContextItemDetailPanel } from "./context-item-detail-panel";
import { getItemLabel, formatItemTimestamp } from "./context-package-history-table.helpers";

const SOURCE_TYPE_LABELS: Record<string, string> = {
  file: "File",
  text: "Text",
  note: "Note",
};

type Props = {
  items: ContextItem[];
};

export function ContextPackageHistoryTable({ items }: Props) {
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <p className="context-history-empty">No context items yet.</p>
    );
  }

  return (
    <ul className="context-history-list" role="list">
      {items.map((item, index) => {
        const label = getItemLabel(index, items.length);
        const isExpanded = expandedItemId === item.id;
        const typeLabel = SOURCE_TYPE_LABELS[item.sourceType] ?? item.sourceType;

        return (
          <li key={item.id} className="context-history-row">
            <div className="context-history-row-header">
              <div className="context-history-row-meta">
                <span className="chip chip-trust">{typeLabel}</span>
                {label && (
                  <span className="chip chip-success">{label}</span>
                )}
                <span className="context-history-title">{item.title}</span>
              </div>
              <div className="context-history-row-actions">
                <span className="context-item-meta">
                  {formatItemTimestamp(item.createdAt)}
                </span>
                <button
                  type="button"
                  className="secondary-button secondary-button--sm"
                  aria-expanded={isExpanded}
                  aria-controls={`detail-${item.id}`}
                  onClick={() =>
                    setExpandedItemId(isExpanded ? null : item.id)
                  }
                >
                  {isExpanded ? "Collapse" : "Inspect"}
                </button>
              </div>
            </div>

            <div
              id={`detail-${item.id}`}
              hidden={!isExpanded}
            >
              {isExpanded && <ContextItemDetailPanel item={item} />}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
