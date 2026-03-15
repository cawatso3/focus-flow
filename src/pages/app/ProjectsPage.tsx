import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useProjects, useCreateProject, useUpdateProject, useStageProgress } from '@/hooks/use-queries';
import { STAGE_CONFIG, PIPELINE_STAGES, type ProjectType, type ProjectStatus } from '@/lib/types';
import { PipelineStepper } from '@/components/PipelineStepper';
import type { PipelineStage, StageStatus as StageStatusType } from '@/lib/types';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_COLORS: Record<ProjectStatus, string> = {
  active: 'bg-stage-execute-subtle stage-execute',
  paused: 'bg-stage-decide-subtle stage-decide',
  completed: 'bg-stage-capture-subtle stage-capture',
  archived: 'bg-muted text-muted-foreground',
};

const TYPE_LABELS: Record<ProjectType, string> = {
  niche_eval: 'Niche Eval',
  client_seo: 'Client SEO',
  custom: 'Custom',
};

function ProjectCard({ project }: { project: import('@/lib/types').Project }) {
  const navigate = useNavigate();
  const updateProject = useUpdateProject();
  const { data: progressList = [] } = useStageProgress(project.id);

  const stageStatuses = progressList.reduce((acc, sp) => {
    acc[sp.stage] = sp.status;
    return acc;
  }, {} as Record<PipelineStage, StageStatusType>);

  return (
    <div
      className="card-interactive p-5 cursor-pointer"
      onClick={() => navigate(`/app/project/${project.id}/${project.current_stage}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">{project.name}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[project.status]}`}>
          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
        </span>
      </div>
      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
        {TYPE_LABELS[project.project_type]}
      </span>
      <div className="mt-4">
        <PipelineStepper projectId={project.id} currentStage={project.current_stage} stageStatuses={stageStatuses} />
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        Updated {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
      </p>
      {!project.is_focused && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            updateProject.mutate({ id: project.id, updates: { is_focused: true } });
            toast.success(`Focused on ${project.name}`);
          }}
        >
          Set as focused
        </Button>
      )}
    </div>
  );
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<ProjectType>('niche_eval');

  const { data: projects = [], isLoading } = useProjects(filter === 'all' ? undefined : filter);
  const createProject = useCreateProject();

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const project = await createProject.mutateAsync({ name: newName.trim(), description: newDesc || undefined, project_type: newType });
      toast.success('Project created!');
      setCreateOpen(false);
      setNewName('');
      setNewDesc('');
      setNewType('niche_eval');
      navigate(`/app/project/${project.id}/capture`);
    } catch (err) {
      toast.error('Failed to create project');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-foreground">Projects</h1>
        <Button onClick={() => setCreateOpen(true)} className="gap-1">
          <Plus className="h-4 w-4" /> New Project
        </Button>
      </div>

      <div className="flex gap-2 mb-6">
        {(['all', 'active', 'paused', 'completed', 'archived'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
              filter === f ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="card-surface p-8 text-center">
          <FolderOpen className="h-10 w-10 text-muted-foreground mx-auto mb-4" strokeWidth={1.5} />
          <h2 className="text-lg font-semibold text-foreground mb-2">No projects yet</h2>
          <p className="text-sm text-muted-foreground mb-4">Create your first research pipeline to get started.</p>
          <Button onClick={() => setCreateOpen(true)} className="gap-1">
            <Plus className="h-4 w-4" /> New Project
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="project-name">Name</Label>
              <Input id="project-name" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g., Local Business SaaS" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="project-desc">Description (optional)</Label>
              <Textarea id="project-desc" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Brief description..." className="mt-1" rows={2} />
            </div>
            <div>
              <Label className="mb-2 block">Type</Label>
              <RadioGroup value={newType} onValueChange={v => setNewType(v as ProjectType)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="niche_eval" id="niche_eval" />
                  <Label htmlFor="niche_eval">Niche Evaluation</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="client_seo" id="client_seo" />
                  <Label htmlFor="client_seo">Client SEO</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label htmlFor="custom">Custom</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newName.trim() || createProject.isPending}>
              {createProject.isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
