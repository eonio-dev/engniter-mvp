"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { JobStatus } from "@/features/jobs/types";

const TERMINAL_STATUSES: JobStatus[] = ["succeeded", "failed"];

const STATUS_LABELS: Record<JobStatus, string> = {
  queued: "Analysis queued.",
  running: "Analysing context…",
  succeeded: "Analysis complete.",
  failed: "Analysis failed.",
};

type Props = {
  jobId: string;
  initialStatus: JobStatus;
};

export function JobStatusPanel({ jobId, initialStatus }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<JobStatus>(initialStatus);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (TERMINAL_STATUSES.includes(status)) return;

    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        const json = await res.json();
        const newStatus: JobStatus = json.data?.job?.status ?? status;
        setStatus(newStatus);
        if (json.data?.job?.errorMessage) {
          setErrorMessage(json.data.job.errorMessage);
        }
        if (TERMINAL_STATUSES.includes(newStatus)) {
          clearInterval(id);
          router.refresh();
        }
      } catch {
        // Network error — keep polling
      }
    }, 3000);

    return () => clearInterval(id);
  }, [jobId, status, router]);

  return (
    <div className="job-status-panel" aria-live="polite">
      <p className="job-status-text">
        {status !== "succeeded" && status !== "failed" && (
          <span className="job-status-spinner" aria-hidden="true" />
        )}
        {STATUS_LABELS[status]}
      </p>
      {status === "failed" && errorMessage && (
        <p className="job-status-error">{errorMessage}</p>
      )}
    </div>
  );
}
