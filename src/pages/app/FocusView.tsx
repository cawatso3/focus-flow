import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Plus, Clock, Crosshair } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getFocusedProject, getActiveParking, getStageProgress, resumeParking } from '@/lib/store';
import { STAGE_CONFIG } from '@/lib/types';
import { PipelineStepper } from '@/components/PipelineStepper';
import type { PipelineStage, StageStatus } from '@/lib/types';
import { toast } from 'sonner';

export default function FocusView() {
  const navigate = useNavigate();
  const project = getFocusedProject();
  const parkings = getActiveParking();

  // Build next action text based on stage
  const getNextAction = () => {
    if (!project) return null;
    const stage = project.current_stage;
    const actions: Record<PipelineStage, { title: string; context: string; estimate: string }> = {
      capture: { title: 'Capture pain points and signals', context: 'Add problems, ideas, and signals you\'ve found.', estimate: '~30 min' },
      score: { title: 'Score your captured signals', context: 'Rate each signal to find the strongest opportunities.', estimate: '~20 min' },
      evaluate: { title: 'Evaluate promoted signals', context: 'Deep-dive market research on your top signals.', estimate: '~45 min' },
      decide: { title: 'Make your decision', context: 'Compare evaluations and commit to one opportunity.', estimate: '~20 min' },
      execute: { title: 'Build your committed project', context: 'Work through tasks to ship your product.', estimate: 'Ongoing' },
    };
    return actions[stage];
  };

  const stageStatuses = project
    ? getStageProgress(project.id).reduce((acc, sp) => {
        acc[sp.stage] = sp.status;
        return acc;
      }, {} as Record<PipelineStage, StageStatus>)
    : ({} as Record<PipelineStage, StageStatus>);

  const stageProgress = project
    ? getStageProgress(project.id).find(sp => sp.stage === project.current_stage)
    : null;

  const nextAction = getNextAction();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-2xl mx-auto"
    >
      {/* Parked session resume */}
      {parkings.length > 0 && (
        <div className="mb-6">
          {parkings.map(parking => (
            <div key={parking.id} className="card-surface p-4 border-l-4 border-stage-decide">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-label stage-decide mb-1">PARKED SESSION</p>
                  <p className="text-sm font-medium text-foreground">{parking.breadcrumb}</p>
                  {parking.notes && (
                    <p className="text-xs text-muted-foreground mt-1">{parking.notes}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Parked {new Date(parking.parked_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      resumeParking(parking.id);
                      if (parking.page_route) navigate(parking.page_route);
                      toast.info('Session resumed');
                    }}
                    className="gap-1"
                  >
                    Resume <ArrowRight className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { resumeParking(parking.id); }}>
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {project ? (
        <>
          {/* Project header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-xl font-semibold text-foreground">{project.name}</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                {project.project_type === 'niche_eval' ? 'Niche Eval' : project.project_type === 'client_seo' ? 'Client SEO' : 'Custom'}
              </span>
            </div>
            <PipelineStepper projectId={project.id} currentStage={project.current_stage} stageStatuses={stageStatuses} />
          </div>

          {/* Next action card */}
          {nextAction && (
            <div className={`card-surface p-6 border-l-4 ${STAGE_CONFIG[project.current_stage].borderClass}`}>
              <p className={`text-label ${STAGE_CONFIG[project.current_stage].colorClass} mb-2`}>
                {STAGE_CONFIG[project.current_stage].label.toUpperCase()}
              </p>
              <h2 className="text-lg font-semibold text-foreground mb-1">{nextAction.title}</h2>
              <p className="text-sm text-muted-foreground mb-4">{nextAction.context}</p>
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => navigate(`/app/project/${project.id}/${project.current_stage}`)}
                  className="gap-1"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {nextAction.estimate}
                </span>
              </div>
            </div>
          )}

          {/* Session stats */}
          {stageProgress && stageProgress.time_budget_seconds && (
            <div className="mt-6 p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Time in {STAGE_CONFIG[project.current_stage].label}: {Math.floor(stageProgress.time_spent_seconds / 60)} min
                  {stageProgress.time_budget_seconds && ` (budget: ${Math.floor(stageProgress.time_budget_seconds / 60)} min)`}
                </span>
              </div>
              {stageProgress.time_budget_seconds > 0 && (
                <div className="w-full h-1 rounded-full bg-muted mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${STAGE_CONFIG[project.current_stage].bgClass}`}
                    style={{ width: `${Math.min((stageProgress.time_spent_seconds / stageProgress.time_budget_seconds) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Switch project link */}
          <div className="mt-6 text-center">
            <Button variant="link" size="sm" className="text-muted-foreground" onClick={() => navigate('/app/projects')}>
              Switch project
            </Button>
          </div>
        </>
      ) : (
        /* No project state */
        <div className="card-surface p-8 text-center">
          <Crosshair className="h-10 w-10 text-muted-foreground mx-auto mb-4" strokeWidth={1.5} />
          <h2 className="text-lg font-semibold text-foreground mb-2">No active project</h2>
          <p className="text-sm text-muted-foreground mb-6">Pick one to focus on, or create a new one.</p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" onClick={() => navigate('/app/projects')}>View Projects</Button>
            <Button onClick={() => navigate('/app/projects')} className="gap-1">
              <Plus className="h-4 w-4" /> New Project
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
