// Core types for NicheCommand

export type ProjectType = 'niche_eval' | 'client_seo' | 'custom';
export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived';
export type PipelineStage = 'capture' | 'score' | 'evaluate' | 'decide' | 'execute';
export type StageStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';
export type SignalSource = 'reddit' | 'g2' | 'manual' | 'web_clip' | 'import';
export type SignalStatus = 'inbox' | 'scored' | 'promoted' | 'archived';
export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type RiskTolerance = 'low' | 'medium' | 'high';
export type DecisionType = 'commit' | 'pass' | 'revisit';

export const PIPELINE_STAGES: PipelineStage[] = ['capture', 'score', 'evaluate', 'decide', 'execute'];

export const STAGE_CONFIG: Record<PipelineStage, { label: string; colorClass: string; bgClass: string; subtleClass: string; borderClass: string; ringClass: string; budget: number }> = {
  capture: { label: 'Capture', colorClass: 'stage-capture', bgClass: 'bg-stage-capture', subtleClass: 'bg-stage-capture-subtle', borderClass: 'border-stage-capture', ringClass: 'ring-stage-capture', budget: 1800 },
  score: { label: 'Score', colorClass: 'stage-score', bgClass: 'bg-stage-score', subtleClass: 'bg-stage-score-subtle', borderClass: 'border-stage-score', ringClass: 'ring-stage-score', budget: 1200 },
  evaluate: { label: 'Evaluate', colorClass: 'stage-evaluate', bgClass: 'bg-stage-evaluate', subtleClass: 'bg-stage-evaluate-subtle', borderClass: 'border-stage-evaluate', ringClass: 'ring-stage-evaluate', budget: 2700 },
  decide: { label: 'Decide', colorClass: 'stage-decide', bgClass: 'bg-stage-decide', subtleClass: 'bg-stage-decide-subtle', borderClass: 'border-stage-decide', ringClass: 'ring-stage-decide', budget: 1200 },
  execute: { label: 'Execute', colorClass: 'stage-execute', bgClass: 'bg-stage-execute', subtleClass: 'bg-stage-execute-subtle', borderClass: 'border-stage-execute', ringClass: 'ring-stage-execute', budget: 0 },
};

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConstraintProfile {
  id: string;
  user_id: string;
  tech_stack: string[];
  builder_tools: string[];
  existing_assets: string[];
  time_budget_hours_per_week: number;
  risk_tolerance: RiskTolerance;
  target_revenue_model: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  project_type: ProjectType;
  status: ProjectStatus;
  current_stage: PipelineStage;
  is_focused: boolean;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface StageProgress {
  id: string;
  project_id: string;
  stage: PipelineStage;
  status: StageStatus;
  time_spent_seconds: number;
  time_budget_seconds: number | null;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Signal {
  id: string;
  project_id: string | null;
  user_id: string;
  source: SignalSource;
  title: string;
  body: string | null;
  source_url: string | null;
  source_metadata: Record<string, unknown>;
  score: number | null;
  score_reasoning: string | null;
  tags: string[];
  status: SignalStatus;
  created_at: string;
  updated_at: string;
}

export interface Evaluation {
  id: string;
  project_id: string;
  signal_id: string | null;
  user_id: string;
  market_size_estimate: string | null;
  market_growth: string | null;
  market_size_score: number | null;
  pain_description: string | null;
  pain_frequency: string | null;
  pain_severity_score: number | null;
  competitors: string | null;
  differentiation: string | null;
  competition_score: number | null;
  tech_requirements: string | null;
  tech_fit_notes: string | null;
  tech_fit_score: number | null;
  estimated_weeks: number | null;
  complexity_notes: string | null;
  build_effort_score: number | null;
  revenue_model: string | null;
  revenue_estimate: string | null;
  revenue_score: number | null;
  overall_score: number | null;
  research_notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  signal?: Signal;
}

export interface Decision {
  id: string;
  project_id: string;
  user_id: string;
  chosen_evaluation_id: string | null;
  ranking: unknown[];
  decision: DecisionType | null;
  reasoning: string | null;
  confidence: number | null;
  decided_at: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  phase: string | null;
  due_date: string | null;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ContextParking {
  id: string;
  project_id: string;
  user_id: string;
  stage: PipelineStage;
  page_route: string | null;
  breadcrumb: string;
  notes: string | null;
  form_state: Record<string, unknown>;
  parked_at: string;
  resumed_at: string | null;
  is_active: boolean;
  project?: Project;
}

export interface TimeEntry {
  id: string;
  project_id: string;
  user_id: string;
  stage: PipelineStage;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  label: string | null;
}
