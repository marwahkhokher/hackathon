import { NextResponse } from "next/server";
import {
  NoveltyResultSchema,
  ScientificIntentSchema,
  type Reference,
} from "@/lib/schemas";
import { jsonCompletion, llmConfigured, MODEL_FAST } from "@/lib/llm";
import { NOVELTY_SYSTEM, NOVELTY_USER_TEMPLATE } from "@/lib/prompts";
import { tavilyLiteratureSearch } from "@/lib/tavily";
import { s2Search } from "@/lib/semanticScholar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json();
  const intent = ScientificIntentSchema.safeParse(body?.intent);
  if (!intent.success) {
    return NextResponse.json({ error: "valid intent required" }, { status: 400 });
  }

  // Build a focused query from the structured intent.
  const query =
    `${intent.data.intervention} vs ${intent.data.comparator} ` +
    `in ${intent.data.model_system} ` +
    `outcome:${intent.data.outcome.metric}`;

  // Run Tavily + S2 in parallel for speed.
  const [tavRefs, s2Refs] = await Promise.all([
    tavilyLiteratureSearch(query),
    s2Search(query, 5),
  ]);

  // Dedup by URL/DOI/title.
  const seen = new Set<string>();
  const merged: Reference[] = [];
  for (const r of [...s2Refs, ...tavRefs]) {
    const key = (r.doi || r.url || r.title).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(r);
    if (merged.length >= 8) break;
  }

  if (merged.length === 0) {
    // Graceful fallback if both backends are unavailable.
    return NextResponse.json({
      novelty: {
        status: "not_found",
        rationale:
          "No external literature backends available (TAVILY_API_KEY missing and Semantic Scholar unreachable). Treating as 'not found' for now — please configure literature search.",
        references: [],
        query_used: query,
      },
    });
  }

  if (!llmConfigured()) {
    return NextResponse.json({
      novelty: {
        status: "similar_work_exists",
        rationale: "LLM not configured — returning raw retrieval results without classification.",
        references: merged.slice(0, 3),
        query_used: query,
      },
    });
  }

  try {
    const decision = await jsonCompletion<{
      status: "not_found" | "similar_work_exists" | "exact_match_found";
      rationale: string;
      selected_indices: number[];
    }>({
      system: NOVELTY_SYSTEM,
      user: NOVELTY_USER_TEMPLATE(intent.data, merged),
      model: MODEL_FAST,
      temperature: 0.1,
    });

    const picked = (decision.selected_indices ?? [])
      .map((i) => merged[i - 1])
      .filter(Boolean)
      .slice(0, 3);

    const novelty = NoveltyResultSchema.parse({
      status: decision.status,
      rationale: decision.rationale,
      references: picked.length ? picked : merged.slice(0, 3),
      query_used: query,
    });
    return NextResponse.json({ novelty });
  } catch (e) {
    return NextResponse.json(
      {
        novelty: {
          status: "similar_work_exists",
          rationale: `Classifier failed (${
            e instanceof Error ? e.message : "unknown"
          }); returning top retrieved references.`,
          references: merged.slice(0, 3),
          query_used: query,
        },
      },
      { status: 200 }
    );
  }
}
