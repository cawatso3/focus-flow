
-- Enable uuid extension
create extension if not exists "uuid-ossp";

-- Profiles
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  avatar_url text,
  onboarded boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Updated_at trigger function
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql set search_path = public;

-- Constraint profiles
create table public.constraint_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  tech_stack text[] default '{}',
  builder_tools text[] default '{}',
  existing_assets text[] default '{}',
  time_budget_hours_per_week integer default 20,
  risk_tolerance text default 'medium' check (risk_tolerance in ('low', 'medium', 'high')),
  target_revenue_model text[] default '{}',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

-- Projects
create type project_type as enum ('niche_eval', 'client_seo', 'custom');
create type project_status as enum ('active', 'paused', 'completed', 'archived');
create type pipeline_stage as enum ('capture', 'score', 'evaluate', 'decide', 'execute');

create table public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  project_type project_type not null default 'niche_eval',
  status project_status not null default 'active',
  current_stage pipeline_stage not null default 'capture',
  is_focused boolean default false,
  color text default '#6366f1',
  project_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Stage progress
create type stage_status as enum ('not_started', 'in_progress', 'completed', 'skipped');

create table public.stage_progress (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  stage pipeline_stage not null,
  status stage_status not null default 'not_started',
  time_spent_seconds integer default 0,
  time_budget_seconds integer,
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(project_id, stage)
);

-- Signals
create type signal_source as enum ('reddit', 'g2', 'manual', 'web_clip', 'import', 'mcp');
create type signal_status as enum ('inbox', 'scored', 'promoted', 'archived');

