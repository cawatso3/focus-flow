import { PIPELINE_STAGES, STAGE_CONFIG, type PipelineStage, type StageStatus } from '@/lib/types';
import { Check, Circle, SkipForward, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PipelineStepperProps {
  projectId: string;
  currentStage: PipelineStage;
  stageStatuses: Record<PipelineStage, StageStatus>;
}

export function PipelineStepper({ projectId, currentStage, stageStatuses }: PipelineStepperProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-1 w-full">
      {PIPELINE_STAGES.map((stage, i) => {
        const config = STAGE_CONFIG[stage];
        const status = stageStatuses[stage] || 'not_started';
        const isCurrent = stage === currentStage;
        const isClickable = status !== 'not_started' || isCurrent;

        return (
          <div key={stage} className="flex items-center gap-1 flex-1">
            <button
              disabled={!isClickable}
              onClick={() => isClickable && navigate(`/app/project/${projectId}/${stage}`)}
              className={`flex flex-col items-center gap-1.5 flex-1 py-2 px-1 rounded-lg transition-all duration-200 ${
                isClickable ? 'cursor-pointer hover:bg-muted/50' : 'cursor-default opacity-40'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                status === 'completed' ? `${config.bgClass} text-primary-foreground` :
                isCurrent ? `ring-2 ring-offset-2 ${config.ringClass} ${config.subtleClass}` :
                'bg-muted'
              }`}>
                {status === 'completed' ? <Check className="h-4 w-4" /> :
                 status === 'in_progress' ? <Loader2 className="h-4 w-4 animate-spin" /> :
                 status === 'skipped' ? <SkipForward className="h-3.5 w-3.5" /> :
                 <Circle className="h-3 w-3" />}
              </div>
              <span className={`text-xs font-medium ${isCurrent ? config.colorClass : 'text-muted-foreground'}`}>
                {config.label}
              </span>
            </button>
            {i < PIPELINE_STAGES.length - 1 && (
              <div className={`w-8 h-0.5 shrink-0 -mt-4 ${
                status === 'completed' ? 'bg-foreground/20' : 'bg-muted'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
