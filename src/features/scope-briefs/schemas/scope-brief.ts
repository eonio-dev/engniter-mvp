import { z } from "zod";

export const SCOPE_CATEGORIES = [
  "goal",
  "functionalRequirement",
  "nonFunctionalRequirement",
  "integration",
  "constraint",
  "risk",
  "assumption",
  "exclusion",
  "openQuestion",
] as const;

export type ScopeCategory = (typeof SCOPE_CATEGORIES)[number];

export const REVIEW_STATUSES = ["pending", "accepted", "rejected", "edited", "flagged"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const SCOPE_CONFIDENCE_LEVELS = ["Low", "Medium", "High"] as const;
export type ScopeConfidence = (typeof SCOPE_CONFIDENCE_LEVELS)[number];

export const scopeItemSchema = z.object({
  id: z.string().min(1),
  category: z.enum(SCOPE_CATEGORIES),
  content: z.string().min(1),
  inferred: z.boolean(),
  reviewStatus: z.enum(REVIEW_STATUSES),
  sourceContextItemIds: z.array(z.string()),
  editedContent: z.string().nullable().optional(),
});

export type ScopeItem = z.infer<typeof scopeItemSchema>;

export const noPromiseOverrideSchema = z.object({
  overriddenByUserId: z.string().min(1),
  overriddenAt: z.string(),
  reason: z.string().min(1),
});

export type NoPromiseOverride = z.infer<typeof noPromiseOverrideSchema>;

export const fitMismatchSchema = z.object({
  criterion: z.string().min(1),
  conflictingItemId: z.string().nullable(),
  reason: z.string().min(1),
});

export type FitMismatch = z.infer<typeof fitMismatchSchema>;

export const scopeBriefSchema = z.object({
  id: z.string().min(1),
  opportunityId: z.string().min(1),
  jobId: z.string().min(1),
  version: z.number().int().min(1),
  status: z.enum(["draft", "approved"]),
  scopeConfidence: z.enum(SCOPE_CONFIDENCE_LEVELS),
  sparseInput: z.boolean(),
  items: z.array(scopeItemSchema),
  createdAt: z.string(),
  createdByJobId: z.string().min(1),
  noPromiseOverride: noPromiseOverrideSchema.nullable().default(null),
  fitMismatches: z.array(fitMismatchSchema).default([]),
  fitCheckedAt: z.string().nullable().default(null),
});

export type ScopeBrief = z.infer<typeof scopeBriefSchema>;

export const updateScopeItemSchema = z.object({
  scopeBriefId: z.string().min(1),
  itemId: z.string().min(1),
  reviewStatus: z.enum(REVIEW_STATUSES),
  editedContent: z.string().optional(),
});

export type UpdateScopeItemInput = z.infer<typeof updateScopeItemSchema>;

export const approveScopeSchema = z.object({
  scopeBriefId: z.string().min(1),
});

export type ApproveScopeInput = z.infer<typeof approveScopeSchema>;

export const overrideNoPromiseSchema = z.object({
  scopeBriefId: z.string().min(1),
  reason: z.string().min(1),
});

export type OverrideNoPromiseInput = z.infer<typeof overrideNoPromiseSchema>;

export const scopeBriefRefSchema = z.object({
  scopeBriefId: z.string().min(1),
});

export type ScopeBriefRefInput = z.infer<typeof scopeBriefRefSchema>;
