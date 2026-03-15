import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Inbox, Pencil, Link2, Upload, MoreHorizontal, Trash2, Archive, Radar, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useSignals, useCreateSignal, useUpdateSignal, useDeleteSignal, useProject, useAdvanceStage } from '@/hooks/use-queries';
import type { SignalSource, SignalStatus } from '@/lib/types';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const SOURCE_ICONS: Record<SignalSource, React.ReactNode> = {
  reddit: <span className="text-xs">📡</span>,
  g2: <span className="text-xs">⭐</span>,
  manual: <Pencil className="h-3.5 w-3.5" />,
  web_clip: <Link2 className="h-3.5 w-3.5" />,
  import: <Upload className="h-3.5 w-3.5" />,
  mcp: <Radar className="h-3.5 w-3.5" />,
};

const SOURCE_BADGE_STYLES: Record<SignalSource, string> = {
  reddit: 'bg-orange-100 text-orange-700',
  g2: 'bg-yellow-100 text-yellow-700',
  manual: 'bg-muted text-muted-foreground',
  web_clip: 'bg-blue-100 text-blue-700',
  import: 'bg-muted text-muted-foreground',
  mcp: 'bg-stage-evaluate-subtle stage-evaluate',
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
  const [infoDismissed, setInfoDismissed] = useState(() => localStorage.getItem('nc_capture_info_dismissed') === 'true');

  const { data: project } = useProject(id);
  const { data: allSignals = [], isLoading } = useSignals(id);
  const createSignal = useCreateSignal();
  const updateSignal = useUpdateSignal();
  const deleteSignal = useDeleteSignal();
  const advanceStage = useAdvanceStage();

  if (!id) return null;

  const filteredSignals = filter === 'all' ? allSignals : allSignals.filter(s => s.status === filter);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    try {
      await createSignal.mutateAsync({
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
    } catch {
      toast.error('Failed to add signal');
    }
  };

  const handleAdvance = async () => {
    if (allSignals.length < 5) {
      toast.error('Capture at least 5 signals before moving on.');
      return;
    }
    try {
      await advanceStage.mutateAsync({ projectId: id, currentStage: 'capture' });
      toast.success('Moving to Score stage!');
    } catch {
      toast.error('Failed to advance stage');
    }
  };

  const dismissInfo = () => {
    setInfoDismissed(true);
    localStorage.setItem('nc_capture_info_dismissed', 'true');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
      {/* Info card */}
      {!infoDismissed && (
        <div className="mb-4 p-3 rounded-lg bg-stage-capture-subtle border border-stage-capture/20 flex items-start gap-3">
          <Info className="h-4 w-4 stage-capture shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-foreground">Signals flow in from your AI tools via the NicheCommand API. Set up your API key in Settings → API Keys, then connect your MCP server in Windsurf.</p>
          </div>
          <button onClick={dismissInfo} className="text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

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

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : filteredSignals.length === 0 ? (
        <div className="card-surface p-8 text-center">
          <Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-4" strokeWidth={1.5} />
          <h3 className="text-base font-semibold text-foreground mb-2">No signals yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Start a research session in Claude or Windsurf — signals will appear here automatically. Or add one manually.</p>
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
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SOURCE_BADGE_STYLES[signal.source]}`}>
                      {signal.source}
                    </span>
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
                        <DropdownMenuItem onClick={() => updateSignal.mutate({ id: signal.id, updates: { status: 'archived' } })}>
                          <Archive className="mr-2 h-4 w-4" /> Archive
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => { deleteSignal.mutate(signal.id); toast.success('Signal deleted'); }}>
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

      {allSignals.length >= 5 && project?.current_stage === 'capture' && (
        <div className="mt-6 text-center">
          <Button onClick={handleAdvance} disabled={advanceStage.isPending} className="gap-1">
            Move to Score <span className="text-xs opacity-70">→</span>
          </Button>
          <p className="text-xs text-muted-foreground mt-2">{allSignals.length} signals captured</p>
        </div>
      )}

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
                  <SelectItem value="mcp">MCP</SelectItem>
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
            <Button onClick={handleAdd} disabled={!newTitle.trim() || createSignal.isPending}>
              {createSignal.isPending ? 'Saving...' : 'Save to Inbox'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
