"use server";

import { requireRole } from "@/features/auth/server/require-role";
import { getOpportunity } from "@/features/opportunities/server/repository";
import { addTextItemSchema, addNoteItemSchema } from "@/features/context-packages/schemas/context-item";
import { addContextItem } from "@/features/context-packages/server/repository";

type ActionSuccess<T> = { data: T };
type ActionError = { error: { code: string; message: string } };
type ActionResult<T> = ActionSuccess<T> | ActionError;

async function resolveOpportunityAccess(opportunityId: string, uid: string) {
  const opportunity = await getOpportunity(opportunityId);
  if (!opportunity) {
    return { error: { code: "NOT_FOUND", message: "Opportunity not found." } } as ActionError;
  }
  if (opportunity.createdByUserId !== uid) {
    return { error: { code: "FORBIDDEN", message: "You do not have permission to add items to this Opportunity." } } as ActionError;
  }
  return null;
}

export async function addTextItemAction(
  formData: unknown,
): Promise<ActionResult<{ itemId: string }>> {
  const session = await requireRole();

  const parsed = addTextItemSchema.safeParse(formData);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: { code: "VALIDATION_ERROR", message: first?.message ?? "Invalid input." } };
  }

  const accessError = await resolveOpportunityAccess(parsed.data.opportunityId, session.uid);
  if (accessError) return accessError;

  try {
    const itemId = await addContextItem(parsed.data.opportunityId, {
      opportunityId: parsed.data.opportunityId,
      sourceType: "text",
      uploaderId: session.uid,
      title: parsed.data.title,
      content: parsed.data.content,
      storageRef: null,
      storageBucket: null,
      mimeType: null,
      sizeBytes: null,
    });
    return { data: { itemId } };
  } catch {
    return { error: { code: "CREATE_FAILED", message: "Failed to add text item." } };
  }
}

export async function addNoteItemAction(
  formData: unknown,
): Promise<ActionResult<{ itemId: string }>> {
  const session = await requireRole();

  const parsed = addNoteItemSchema.safeParse(formData);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: { code: "VALIDATION_ERROR", message: first?.message ?? "Invalid input." } };
  }

  const accessError = await resolveOpportunityAccess(parsed.data.opportunityId, session.uid);
  if (accessError) return accessError;

  try {
    const itemId = await addContextItem(parsed.data.opportunityId, {
      opportunityId: parsed.data.opportunityId,
      sourceType: "note",
      uploaderId: session.uid,
      title: parsed.data.title,
      content: parsed.data.content,
      storageRef: null,
      storageBucket: null,
      mimeType: null,
      sizeBytes: null,
    });
    return { data: { itemId } };
  } catch {
    return { error: { code: "CREATE_FAILED", message: "Failed to add note." } };
  }
}
