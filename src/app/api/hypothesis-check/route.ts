import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeHypothesis } from "@/lib/hypothesisQuality";
import { jsonCompletion, llmConfigured, MODEL_FAST } from "@/lib/llm";
import { HYPOTHESIS_REWRITE_SYSTEM, HYPOTHESIS_REWRITE_USER } from "@/lib/prompts";
import { HypothesisQualitySchema } from "@/lib/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RewriteRespSchema = z.object({
  improved_version: z.string().min(8),
  rationale: z.string().optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const text: string = (body?.hypothesis ?? "").toString();
  const wantRewrite: boolean = Boolean(body?.rewrite);

  if (text.trim().length < 10) {
    return NextResponse.json(
      { error: "hypothesis is required (min 10 chars)" },
      { status: 400 }
    );
  }

  const quality = analyzeHypothesis(text);

  // Optionally call the LLM to rewrite if any check failed/warned and a key is configured.
  let improved_version: string | undefined;
  let rationale: string | undefined;
  const failed = quality.checks.filter((c) => c.status !== "pass").map((c) => c.id);
  if (wantRewrite && failed.length > 0 && llmConfigured()) {
    try {
      const r = await jsonCompletion<unknown>({
        system: HYPOTHESIS_REWRITE_SYSTEM,
        user: HYPOTHESIS_REWRITE_USER(text, failed),
        model: MODEL_FAST,
        temperature: 0.3,
      });
      const parsed = RewriteRespSchema.safeParse(r);
      if (parsed.success) {
        improved_version = parsed.data.improved_version;
        rationale = parsed.data.rationale;
      }
    } catch {
      // non-fatal — return the deterministic checks anyway
    }
  }

  const out = HypothesisQualitySchema.parse({
    ...quality,
    improved_version,
    rationale,
  });
  return NextResponse.json({ quality: out });
}
