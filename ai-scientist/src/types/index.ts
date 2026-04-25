export interface StructuredHypothesis {
  original_text: string;
  domain: string;
  independent_variable: string;
  dependent_variable: string;
  intervention: string;
  expected_outcome: string;
  mechanism: string;
  control_condition: string;
  constraints: string[];
  measurement_method: string;
}

export interface LiteratureResult {
  novelty_status: 'Not Found' | 'Similar Work Exists' | 'Exact Match Found';
  summary: string;
  references: LiteratureReference[];
  search_queries_used: string[];
}

export interface LiteratureReference {
  title: string;
  authors: string;
  year: string;
  source: string;
  url: string;
  relevance: string;
}

export interface ProtocolStep {
  step_number: number;
  title: string;
  description: string;
  duration: string;
  critical_notes: string[];
  equipment_needed: string[];
}

export interface MaterialItem {
  name: string;
  catalog_number: string;
  supplier: string;
  quantity: string;
  unit_price: string;
  total_price: string;
  category: 'reagent' | 'consumable' | 'equipment' | 'biological' | 'other';
}

export interface BudgetCategory {
  category: string;
  items: MaterialItem[];
  subtotal: string;
}

export interface TimelinePhase {
  phase: string;
  duration: string;
  start_week: number;
  end_week: number;
  tasks: string[];
  dependencies: string[];
  milestones: string[];
}

export interface ValidationStrategy {
  primary_endpoint: string;
  secondary_endpoints: string[];
  statistical_method: string;
  sample_size_justification: string;
  success_criteria: string;
  failure_criteria: string;
  controls: string[];
}

export interface ExperimentPlan {
  title: string;
  hypothesis: StructuredHypothesis;
  literature_check: LiteratureResult;
  protocol: ProtocolStep[];
  materials: BudgetCategory[];
  total_budget: string;
  timeline: TimelinePhase[];
  total_duration: string;
  validation: ValidationStrategy;
  assumptions: string[];
  risks: string[];
  references_used: string[];
  generation_rationale: string;
}

export interface FeedbackEntry {
  id: string;
  experiment_id: string;
  section: 'protocol' | 'materials' | 'budget' | 'timeline' | 'validation' | 'overall';
  original_content: string;
  corrected_content: string;
  correction_type: 'factual_error' | 'missing_detail' | 'cost_adjustment' | 'protocol_improvement' | 'timeline_change' | 'other';
  scientist_note: string;
  domain: string;
  created_at: string;
}

export interface ExperimentRecord {
  id: string;
  hypothesis: string;
  structured_hypothesis: StructuredHypothesis;
  literature_result: LiteratureResult;
  plan: ExperimentPlan;
  feedback_count: number;
  created_at: string;
  updated_at: string;
}

export type PipelineStage = 'input' | 'parsing' | 'literature' | 'generating' | 'complete';
