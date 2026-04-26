import { z } from "zod";

// ===========================================================
// Structured scientific intent — extracted from the user's
// natural language hypothesis.
// ===========================================================

export const ScientificIntentSchema = z.object({
  domain: z.enum([
    "biomedical",
    "diagnostics",
    "cell_biology",
    "microbiology",
    "chemistry",
    "materials",
    "climate",
    "energy",
    "neuroscience",
    "agriculture",
    "other",
  ]),
  hypothesis_restated: z.string(),
  intervention: z.string(),
  comparator: z.string(),
  outcome: z.object({
    name: z.string(),
    metric: z.string(),
    threshold: z.string().optional(),
    direction: z.enum(["increase", "decrease", "no_change", "match"]).optional(),
  }),
  variables: z.object({
    independent: z.array(z.string()),
    dependent: z.array(z.string()),
    controlled: z.array(z.string()),
  }),
  model_system: z.string(),
  constraints: z.array(z.string()),
  ethics_flags: z.array(z.string()),
  keywords: z.array(z.string()),
});
export type ScientificIntent = z.infer<typeof ScientificIntentSchema>;

// ===========================================================
// Literature QC
// ===========================================================

export const NoveltyStatus = z.enum([
  "not_found",
  "similar_work_exists",
  "exact_match_found",
]);
export type NoveltyStatusT = z.infer<typeof NoveltyStatus>;

export const ReferenceSchema = z.object({
  title: z.string(),
  authors: z.array(z.string()).default([]),
  year: z.number().int().optional(),
  venue: z.string().optional(),
  url: z.string().url().optional(),
  doi: z.string().optional(),
  relevance: z.string(),
  similarity: z.number().min(0).max(1).optional(),
  source: z.enum(["semantic_scholar", "tavily", "arxiv", "manual"]).default("tavily"),
});
export type Reference = z.infer<typeof ReferenceSchema>;

export const NoveltyResultSchema = z.object({
  status: NoveltyStatus,
  rationale: z.string(),
  references: z.array(ReferenceSchema).max(8),
  query_used: z.string(),
});
export type NoveltyResult = z.infer<typeof NoveltyResultSchema>;

// ===========================================================
// Experiment plan — the main deliverable
// ===========================================================

export const MaterialSchema = z.object({
  name: z.string(),
  category: z.enum([
    "reagent",
    "consumable",
    "equipment",
    "biological",
    "kit",
    "service",
    "other",
  ]),
  supplier: z.string(),
  catalog_number: z.string().optional(),
  url: z.string().url().optional(),
  quantity: z.string(),
  unit_cost_usd: z.number().nonnegative(),
  total_cost_usd: z.number().nonnegative(),
  notes: z.string().optional(),
});
export type Material = z.infer<typeof MaterialSchema>;

export const ProtocolCitationSchema = z.object({
  label: z.string(), // e.g. "protocols.io: Trypan blue assay"
  url: z.string().url().optional(),
  doi: z.string().optional(),
  source: z
    .enum(["protocols.io", "bio-protocol", "nature_protocols", "jove", "openwetware", "pubmed", "doi", "other"])
    .default("other"),
});
export type ProtocolCitation = z.infer<typeof ProtocolCitationSchema>;

export const ProtocolStepSchema = z.object({
  id: z.string(),
  phase: z.string(),
  title: z.string(),
  duration: z.string(),
  description: z.string(),
  critical_parameters: z.array(z.string()).default([]),
  safety_notes: z.array(z.string()).default([]),
  references: z.array(z.string()).default([]),
  citations: z.array(ProtocolCitationSchema).default([]),
});
export type ProtocolStep = z.infer<typeof ProtocolStepSchema>;

export const TimelinePhaseSchema = z.object({
  name: z.string(),
  duration: z.string(),
  start_week: z.number(),
  end_week: z.number(),
  deliverables: z.array(z.string()),
  depends_on: z.array(z.string()).default([]),
});
export type TimelinePhase = z.infer<typeof TimelinePhaseSchema>;

export const BudgetLineSchema = z.object({
  category: z.string(),
  description: z.string(),
  cost_usd: z.number().nonnegative(),
});
export type BudgetLine = z.infer<typeof BudgetLineSchema>;

