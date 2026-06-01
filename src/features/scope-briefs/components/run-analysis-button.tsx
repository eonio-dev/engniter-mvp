"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  opportunityId: string;
};

export function RunAnalysisButton({ opportunityId }: Props) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setIsPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}/analysis`, {
        method: "POST",
      });
      const json = await res.json();
      if ("error" in json) {
        setError(json.error.message ?? "Failed to start analysis.");
        return;
      }
      const jobId = json.data?.jobId;
      router.push(`/opportunities/${opportunityId}/scope-brief?jobId=${jobId}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="run-analysis-wrapper">
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      <button
        type="button"
        className="primary-button"
        disabled={isPending}
        onClick={handleClick}
      >
        {isPending ? "Starting analysis…" : "Run analysis"}
      </button>
    </div>
  );
}
