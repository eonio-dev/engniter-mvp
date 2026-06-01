"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { generateClarificationPacketAction } from "@/features/clarifications/server/actions";

type Props = {
  scopeBriefId: string;
  label?: string;
};

type GenerateState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export function GenerateClarificationPacketButton({
  scopeBriefId,
  label = "Generate clarifications",
}: Props) {
  const router = useRouter();

  const generateBound = async (
    _prev: GenerateState,
    _formData: FormData,
  ): Promise<GenerateState> => {
    const result = await generateClarificationPacketAction({ scopeBriefId });
    if ("error" in result) {
      return { status: "error", message: result.error.message };
    }
    router.refresh();
    return { status: "success" };
  };

  const [state, dispatch, isPending] = useActionState<GenerateState, FormData>(
    generateBound,
    { status: "idle" },
  );

  return (
    <div className="clarification-generate">
      {state.status === "error" && (
        <div className="form-error" role="alert">
          {state.message}
        </div>
      )}
      <form action={dispatch}>
        <button type="submit" className="secondary-button" disabled={isPending}>
          {isPending ? "Generating…" : label}
        </button>
      </form>
    </div>
  );
}
