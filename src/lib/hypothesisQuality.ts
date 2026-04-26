import type { HypothesisCheckResult, HypothesisQuality } from "./schemas";

// ===========================================================
// Hypothesis quality pre-flight check.
// 4 deterministic checks run on the plain text:
//   1. Specific intervention named
//   2. Measurable outcome with a quantitative threshold
//   3. Mechanistic reason ("due to / because of / via …")
//   4. Implied control / comparator
// Plus an LLM-generated rewrite suggestion (optional).
// ===========================================================

const INTERVENTION_VERBS = [
  /\b(?:replac\w+|substitut\w+|add\w*|introduc\w+|supplement\w*|administer\w+|treat\w+|expos\w+|inhibit\w+|knock\s?out|knock\s?down|overexpres\w+|delete\w*|cultur\w+|incubat\w+|inject\w+|appl\w+|coat\w+|functionaliz\w+|engineer\w+|delivere?r\b|stimulat\w+|combin\w+|fortif\w+)/i,
  /\b(?:will\s+(?:detect|reduce|increase|outperform|fix|measure|achieve|match))/i,
];

const NAMED_ENTITY_RE =
  /\b(?:[A-Z][a-zA-Z\-]+(?:\s+[A-Z][a-zA-Z\-]+)*|[A-Z]{2,}[\d\-A-Z]*|\d+[A-Za-z\-]+|[a-z]+\-\d+)\b/;

const QUANT_THRESHOLD_RE = new RegExp(
  // matches: "at least 30%", "≥0.5 mg/L", "below 10 minutes", "by 15 percentage points",
  // ">=150 mmol/L/day", "by at least 20%", "in 10 minutes", etc.
  String.raw`(?:` +
    String.raw`(?:at\s+least|no\s+less\s+than|≥|>=|>|<|≤|<=|below|under|above|over|by(?:\s+at\s+least)?)` +
    String.raw`\s*\d+(?:\.\d+)?\s*(?:%|percentage\s+points?|pp|µ?[gmlMμ]|mol|mM|µM|nM|pM|U|ng|µg|mg|g|kg|kDa|Da|°C|min|minutes?|h|hr|hrs|hours?|s|sec|x|×|nm|µm|mm|cm|m|rpm|×g|mmol/?L?/?day|fold))|` +
    String.raw`(?:within\s+\d+\s*(?:min|minutes?|h|hours?|s|sec|days?|weeks?))|` +
    String.raw`(?:\d+(?:\.\d+)?\s*(?:%|mg/L|mmol/L|°C)\s*(?:or\s+(?:more|less|higher|lower)|threshold))`,
  "i"
);

const MECHANISM_RE =
  /\b(?:due\s+to|because\s+(?:of|the)|via\s+(?:the\s+)?\w+|through\s+(?:the\s+)?\w+|by\s+(?:way\s+of|means\s+of|virtue\s+of|inhibiting|activating|modulating|disrupting|enhancing|blocking|upregulating|downregulating|binding\s+to)|mediated\s+by|driven\s+by|owing\s+to|as\s+a\s+result\s+of|attributable\s+to)\b/i;

const CONTROL_RE =
  /\b(?:compared\s+(?:to|with|against)|relative\s+to|versus|vs\.?|against|over|standard|conventional|baseline|control(?:s)?|placebo|untreated|sham|wild[-\s]?type|wt\b|benchmark)/i;

function status(condition: boolean, soft = false): "pass" | "warn" | "fail" {
  if (condition) return "pass";
  return soft ? "warn" : "fail";
}

export function analyzeHypothesis(text: string): HypothesisQuality {
  const t = text.trim();

  // 1. Intervention
  const verbMatch = INTERVENTION_VERBS.some((re) => re.test(t));
  const namedEntity = NAMED_ENTITY_RE.test(t);
  const interventionPass = verbMatch && namedEntity && t.length >= 20;
  const intervention: HypothesisCheckResult = {
    id: "intervention",
    label: "Specific intervention named",
    status: status(interventionPass),
    evidence: interventionPass
      ? "An action verb plus a named entity were found."
      : verbMatch
      ? "Action verb found, but no clearly-named entity (compound, organism, device)."
      : "No clear action verb that describes what is being changed.",
    hint: interventionPass
      ? undefined
      : "Name the specific compound, organism, device, or technique you're applying.",
  };

  // 2. Quantitative outcome with threshold
  const quant = QUANT_THRESHOLD_RE.test(t);
  const outcome: HypothesisCheckResult = {
    id: "outcome_threshold",
    label: "Measurable outcome with threshold",
    status: status(quant),
    evidence: quant
      ? "A quantitative threshold (≥, %, mg/L, minutes, etc.) was detected."
      : "No quantitative threshold detected.",
    hint: quant
      ? undefined
      : "Add a measurable target — e.g. 'reduces X by ≥30%' or 'within 10 minutes'.",
  };

  // 3. Mechanism
  const mech = MECHANISM_RE.test(t);
  const mechanism: HypothesisCheckResult = {
    id: "mechanism",
    label: "Mechanistic reason",
    status: status(mech, true),
    evidence: mech
      ? "A causal/mechanistic phrase was found ('due to', 'via', 'mediated by', …)."
      : "No mechanistic explanation detected.",
    hint: mech
      ? undefined
      : "Adding a 'due to …' clause helps the planner pick assays that probe the right mechanism.",
  };

  // 4. Control implied
  const ctrl = CONTROL_RE.test(t);
  const control: HypothesisCheckResult = {
    id: "control",
    label: "Control / comparator implied",
    status: status(ctrl),
    evidence: ctrl
      ? "A comparator phrase was found ('compared to', 'vs', 'standard', 'baseline', …)."
      : "No clear comparator phrase detected.",
    hint: ctrl
      ? undefined
      : "Make the comparison explicit — e.g. 'compared to the standard DMSO protocol'.",
  };

  const checks = [intervention, outcome, mechanism, control];
  // Weighted: intervention 30, outcome 30, control 25, mechanism 15
  const weights: Record<HypothesisCheckResult["id"], number> = {
    intervention: 30,
    outcome_threshold: 30,
    control: 25,
    mechanism: 15,
  };
  const score = checks.reduce((s, c) => {
    const w = weights[c.id];
    if (c.status === "pass") return s + w;
    if (c.status === "warn") return s + w * 0.5;
    return s;
  }, 0);

  return {
    score: Math.round(score),
    checks,
  };
}
