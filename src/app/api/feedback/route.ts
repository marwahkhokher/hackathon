import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { addFeedback, getPlan, listFeedback, savePlan } from "@/lib/store";
import { FeedbackEntrySchema, ExperimentPlanSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ feedback: await listFeedback() });
}

export async function POST(req: Request) {
  const body = await req.json();

  // Two shapes accepted:
  // (a) { plan_id, section, original, correction, rating, scientist?, hypothesis, domain }
  // (b) { plan_id, edited_plan }  -> persists edits + records a structured note
  if (body?.edited_plan) {
    const stored = await getPlan(body.plan_id);
    if (!stored) return NextResponse.json({ error: "plan not found" }, { status: 404 });
    const validated = ExperimentPlanSchema.safeParse(body.edited_plan);
    if (!validated.success) {
      return NextResponse.json(
        { error: "edited plan did not match schema", issues: validated.error.issues },
        { status: 422 }
      );
    }
    stored.plan = validated.data;
    stored.version += 1;
    stored.updated_at = new Date().toISOString();
    await savePlan(stored);
    return NextResponse.json({ ok: true, plan: stored });
  }

  const entry = FeedbackEntrySchema.safeParse({
    id: nanoid(10),
    created_at: new Date().toISOString(),
    ...body,
  });
  if (!entry.success) {
    return NextResponse.json(
      { error: "invalid feedback", issues: entry.error.issues },
      { status: 400 }
    );
  }
  await addFeedback(entry.data);
  return NextResponse.json({ ok: true, feedback: entry.data });
}
