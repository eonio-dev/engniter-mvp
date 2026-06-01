import { getAnthropicClient } from "./provider";
import {
  parseFitMismatchResponse,
  mapFitMismatches,
} from "./fit-mismatch.helpers";
import type { ScopeItem, FitMismatch } from "@/features/scope-briefs/types";

const SYSTEM_PROMPT = `You are a fit-assessment engine for pre-sales software consulting.
Compare a client's stated fit criteria against the extracted scope items and surface concrete mismatches.
Output ONLY valid JSON matching the schema. No explanation, no preamble, no markdown fences.`;

function buildUserPrompt(fitCriteria: string, items: ScopeItem[]): string {
  const itemBlocks = items
    .map((item, i) => {
      const text = item.editedContent ?? item.content;
      return `[${i + 1}] (${item.category}) ${text}`;
    })
    .join("\n");

  return `Assess whether the extracted scope conflicts with the client's fit criteria.

FIT CRITERIA:
${fitCriteria}

SCOPE ITEMS:
${itemBlocks}

Rules:
- Only report genuine mismatches where a scope item conflicts with or undermines a fit criterion.
- "conflictingItemIndex" should reference a [N] index above, or null when the mismatch is general.
- "reason" must be a short plain-language explanation a consultant can act on.
- If there are no mismatches, return an empty "mismatches" array.

Output JSON schema:
{
  "mismatches": [
    {
      "criterion": "string",
      "conflictingItemIndex": number | null,
      "reason": "string"
    }
  ]
}`;
}

export async function evaluateFitMismatch(
  fitCriteria: string | null,
  items: ScopeItem[],
): Promise<FitMismatch[]> {
  if (!fitCriteria || fitCriteria.trim().length === 0 || items.length === 0) {
    return [];
  }

  const client = getAnthropicClient();

  let response;
  try {
    response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(fitCriteria, items) }],
    });
  } catch {
    throw Object.assign(
      new Error("The fit check could not reach the AI provider. Please try again."),
      { code: "FIT_CHECK_FAILED" },
    );
  }

  const rawText =
    response.content[0]?.type === "text" ? response.content[0].text : "";

  const parsed = parseFitMismatchResponse(rawText);
  if (!parsed) {
    throw Object.assign(
      new Error("The fit check returned an unreadable response. Please try again."),
      { code: "FIT_CHECK_FAILED" },
    );
  }

  return mapFitMismatches(parsed, items);
}
