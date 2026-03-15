import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, GripVertical, Calendar, Trash2, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useUpdateProject } from '@/hooks/use-queries';
import type { TaskStatus, TaskPriority } from '@/lib/types';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { Skeleton } from '@/components/ui/skeleton';

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'todo', label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'blocked', label: 'Blocked' },
  { id: 'done', label: 'Done' },
];

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  urgent: 'text-destructive bg-destructive/10',
  high: 'stage-decide bg-stage-decide-subtle',
  medium: 'stage-capture bg-stage-capture-subtle',
  low: 'text-muted-foreground bg-muted',
};

export default function ExecuteStage() {
  const { id } = useParams<{ id: string }>();
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPhase, setNewPhase] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newDue, setNewDue] = useState('');

  const { data: tasks = [], isLoading } = useTasks(id);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const updateProject = useUpdateProject();

  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId as TaskStatus;
    updateTask.mutate({ id: result.draggableId, updates: { status: newStatus } });
  }, [updateTask]);

  if (!id) return null;

  const done = tasks.filter(t => t.status === 'done').length;
  const allDone = tasks.length > 0 && done === tasks.length;
  const progressPercent = tasks.length > 0 ? (done / tasks.length) * 100 : 0;

  const handleAdd = async () => {
    if (!newTitle.trim() || !id) return;
    try {
      await createTask.mutateAsync({
        project_id: id,
        title: newTitle.trim(),
        description: newDesc || undefined,
        phase: newPhase || undefined,
        priority: newPriority,
        due_date: newDue || undefined,
      });
      toast.success('Task created!');
      setAddOpen(false);
      setNewTitle('');
      setNewDesc('');
      setNewPhase('');
      setNewPriority('medium');
      setNewDue('');
    } catch {
      toast.error('Failed to create task');
    }
  };

  const handleMarkComplete = () => {
    updateProject.mutate({ id, updates: { status: 'completed' } });
    toast.success('🎉 Project completed!');
  };

  if (isLoading) {
    return <div className="grid grid-cols-4 gap-3">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 w-full" />)}</div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4 flex-1">
          <span className="text-sm text-muted-foreground">
            {done} of {tasks.length} tasks complete
          </span>
          {tasks.length > 0 && (
            <Progress value={progressPercent} className="w-32 h-1.5" />
          )}
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1">
          <Plus className="h-4 w-4" /> Add Task
        </Button>
      </div>

      {allDone && (
        <div className="mb-6 card-surface p-6 text-center border-l-4 border-stage-execute">
          <Trophy className="h-8 w-8 stage-execute mx-auto mb-2" />
          <h3 className="text-base font-semibold text-foreground mb-1">All tasks complete! 🎉</h3>
          <p className="text-sm text-muted-foreground mb-4">You've shipped it. Mark this project as complete?</p>
          <Button onClick={handleMarkComplete} className="gap-1">Mark Project Complete</Button>
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-4 gap-3">
          {COLUMNS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id);
            return (
              <div key={col.id}>
                <h4 className="text-label mb-3">{col.label} ({colTasks.length})</h4>
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[200px] rounded-lg p-2 transition-colors duration-200 ${
                        snapshot.isDraggingOver ? 'bg-muted/50' : ''
                      }`}
                    >
                      {colTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="card-surface p-3 mb-2"
                            >
                              <div className="flex items-start gap-2">
                                <div {...provided.dragHandleProps} className="mt-0.5 text-muted-foreground cursor-grab">
                                  <GripVertical className="h-3.5 w-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground">{task.title}</p>
                                  {task.phase && <p className="text-xs text-muted-foreground mt-0.5">{task.phase}</p>}
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_STYLES[task.priority]}`}>
                                      {task.priority}
                                    </span>
                                    {task.due_date && (
                                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(task.due_date).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={() => deleteTask.mutate(task.id)}
                                  className="text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="What needs to be done?" className="mt-1" />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={2} className="mt-1" />
            </div>
            <div>
              <Label>Phase</Label>
              <Input value={newPhase} onChange={e => setNewPhase(e.target.value)} placeholder="e.g., Phase 1: Scaffold" className="mt-1" />
            </div>
            <div>
              <Label className="mb-2 block">Priority</Label>
              <RadioGroup value={newPriority} onValueChange={v => setNewPriority(v as TaskPriority)} className="flex gap-3">
                {(['low', 'medium', 'high', 'urgent'] as const).map(p => (
                  <div key={p} className="flex items-center space-x-1">
                    <RadioGroupItem value={p} id={`pri-${p}`} />
                    <Label htmlFor={`pri-${p}`} className="text-sm capitalize">{p}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div>
              <Label>Due Date (optional)</Label>
              <Input type="date" value={newDue} onChange={e => setNewDue(e.target.value)} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!newTitle.trim() || createTask.isPending}>
              {createTask.isPending ? 'Adding...' : 'Add Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
