import type { ExperimentPlan } from "./schemas";

// ===========================================================
// "Monday Readiness Score" — composite 0–100 score with four
// transparent sub-scores. Pure function of an ExperimentPlan
// (no LLM call) so it's deterministic and explainable.
// ===========================================================

export type ReadinessSubKey =
  | "protocol_clarity"
  | "materials_availability"
  | "budget_realism"
  | "timeline_feasibility";

export interface ReadinessSubScore {
  key: ReadinessSubKey;
  label: string;
  score: number; // 0–100
  weight: number; // 0–1, sums to 1 across sub-scores
  reasons: string[];
  flags: string[];
}

export interface ReadinessScore {
  overall: number; // 0–100
  band: "ready" | "near_ready" | "needs_work";
  sub_scores: ReadinessSubScore[];
  headline: string; // 1-line judge-quotable summary
}

const KNOWN_SUPPLIERS = new Set([
  "sigma-aldrich",
  "thermo fisher",
  "thermo fisher (nunc)",
  "thermo fisher (nalgene)",
  "thermo fisher nunc",
  "thermo fisher nalgene",
  "neb",
  "promega",
  "qiagen",
  "idt",
  "bio-rad",
  "atcc",
  "addgene",
  "dsmz",
  "the jackson laboratory",
  "jackson laboratory",
  "abcam",
  "cytiva",
  "cytiva (whatman)",
  "eppendorf",
  "metrohm",
  "metrohm dropsens",
  "basi",
  "alfa aesar",
  "lonza",
]);

const VAGUE_PHRASES = [
  /\bperform\s+analysis\b/i,
  /\bmeasure\s+(?:the\s+)?outcome\b/i,
  /\bas\s+needed\b/i,
  /\b(?:appropriate|suitable)\b/i,
  /\bsome\s+amount\b/i,
  /\bfollow\s+(?:standard|appropriate)\s+protocol\b/i,
  /\b(?:tbd|todo|t\.b\.d\.)\b/i,
];

const NUMBER_RE = /\b\d+(?:\.\d+)?\s*(?:%|µ?[gmlMμ]|mol|mM|µM|nM|pM|U|ng|µg|mg|g|kg|kDa|Da|°C|min|h|hr|hrs|s|sec|x|×|nm|µm|mm|cm|m|rpm|×g|g)/i;

// ----------------------- helpers -----------------------------

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}
function pct(n: number) {
  return Math.round(clamp01(n) * 100);
}

// ----------------------- sub-scores --------------------------

function scoreProtocolClarity(plan: ExperimentPlan): ReadinessSubScore {
  const reasons: string[] = [];
  const flags: string[] = [];
  if (plan.protocol.length === 0) {
    return {
      key: "protocol_clarity",
      label: "Protocol Clarity",
      score: 0,
      weight: 0.3,
      reasons: ["No protocol steps generated."],
      flags: ["No protocol"],
    };
  }
  let stepScore = 0;
  let citedSteps = 0;
  let vagueSteps = 0;
  let quantitativeSteps = 0;
  let critParamSteps = 0;

  for (const s of plan.protocol) {
    const text = `${s.title}\n${s.description}`;
    const isVague = VAGUE_PHRASES.some((re) => re.test(text));
    const hasNumber = NUMBER_RE.test(text);
    const hasCrit = (s.critical_parameters?.length ?? 0) > 0;
    const hasCite = (s.citations?.length ?? 0) > 0 || (s.references?.length ?? 0) > 0;

    if (isVague) vagueSteps++;
    if (hasNumber) quantitativeSteps++;
    if (hasCrit) critParamSteps++;
    if (hasCite) citedSteps++;

    let local = 0.4; // baseline for any step
    if (hasNumber) local += 0.2;
    if (hasCrit) local += 0.15;
    if (hasCite) local += 0.2;
    if (text.length > 160) local += 0.05;
    if (isVague) local -= 0.35;
    stepScore += clamp01(local);
  }

  const avg = stepScore / plan.protocol.length;
  if (vagueSteps > 0) flags.push(`${vagueSteps} step(s) contain vague language`);
  if (citedSteps / plan.protocol.length >= 0.6)
    reasons.push(`${citedSteps}/${plan.protocol.length} steps cite a source`);
  else flags.push(`only ${citedSteps}/${plan.protocol.length} steps cite a source`);
  if (quantitativeSteps / plan.protocol.length >= 0.6)
    reasons.push(`${quantitativeSteps}/${plan.protocol.length} steps include quantitative parameters`);
  if (critParamSteps / plan.protocol.length >= 0.5)
    reasons.push(`${critParamSteps}/${plan.protocol.length} steps list critical parameters`);

  return {
    key: "protocol_clarity",
    label: "Protocol Clarity",
    score: pct(avg),
    weight: 0.3,
    reasons,
    flags,
  };
}

