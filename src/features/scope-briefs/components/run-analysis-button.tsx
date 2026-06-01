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

  async function readErrorMessage(response: Response) {
    const text = await response.text();
    try {
      const json = JSON.parse(text) as { error?: { message?: string }; data?: { jobId?: string } };
      return {
        jobId: json.data?.jobId,
        errorMessage: json.error?.message,
      };
    } catch {
      return {
        jobId: undefined,
        errorMessage: text || `Request failed with status ${response.status}.`,
      };
    }
  }

  async function handleClick() {
    setIsPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}/analysis`, {
        method: "POST",
      });
      const { jobId, errorMessage } = await readErrorMessage(res);
      if (!res.ok) {
        setError(errorMessage ?? "Failed to start analysis.");
        return;
      }
      router.push(`/opportunities/${opportunityId}/scope-brief?jobId=${jobId}`);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Network error. Please try again.",
      );
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
