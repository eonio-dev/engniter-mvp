"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/features/auth/server/require-role";
import { createOpportunitySchema, updateOpportunitySchema } from "@/features/opportunities/schemas/opportunity";
import {
  createOpportunity,
  getOpportunity,
  updateOpportunity,
} from "@/features/opportunities/server/repository";

type ActionSuccess<T> = { data: T };
type ActionError = { error: { code: string; message: string } };
type ActionResult<T> = ActionSuccess<T> | ActionError;

export async function createOpportunityAction(
  formData: unknown,
): Promise<ActionResult<{ opportunityId: string }>> {
  const session = await requireRole();

  const parsed = createOpportunitySchema.safeParse(formData);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      error: {
        code: "VALIDATION_ERROR",
        message: first?.message ?? "Invalid input.",
      },
    };
  }

  try {
    const opportunityId = await createOpportunity({
      ...parsed.data,
      createdByUserId: session.uid,
    });
    return { data: { opportunityId } };
  } catch {
    return {
      error: { code: "CREATE_FAILED", message: "Failed to create opportunity." },
    };
  }
}

export async function updateOpportunityAction(
  formData: unknown,
): Promise<ActionResult<{ opportunityId: string }>> {
  const session = await requireRole();

  const parsed = updateOpportunitySchema.safeParse(formData);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      error: {
        code: "VALIDATION_ERROR",
        message: first?.message ?? "Invalid input.",
      },
    };
  }

  const { opportunityId, ...updates } = parsed.data;

  const existing = await getOpportunity(opportunityId);
  if (!existing) {
    return { error: { code: "NOT_FOUND", message: "Opportunity not found." } };
  }

  if (existing.createdByUserId !== session.uid) {
    return { error: { code: "FORBIDDEN", message: "You do not have permission to edit this Opportunity." } };
  }

  try {
    await updateOpportunity(opportunityId, updates);
    return { data: { opportunityId } };
  } catch {
    return {
      error: { code: "UPDATE_FAILED", message: "Failed to update opportunity." },
    };
  }
}
