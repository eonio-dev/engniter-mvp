"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { recheckFitMismatchAction } from "@/features/scope-briefs/server/actions";

type Props = {
  scopeBriefId: string;
  label?: string;
};

type RecheckState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export function RecheckFitButton({ scopeBriefId, label = "Re-check fit" }: Props) {
  const router = useRouter();

  const recheckBound = async (
    _prev: RecheckState,
    _formData: FormData,
  ): Promise<RecheckState> => {
    const result = await recheckFitMismatchAction({ scopeBriefId });
    if ("error" in result) {
      return { status: "error", message: result.error.message };
    }
    router.refresh();
    return { status: "success" };
  };

  const [state, dispatch, isPending] = useActionState<RecheckState, FormData>(
    recheckBound,
    { status: "idle" },
  );

  return (
    <div className="fit-recheck">
      {state.status === "error" && (
        <div className="form-error" role="alert">
          {state.message}
        </div>
      )}
      <form action={dispatch}>
        <button type="submit" className="secondary-button" disabled={isPending}>
          {isPending ? "Checking…" : label}
        </button>
      </form>
    </div>
  );
}
