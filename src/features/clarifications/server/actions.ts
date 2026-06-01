"use server";

import { requireRole } from "@/features/auth/server/require-role";
import { getOpportunity } from "@/features/opportunities/server/repository";
import { getScopeBrief } from "@/features/scope-briefs/server/repository";
import { generateClarificationPacketSchema } from "@/features/clarifications/schemas/clarification";
import { createClarificationPacket } from "@/features/clarifications/server/repository";
import { generateClarificationQuestions } from "@/server/ai/generate-clarification-packet";

type ActionSuccess<T> = { data: T };
type ActionError = { error: { code: string; message: string } };
type ActionResult<T> = ActionSuccess<T> | ActionError;

export async function generateClarificationPacketAction(
  formData: unknown,
): Promise<ActionResult<{ packetId: string }>> {
  const session = await requireRole();

  const parsed = generateClarificationPacketSchema.safeParse(formData);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: { code: "VALIDATION_ERROR", message: first?.message ?? "Invalid input." } };
  }

  const scopeBrief = await getScopeBrief(parsed.data.scopeBriefId);
  if (!scopeBrief) {
    return { error: { code: "NOT_FOUND", message: "Scope Brief not found." } };
  }

  const opportunity = await getOpportunity(scopeBrief.opportunityId);
  if (!opportunity || opportunity.createdByUserId !== session.uid) {
    return {
      error: {
        code: "FORBIDDEN",
        message: "You do not have permission to generate clarifications for this Scope Brief.",
      },
    };
  }

  if (scopeBrief.sparseInput) {
    return {
      error: {
        code: "VALIDATION_ERROR",
        message:
          "The Context Package is too sparse for trustworthy clarifications. Add more source material first.",
      },
    };
  }

  try {
    const questions = await generateClarificationQuestions(scopeBrief.items);
    const packetId = await createClarificationPacket({
      opportunityId: scopeBrief.opportunityId,
      scopeBriefId: scopeBrief.id,
      scopeBriefVersion: scopeBrief.version,
      questions,
    });
    return { data: { packetId } };
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "CLARIFICATION_FAILED") {
      return {
        error: {
          code,
          message:
            "We couldn't generate the Clarification Packet from the AI provider. Please try again.",
        },
      };
    }
    return {
      error: {
        code: "GENERATION_FAILED",
        message: "Failed to generate the Clarification Packet. Please try again.",
      },
    };
  }
}
