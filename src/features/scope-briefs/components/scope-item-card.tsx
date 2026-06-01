"use client";

import { useState, useRef, useCallback } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import type { ScopeItem } from "@/features/scope-briefs/types";
import type { ContextItem } from "@/features/context-packages/types";
import { SourceReferenceDrawer } from "@/features/context-packages/components/source-reference-drawer";
import { updateScopeItemAction } from "@/features/scope-briefs/server/actions";

type Props = {
  item: ScopeItem;
  scopeBriefId: string;
  contextItemsRecord: Record<string, ContextItem>;
};

type ReviewState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export function ScopeItemCard({ item, scopeBriefId, contextItemsRecord }: Props) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeSourceId, setActiveSourceId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState(item.editedContent ?? item.content);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const openDrawer = useCallback((sourceId: string) => {
    setActiveSourceId(sourceId);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setActiveSourceId(null);
    triggerRef.current?.focus();
  }, []);

  const reviewBoundAction = async (
    _prev: ReviewState,
    formData: FormData,
  ): Promise<ReviewState> => {
    const reviewStatus = formData.get("reviewStatus") as string;
    const editedContent = formData.get("editedContent");
    const result = await updateScopeItemAction({
      scopeBriefId,
      itemId: item.id,
      reviewStatus,
      editedContent: editedContent === null ? undefined : (editedContent as string),
    });
    if ("error" in result) {
      return { status: "error", message: result.error.message };
    }
    setEditMode(false);
    router.refresh();
    return { status: "success" };
  };

  const [reviewState, reviewDispatch, isReviewing] = useActionState<ReviewState, FormData>(
    reviewBoundAction,
    { status: "idle" },
  );

  const activeSourceItem = activeSourceId ? contextItemsRecord[activeSourceId] : null;
  const hasSources = item.sourceContextItemIds.length > 0;
  const firstSourceId = item.sourceContextItemIds[0] ?? null;

  const displayContent =
    item.reviewStatus === "edited" ? (item.editedContent ?? item.content) : item.content;

  return (
    <div className="scope-item-card">
      <p className="scope-item-content">{displayContent}</p>

      <div className="scope-item-chips">
        {item.inferred && (
          <span className="chip chip-warning" title="This item was inferred — no direct evidence found in the context.">
            Inferred — no direct evidence
          </span>
        )}
        {item.reviewStatus === "accepted" && <span className="chip chip-success">Accepted</span>}
        {item.reviewStatus === "rejected" && <span className="chip chip-danger">Rejected</span>}
        {item.reviewStatus === "edited" && <span className="chip chip-trust">Edited</span>}
        {item.reviewStatus === "flagged" && <span className="chip chip-warning">Flagged</span>}
        {item.reviewStatus === "pending" && <span className="chip chip-muted">Pending review</span>}
      </div>

      {reviewState.status === "error" && (
        <div className="form-error" role="alert">
          {reviewState.message}
        </div>
      )}

      {editMode ? (
        <form action={reviewDispatch} className="scope-item-edit">
          <input type="hidden" name="reviewStatus" value="edited" />
          <label htmlFor={`edit-${item.id}`} className="form-label">
            Edit scope item
          </label>
          <textarea
            id={`edit-${item.id}`}
            name="editedContent"
            className="form-input form-textarea"
            rows={3}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            required
          />
          <div className="scope-item-review-actions">
            <button
              type="submit"
              className="primary-button"
              disabled={isReviewing || editText.trim().length === 0}
            >
              {isReviewing ? "Saving…" : "Save edit"}
            </button>
            <button
              type="button"
              className="secondary-link"
              onClick={() => {
                setEditMode(false);
                setEditText(item.editedContent ?? item.content);
              }}
              disabled={isReviewing}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="scope-item-review-actions" role="group" aria-label="Review actions">
          {item.reviewStatus === "pending" && (
            <>
              <ReviewButton label="Accept" value="accepted" dispatch={reviewDispatch} disabled={isReviewing} />
              <button
                type="button"
                className="review-button"
                onClick={() => setEditMode(true)}
                disabled={isReviewing}
              >
                Edit
              </button>
              <ReviewButton label="Reject" value="rejected" dispatch={reviewDispatch} disabled={isReviewing} />
              <ReviewButton label="Flag" value="flagged" dispatch={reviewDispatch} disabled={isReviewing} />
            </>
          )}
          {item.reviewStatus === "rejected" && (
            <ReviewButton label="Restore" value="pending" dispatch={reviewDispatch} disabled={isReviewing} />
          )}
          {item.reviewStatus === "edited" && (
            <button
              type="button"
              className="review-button"
              onClick={() => setEditMode(true)}
              disabled={isReviewing}
            >
              Edit again
            </button>
          )}
          {(item.reviewStatus === "accepted" || item.reviewStatus === "flagged") && (
            <ReviewButton label="Change" value="pending" dispatch={reviewDispatch} disabled={isReviewing} />
          )}
        </div>
      )}

      {hasSources && firstSourceId && (
        <div className="scope-item-actions">
          <button
            ref={triggerRef}
            type="button"
            className="source-link"
            aria-expanded={drawerOpen}
            aria-controls="source-reference-drawer"
            onClick={() => openDrawer(firstSourceId)}
          >
            View source
          </button>
          {item.sourceContextItemIds.length > 1 && (
            <span className="context-item-meta">
              +{item.sourceContextItemIds.length - 1} more
            </span>
          )}
        </div>
      )}

      <SourceReferenceDrawer
        item={activeSourceItem ?? undefined}
        isOpen={drawerOpen}
        onClose={closeDrawer}
      />
    </div>
  );
}

type ReviewButtonProps = {
  label: string;
  value: string;
  dispatch: (formData: FormData) => void;
  disabled: boolean;
};

function ReviewButton({ label, value, dispatch, disabled }: ReviewButtonProps) {
  return (
    <form
      action={(formData) => {
        formData.set("reviewStatus", value);
        dispatch(formData);
      }}
    >
      <button type="submit" className="review-button" disabled={disabled}>
        {label}
      </button>
    </form>
  );
}
