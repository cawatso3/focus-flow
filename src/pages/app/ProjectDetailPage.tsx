import { useParams, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProject, useStageProgress } from '@/hooks/use-queries';
import { PipelineStepper } from '@/components/PipelineStepper';
import type { PipelineStage, StageStatus } from '@/lib/types';
import { STAGE_CONFIG } from '@/lib/types';
import { StageTimer } from '@/components/StageTimer';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading } = useProject(id);
  const { data: progressList = [] } = useStageProgress(id);

  if (!id) return null;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Project not found.</p>
      </div>
    );
  }

  const stageStatuses = progressList.reduce((acc, sp) => {
    acc[sp.stage] = sp.status;
    return acc;
  }, {} as Record<PipelineStage, StageStatus>);

  const currentProgress = progressList.find(sp => sp.stage === project.current_stage);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-foreground">{project.name}</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
              {project.project_type === 'niche_eval' ? 'Niche Eval' : project.project_type === 'client_seo' ? 'Client SEO' : 'Custom'}
            </span>
          </div>
          {currentProgress && (
            <StageTimer
              stage={project.current_stage}
              timeSpentSeconds={currentProgress.time_spent_seconds}
              budgetSeconds={currentProgress.time_budget_seconds}
            />
          )}
        </div>
        <PipelineStepper projectId={id} currentStage={project.current_stage} stageStatuses={stageStatuses} />
      </div>

      <Outlet />
    </motion.div>
  );
}
