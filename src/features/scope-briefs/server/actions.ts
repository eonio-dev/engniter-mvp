"use server";

import { requireRole } from "@/features/auth/server/require-role";
import { getOpportunity } from "@/features/opportunities/server/repository";
import { canApproveScopeBrief } from "@/features/scope-briefs/confidence";
import {
  updateScopeItemSchema,
  approveScopeSchema,
  overrideNoPromiseSchema,
  scopeBriefRefSchema,
} from "@/features/scope-briefs/schemas/scope-brief";
import {
  getScopeBrief,
  updateScopeItemInBrief,
  updateScopeBriefStatus,
  setNoPromiseOverride,
  setFitMismatches,
} from "@/features/scope-briefs/server/repository";
import { evaluateFitMismatch } from "@/server/ai/fit-mismatch";

type ActionSuccess<T> = { data: T };
type ActionError = { error: { code: string; message: string } };
type ActionResult<T> = ActionSuccess<T> | ActionError;

async function resolveScopeBriefAccess(scopeBriefId: string, uid: string) {
  const scopeBrief = await getScopeBrief(scopeBriefId);
  if (!scopeBrief) {
    return { error: { code: "NOT_FOUND", message: "Scope Brief not found." } } as ActionError;
  }
  const opportunity = await getOpportunity(scopeBrief.opportunityId);
  if (!opportunity || opportunity.createdByUserId !== uid) {
    return {
      error: { code: "FORBIDDEN", message: "You do not have permission to review this Scope Brief." },
    } as ActionError;
  }
  return { scopeBrief, opportunity } as {
    scopeBrief: NonNullable<Awaited<ReturnType<typeof getScopeBrief>>>;
    opportunity: NonNullable<Awaited<ReturnType<typeof getOpportunity>>>;
  };
}

export async function updateScopeItemAction(
  formData: unknown,
): Promise<ActionResult<{ itemId: string }>> {
  const session = await requireRole();

  const parsed = updateScopeItemSchema.safeParse(formData);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: { code: "VALIDATION_ERROR", message: first?.message ?? "Invalid input." } };
  }

  const access = await resolveScopeBriefAccess(parsed.data.scopeBriefId, session.uid);
  if ("error" in access) return access;

  try {
    await updateScopeItemInBrief(parsed.data.scopeBriefId, parsed.data.itemId, {
      reviewStatus: parsed.data.reviewStatus,
      editedContent: parsed.data.editedContent ?? null,
    });
    return { data: { itemId: parsed.data.itemId } };
  } catch (err) {
    const code = (err as { code?: string }).code ?? "UPDATE_FAILED";
    const message =
      err instanceof Error ? err.message : "Failed to update scope item.";
    return { error: { code, message } };
  }
}

export async function approveScopeBriefAction(
  formData: unknown,
): Promise<ActionResult<{ scopeBriefId: string }>> {
  const session = await requireRole();

  const parsed = approveScopeSchema.safeParse(formData);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: { code: "VALIDATION_ERROR", message: first?.message ?? "Invalid input." } };
  }

  const access = await resolveScopeBriefAccess(parsed.data.scopeBriefId, session.uid);
  if ("error" in access) return access;

  const decision = canApproveScopeBrief(access.scopeBrief);
  if (!decision.allowed) {
    return {
      error: { code: "REVIEW_INCOMPLETE", message: decision.reason ?? "Cannot approve this Scope Brief yet." },
    };
  }

  try {
    await updateScopeBriefStatus(parsed.data.scopeBriefId, "approved");
    return { data: { scopeBriefId: parsed.data.scopeBriefId } };
  } catch (err) {
    const code = (err as { code?: string }).code ?? "UPDATE_FAILED";
    const message =
      err instanceof Error ? err.message : "Failed to approve Scope Brief.";
    return { error: { code, message } };
  }
}

export async function overrideNoPromiseGateAction(
  formData: unknown,
): Promise<ActionResult<{ scopeBriefId: string }>> {
  // TODO(post-MVP collaboration): tighten to requireRole({ allowedRoles: EDITOR_ROLES })
  const session = await requireRole();

  const parsed = overrideNoPromiseSchema.safeParse(formData);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: { code: "VALIDATION_ERROR", message: first?.message ?? "Invalid input." } };
  }

  const access = await resolveScopeBriefAccess(parsed.data.scopeBriefId, session.uid);
  if ("error" in access) return access;

  try {
    await setNoPromiseOverride(parsed.data.scopeBriefId, {
      overriddenByUserId: session.uid,
      overriddenAt: new Date().toISOString(),
      reason: parsed.data.reason,
    });
    return { data: { scopeBriefId: parsed.data.scopeBriefId } };
  } catch (err) {
    const code = (err as { code?: string }).code ?? "UPDATE_FAILED";
    const message =
      err instanceof Error ? err.message : "Failed to override no-promise gate.";
    return { error: { code, message } };
  }
}

export async function clearNoPromiseOverrideAction(
  formData: unknown,
): Promise<ActionResult<{ scopeBriefId: string }>> {
  // TODO(post-MVP collaboration): tighten to requireRole({ allowedRoles: EDITOR_ROLES })
  const session = await requireRole();

  const parsed = scopeBriefRefSchema.safeParse(formData);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: { code: "VALIDATION_ERROR", message: first?.message ?? "Invalid input." } };
  }

  const access = await resolveScopeBriefAccess(parsed.data.scopeBriefId, session.uid);
  if ("error" in access) return access;

  try {
    await setNoPromiseOverride(parsed.data.scopeBriefId, null);
    return { data: { scopeBriefId: parsed.data.scopeBriefId } };
  } catch (err) {
    const code = (err as { code?: string }).code ?? "UPDATE_FAILED";
    const message =
      err instanceof Error ? err.message : "Failed to clear no-promise override.";
    return { error: { code, message } };
  }
}

export async function recheckFitMismatchAction(
  formData: unknown,
): Promise<ActionResult<{ scopeBriefId: string; count: number }>> {
  const session = await requireRole();

  const parsed = scopeBriefRefSchema.safeParse(formData);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: { code: "VALIDATION_ERROR", message: first?.message ?? "Invalid input." } };
  }

  const access = await resolveScopeBriefAccess(parsed.data.scopeBriefId, session.uid);
  if ("error" in access) return access;

  try {
    const mismatches = await evaluateFitMismatch(
      access.opportunity.fitCriteria,
      access.scopeBrief.items.filter((i) => i.reviewStatus !== "rejected"),
    );
    await setFitMismatches(parsed.data.scopeBriefId, mismatches);
    return { data: { scopeBriefId: parsed.data.scopeBriefId, count: mismatches.length } };
  } catch (err) {
    const code = (err as { code?: string }).code ?? "UPDATE_FAILED";
    const message =
      err instanceof Error ? err.message : "Failed to re-check fit.";
    return { error: { code, message } };
  }
}
