import { z } from "zod";

const createOptionalField = z.string().nullish().transform((value) => value ?? undefined);

export const opportunitySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, "Title is required."),
  technicalOwner: z.string().min(1, "Technical owner is required."),
  clientName: z.string().nullable(),
  projectType: z.string().nullable(),
  estimatedValue: z.string().nullable(),
  proposalDeadline: z.string().nullable(),
  fitCriteria: z.string().nullable(),
  status: z.string().min(1),
  createdByUserId: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Opportunity = z.infer<typeof opportunitySchema>;

export const createOpportunitySchema = z.object({
  title: z.string().min(1, "Title is required."),
  technicalOwner: z.string().min(1, "Technical owner is required."),
  clientName: createOptionalField,
  projectType: createOptionalField,
  estimatedValue: createOptionalField,
  proposalDeadline: createOptionalField,
  fitCriteria: createOptionalField,
});

export type CreateOpportunityInput = z.infer<typeof createOpportunitySchema>;

export const updateOpportunitySchema = z.object({
  opportunityId: z.string().min(1, "Opportunity ID is required."),
  title: z.string().min(1, "Title is required.").optional(),
  technicalOwner: z.string().min(1, "Technical owner is required.").optional(),
  clientName: z.string().nullable().optional(),
  projectType: z.string().nullable().optional(),
  estimatedValue: z.string().nullable().optional(),
  proposalDeadline: z.string().nullable().optional(),
  fitCriteria: z.string().nullable().optional(),
});

export type UpdateOpportunityInput = z.infer<typeof updateOpportunitySchema>;
