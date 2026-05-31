import type { ContextItem } from "@/features/context-packages/types";

type Props = {
  item: ContextItem;
};

function formatBytes(bytes: number | null): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function ContextItemDetailPanel({ item }: Props) {
  if (item.sourceType === "text" || item.sourceType === "note") {
    return (
      <div className="context-item-detail" role="region" aria-label={`Content: ${item.title}`}>
        <p className="context-item-detail-label">Content</p>
        <div className="context-item-detail-content">
          <pre className="context-item-detail-pre">{item.content ?? "(no content)"}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="context-item-detail" role="region" aria-label={`File details: ${item.title}`}>
      <dl className="context-item-detail-meta">
        <div className="context-item-detail-row">
          <dt>Filename</dt>
          <dd>{item.title}</dd>
        </div>
        {item.mimeType && (
          <div className="context-item-detail-row">
            <dt>Type</dt>
            <dd>{item.mimeType}</dd>
          </div>
        )}
        {item.sizeBytes != null && (
          <div className="context-item-detail-row">
            <dt>Size</dt>
            <dd>{formatBytes(item.sizeBytes)}</dd>
          </div>
        )}
      </dl>
      <p className="context-item-detail-note">
        File content visible after source references are linked in a later analysis step.
      </p>
    </div>
  );
}
