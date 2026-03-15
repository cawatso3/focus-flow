import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Inbox, MoreHorizontal, Trash2, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getSignals, createSignal, deleteSignal, updateSignal, getProjects } from '@/lib/store';
import type { SignalSource } from '@/lib/types';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function InboxPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newSource, setNewSource] = useState<SignalSource>('manual');
  const [newProjectId, setNewProjectId] = useState<string>('');
  const [, setRefresh] = useState(0);

  const allSignals = getSignals();
  const projects = getProjects();

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    createSignal({
      project_id: newProjectId || undefined,
      source: newSource,
      title: newTitle.trim(),
      body: newBody || undefined,
    });
    toast.success('Signal captured!');
    setAddOpen(false);
    setNewTitle('');
    setNewBody('');
    setNewProjectId('');
    setRefresh(r => r + 1);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-foreground">Signal Inbox</h1>
        <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1">
          <Plus className="h-4 w-4" /> Add Signal
        </Button>
      </div>

      {allSignals.length === 0 ? (
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
          {allSignals.map(signal => {
            const project = projects.find(p => p.id === signal.project_id);
            return (
              <div key={signal.id} className="card-surface p-4 flex items-start gap-3">
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
                      <DropdownMenuItem key={p.id} onClick={() => { updateSignal(signal.id, { project_id: p.id } as Parameters<typeof updateSignal>[1]); setRefresh(r => r + 1); toast.success(`Assigned to ${p.name}`); }}>
                        <FolderOpen className="mr-2 h-4 w-4" /> Assign to {p.name}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem className="text-destructive" onClick={() => { deleteSignal(signal.id); setRefresh(r => r + 1); toast.success('Signal deleted'); }}>
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
            <Button onClick={handleAdd} disabled={!newTitle.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
