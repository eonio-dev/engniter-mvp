import { z } from "zod";

export const JOB_STATUSES = ["queued", "running", "succeeded", "failed"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const jobSchema = z.object({
  id: z.string().min(1),
  type: z.literal("extract-context-package"),
  opportunityId: z.string().min(1),
  status: z.enum(JOB_STATUSES),
  createdByUserId: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
  errorCode: z.string().nullable(),
  errorMessage: z.string().nullable(),
  resultRef: z.string().nullable(),
});

export type Job = z.infer<typeof jobSchema>;

export const createJobSchema = z.object({
  opportunityId: z.string().min(1),
  type: z.literal("extract-context-package"),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
