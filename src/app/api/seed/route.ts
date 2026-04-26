import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { SEED_DEMO_HYPOTHESIS, SEED_PLANS } from "@/data/seedPlans";
import { savePlan } from "@/lib/store";
import type { StoredPlan } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST() {
  const plan = SEED_PLANS[0];
  const stored: StoredPlan = {
    id: nanoid(10),
    hypothesis: SEED_DEMO_HYPOTHESIS,
    intent: plan.intent,
    novelty: {
      status: "similar_work_exists",
      rationale:
        "Trehalose has been studied as a cryoprotectant for various cell types, but matched 3-arm comparisons against DMSO with the specific 0.3 M trehalose + 5% DMSO formulation in HeLa at the 15 pp threshold are not common.",
      references: [
        {
          title:
            "Trehalose as a cryoprotectant: a review of physical and biological properties",
          authors: ["Crowe LM", "Crowe JH"],
          year: 1992,
          venue: "Cryobiology",
          url: "https://doi.org/10.1016/0011-2240(92)90033-X",
          doi: "10.1016/0011-2240(92)90033-X",
          relevance:
            "Mechanistic basis for trehalose membrane stabilization at low temperatures.",
          source: "manual",
        },
        {
          title: "Loading mammalian cells with trehalose by intracellular delivery",
          authors: ["Eroglu A", "et al."],
          year: 2000,
          venue: "Nature Biotechnology",
          url: "https://www.nature.com/articles/nbt0200_163",
          relevance:
            "Demonstrates trehalose can improve mammalian cell cryopreservation outcomes.",
          source: "manual",
        },
      ],
      query_used:
        "trehalose vs DMSO cryoprotectant HeLa post-thaw viability percentage",
    },
    plan,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  };
  await savePlan(stored);
  return NextResponse.json({ plan: stored });
}
