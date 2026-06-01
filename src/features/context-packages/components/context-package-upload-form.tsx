"use client";

import { useState, useRef, useActionState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { ContextItem } from "@/features/context-packages/types";
import { addTextItemAction, addNoteItemAction } from "@/features/context-packages/server/actions";
import { ConfirmedContextItemCard, PendingContextItemCard } from "./context-item-card";

type PendingItem = {
  id: string;
  name: string;
  status: "uploading" | "failed";
  progress: number;
  file: File;
  errorMessage?: string;
};

type TextFormState = { status: "idle" } | { status: "error"; message: string } | { status: "success" };
type NoteFormState = { status: "idle" } | { status: "error"; message: string } | { status: "success" };

type Props = {
  opportunityId: string;
  initialItems: ContextItem[];
};

function uploadFileXhr(
  opportunityId: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<{ itemId: string; storageRef: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText);
          if ("error" in result) reject(new Error(result.error.message));
          else resolve(result.data);
        } catch {
          reject(new Error("Invalid server response."));
        }
      } else {
        try {
          const result = JSON.parse(xhr.responseText);
          reject(new Error(result?.error?.message ?? "Upload failed."));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}.`));
        }
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.open("POST", `/api/context-packages/${opportunityId}/items`);
    const fd = new FormData();
    fd.append("file", file);
    xhr.send(fd);
  });
}

export function ContextPackageUploadForm({ opportunityId, initialItems }: Props) {
  const router = useRouter();
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [activeTab, setActiveTab] = useState<"file" | "text" | "note">("file");
  const [textFormKey, setTextFormKey] = useState(0);
  const [noteFormKey, setNoteFormKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (!files.length) return;
      // Reset input so same file can be re-selected after failure
      if (fileInputRef.current) fileInputRef.current.value = "";

      for (const file of files) {
        const pendingId = crypto.randomUUID();
        setPendingItems((prev) => [
          { id: pendingId, name: file.name, status: "uploading", progress: 0, file },
          ...prev,
        ]);

        uploadFileXhr(
          opportunityId,
          file,
          (pct) =>
            setPendingItems((prev) =>
              prev.map((p) => (p.id === pendingId ? { ...p, progress: pct } : p)),
            ),
        )
          .then(() => {
            setPendingItems((prev) => prev.filter((p) => p.id !== pendingId));
            router.refresh();
          })
          .catch((error: unknown) => {
            setPendingItems((prev) =>
              prev.map((p) =>
                p.id === pendingId
                  ? {
                      ...p,
                      status: "failed",
                      progress: 0,
                      errorMessage:
                        error instanceof Error ? error.message : "Upload failed.",
                    }
                  : p,
              ),
            );
          });
      }
    },
    [opportunityId, router],
  );

  const handleRetry = useCallback(
    (pendingId: string) => {
      const item = pendingItems.find((p) => p.id === pendingId);
      if (!item || item.status === "uploading") return;
      setPendingItems((prev) =>
        prev.map((p) =>
          p.id === pendingId
            ? { ...p, status: "uploading", progress: 0, errorMessage: undefined }
            : p,
        ),
      );
      uploadFileXhr(
        opportunityId,
        item.file,
        (pct) =>
          setPendingItems((prev) =>
            prev.map((p) => (p.id === pendingId ? { ...p, progress: pct } : p)),
          ),
      )
        .then(() => {
          setPendingItems((prev) => prev.filter((p) => p.id !== pendingId));
          router.refresh();
        })
        .catch((error: unknown) => {
          setPendingItems((prev) =>
            prev.map((p) =>
              p.id === pendingId
                ? {
                    ...p,
                    status: "failed",
                    progress: 0,
                    errorMessage:
                      error instanceof Error ? error.message : "Upload failed.",
                  }
                : p,
            ),
          );
        });
    },
    [opportunityId, pendingItems, router],
  );

  const handleRemove = useCallback((pendingId: string) => {
    setPendingItems((prev) => prev.filter((p) => p.id !== pendingId));
  }, []);

  const textBoundAction = async (prev: TextFormState, formData: FormData): Promise<TextFormState> => {
    const result = await addTextItemAction({
      opportunityId,
      title: (formData.get("title") as string) || undefined,
      content: formData.get("content") as string,
    });
    if ("error" in result) return { status: "error", message: result.error.message };
    router.refresh();
    setTextFormKey((k) => k + 1);
    return { status: "success" };
  };

  const noteBoundAction = async (prev: NoteFormState, formData: FormData): Promise<NoteFormState> => {
    const result = await addNoteItemAction({
      opportunityId,
      title: formData.get("title") as string,
      content: formData.get("content") as string,
    });
    if ("error" in result) return { status: "error", message: result.error.message };
    router.refresh();
    setNoteFormKey((k) => k + 1);
    return { status: "success" };
  };

  const [textState, textDispatch, textPending] = useActionState<TextFormState, FormData>(
    textBoundAction,
    { status: "idle" },
  );
  const [noteState, noteDispatch, notePending] = useActionState<NoteFormState, FormData>(
    noteBoundAction,
    { status: "idle" },
  );

  const allItems: Array<{ type: "pending"; item: PendingItem } | { type: "confirmed"; item: ContextItem }> = [
    ...pendingItems.map((p) => ({ type: "pending" as const, item: p })),
    ...initialItems.map((i) => ({ type: "confirmed" as const, item: i })),
  ];

  return (
    <div className="context-package-panel">
      {/* Input tabs */}
      <div className="context-package-tabs" role="tablist">
        {(["file", "text", "note"] as const).map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            type="button"
            className={`context-package-tab${activeTab === tab ? " context-package-tab--active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "file" ? "Add file" : tab === "text" ? "Paste text" : "Add note"}
          </button>
        ))}
      </div>

      {/* File upload tab */}
      {activeTab === "file" && (
        <div className="context-package-tab-panel" role="tabpanel">
          <label htmlFor="file-input" className="form-label">
            Upload file
          </label>
          <input
            id="file-input"
            ref={fileInputRef}
            type="file"
            multiple
            className="form-input"
            onChange={handleFileChange}
            aria-describedby="file-hint"
          />
          <p id="file-hint" className="form-hint">
            Maximum 20 MB per file.
          </p>
        </div>
      )}

      {/* Text paste tab */}
      {activeTab === "text" && (
        <form key={textFormKey} action={textDispatch} className="context-package-tab-panel" role="tabpanel" noValidate>
          {textState.status === "error" && (
            <div className="form-error" role="alert">{textState.message}</div>
          )}
          {textState.status === "success" && (
            <div className="form-success" role="status">Text added.</div>
          )}
          <div className="form-field">
            <label htmlFor="text-title" className="form-label">Title (optional)</label>
            <input id="text-title" name="title" type="text" className="form-input" autoComplete="off" />
          </div>
          <div className="form-field">
            <label htmlFor="text-content" className="form-label">
              Content <span aria-hidden="true">*</span>
            </label>
            <textarea
              id="text-content"
              name="content"
              rows={6}
              required
              aria-required="true"
              className="form-input form-textarea"
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="primary-button" disabled={textPending}>
              {textPending ? "Saving…" : "Add text"}
            </button>
          </div>
        </form>
      )}

      {/* Structured note tab */}
      {activeTab === "note" && (
        <form key={noteFormKey} action={noteDispatch} className="context-package-tab-panel" role="tabpanel" noValidate>
          {noteState.status === "error" && (
            <div className="form-error" role="alert">{noteState.message}</div>
          )}
          {noteState.status === "success" && (
            <div className="form-success" role="status">Note added.</div>
          )}
          <div className="form-field">
            <label htmlFor="note-title" className="form-label">
              Title <span aria-hidden="true">*</span>
            </label>
            <input
              id="note-title"
              name="title"
              type="text"
              required
              aria-required="true"
              className="form-input"
              autoComplete="off"
            />
          </div>
          <div className="form-field">
            <label htmlFor="note-content" className="form-label">
              Content <span aria-hidden="true">*</span>
            </label>
            <textarea
              id="note-content"
              name="content"
              rows={6}
              required
              aria-required="true"
              className="form-input form-textarea"
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="primary-button" disabled={notePending}>
              {notePending ? "Saving…" : "Add note"}
            </button>
          </div>
        </form>
      )}

      {/* Items list */}
      <div className="context-items-list">
        {allItems.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">
              No context added yet. Upload a file, paste text, or add a structured note.
            </p>
          </div>
        ) : (
          <ul role="list" className="context-items-ul">
            {allItems.map((entry) =>
              entry.type === "pending" ? (
                <li key={entry.item.id} className="context-items-li">
                  <PendingContextItemCard
                    id={entry.item.id}
                    name={entry.item.name}
                    status={entry.item.status}
                    progress={entry.item.progress}
                    errorMessage={entry.item.errorMessage}
                    onRetry={handleRetry}
                    onRemove={handleRemove}
                  />
                </li>
              ) : (
                <li key={entry.item.id} className="context-items-li">
                  <ConfirmedContextItemCard item={entry.item} />
                </li>
              ),
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