export const ValidationCriterionSchema = z.object({
  name: z.string(),
  measurement: z.string(),
  success_threshold: z.string(),
  failure_mode: z.string(),
  statistical_test: z.string().optional(),
  sample_size: z.string().optional(),
});
export type ValidationCriterion = z.infer<typeof ValidationCriterionSchema>;

export const PersonnelRoleSchema = z.object({
  role: z.string(),
  fte: z.number(),
  weeks: z.number(),
  responsibilities: z.array(z.string()),
});
export type PersonnelRole = z.infer<typeof PersonnelRoleSchema>;

export const AlternativeApproachSchema = z.object({
  name: z.string(),
  description: z.string(),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  est_total_cost_usd: z.number().nonnegative(),
  est_timeline_weeks: z.number().positive(),
  est_success_probability: z.number().min(0).max(1).optional(),
  recommendation: z.enum(["primary", "alternative", "not_recommended"]).default("alternative"),
});
export type AlternativeApproach = z.infer<typeof AlternativeApproachSchema>;

export const ExperimentPlanSchema = z.object({
  title: z.string(),
  summary: z.string(),
  intent: ScientificIntentSchema,
  controls: z.array(
    z.object({
      type: z.enum(["positive", "negative", "vehicle", "sham", "baseline", "other"]),
      description: z.string(),
    })
  ),
  protocol: z.array(ProtocolStepSchema),
  materials: z.array(MaterialSchema),
  timeline: z.object({
    total_weeks: z.number(),
    phases: z.array(TimelinePhaseSchema),
  }),
  personnel: z.array(PersonnelRoleSchema),
  budget: z.object({
    total_usd: z.number().nonnegative(),
    currency: z.literal("USD"),
    lines: z.array(BudgetLineSchema),
    contingency_pct: z.number().min(0).max(100),
  }),
  validation: z.array(ValidationCriterionSchema),
  risks: z.array(
    z.object({
      risk: z.string(),
      likelihood: z.enum(["low", "medium", "high"]),
      impact: z.enum(["low", "medium", "high"]),
      mitigation: z.string(),
    })
  ),
  assumptions: z.array(z.string()),
  why_this_plan: z.array(z.string()),
  citations: z.array(ReferenceSchema).default([]),
  alternatives: z.array(AlternativeApproachSchema).default([]),
});
export type ExperimentPlan = z.infer<typeof ExperimentPlanSchema>;

// ===========================================================
// Scientist feedback — captured corrections per section
// ===========================================================

export const FeedbackEntrySchema = z.object({
  id: z.string(),
  plan_id: z.string(),
  hypothesis: z.string(),
  domain: z.string(),
  section: z.enum([
    "protocol",
    "materials",
    "budget",
    "timeline",
    "validation",
    "controls",
    "general",
  ]),
  original: z.string(),
  correction: z.string(),
  rating: z.number().int().min(1).max(5),
  scientist: z.string().optional(),
  created_at: z.string(),
});
export type FeedbackEntry = z.infer<typeof FeedbackEntrySchema>;

// ===========================================================
// Hypothesis pre-flight quality check
// ===========================================================

export const HypothesisCheckIdSchema = z.enum([
  "intervention",
  "outcome_threshold",
  "mechanism",
  "control",
]);
export type HypothesisCheckId = z.infer<typeof HypothesisCheckIdSchema>;

export const HypothesisCheckSchema = z.object({
  id: HypothesisCheckIdSchema,
  label: z.string(),
  status: z.enum(["pass", "warn", "fail"]),
  evidence: z.string(),
  hint: z.string().optional(),
});
export type HypothesisCheckResult = z.infer<typeof HypothesisCheckSchema>;

export const HypothesisQualitySchema = z.object({
  score: z.number().min(0).max(100),
  checks: z.array(HypothesisCheckSchema),
  improved_version: z.string().optional(),
  rationale: z.string().optional(),
});
export type HypothesisQuality = z.infer<typeof HypothesisQualitySchema>;

export const StoredPlanSchema = z.object({
  id: z.string(),
  hypothesis: z.string(),
  intent: ScientificIntentSchema,
  novelty: NoveltyResultSchema,
  plan: ExperimentPlanSchema,
  created_at: z.string(),
  updated_at: z.string(),
  version: z.number().int().default(1),
});
export type StoredPlan = z.infer<typeof StoredPlanSchema>;
