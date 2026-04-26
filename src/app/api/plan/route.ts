import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import {
  ExperimentPlanSchema,
  NoveltyResultSchema,
  ScientificIntentSchema,
  type ExperimentPlan,
  type StoredPlan,
} from "@/lib/schemas";
import { llm, llmConfigured, MODEL, safeJsonParse } from "@/lib/llm";
import { PLAN_SYSTEM, PLAN_USER_TEMPLATE } from "@/lib/prompts";
import { searchSuppliers } from "@/data/suppliers";
import { SEED_PLANS } from "@/data/seedPlans";
import { relevantFeedback, savePlan } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PlanRequest {
  hypothesis: string;
  intent: unknown;
  novelty: unknown;
  stream?: boolean;
}

export async function POST(req: Request) {
  const body = (await req.json()) as PlanRequest;
  const intent = ScientificIntentSchema.safeParse(body.intent);
  const novelty = NoveltyResultSchema.safeParse(body.novelty);
  if (!intent.success || !novelty.success) {
    return NextResponse.json(
      { error: "intent + novelty required", intent_issues: intent.success ? null : intent.error.issues, novelty_issues: novelty.success ? null : novelty.error.issues },
      { status: 400 }
    );
  }
  if (!llmConfigured()) {
    return NextResponse.json({ error: "LLM_API_KEY not configured" }, { status: 500 });
  }

  const supplierMatches = searchSuppliers(intent.data.keywords).slice(0, 16);
  const feedback = await relevantFeedback(intent.data.domain, intent.data.keywords, 4);
  const example = SEED_PLANS[0];

  const userPrompt = PLAN_USER_TEMPLATE({
    hypothesis: body.hypothesis,
    intent: intent.data,
    novelty: novelty.data,
    supplier_catalog: supplierMatches,
    feedback_examples: feedback,
    example_plan: example,
  });

  const stream = body.stream !== false;

  if (!stream) {
    const completion = await llm.chat.completions.create({
      model: MODEL,
      temperature: 0.25,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: PLAN_SYSTEM },
        { role: "user", content: userPrompt },
      ],
    });
    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed = safeJsonParse<unknown>(raw);
    const validated = ExperimentPlanSchema.safeParse(parsed);
    if (!validated.success) {
      return NextResponse.json(
        { error: "plan did not match schema", issues: validated.error.issues, raw },
        { status: 422 }
      );
    }
    const stored: StoredPlan = {
      id: nanoid(10),
      hypothesis: body.hypothesis,
      intent: intent.data,
      novelty: novelty.data,
      plan: validated.data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1,
    };
    await savePlan(stored);
    return NextResponse.json({ plan: stored });
  }

  // ---- streaming branch -------------------------------------------------
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };
      try {
        send("status", { stage: "thinking" });

        const completion = await llm.chat.completions.create({
          model: MODEL,
          temperature: 0.25,
          response_format: { type: "json_object" },
          stream: true,
          messages: [
            { role: "system", content: PLAN_SYSTEM },
            { role: "user", content: userPrompt },
          ],
        });

        let buf = "";
        for await (const chunk of completion) {
          const delta = chunk.choices?.[0]?.delta?.content ?? "";
          if (delta) {
            buf += delta;
            send("chunk", { delta, total_len: buf.length });
          }
        }

        send("status", { stage: "validating" });
        const parsed = safeJsonParse<unknown>(buf);
        const validated = ExperimentPlanSchema.safeParse(parsed);
        if (!validated.success) {
          send("error", { error: "plan did not match schema", issues: validated.error.issues, raw: buf });
          controller.close();
          return;
        }

        const plan: ExperimentPlan = validated.data;
        const stored: StoredPlan = {
          id: nanoid(10),
          hypothesis: body.hypothesis,
          intent: intent.data,
          novelty: novelty.data,
          plan,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          version: 1,
        };
        await savePlan(stored);
        send("plan", stored);
        send("done", { ok: true });
        controller.close();
      } catch (e) {
        send("error", { error: e instanceof Error ? e.message : "plan generation failed" });
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
