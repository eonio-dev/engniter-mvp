"use client";

import { useEffect, useRef } from "react";
import type { ContextItem } from "@/features/context-packages/types";

type Props = {
  item: ContextItem | null | undefined;
  isOpen: boolean;
  onClose: () => void;
};

export function SourceReferenceDrawer({ item, isOpen, onClose }: Props) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management: move focus to close button on open
  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const SOURCE_TYPE_LABELS: Record<string, string> = {
    file: "File",
    text: "Text",
    note: "Note",
  };

  return (
    <div
      id="source-reference-drawer"
      className={`source-reference-drawer${isOpen ? " source-reference-drawer--open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Source reference"
      aria-hidden={!isOpen}
    >
      <div className="source-reference-drawer-header">
        <h2 className="source-reference-drawer-title">Source reference</h2>
        <button
          ref={closeButtonRef}
          type="button"
          className="source-reference-drawer-close"
          aria-label="Close source reference"
          tabIndex={!isOpen ? -1 : undefined}
          onClick={onClose}
        >
          Close
        </button>
      </div>

      <div className="source-reference-drawer-body">
        {!item ? (
          <div className="source-reference-unavailable" role="status">
            <p>Source unavailable.</p>
            <p className="context-item-meta">
              This reference may have been deleted or is no longer accessible.
            </p>
          </div>
        ) : (
          <>
            <div className="source-reference-meta">
              <span className="chip chip-trust">
                {SOURCE_TYPE_LABELS[item.sourceType] ?? item.sourceType}
              </span>
              <span className="source-reference-title">{item.title}</span>
            </div>

            {(item.sourceType === "text" || item.sourceType === "note") && (
              <div className="source-reference-content">
                <pre className="source-reference-pre">
                  {item.content ?? "(no content)"}
                </pre>
              </div>
            )}

            {item.sourceType === "file" && (
              <div className="source-reference-file-meta">
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
                      <dd>{(item.sizeBytes / 1024).toFixed(1)} KB</dd>
                    </div>
                  )}
                </dl>
                <p className="context-item-detail-note">
                  File content view coming soon.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
