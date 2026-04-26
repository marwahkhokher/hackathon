import OpenAI from "openai";

// ===========================================================
// Single LLM client. Works with any OpenAI-compatible endpoint
// (OpenAI, OpenRouter, Together, Groq, Cursor proxy, etc).
// ===========================================================

const apiKey = process.env.LLM_API_KEY ?? process.env.OPENAI_API_KEY ?? "";
const baseURL =
  process.env.LLM_BASE_URL ?? process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";

export const llm = new OpenAI({
  apiKey: apiKey || "missing-key",
  baseURL,
});

export const MODEL = process.env.LLM_MODEL ?? "gpt-4o-mini";
export const MODEL_FAST = process.env.LLM_MODEL_FAST ?? MODEL;

export function llmConfigured(): boolean {
  return Boolean(apiKey);
}

/** Robust JSON parse for LLM output that sometimes fences or trails text. */
export function safeJsonParse<T = unknown>(raw: string): T | null {
  if (!raw) return null;
  let s = raw.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  }
  // Find the largest balanced JSON block
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    s = s.slice(first, last + 1);
  }
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

/** Strict JSON completion with retry on parse failure. */
export async function jsonCompletion<T>({
  system,
  user,
  model = MODEL,
  temperature = 0.2,
  retries = 1,
}: {
  system: string;
  user: string;
  model?: string;
  temperature?: number;
  retries?: number;
}): Promise<T> {
  let attempt = 0;
  let lastErr = "";
  while (attempt <= retries) {
    const res = await llm.chat.completions.create({
      model,
      temperature,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    const raw = res.choices[0]?.message?.content ?? "";
    const parsed = safeJsonParse<T>(raw);
    if (parsed) return parsed;
    lastErr = raw.slice(0, 500);
    attempt++;
  }
  throw new Error(`LLM did not return valid JSON. Last output: ${lastErr}`);
}
