"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { approveScopeBriefAction } from "@/features/scope-briefs/server/actions";

type Props = {
  scopeBriefId: string;
  pendingCount: number;
  currentStatus: "draft" | "approved";
};

type ApproveState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export function ApproveScopeBriefButton({ scopeBriefId, pendingCount, currentStatus }: Props) {
  const router = useRouter();

  const approveBoundAction = async (
    _prev: ApproveState,
    _formData: FormData,
  ): Promise<ApproveState> => {
    const result = await approveScopeBriefAction({ scopeBriefId });
    if ("error" in result) {
      return { status: "error", message: result.error.message };
    }
    router.refresh();
    return { status: "success" };
  };

  const [state, dispatch, isPending] = useActionState<ApproveState, FormData>(
    approveBoundAction,
    {
      status: "idle",
    },
  );

  if (currentStatus === "approved") {
    return (
      <div className="scope-brief-approve" role="status">
        <span className="chip chip-success">Scope Brief approved ✓</span>
      </div>
    );
  }

  const blocked = pendingCount > 0;

  return (
    <div className="scope-brief-approve">
      {state.status === "error" && (
        <div className="form-error" role="alert">
          {state.message}
        </div>
      )}
      <form action={dispatch}>
        <button type="submit" className="primary-button" disabled={blocked || isPending}>
          {isPending ? "Approving…" : "Approve Scope Brief"}
        </button>
      </form>
      {blocked && (
        <p className="form-hint" role="status">
          {pendingCount} item(s) still need review.
        </p>
      )}
    </div>
  );
}