function scoreMaterialsAvailability(plan: ExperimentPlan): ReadinessSubScore {
  const reasons: string[] = [];
  const flags: string[] = [];
  if (plan.materials.length === 0) {
    return {
      key: "materials_availability",
      label: "Materials Availability",
      score: 0,
      weight: 0.25,
      reasons: ["No materials in plan."],
      flags: ["No materials"],
    };
  }
  let withCatalog = 0;
  let withSupplier = 0;
  let withUrl = 0;
  let knownSupplier = 0;
  let priced = 0;

  for (const m of plan.materials) {
    if ((m.catalog_number ?? "").trim().length >= 3) withCatalog++;
    if ((m.supplier ?? "").trim()) withSupplier++;
    if (m.url) withUrl++;
    if (KNOWN_SUPPLIERS.has((m.supplier ?? "").trim().toLowerCase())) knownSupplier++;
    if ((m.unit_cost_usd ?? 0) > 0 && (m.total_cost_usd ?? 0) > 0) priced++;
  }
  const n = plan.materials.length;
  const score =
    0.4 * (withCatalog / n) +
    0.2 * (withSupplier / n) +
    0.15 * (withUrl / n) +
    0.15 * (knownSupplier / n) +
    0.1 * (priced / n);

  if (withCatalog === n) reasons.push("All items have catalog numbers");
  else flags.push(`${n - withCatalog}/${n} items missing catalog numbers`);
  if (knownSupplier / n >= 0.7)
    reasons.push(`${knownSupplier}/${n} items from major recognized suppliers`);
  if (withUrl / n >= 0.5) reasons.push(`${withUrl}/${n} items linked to live product pages`);
  if (priced / n < 1) flags.push(`${n - priced}/${n} items missing prices`);

  return {
    key: "materials_availability",
    label: "Materials Availability",
    score: pct(score),
    weight: 0.25,
    reasons,
    flags,
  };
}

function scoreBudgetRealism(plan: ExperimentPlan): ReadinessSubScore {
  const reasons: string[] = [];
  const flags: string[] = [];
  const total = plan.budget.total_usd;
  const linesSum = plan.budget.lines.reduce((s, l) => s + l.cost_usd, 0);
  const consistency = total > 0 ? clamp01(1 - Math.abs(total - linesSum) / total) : 0;
  if (consistency >= 0.97) reasons.push("Budget lines sum to total within 3%");
  else flags.push(`Lines sum (${linesSum.toLocaleString()}) ≠ total (${total.toLocaleString()})`);

  // Personnel coverage: do we have at least one personnel role with ≥0.25 FTE?
  const hasPersonnel = plan.personnel.some((p) => p.fte >= 0.25 && p.weeks >= 1);
  if (hasPersonnel) reasons.push("Personnel cost included");
  else flags.push("Personnel cost missing or under-allocated");

  // Contingency presence
  const cont = plan.budget.contingency_pct;
  const goodCont = cont >= 5 && cont <= 20;
  if (goodCont) reasons.push(`${cont}% contingency in line with norms`);
  else flags.push(`Contingency ${cont}% outside typical 5–20% range`);

  // Per-week burn sanity check (reagents-heavy biomedical work tends to be
  // $1,500–$50,000/week excluding overhead — flag wild extremes).
  const perWeek = total / Math.max(1, plan.timeline.total_weeks);
  const burnOk = perWeek >= 600 && perWeek <= 80_000;
  if (burnOk) reasons.push(`$${Math.round(perWeek).toLocaleString()}/week burn rate is plausible`);
  else flags.push(`$${Math.round(perWeek).toLocaleString()}/week burn rate is unusual`);

  // Categories diversity: typical projects have ≥3 distinct categories
  const cats = new Set(plan.budget.lines.map((l) => l.category.toLowerCase()));
  const diversityOk = cats.size >= 3;
  if (diversityOk) reasons.push(`${cats.size} budget categories covered`);
  else flags.push(`Only ${cats.size} budget categor${cats.size === 1 ? "y" : "ies"}`);

  const score =
    0.3 * consistency +
    0.2 * (hasPersonnel ? 1 : 0) +
    0.15 * (goodCont ? 1 : 0) +
    0.2 * (burnOk ? 1 : 0) +
    0.15 * (diversityOk ? 1 : 0);

  return {
    key: "budget_realism",
    label: "Budget Realism",
    score: pct(score),
    weight: 0.2,
    reasons,
    flags,
  };
}

