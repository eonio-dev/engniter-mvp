"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import {
  overrideNoPromiseGateAction,
  clearNoPromiseOverrideAction,
} from "@/features/scope-briefs/server/actions";

type Props = {
  scopeBriefId: string;
  hasOverride: boolean;
};

type ControlState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export function NoPromiseOverrideControl({ scopeBriefId, hasOverride }: Props) {
  const router = useRouter();
  const [reason, setReason] = useState("");

  const overrideBound = async (
    _prev: ControlState,
    _formData: FormData,
  ): Promise<ControlState> => {
    const result = await overrideNoPromiseGateAction({ scopeBriefId, reason });
    if ("error" in result) {
      return { status: "error", message: result.error.message };
    }
    setReason("");
    router.refresh();
    return { status: "success" };
  };

  const clearBound = async (
    _prev: ControlState,
    _formData: FormData,
  ): Promise<ControlState> => {
    const result = await clearNoPromiseOverrideAction({ scopeBriefId });
    if ("error" in result) {
      return { status: "error", message: result.error.message };
    }
    router.refresh();
    return { status: "success" };
  };

  const [overrideState, overrideDispatch, overridePending] = useActionState<
    ControlState,
    FormData
  >(overrideBound, { status: "idle" });
  const [clearState, clearDispatch, clearPending] = useActionState<
    ControlState,
    FormData
  >(clearBound, { status: "idle" });

  if (hasOverride) {
    return (
      <div className="no-promise-override">
        {clearState.status === "error" && (
          <div className="form-error" role="alert">
            {clearState.message}
          </div>
        )}
        <form action={clearDispatch}>
          <button type="submit" className="secondary-button" disabled={clearPending}>
            {clearPending ? "Removing…" : "Remove override"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="no-promise-override">
      {overrideState.status === "error" && (
        <div className="form-error" role="alert">
          {overrideState.message}
        </div>
      )}
      <form action={overrideDispatch} className="no-promise-override-form">
        <label htmlFor={`override-reason-${scopeBriefId}`} className="form-label">
          Override reason
        </label>
        <textarea
          id={`override-reason-${scopeBriefId}`}
          className="form-textarea"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Record why the team is acknowledging these risks before proceeding."
          rows={2}
          required
        />
        <button
          type="submit"
          className="secondary-button"
          disabled={overridePending || reason.trim().length === 0}
        >
          {overridePending ? "Saving…" : "Override gate"}
        </button>
      </form>
    </div>
  );
}
