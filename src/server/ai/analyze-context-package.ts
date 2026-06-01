import { z } from "zod";
import { getAnthropicClient } from "./provider";
import type { ContextItem } from "@/features/context-packages/types";
import type { ScopeItem, ScopeCategory } from "@/features/scope-briefs/types";
import { SCOPE_CATEGORIES } from "@/features/scope-briefs/schemas/scope-brief";
import { evaluateScopeConfidence } from "@/features/scope-briefs/confidence";
import { isSparseInput, mapSourceIndices } from "./analyze-context-package.helpers";

export { isSparseInput } from "./analyze-context-package.helpers";

export type AnalysisResult = {
  sparseInput: boolean;
  scopeConfidence: "Low" | "Medium" | "High";
  items: ScopeItem[];
};

const SYSTEM_PROMPT = `You are a technical scope extraction engine for pre-sales software consulting.
Extract structured scope items from the provided client context material.
Output ONLY valid JSON matching the schema. No explanation, no preamble, no markdown fences.`;

function buildUserPrompt(items: ContextItem[]): string {
  const contextBlocks = items
    .map(
      (item, i) =>
        `[${i + 1}] ${item.sourceType.toUpperCase()}: ${item.title}\n${item.content ?? "(file — no inline content)"}`,
    )
    .join("\n\n");

  return `Analyze the following Context Package items and extract a draft Scope Brief.

CONTEXT ITEMS:
${contextBlocks}

Extract scope items in the following categories: goal, functionalRequirement, nonFunctionalRequirement, integration, constraint, risk, assumption, exclusion, openQuestion.

Rules:
- Only include items supported by the context above.
- Mark "inferred": true for items that are reasonable inferences but have no direct evidence.
- "sourceContextItemIds" should reference the [N] indices above (as strings like "1", "2").
- If the context is too sparse or vague for reliable extraction, set "sparseInput": true.
- Provide "scopeConfidence": "Low" | "Medium" | "High" based on context quality.

Output JSON schema:
{
  "sparseInput": boolean,
  "scopeConfidence": "Low" | "Medium" | "High",
  "items": [
    {
      "category": "goal" | "functionalRequirement" | "nonFunctionalRequirement" | "integration" | "constraint" | "risk" | "assumption" | "exclusion" | "openQuestion",
      "content": "string",
      "inferred": boolean,
      "sourceContextItemIds": ["1", "2"]
    }
  ]
}`;
}

const claudeResponseSchema = z.object({
  sparseInput: z.boolean(),
  scopeConfidence: z.enum(["Low", "Medium", "High"]),
  items: z.array(
    z.object({
      category: z.enum(SCOPE_CATEGORIES),
      content: z.string().min(1),
      inferred: z.boolean(),
      sourceContextItemIds: z.array(z.string()),
    }),
  ),
});

export async function analyzeContextPackage(
  items: ContextItem[],
): Promise<AnalysisResult> {
  if (isSparseInput(items)) {
    return { sparseInput: true, scopeConfidence: "Low", items: [] };
  }

  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(items) }],
  });

  const rawText =
    response.content[0]?.type === "text" ? response.content[0].text : "";

  let parsed: z.infer<typeof claudeResponseSchema>;
  try {
    parsed = claudeResponseSchema.parse(JSON.parse(rawText));
  } catch {
    throw Object.assign(
      new Error("Failed to parse AI response as valid Scope Brief JSON."),
      { code: "PARSE_ERROR" },
    );
  }

  const scopeItems: ScopeItem[] = parsed.items.map((item, idx) => ({
    id: crypto.randomUUID(),
    category: item.category as ScopeCategory,
    content: item.content,
    inferred: item.inferred,
    reviewStatus: "pending" as const,
    sourceContextItemIds: mapSourceIndices(item.sourceContextItemIds, items),
    editedContent: null,
  }));

  return {
    sparseInput: parsed.sparseInput,
    scopeConfidence: evaluateScopeConfidence({
      sparseInput: parsed.sparseInput,
      items: scopeItems,
    }),
    items: scopeItems,
  };
}
