import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  Project, Signal, Evaluation, Decision, Task, StageProgress,
  ContextParking, ConstraintProfile, ActivityLogEntry, ApiKey,
  ProjectType, PipelineStage, SignalSource, SignalStatus, TaskStatus,
  TaskPriority, DecisionType, ActivityType, RiskTolerance,
} from '@/lib/types';
import { STAGE_CONFIG, PIPELINE_STAGES } from '@/lib/types';
import { toast } from 'sonner';

// Helper to get current user id
async function getUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

// ============ PROJECTS ============

export function useProjects(status?: string) {
  return useQuery({
    queryKey: ['projects', status],
    queryFn: async () => {
      let q = supabase.from('projects').select('*').order('updated_at', { ascending: false });
      if (status && status !== 'all') q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as Project[];
    },
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();
      if (error) throw error;
      return data as unknown as Project;
    },
    enabled: !!id,
  });
}

export function useFocusedProject() {
  return useQuery({
    queryKey: ['focused-project'],
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select('*').eq('is_focused', true).eq('status', 'active').maybeSingle();
      if (error) throw error;
      return data as unknown as Project | null;
    },
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; project_type: ProjectType }) => {
      const userId = await getUserId();
      // Unfocus other projects
      await supabase.from('projects').update({ is_focused: false } as never).eq('user_id', userId).eq('is_focused', true);
      
      const { data: project, error } = await supabase.from('projects').insert({
        user_id: userId,
        name: data.name,
        description: data.description || null,
        project_type: data.project_type,
        is_focused: true,
      } as never).select().single();
      if (error) throw error;

      // Create stage progress entries
      const stages = PIPELINE_STAGES.map((stage, i) => ({
        project_id: project.id,
        stage,
        status: i === 0 ? 'in_progress' : 'not_started',
        time_spent_seconds: 0,
        time_budget_seconds: STAGE_CONFIG[stage].budget || null,
        started_at: i === 0 ? new Date().toISOString() : null,
      }));
      const { error: spError } = await supabase.from('stage_progress').insert(stages as never);
      if (spError) throw spError;

      return project as unknown as Project;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['focused-project'] });
    },
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Project> }) => {
      if (updates.is_focused) {
        const userId = await getUserId();
        await supabase.from('projects').update({ is_focused: false } as never).eq('user_id', userId).eq('is_focused', true);
      }
      const { data, error } = await supabase.from('projects').update(updates as never).eq('id', id).select().single();
      if (error) throw error;
      return data as unknown as Project;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['project', id] });
      qc.invalidateQueries({ queryKey: ['focused-project'] });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['focused-project'] });
    },
  });
}

// ============ SIGNALS ============

export function useSignals(projectId?: string) {
  return useQuery({
    queryKey: ['signals', projectId],
    queryFn: async () => {
      let q = supabase.from('signals').select('*').order('created_at', { ascending: false });
      if (projectId) q = q.eq('project_id', projectId);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as Signal[];
    },
  });
}

export function useCreateSignal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { project_id?: string; source: SignalSource; title: string; body?: string; source_url?: string; tags?: string[] }) => {
      const userId = await getUserId();
      const { data: signal, error } = await supabase.from('signals').insert({
        user_id: userId,
        project_id: data.project_id || null,
        source: data.source,
        title: data.title,
        body: data.body || null,
        source_url: data.source_url || null,
        tags: data.tags || [],
      } as never).select().single();
      if (error) throw error;
      return signal as unknown as Signal;
    },
    onSuccess: (signal) => {
      qc.invalidateQueries({ queryKey: ['signals'] });
      if (signal.project_id) qc.invalidateQueries({ queryKey: ['signals', signal.project_id] });
    },
  });
}

export function useUpdateSignal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Signal> }) => {
      const { data, error } = await supabase.from('signals').update(updates as never).eq('id', id).select().single();
      if (error) throw error;
      return data as unknown as Signal;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['signals'] });
    },
  });
}

export function useDeleteSignal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('signals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['signals'] });
    },
  });
}

// ============ STAGE PROGRESS ============

export function useStageProgress(projectId: string | undefined) {
  return useQuery({
    queryKey: ['stage-progress', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase.from('stage_progress').select('*').eq('project_id', projectId);
      if (error) throw error;
      return data as unknown as StageProgress[];
    },
    enabled: !!projectId,
  });
}

