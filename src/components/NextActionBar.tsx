import { useNavigate } from 'react-router-dom';
import { ArrowRight, Crosshair } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFocusedProject } from '@/hooks/use-queries';
import { STAGE_CONFIG } from '@/lib/types';

export function NextActionBar() {
  const navigate = useNavigate();
  const { data: project } = useFocusedProject();

  if (!project) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="text-muted-foreground gap-2 text-xs" onClick={() => navigate('/app/projects')}>
          <Crosshair className="h-3.5 w-3.5" />
          Create your first project
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  const stageConfig = STAGE_CONFIG[project.current_stage];

  return (
    <div className={`flex items-center gap-3 px-3 py-1.5 rounded-full ${stageConfig.subtleClass} max-w-xl`}>
      <span className={`text-xs font-medium ${stageConfig.colorClass}`}>{stageConfig.label}</span>
      <span className="text-xs text-muted-foreground">•</span>
      <span className="text-xs font-medium text-foreground truncate">{project.name}</span>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs gap-1 ml-auto"
        onClick={() => navigate(`/app/project/${project.id}/${project.current_stage}`)}
      >
        Continue <ArrowRight className="h-3 w-3" />
      </Button>
    </div>
  );
}
