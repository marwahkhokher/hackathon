import { NextResponse } from "next/server";
import {
  ScientificIntentSchema,
  type ScientificIntent,
} from "@/lib/schemas";
import { jsonCompletion, llmConfigured, MODEL_FAST } from "@/lib/llm";
import { INTENT_SYSTEM, INTENT_USER_TEMPLATE } from "@/lib/prompts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { hypothesis } = (await req.json()) as { hypothesis?: string };
  if (!hypothesis || hypothesis.trim().length < 10) {
    return NextResponse.json({ error: "hypothesis is required (min 10 chars)" }, { status: 400 });
  }

  if (!llmConfigured()) {
    return NextResponse.json({ error: "LLM_API_KEY not configured" }, { status: 500 });
  }

  try {
    const raw = await jsonCompletion<unknown>({
      system: INTENT_SYSTEM,
      user: INTENT_USER_TEMPLATE(hypothesis),
      model: MODEL_FAST,
      temperature: 0.1,
    });
    const parsed = ScientificIntentSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "intent did not match schema", issues: parsed.error.issues, raw },
        { status: 422 }
      );
    }
    const intent: ScientificIntent = parsed.data;
    return NextResponse.json({ intent });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "intent extraction failed" },
      { status: 500 }
    );
  }
}