export function useAdvanceStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, currentStage }: { projectId: string; currentStage: PipelineStage }) => {
      const currentIdx = PIPELINE_STAGES.indexOf(currentStage);
      if (currentIdx >= PIPELINE_STAGES.length - 1) return;
      const nextStage = PIPELINE_STAGES[currentIdx + 1];

      // Complete current stage
      await supabase.from('stage_progress').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      } as never).eq('project_id', projectId).eq('stage', currentStage);

      // Start next stage
      await supabase.from('stage_progress').update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
      } as never).eq('project_id', projectId).eq('stage', nextStage);

      // Update project
      const { error } = await supabase.from('projects').update({
        current_stage: nextStage,
      } as never).eq('id', projectId);
      if (error) throw error;

      return nextStage;
    },
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['focused-project'] });
      qc.invalidateQueries({ queryKey: ['stage-progress', projectId] });
    },
  });
}

// ============ EVALUATIONS ============

export function useEvaluations(projectId: string | undefined) {
  return useQuery({
    queryKey: ['evaluations', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase.from('evaluations').select('*, signal:signals(*)').eq('project_id', projectId);
      if (error) throw error;
      return (data as unknown as (Evaluation & { signal: Signal | null })[]).map(e => ({
        ...e,
        signal: e.signal || undefined,
      }));
    },
    enabled: !!projectId,
  });
}

export function useCreateEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { project_id: string; signal_id: string }) => {
      const userId = await getUserId();
      const { data: evaluation, error } = await supabase.from('evaluations').insert({
        user_id: userId,
        project_id: data.project_id,
        signal_id: data.signal_id,
      } as never).select().single();
      if (error) throw error;
      return evaluation as unknown as Evaluation;
    },
    onSuccess: (_, { project_id }) => {
      qc.invalidateQueries({ queryKey: ['evaluations', project_id] });
    },
  });
}

export function useUpdateEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Evaluation> }) => {
      // Remove computed/relation fields
      const { overall_score, signal, ...rest } = updates as Record<string, unknown>;
      const { data, error } = await supabase.from('evaluations').update(rest as never).eq('id', id).select().single();
      if (error) throw error;
      return data as unknown as Evaluation;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['evaluations'] });
    },
  });
}

// ============ DECISIONS ============

export function useDecisions(projectId: string | undefined) {
  return useQuery({
    queryKey: ['decisions', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase.from('decisions').select('*').eq('project_id', projectId);
      if (error) throw error;
      return data as unknown as Decision[];
    },
    enabled: !!projectId,
  });
}

export function useCreateDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { project_id: string; chosen_evaluation_id?: string; decision: DecisionType; reasoning?: string; confidence?: number }) => {
      const userId = await getUserId();
      const { data: decision, error } = await supabase.from('decisions').insert({
        user_id: userId,
        project_id: data.project_id,
        chosen_evaluation_id: data.chosen_evaluation_id || null,
        decision: data.decision,
        reasoning: data.reasoning || null,
        confidence: data.confidence || null,
      } as never).select().single();
      if (error) throw error;
      return decision as unknown as Decision;
    },
    onSuccess: (_, { project_id }) => {
      qc.invalidateQueries({ queryKey: ['decisions', project_id] });
    },
  });
}

// ============ TASKS ============

export function useTasks(projectId: string | undefined) {
  return useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase.from('tasks').select('*').eq('project_id', projectId).order('sort_order');
      if (error) throw error;
      return data as unknown as Task[];
    },
    enabled: !!projectId,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { project_id: string; title: string; description?: string; priority?: TaskPriority; phase?: string; due_date?: string }) => {
      const userId = await getUserId();
      const { data: task, error } = await supabase.from('tasks').insert({
        user_id: userId,
        project_id: data.project_id,
        title: data.title,
        description: data.description || null,
        priority: data.priority || 'medium',
        phase: data.phase || null,
        due_date: data.due_date || null,
      } as never).select().single();
      if (error) throw error;
      return task as unknown as Task;
    },
    onSuccess: (_, { project_id }) => {
      qc.invalidateQueries({ queryKey: ['tasks', project_id] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
      if (updates.status === 'done') {
        updates.completed_at = new Date().toISOString();
      }
      const { data, error } = await supabase.from('tasks').update(updates as never).eq('id', id).select().single();
      if (error) throw error;
      return data as unknown as Task;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

// ============ CONTEXT PARKING ============

export function useActiveParking() {
  return useQuery({
    queryKey: ['active-parking'],
    queryFn: async () => {
      const { data, error } = await supabase.from('context_parking').select('*, project:projects(*)').eq('is_active', true);
      if (error) throw error;
      return (data as unknown as (ContextParking & { project: Project | null })[]).map(cp => ({
        ...cp,
        project: cp.project || undefined,
      }));
    },
  });
}

export function useParkSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { project_id: string; stage: PipelineStage; page_route: string; breadcrumb: string; notes?: string }) => {
      const userId = await getUserId();
      // Deactivate existing
      await supabase.from('context_parking').update({ is_active: false } as never).eq('project_id', data.project_id).eq('is_active', true);
      
      const { data: parking, error } = await supabase.from('context_parking').insert({
        user_id: userId,
        project_id: data.project_id,
        stage: data.stage,
        page_route: data.page_route,
        breadcrumb: data.breadcrumb,
        notes: data.notes || null,
      } as never).select().single();
      if (error) throw error;
      return parking as unknown as ContextParking;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active-parking'] });
    },
  });
}