create table public.signals (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade not null,
  source signal_source not null default 'manual',
  title text not null,
  body text,
  source_url text,
  source_metadata jsonb default '{}',
  score numeric(3,1),
  score_reasoning text,
  ai_assessment jsonb,
  tags text[] default '{}',
  status signal_status not null default 'inbox',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Evaluations
create table public.evaluations (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  signal_id uuid references public.signals(id) on delete set null,
  user_id uuid references auth.users(id) on delete cascade not null,
  market_size_estimate text,
  market_growth text,
  market_size_score integer check (market_size_score between 1 and 5),
  pain_description text,
  pain_frequency text,
  pain_severity_score integer check (pain_severity_score between 1 and 5),
  competitors text,
  differentiation text,
  competition_score integer check (competition_score between 1 and 5),
  tech_requirements text,
  tech_fit_notes text,
  tech_fit_score integer check (tech_fit_score between 1 and 5),
  estimated_weeks integer,
  complexity_notes text,
  build_effort_score integer check (build_effort_score between 1 and 5),
  revenue_model text,
  revenue_estimate text,
  revenue_score integer check (revenue_score between 1 and 5),
  overall_score numeric(3,1) generated always as (
    (coalesce(market_size_score,0) + coalesce(pain_severity_score,0) +
     coalesce(competition_score,0) + coalesce(tech_fit_score,0) +
     coalesce(build_effort_score,0) + coalesce(revenue_score,0)) / 6.0
  ) stored,
  research_notes text,
  status text default 'draft' check (status in ('draft', 'complete')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Decisions
create table public.decisions (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  chosen_evaluation_id uuid references public.evaluations(id) on delete set null,
  ranking jsonb default '[]',
  decision text check (decision in ('commit', 'pass', 'revisit')),
  reasoning text,
  confidence integer check (confidence between 1 and 5),
  decided_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tasks
create type task_status as enum ('todo', 'in_progress', 'blocked', 'done');
create type task_priority as enum ('low', 'medium', 'high', 'urgent');

create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  status task_status not null default 'todo',
  priority task_priority default 'medium',
  phase text,
  due_date date,
  completed_at timestamptz,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Context parking
create table public.context_parking (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  stage pipeline_stage not null,
  page_route text,
  breadcrumb text not null,
  notes text,
  form_state jsonb default '{}',
  parked_at timestamptz default now(),
  resumed_at timestamptz,
  is_active boolean default true
);

-- Time entries
create table public.time_entries (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  stage pipeline_stage not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer,
  label text
);

-- Activity log
create table public.activity_log (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade not null,
  stage pipeline_stage,
  activity_type text not null check (activity_type in ('research', 'chat_external', 'build_session', 'note', 'decision', 'milestone', 'signal_captured')),
  title text not null,
  description text,
  external_url text,
  tool_used text,
  duration_minutes integer,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- API keys
create table public.api_keys (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  key_hash text not null,
  key_prefix text not null,
  last_used_at timestamptz,
  created_at timestamptz default now(),
  revoked_at timestamptz
);

-- RLS on profiles
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (id = auth.uid());
create policy "Users can update own profile" on public.profiles for update using (id = auth.uid());
create policy "Users can insert own profile" on public.profiles for insert with check (id = auth.uid());

-- RLS on all user_id tables
alter table public.constraint_profiles enable row level security;
create policy "Users can view own constraint_profiles" on public.constraint_profiles for select using (user_id = auth.uid());
create policy "Users can insert own constraint_profiles" on public.constraint_profiles for insert with check (user_id = auth.uid());
create policy "Users can update own constraint_profiles" on public.constraint_profiles for update using (user_id = auth.uid());
create policy "Users can delete own constraint_profiles" on public.constraint_profiles for delete using (user_id = auth.uid());

alter table public.projects enable row level security;
create policy "Users can view own projects" on public.projects for select using (user_id = auth.uid());
create policy "Users can insert own projects" on public.projects for insert with check (user_id = auth.uid());
create policy "Users can update own projects" on public.projects for update using (user_id = auth.uid());
create policy "Users can delete own projects" on public.projects for delete using (user_id = auth.uid());

alter table public.stage_progress enable row level security;
-- stage_progress doesn't have user_id, use project ownership
create policy "Users can view own stage_progress" on public.stage_progress for select using (
  exists (select 1 from public.projects where id = stage_progress.project_id and user_id = auth.uid())
);
create policy "Users can insert own stage_progress" on public.stage_progress for insert with check (
  exists (select 1 from public.projects where id = stage_progress.project_id and user_id = auth.uid())
);
create policy "Users can update own stage_progress" on public.stage_progress for update using (
  exists (select 1 from public.projects where id = stage_progress.project_id and user_id = auth.uid())
);
create policy "Users can delete own stage_progress" on public.stage_progress for delete using (
  exists (select 1 from public.projects where id = stage_progress.project_id and user_id = auth.uid())
);

alter table public.signals enable row level security;
create policy "Users can view own signals" on public.signals for select using (user_id = auth.uid());
create policy "Users can insert own signals" on public.signals for insert with check (user_id = auth.uid());
create policy "Users can update own signals" on public.signals for update using (user_id = auth.uid());
create policy "Users can delete own signals" on public.signals for delete using (user_id = auth.uid());

alter table public.evaluations enable row level security;
create policy "Users can view own evaluations" on public.evaluations for select using (user_id = auth.uid());
create policy "Users can insert own evaluations" on public.evaluations for insert with check (user_id = auth.uid());
create policy "Users can update own evaluations" on public.evaluations for update using (user_id = auth.uid());
create policy "Users can delete own evaluations" on public.evaluations for delete using (user_id = auth.uid());

alter table public.decisions enable row level security;
create policy "Users can view own decisions" on public.decisions for select using (user_id = auth.uid());
create policy "Users can insert own decisions" on public.decisions for insert with check (user_id = auth.uid());
create policy "Users can update own decisions" on public.decisions for update using (user_id = auth.uid());
create policy "Users can delete own decisions" on public.decisions for delete using (user_id = auth.uid());

alter table public.tasks enable row level security;
create policy "Users can view own tasks" on public.tasks for select using (user_id = auth.uid());
create policy "Users can insert own tasks" on public.tasks for insert with check (user_id = auth.uid());
create policy "Users can update own tasks" on public.tasks for update using (user_id = auth.uid());
create policy "Users can delete own tasks" on public.tasks for delete using (user_id = auth.uid());

alter table public.context_parking enable row level security;
create policy "Users can view own context_parking" on public.context_parking for select using (user_id = auth.uid());
create policy "Users can insert own context_parking" on public.context_parking for insert with check (user_id = auth.uid());
create policy "Users can update own context_parking" on public.context_parking for update using (user_id = auth.uid());
create policy "Users can delete own context_parking" on public.context_parking for delete using (user_id = auth.uid());

alter table public.time_entries enable row level security;
create policy "Users can view own time_entries" on public.time_entries for select using (user_id = auth.uid());
create policy "Users can insert own time_entries" on public.time_entries for insert with check (user_id = auth.uid());
create policy "Users can update own time_entries" on public.time_entries for update using (user_id = auth.uid());
create policy "Users can delete own time_entries" on public.time_entries for delete using (user_id = auth.uid());

alter table public.activity_log enable row level security;
create policy "Users can view own activity_log" on public.activity_log for select using (user_id = auth.uid());
create policy "Users can insert own activity_log" on public.activity_log for insert with check (user_id = auth.uid());
create policy "Users can update own activity_log" on public.activity_log for update using (user_id = auth.uid());
create policy "Users can delete own activity_log" on public.activity_log for delete using (user_id = auth.uid());

alter table public.api_keys enable row level security;
create policy "Users can view own api_keys" on public.api_keys for select using (user_id = auth.uid());
create policy "Users can insert own api_keys" on public.api_keys for insert with check (user_id = auth.uid());
create policy "Users can update own api_keys" on public.api_keys for update using (user_id = auth.uid());
create policy "Users can delete own api_keys" on public.api_keys for delete using (user_id = auth.uid());

-- Indexes
create index idx_projects_user_status on public.projects(user_id, status);
create index idx_signals_project on public.signals(project_id);
create index idx_signals_user on public.signals(user_id);
create index idx_evaluations_project on public.evaluations(project_id);
create index idx_tasks_project on public.tasks(project_id);
create index idx_activity_log_project on public.activity_log(project_id, created_at);
create index idx_context_parking_active on public.context_parking(user_id, is_active) where is_active = true;
create index idx_api_keys_user on public.api_keys(user_id) where revoked_at is null;

-- Updated_at triggers
create trigger update_profiles_updated_at before update on public.profiles for each row execute function public.update_updated_at_column();
create trigger update_constraint_profiles_updated_at before update on public.constraint_profiles for each row execute function public.update_updated_at_column();
create trigger update_projects_updated_at before update on public.projects for each row execute function public.update_updated_at_column();
create trigger update_stage_progress_updated_at before update on public.stage_progress for each row execute function public.update_updated_at_column();
create trigger update_signals_updated_at before update on public.signals for each row execute function public.update_updated_at_column();
create trigger update_evaluations_updated_at before update on public.evaluations for each row execute function public.update_updated_at_column();
create trigger update_decisions_updated_at before update on public.decisions for each row execute function public.update_updated_at_column();
create trigger update_tasks_updated_at before update on public.tasks for each row execute function public.update_updated_at_column();

-- Service role policy for API key lookups (edge functions use service role)
create policy "Service role can read api_keys" on public.api_keys for select using (true);
create policy "Service role can update api_keys" on public.api_keys for update using (true);
