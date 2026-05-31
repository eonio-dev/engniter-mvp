import { z } from "zod";

export const SOURCE_TYPES = ["file", "text", "note"] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const contextItemSchema = z.object({
  id: z.string().min(1),
  opportunityId: z.string().min(1),
  sourceType: z.enum(SOURCE_TYPES),
  uploaderId: z.string().min(1),
  title: z.string().min(1),
  content: z.string().nullable(),
  storageRef: z.string().nullable(),
  storageBucket: z.string().nullable(),
  mimeType: z.string().nullable(),
  sizeBytes: z.number().int().nonnegative().nullable(),
  createdAt: z.string(),
});

export type ContextItem = z.infer<typeof contextItemSchema>;

export const addTextItemSchema = z.object({
  opportunityId: z.string().min(1),
  title: z.string().min(1).optional().default("Pasted text"),
  content: z.string().min(1, "Content is required."),
});

export type AddTextItemInput = z.infer<typeof addTextItemSchema>;

export const addNoteItemSchema = z.object({
  opportunityId: z.string().min(1),
  title: z.string().min(1, "Title is required."),
  content: z.string().min(1, "Content is required."),
});

export type AddNoteItemInput = z.infer<typeof addNoteItemSchema>;

export const addFileItemSchema = z.object({
  opportunityId: z.string().min(1),
  title: z.string().min(1),
  storageRef: z.string().min(1),
  storageBucket: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
});

export type AddFileItemInput = z.infer<typeof addFileItemSchema>;
