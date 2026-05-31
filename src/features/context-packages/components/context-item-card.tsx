import type { ContextItem } from "@/features/context-packages/types";

const SOURCE_TYPE_LABELS: Record<string, string> = {
  file: "File",
  text: "Text",
  note: "Note",
};

type ConfirmedCardProps = {
  item: ContextItem;
};

export function ConfirmedContextItemCard({ item }: ConfirmedCardProps) {
  const typeLabel = SOURCE_TYPE_LABELS[item.sourceType] ?? item.sourceType;
  const date = item.createdAt
    ? new Date(item.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div className="context-item-card">
      <div className="context-item-main">
        <span className="context-item-title">{item.title}</span>
        {item.sizeBytes != null && (
          <span className="context-item-meta">
            {(item.sizeBytes / 1024).toFixed(0)} KB
          </span>
        )}
      </div>
      <div className="context-item-meta-row">
        <span className="chip chip-trust">{typeLabel}</span>
        <span className="context-item-meta">{date}</span>
      </div>
    </div>
  );
}

type PendingCardProps = {
  id: string;
  name: string;
  status: "uploading" | "failed";
  progress: number;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
};

export function PendingContextItemCard({
  id,
  name,
  status,
  progress,
  onRetry,
  onRemove,
}: PendingCardProps) {
  return (
    <div className="context-item-card context-item-card--pending">
      <div className="context-item-main">
        <span className="context-item-title">{name}</span>
        {status === "failed" && (
          <span className="context-item-error">Upload failed.</span>
        )}
      </div>
      {status === "uploading" && (
        <div className="context-item-progress">
          <progress
            value={progress}
            max={100}
            aria-valuenow={progress}
            aria-valuemax={100}
            aria-label={`Uploading ${name}: ${progress}%`}
          />
          <span className="context-item-meta">{progress}%</span>
        </div>
      )}
      {status === "failed" && (
        <div className="context-item-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => onRetry(id)}
            disabled={status !== "failed"}
          >
            Retry
          </button>
          <button
            type="button"
            className="danger-button"
            onClick={() => onRemove(id)}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