export function useResumeParking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('context_parking').update({
        is_active: false,
        resumed_at: new Date().toISOString(),
      } as never).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active-parking'] });
    },
  });
}

// ============ CONSTRAINT PROFILE ============

export function useConstraintProfile() {
  return useQuery({
    queryKey: ['constraint-profile'],
    queryFn: async () => {
      const userId = await getUserId();
      const { data, error } = await supabase.from('constraint_profiles').select('*').eq('user_id', userId).maybeSingle();
      if (error) throw error;
      return data as unknown as ConstraintProfile | null;
    },
  });
}

export function useUpsertConstraintProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ConstraintProfile>) => {
      const userId = await getUserId();
      const { data: existing } = await supabase.from('constraint_profiles').select('id').eq('user_id', userId).maybeSingle();
      
      if (existing) {
        const { data: updated, error } = await supabase.from('constraint_profiles').update(data as never).eq('user_id', userId).select().single();
        if (error) throw error;
        return updated as unknown as ConstraintProfile;
      } else {
        const { data: created, error } = await supabase.from('constraint_profiles').insert({
          user_id: userId,
          ...data,
        } as never).select().single();
        if (error) throw error;
        return created as unknown as ConstraintProfile;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['constraint-profile'] });
    },
  });
}

// ============ ACTIVITY LOG ============

export function useActivityLog(projectId: string | undefined) {
  return useQuery({
    queryKey: ['activity-log', projectId],
    queryFn: async () => {
      let q = supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(50);
      if (projectId) q = q.eq('project_id', projectId);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as ActivityLogEntry[];
    },
    enabled: projectId !== undefined,
  });
}

export function useCreateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { project_id?: string; stage?: PipelineStage; activity_type: ActivityType; title: string; description?: string; external_url?: string; tool_used?: string; duration_minutes?: number }) => {
      const userId = await getUserId();
      const { data: activity, error } = await supabase.from('activity_log').insert({
        user_id: userId,
        project_id: data.project_id || null,
        stage: data.stage || null,
        activity_type: data.activity_type,
        title: data.title,
        description: data.description || null,
        external_url: data.external_url || null,
        tool_used: data.tool_used || null,
        duration_minutes: data.duration_minutes || null,
      } as never).select().single();
      if (error) throw error;
      return activity as unknown as ActivityLogEntry;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activity-log'] });
    },
  });
}

// ============ API KEYS ============

export function useApiKeys() {
  return useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const { data, error } = await supabase.from('api_keys').select('*').is('revoked_at', null).order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as ApiKey[];
    },
  });
}

export function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const userId = await getUserId();
      // Generate key
      const rawKey = `nc_${Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('')}`;
      const keyPrefix = rawKey.slice(0, 11);
      // Hash it
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(rawKey));
      const keyHash = Array.from(new Uint8Array(hashBuffer), b => b.toString(16).padStart(2, '0')).join('');
      
      const { data, error } = await supabase.from('api_keys').insert({
        user_id: userId,
        name,
        key_hash: keyHash,
        key_prefix: keyPrefix,
      } as never).select().single();
      if (error) throw error;
      return { apiKey: data as unknown as ApiKey, rawKey };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });
}

export function useRevokeApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('api_keys').update({ revoked_at: new Date().toISOString() } as never).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });
}

// ============ PROFILE ============

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const userId = await getUserId();
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error) throw error;
      return data as unknown as import('@/lib/types').Profile;
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<import('@/lib/types').Profile>) => {
      const userId = await getUserId();
      const { data, error } = await supabase.from('profiles').update(updates as never).eq('id', userId).select().single();
      if (error) throw error;
      return data as unknown as import('@/lib/types').Profile;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