function scoreTimelineFeasibility(plan: ExperimentPlan): ReadinessSubScore {
  const reasons: string[] = [];
  const flags: string[] = [];
  const total = plan.timeline.total_weeks;
  const phases = plan.timeline.phases;
  if (phases.length === 0 || total <= 0) {
    return {
      key: "timeline_feasibility",
      label: "Timeline Feasibility",
      score: 0,
      weight: 0.25,
      reasons: [],
      flags: ["No timeline phases defined"],
    };
  }
  const phaseNames = new Set(phases.map((p) => p.name));
  let valid = 0;
  let coverageEnd = 0;
  let validDeps = 0;
  let totalDeps = 0;

  for (const p of phases) {
    if (p.start_week >= 1 && p.end_week >= p.start_week && p.end_week <= total) valid++;
    coverageEnd = Math.max(coverageEnd, p.end_week);
    for (const d of p.depends_on ?? []) {
      totalDeps++;
      if (phaseNames.has(d)) validDeps++;
    }
  }
  const validity = valid / phases.length;
  const coverage = clamp01(coverageEnd / total);
  const deps = totalDeps === 0 ? 0.6 : validDeps / totalDeps; // some deps expected
  const phaseDensity = clamp01(phases.length / Math.max(1, Math.ceil(total / 2))); // ~1 phase per 2 weeks
  const hasAnalysis = phases.some((p) => /analy|report|stat/i.test(p.name));

  if (validity === 1) reasons.push("All phases stay within bounds");
  else flags.push(`${phases.length - valid}/${phases.length} phases out of bounds`);
  if (coverage > 0.9) reasons.push("Phases cover the full timeline");
  else flags.push(`Phases only cover ${(coverage * 100).toFixed(0)}% of total weeks`);
  if (totalDeps > 0 && validDeps === totalDeps) reasons.push("All declared dependencies resolve");
  if (hasAnalysis) reasons.push("Includes analysis/reporting phase");
  else flags.push("No analysis or reporting phase declared");

  const score =
    0.35 * validity + 0.2 * coverage + 0.25 * deps + 0.1 * phaseDensity + 0.1 * (hasAnalysis ? 1 : 0);

  return {
    key: "timeline_feasibility",
    label: "Timeline Feasibility",
    score: pct(score),
    weight: 0.25,
    reasons,
    flags,
  };
}

// ----------------------- public ------------------------------

export function computeReadiness(plan: ExperimentPlan): ReadinessScore {
  const subs = [
    scoreProtocolClarity(plan),
    scoreMaterialsAvailability(plan),
    scoreBudgetRealism(plan),
    scoreTimelineFeasibility(plan),
  ];
  const overall = Math.round(subs.reduce((s, x) => s + x.score * x.weight, 0));
  const band: ReadinessScore["band"] =
    overall >= 80 ? "ready" : overall >= 60 ? "near_ready" : "needs_work";
  const headline =
    band === "ready"
      ? "Monday-ready: a senior scientist could start ordering reagents today."
      : band === "near_ready"
      ? "Almost there: a few targeted edits and this plan is executable."
      : "Needs work before a CRO would touch it — see the flagged sub-scores.";
  return { overall, band, sub_scores: subs, headline };
}
