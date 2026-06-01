import { z } from "zod";

export const CLARIFICATION_CATEGORIES = [
  "business",
  "scope",
  "integration",
  "nonFunctional",
  "timeline",
  "responsibility",
] as const;

export type ClarificationCategory = (typeof CLARIFICATION_CATEGORIES)[number];

export const CLARIFICATION_PRIORITIES = ["Critical", "High", "Medium", "Low"] as const;
export type ClarificationPriority = (typeof CLARIFICATION_PRIORITIES)[number];

export const CLARIFICATION_STATUSES = ["open", "resolved"] as const;
export type ClarificationStatus = (typeof CLARIFICATION_STATUSES)[number];

export const clarificationQuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().trim().min(1),
  category: z.enum(CLARIFICATION_CATEGORIES),
  priority: z.enum(CLARIFICATION_PRIORITIES),
  cause: z.string().trim().min(1),
  linkedItemId: z.string().nullable(),
});

export type ClarificationQuestion = z.infer<typeof clarificationQuestionSchema>;

export const clarificationPacketSchema = z.object({
  id: z.string().min(1),
  opportunityId: z.string().min(1),
  scopeBriefId: z.string().min(1),
  scopeBriefVersion: z.number().int().min(1),
  generatedAt: z.string(),
  questions: z.array(clarificationQuestionSchema),
});

export type ClarificationPacket = z.infer<typeof clarificationPacketSchema>;

export const generateClarificationPacketSchema = z.object({
  scopeBriefId: z.string().min(1),
});

export type GenerateClarificationPacketInput = z.infer<typeof generateClarificationPacketSchema>;
