import Anthropic from "@anthropic-ai/sdk";
import { getServerEnv } from "@/lib/config/env";

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  const apiKey = getServerEnv().ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error("ANTHROPIC_API_KEY is not configured."), {
      code: "CONFIGURATION_ERROR",
    });
  }
  if (!client) {
    client = new Anthropic({ apiKey });
  }
  return client;
}
