import { getAnthropicClient } from "./provider";
import {
  parseClarificationResponse,
  mapClarificationQuestions,
  selectCandidateItems,
} from "./generate-clarification-packet.helpers";
import type { ScopeItem } from "@/features/scope-briefs/types";
import type { ClarificationQuestion } from "@/features/clarifications/types";

const SYSTEM_PROMPT = `You are a discovery-acceleration engine for pre-sales software consulting.
Turn unresolved scope gaps, risks, and missing evidence into a prioritized set of clarification questions a consultant can ask the client before committing externally.
Output ONLY valid JSON matching the schema. No explanation, no preamble, no markdown fences.`;

function buildUserPrompt(items: ScopeItem[]): string {
  const itemBlocks = items
    .map((item, i) => {
      const text = item.editedContent ?? item.content;
      const evidence = item.sourceContextItemIds.length === 0 ? " [no source evidence]" : "";
      return `[${i + 1}] (${item.category}, ${item.reviewStatus})${evidence} ${text}`;
    })
    .join("\n");

  return `Generate clarification questions from the unresolved scope items below.

UNRESOLVED SCOPE ITEMS:
${itemBlocks}

Rules:
- Produce one question per genuine discovery gap. Do not invent gaps that the items do not support.
- "category" must be one of: business, scope, integration, nonFunctional, timeline, responsibility.
- "priority" must be one of: Critical, High, Medium, Low. Assign Critical or High when the unresolved issue could materially change scope commitment, integration feasibility, security or compliance posture, delivery feasibility, or commercial viability.
- "cause" is a short plain-language explanation of why the question matters to scope safety or delivery feasibility.
- "linkedItemIndex" must reference the [N] index of the triggering item above, or null when the question is general.

Output JSON schema:
{
  "questions": [
    {
      "question": "string",
      "category": "business" | "scope" | "integration" | "nonFunctional" | "timeline" | "responsibility",
      "priority": "Critical" | "High" | "Medium" | "Low",
      "cause": "string",
      "linkedItemIndex": number | null
    }
  ]
}`;
}

/**
 * Generates clarification questions from a Scope Brief's unresolved items.
 * Unlike fit-mismatch, this THROWS a coded error on failure so the calling action
 * can surface a retry path and preserve the previously persisted packet (NFR-3).
 */
export async function generateClarificationQuestions(
  items: ScopeItem[],
): Promise<ClarificationQuestion[]> {
  const candidates = selectCandidateItems(items);
  if (candidates.length === 0) {
    return [];
  }

  const client = getAnthropicClient();

  let response;
  try {
    response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(candidates) }],
    });
  } catch {
    throw Object.assign(
      new Error("The Clarification Packet could not reach the AI provider. Please try again."),
      { code: "CLARIFICATION_FAILED" },
    );
  }

  const rawText =
    response.content[0]?.type === "text" ? response.content[0].text : "";

  const parsed = parseClarificationResponse(rawText);
  if (!parsed) {
    throw Object.assign(
      new Error("The Clarification Packet returned an unreadable response. Please try again."),
      { code: "CLARIFICATION_FAILED" },
    );
  }

  return mapClarificationQuestions(parsed, candidates);
}
