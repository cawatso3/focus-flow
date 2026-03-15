// Local state management for NicheCommand
// This provides mock data management until Supabase is connected
// All data is stored in-memory and will be replaced with Supabase queries

import type {
  Profile, ConstraintProfile, Project, StageProgress, Signal,
  Evaluation, Decision, Task, ContextParking, TimeEntry,
  PipelineStage, ProjectType, ProjectStatus, SignalSource, SignalStatus,
  TaskStatus, TaskPriority, StageStatus, RiskTolerance, DecisionType
} from './types';
import { STAGE_CONFIG, PIPELINE_STAGES } from './types';

function uuid(): string {
  return crypto.randomUUID();
}

// In-memory stores
let currentUserId: string | null = null;
let profile: Profile | null = null;
let constraintProfile: ConstraintProfile | null = null;
let projects: Project[] = [];
let stageProgressList: StageProgress[] = [];
let signals: Signal[] = [];
let evaluations: Evaluation[] = [];
let decisions: Decision[] = [];
let tasks: Task[] = [];
let contextParkings: ContextParking[] = [];
let timeEntries: TimeEntry[] = [];

// Auth simulation
export function simulateLogin(email: string): { userId: string; profile: Profile } {
  const userId = uuid();
  currentUserId = userId;
  profile = {
    id: userId,
    display_name: email.split('@')[0],
    avatar_url: null,
    onboarded: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  return { userId, profile };
}

export function simulateSignup(email: string, name?: string): { userId: string; profile: Profile } {
  const userId = uuid();
  currentUserId = userId;
  profile = {
    id: userId,
    display_name: name || email.split('@')[0],
    avatar_url: null,
    onboarded: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  return { userId, profile };
}

export function logout() {
  currentUserId = null;
  profile = null;
  constraintProfile = null;
  projects = [];
  stageProgressList = [];
  signals = [];
  evaluations = [];
  decisions = [];
  tasks = [];
  contextParkings = [];
  timeEntries = [];
}

export function getCurrentUser() {
  return currentUserId ? { id: currentUserId, profile } : null;
}

export function getProfile(): Profile | null {
  return profile;
}

export function updateProfile(updates: Partial<Profile>): Profile | null {
  if (!profile) return null;
  profile = { ...profile, ...updates, updated_at: new Date().toISOString() };
  return profile;
}

// Constraint Profile
export function getConstraintProfile(): ConstraintProfile | null {
  return constraintProfile;
}

export function upsertConstraintProfile(data: Partial<ConstraintProfile>): ConstraintProfile {
  if (!currentUserId) throw new Error('Not authenticated');
  if (constraintProfile) {
    constraintProfile = { ...constraintProfile, ...data, updated_at: new Date().toISOString() };
  } else {
    constraintProfile = {
      id: uuid(),
      user_id: currentUserId,
      tech_stack: data.tech_stack || [],
      builder_tools: data.builder_tools || [],
      existing_assets: data.existing_assets || [],
      time_budget_hours_per_week: data.time_budget_hours_per_week || 15,
      risk_tolerance: data.risk_tolerance || 'medium',
      target_revenue_model: data.target_revenue_model || [],
      notes: data.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
  if (profile) {
    profile.onboarded = true;
  }
  return constraintProfile;
}

// Projects
export function getProjects(): Project[] {
  return projects;
}

export function getProject(id: string): Project | undefined {
  return projects.find(p => p.id === id);
}

export function getFocusedProject(): Project | undefined {
  return projects.find(p => p.is_focused && p.status === 'active');
}

export function createProject(data: { name: string; description?: string; project_type: ProjectType }): Project {
  if (!currentUserId) throw new Error('Not authenticated');
  
  // Unfocus other projects
  projects = projects.map(p => ({ ...p, is_focused: false }));
  
  const project: Project = {
    id: uuid(),
    user_id: currentUserId,
    name: data.name,
    description: data.description || null,
    project_type: data.project_type,
    status: 'active',
    current_stage: 'capture',
    is_focused: true,
    color: '#6366f1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  projects.push(project);

  // Create stage progress entries
  PIPELINE_STAGES.forEach((stage, i) => {
    stageProgressList.push({
      id: uuid(),
      project_id: project.id,
      stage,
      status: i === 0 ? 'in_progress' : 'not_started',
      time_spent_seconds: 0,
      time_budget_seconds: STAGE_CONFIG[stage].budget || null,
      started_at: i === 0 ? new Date().toISOString() : null,
      completed_at: null,
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  return project;
}

export function updateProject(id: string, updates: Partial<Project>): Project | undefined {
  const idx = projects.findIndex(p => p.id === id);
  if (idx === -1) return undefined;
  if (updates.is_focused) {
    projects = projects.map(p => ({ ...p, is_focused: false }));
  }
  projects[idx] = { ...projects[idx], ...updates, updated_at: new Date().toISOString() };
  return projects[idx];
}

export function deleteProject(id: string): void {
  projects = projects.filter(p => p.id !== id);
  stageProgressList = stageProgressList.filter(sp => sp.project_id !== id);
  signals = signals.filter(s => s.project_id !== id);
  evaluations = evaluations.filter(e => e.project_id !== id);
  decisions = decisions.filter(d => d.project_id !== id);
  tasks = tasks.filter(t => t.project_id !== id);
  contextParkings = contextParkings.filter(cp => cp.project_id !== id);
  timeEntries = timeEntries.filter(te => te.project_id !== id);
}

// Stage Progress
export function getStageProgress(projectId: string): StageProgress[] {
  return stageProgressList.filter(sp => sp.project_id === projectId);
}

export function getStageProgressByStage(projectId: string, stage: PipelineStage): StageProgress | undefined {
  return stageProgressList.find(sp => sp.project_id === projectId && sp.stage === stage);
}

export function updateStageProgress(projectId: string, stage: PipelineStage, updates: Partial<StageProgress>): StageProgress | undefined {
  const idx = stageProgressList.findIndex(sp => sp.project_id === projectId && sp.stage === stage);
  if (idx === -1) return undefined;
  stageProgressList[idx] = { ...stageProgressList[idx], ...updates, updated_at: new Date().toISOString() };
  return stageProgressList[idx];
}

export function advanceStage(projectId: string): Project | undefined {
  const project = getProject(projectId);
  if (!project) return undefined;
  
  const currentIdx = PIPELINE_STAGES.indexOf(project.current_stage);
  if (currentIdx >= PIPELINE_STAGES.length - 1) return project;
  
  const nextStage = PIPELINE_STAGES[currentIdx + 1];
  
  updateStageProgress(projectId, project.current_stage, { status: 'completed', completed_at: new Date().toISOString() });
  updateStageProgress(projectId, nextStage, { status: 'in_progress', started_at: new Date().toISOString() });
  
  return updateProject(projectId, { current_stage: nextStage });
}

// Signals
export function getSignals(projectId?: string): Signal[] {
  if (projectId) return signals.filter(s => s.project_id === projectId);
  return signals;
}

export function getSignal(id: string): Signal | undefined {
  return signals.find(s => s.id === id);
}

export function createSignal(data: { project_id?: string; source: SignalSource; title: string; body?: string; source_url?: string; tags?: string[] }): Signal {
  if (!currentUserId) throw new Error('Not authenticated');
  const signal: Signal = {
    id: uuid(),
    project_id: data.project_id || null,
    user_id: currentUserId,
    source: data.source,
    title: data.title,
    body: data.body || null,
    source_url: data.source_url || null,
    source_metadata: {},
    score: null,
    score_reasoning: null,
    tags: data.tags || [],
    status: 'inbox',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  signals.push(signal);
  return signal;
}

export function updateSignal(id: string, updates: Partial<Signal>): Signal | undefined {
  const idx = signals.findIndex(s => s.id === id);
  if (idx === -1) return undefined;
  signals[idx] = { ...signals[idx], ...updates, updated_at: new Date().toISOString() };
  return signals[idx];
}

export function deleteSignal(id: string): void {
  signals = signals.filter(s => s.id !== id);
}

// Evaluations
export function getEvaluations(projectId: string): Evaluation[] {
  return evaluations.filter(e => e.project_id === projectId).map(e => ({
    ...e,
    signal: e.signal_id ? getSignal(e.signal_id) : undefined,
  }));
}

export function getEvaluation(id: string): Evaluation | undefined {
  const e = evaluations.find(ev => ev.id === id);
  if (!e) return undefined;
  return { ...e, signal: e.signal_id ? getSignal(e.signal_id) : undefined };
}

export function createEvaluation(data: { project_id: string; signal_id: string }): Evaluation {
  if (!currentUserId) throw new Error('Not authenticated');
  const evaluation: Evaluation = {
    id: uuid(),
    project_id: data.project_id,
    signal_id: data.signal_id,
    user_id: currentUserId,
    market_size_estimate: null,
    market_growth: null,
    market_size_score: null,
    pain_description: null,
    pain_frequency: null,
    pain_severity_score: null,
    competitors: null,
    differentiation: null,
    competition_score: null,
    tech_requirements: null,
    tech_fit_notes: null,
    tech_fit_score: null,
    estimated_weeks: null,
    complexity_notes: null,
    build_effort_score: null,
    revenue_model: null,
    revenue_estimate: null,
    revenue_score: null,
    overall_score: null,
    research_notes: null,
    status: 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  evaluations.push(evaluation);
  return evaluation;
}

export function updateEvaluation(id: string, updates: Partial<Evaluation>): Evaluation | undefined {
  const idx = evaluations.findIndex(e => e.id === id);
  if (idx === -1) return undefined;
  
  const updated = { ...evaluations[idx], ...updates, updated_at: new Date().toISOString() };
  
  // Calculate overall score
  const scores = [updated.market_size_score, updated.pain_severity_score, updated.competition_score, updated.tech_fit_score, updated.build_effort_score, updated.revenue_score].filter(s => s !== null) as number[];
  updated.overall_score = scores.length > 0 ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : null;
  
  evaluations[idx] = updated;
  return { ...updated, signal: updated.signal_id ? getSignal(updated.signal_id) : undefined };
}

// Decisions
export function getDecisions(projectId: string): Decision[] {
  return decisions.filter(d => d.project_id === projectId);
}

export function createDecision(data: { project_id: string; chosen_evaluation_id?: string; decision: DecisionType; reasoning?: string; confidence?: number }): Decision {
  if (!currentUserId) throw new Error('Not authenticated');
  const decision: Decision = {
    id: uuid(),
    project_id: data.project_id,
    user_id: currentUserId,
    chosen_evaluation_id: data.chosen_evaluation_id || null,
    ranking: [],
    decision: data.decision,
    reasoning: data.reasoning || null,
    confidence: data.confidence || null,
    decided_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  decisions.push(decision);
  return decision;
}

// Tasks
export function getTasks(projectId: string): Task[] {
  return tasks.filter(t => t.project_id === projectId).sort((a, b) => a.sort_order - b.sort_order);
}

export function createTask(data: { project_id: string; title: string; description?: string; priority?: TaskPriority; phase?: string; due_date?: string }): Task {
  if (!currentUserId) throw new Error('Not authenticated');
  const task: Task = {
    id: uuid(),
    project_id: data.project_id,
    user_id: currentUserId,
    title: data.title,
    description: data.description || null,
    status: 'todo',
    priority: data.priority || 'medium',
    phase: data.phase || null,
    due_date: data.due_date || null,
    completed_at: null,
    sort_order: tasks.filter(t => t.project_id === data.project_id).length,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  tasks.push(task);
  return task;
}

export function updateTask(id: string, updates: Partial<Task>): Task | undefined {
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) return undefined;
  tasks[idx] = { ...tasks[idx], ...updates, updated_at: new Date().toISOString() };
  if (updates.status === 'done' && !tasks[idx].completed_at) {
    tasks[idx].completed_at = new Date().toISOString();
  }
  return tasks[idx];
}

export function deleteTask(id: string): void {
  tasks = tasks.filter(t => t.id !== id);
}

// Context Parking
export function getActiveParking(): ContextParking[] {
  return contextParkings.filter(cp => cp.is_active).map(cp => ({
    ...cp,
    project: getProject(cp.project_id),
  }));
}

export function parkSession(data: { project_id: string; stage: PipelineStage; page_route: string; breadcrumb: string; notes?: string }): ContextParking {
  if (!currentUserId) throw new Error('Not authenticated');
  
  // Deactivate existing parkings for this project
  contextParkings = contextParkings.map(cp => 
    cp.project_id === data.project_id ? { ...cp, is_active: false } : cp
  );
  
  const parking: ContextParking = {
    id: uuid(),
    project_id: data.project_id,
    user_id: currentUserId,
    stage: data.stage,
    page_route: data.page_route,
    breadcrumb: data.breadcrumb,
    notes: data.notes || null,
    form_state: {},
    parked_at: new Date().toISOString(),
    resumed_at: null,
    is_active: true,
  };
  contextParkings.push(parking);
  return parking;
}

export function resumeParking(id: string): void {
  const idx = contextParkings.findIndex(cp => cp.id === id);
  if (idx !== -1) {
    contextParkings[idx] = { ...contextParkings[idx], is_active: false, resumed_at: new Date().toISOString() };
  }
}

// Time Entries
export function startTimeEntry(projectId: string, stage: PipelineStage): TimeEntry {
  if (!currentUserId) throw new Error('Not authenticated');
  const entry: TimeEntry = {
    id: uuid(),
    project_id: projectId,
    user_id: currentUserId,
    stage,
    started_at: new Date().toISOString(),
    ended_at: null,
    duration_seconds: null,
    label: null,
  };
  timeEntries.push(entry);
  return entry;
}

export function endTimeEntry(id: string): TimeEntry | undefined {
  const idx = timeEntries.findIndex(te => te.id === id);
  if (idx === -1) return undefined;
  const ended = new Date();
  const started = new Date(timeEntries[idx].started_at);
  const duration = Math.floor((ended.getTime() - started.getTime()) / 1000);
  timeEntries[idx] = { ...timeEntries[idx], ended_at: ended.toISOString(), duration_seconds: duration };
  return timeEntries[idx];
}

export function getTimeEntries(projectId: string, stage?: PipelineStage): TimeEntry[] {
  return timeEntries.filter(te => te.project_id === projectId && (!stage || te.stage === stage));
}
