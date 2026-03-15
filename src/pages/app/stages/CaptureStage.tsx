import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Inbox, Pencil, Link2, Upload, MoreHorizontal, Trash2, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getSignals, createSignal, updateSignal, deleteSignal, getProject, advanceStage } from '@/lib/store';
import type { SignalSource, SignalStatus } from '@/lib/types';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const SOURCE_ICONS: Record<SignalSource, React.ReactNode> = {
  reddit: <span className="text-xs">📡</span>,
  g2: <span className="text-xs">⭐</span>,
  manual: <Pencil className="h-3.5 w-3.5" />,
  web_clip: <Link2 className="h-3.5 w-3.5" />,
  import: <Upload className="h-3.5 w-3.5" />,
};

const STATUS_STYLES: Record<SignalStatus, string> = {
  inbox: 'bg-muted text-muted-foreground',
  scored: 'bg-stage-score-subtle stage-score',
  promoted: 'bg-stage-evaluate-subtle stage-evaluate',
  archived: 'bg-muted text-muted-foreground',
};

export default function CaptureStage() {
  const { id } = useParams<{ id: string }>();
  const [addOpen, setAddOpen] = useState(false);
  const [filter, setFilter] = useState<SignalStatus | 'all'>('all');
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newSource, setNewSource] = useState<SignalSource>('manual');
  const [newTags, setNewTags] = useState('');
  const [, setRefresh] = useState(0);

  if (!id) return null;

  const project = getProject(id);
  const allSignals = getSignals(id);
  const filteredSignals = filter === 'all' ? allSignals : allSignals.filter(s => s.status === filter);

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    createSignal({
      project_id: id,
      source: newSource,
      title: newTitle.trim(),
      body: newBody || undefined,
      source_url: newUrl || undefined,
      tags: newTags ? newTags.split(',').map(t => t.trim()).filter(Boolean) : [],
    });
    toast.success('Signal captured!');
    setAddOpen(false);
    setNewTitle('');
    setNewBody('');
    setNewUrl('');
    setNewTags('');
    setRefresh(r => r + 1);
  };

  const handleAdvance = () => {
    if (allSignals.length < 5) {
      toast.error('Capture at least 5 signals before moving on.');
      return;
    }
    advanceStage(id);
    toast.success('Moving to Score stage!');
    setRefresh(r => r + 1);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {(['all', 'inbox', 'scored', 'promoted', 'archived'] as const).map(f => (
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
        <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1">
          <Plus className="h-4 w-4" /> Add Signal
        </Button>
      </div>

      {filteredSignals.length === 0 ? (
        <div className="card-surface p-8 text-center">
          <Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-4" strokeWidth={1.5} />
          <h3 className="text-base font-semibold text-foreground mb-2">No signals captured yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Add your first pain point, idea, or problem.</p>
          <Button onClick={() => setAddOpen(true)} className="gap-1">
            <Plus className="h-4 w-4" /> Add Signal
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSignals.map(signal => (
            <div key={signal.id} className="card-surface p-4 flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                {SOURCE_ICONS[signal.source]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-medium text-foreground truncate">{signal.title}</h4>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[signal.status]}`}>
                      {signal.status}
                    </span>
                    {signal.score !== null && (
                      <span className={`text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full ${
                        signal.score >= 4 ? 'bg-stage-execute-subtle stage-execute' :
                        signal.score >= 3 ? 'bg-stage-decide-subtle stage-decide' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {signal.score}
                      </span>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { updateSignal(signal.id, { status: 'archived' }); setRefresh(r => r + 1); }}>
                          <Archive className="mr-2 h-4 w-4" /> Archive
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => { deleteSignal(signal.id); setRefresh(r => r + 1); toast.success('Signal deleted'); }}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {signal.body && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{signal.body}</p>}
                <div className="flex items-center gap-2 mt-2">
                  {signal.tags.map(tag => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{tag}</span>
                  ))}
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(signal.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Advance button */}
      {allSignals.length >= 5 && project?.current_stage === 'capture' && (
        <div className="mt-6 text-center">
          <Button onClick={handleAdvance} className="gap-1">
            Move to Score <span className="text-xs opacity-70">→</span>
          </Button>
          <p className="text-xs text-muted-foreground mt-2">{allSignals.length} signals captured</p>
        </div>
      )}

      {/* Add Signal Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Signal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Source</Label>
              <Select value={newSource} onValueChange={v => setNewSource(v as SignalSource)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="web_clip">Web Clip</SelectItem>
                  <SelectItem value="import">Import</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Title</Label>
              <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Pain point or idea" className="mt-1" />
            </div>
            <div>
              <Label>Body (optional)</Label>
              <Textarea value={newBody} onChange={e => setNewBody(e.target.value)} placeholder="More details..." className="mt-1" rows={3} />
            </div>
            <div>
              <Label>URL (optional)</Label>
              <Input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://..." className="mt-1" />
            </div>
            <div>
              <Label>Tags (comma-separated)</Label>
              <Input value={newTags} onChange={e => setNewTags(e.target.value)} placeholder="saas, local-business" className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!newTitle.trim()}>Save to Inbox</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
