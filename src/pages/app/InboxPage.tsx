import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Inbox, MoreHorizontal, Trash2, FolderOpen, CheckSquare, Square, Archive, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useSignals, useCreateSignal, useDeleteSignal, useUpdateSignal, useProjects } from '@/hooks/use-queries';
import type { SignalSource } from '@/lib/types';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function InboxPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newSource, setNewSource] = useState<SignalSource>('manual');
  const [newProjectId, setNewProjectId] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: allSignals = [], isLoading: signalsLoading } = useSignals();
  const { data: projects = [] } = useProjects();
  const createSignal = useCreateSignal();
  const deleteSignal = useDeleteSignal();
  const updateSignal = useUpdateSignal();

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === allSignals.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allSignals.map(s => s.id)));
    }
  };

  const handleBulkAssign = (projectId: string) => {
    selectedIds.forEach(id => {
      updateSignal.mutate({ id, updates: { project_id: projectId } as never });
    });
    toast.success(`Assigned ${selectedIds.size} signals`);
    setSelectedIds(new Set());
  };

  const handleBulkArchive = () => {
    selectedIds.forEach(id => {
      updateSignal.mutate({ id, updates: { status: 'archived' } as never });
    });
    toast.success(`Archived ${selectedIds.size} signals`);
    setSelectedIds(new Set());
  };

  const handleBulkDelete = () => {
    selectedIds.forEach(id => deleteSignal.mutate(id));
    toast.success(`Deleted ${selectedIds.size} signals`);
    setSelectedIds(new Set());
  };

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    try {
      await createSignal.mutateAsync({
        project_id: newProjectId && newProjectId !== 'none' ? newProjectId : undefined,
        source: newSource,
        title: newTitle.trim(),
        body: newBody || undefined,
      });
      toast.success('Signal captured!');
      setAddOpen(false);
      setNewTitle('');
      setNewBody('');
      setNewProjectId('');
    } catch {
      toast.error('Failed to add signal');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-foreground">Signal Inbox</h1>
        <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1">
          <Plus className="h-4 w-4" /> Add Signal
        </Button>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-muted flex items-center gap-3">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">Assign to Project</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {projects.map(p => (
                <DropdownMenuItem key={p.id} onClick={() => handleBulkAssign(p.id)}>
                  <FolderOpen className="mr-2 h-4 w-4" /> {p.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" variant="outline" onClick={handleBulkArchive}>
            <Archive className="mr-1 h-3.5 w-3.5" /> Archive
          </Button>
          <Button size="sm" variant="outline" className="text-destructive" onClick={handleBulkDelete}>
            <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>Clear</Button>
        </div>
      )}

      {signalsLoading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : allSignals.length === 0 ? (
        <div className="card-surface p-8 text-center">
          <Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-4" strokeWidth={1.5} />
          <h2 className="text-lg font-semibold text-foreground mb-2">Inbox is empty</h2>
          <p className="text-sm text-muted-foreground mb-4">Capture your first pain point, idea, or signal.</p>
          <Button onClick={() => setAddOpen(true)} className="gap-1">
            <Plus className="h-4 w-4" /> Add Signal
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Select all */}
          <div className="flex items-center gap-2 px-4 py-1">
            <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-foreground">
              {selectedIds.size === allSignals.length ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
            </button>
            <span className="text-xs text-muted-foreground">Select all</span>
          </div>
          {allSignals.map(signal => {
            const project = projects.find(p => p.id === signal.project_id);
            const isSelected = selectedIds.has(signal.id);
            return (
              <div key={signal.id} className={`card-surface p-4 flex items-start gap-3 ${isSelected ? 'ring-1 ring-foreground/20' : ''}`}>
                <button onClick={() => toggleSelect(signal.id)} className="mt-1 text-muted-foreground hover:text-foreground">
                  {isSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-foreground truncate">{signal.title}</h4>
                    {project && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                        {project.name}
                      </span>
                    )}
                    {!project && signal.project_id === null && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-stage-decide-subtle stage-decide shrink-0">
                        Unassigned
                      </span>
                    )}
                  </div>
                  {signal.body && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{signal.body}</p>}
                  <span className="text-xs text-muted-foreground mt-1 block">
                    {formatDistanceToNow(new Date(signal.created_at), { addSuffix: true })}
                  </span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {projects.map(p => (
                      <DropdownMenuItem key={p.id} onClick={() => { updateSignal.mutate({ id: signal.id, updates: { project_id: p.id } as never }); toast.success(`Assigned to ${p.name}`); }}>
                        <FolderOpen className="mr-2 h-4 w-4" /> Assign to {p.name}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem className="text-destructive" onClick={() => { deleteSignal.mutate(signal.id); toast.success('Signal deleted'); }}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Signal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Pain point or idea" className="mt-1" />
            </div>
            <div>
              <Label>Body (optional)</Label>
              <Textarea value={newBody} onChange={e => setNewBody(e.target.value)} rows={3} className="mt-1" />
            </div>
            <div>
              <Label>Assign to project (optional)</Label>
              <Select value={newProjectId} onValueChange={setNewProjectId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!newTitle.trim() || createSignal.isPending}>
              {createSignal.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
