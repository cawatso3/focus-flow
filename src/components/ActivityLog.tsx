import { useState } from 'react';
import { Search, MessageSquare, Hammer, StickyNote, Flag, Trophy, Radar, ExternalLink, Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useActivityLog, useCreateActivity } from '@/hooks/use-queries';
import type { ActivityType, PipelineStage } from '@/lib/types';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  research: <Search className="h-3.5 w-3.5" />,
  chat_external: <MessageSquare className="h-3.5 w-3.5" />,
  build_session: <Hammer className="h-3.5 w-3.5" />,
  note: <StickyNote className="h-3.5 w-3.5" />,
  decision: <Flag className="h-3.5 w-3.5" />,
  milestone: <Trophy className="h-3.5 w-3.5" />,
  signal_captured: <Radar className="h-3.5 w-3.5" />,
};

const TOOL_OPTIONS = ['Claude.ai', 'Windsurf', 'Claude Code', 'Cursor', 'Browser', 'n8n', 'Other'];

interface ActivityLogProps {
  projectId: string;
}

export function ActivityLog({ projectId }: ActivityLogProps) {
  const { data: activities = [], isLoading } = useActivityLog(projectId);
  const createActivity = useCreateActivity();
  const [logOpen, setLogOpen] = useState(false);
  const [activityType, setActivityType] = useState<ActivityType>('research');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [toolUsed, setToolUsed] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');

  const handleLog = async () => {
    if (!title.trim()) return;
    try {
      await createActivity.mutateAsync({
        project_id: projectId,
        activity_type: activityType,
        title: title.trim(),
        description: description || undefined,
        external_url: externalUrl || undefined,
        tool_used: toolUsed || undefined,
        duration_minutes: durationMinutes ? parseInt(durationMinutes) : undefined,
      });
      toast.success('Activity logged!');
      setLogOpen(false);
      setTitle('');
      setDescription('');
      setExternalUrl('');
      setToolUsed('');
      setDurationMinutes('');
    } catch {
      toast.error('Failed to log activity');
    }
  };

  return (
    <div>
      <Button size="sm" variant="outline" onClick={() => setLogOpen(true)} className="w-full gap-1 mb-3">
        <Plus className="h-3.5 w-3.5" /> Log Activity
      </Button>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : activities.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No activity yet</p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {activities.slice(0, 10).map(activity => (
            <div key={activity.id} className={`flex gap-2 p-2 rounded-lg ${activity.activity_type === 'signal_captured' ? 'bg-muted/30' : ''}`}>
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                {TYPE_ICONS[activity.activity_type] || <StickyNote className="h-3.5 w-3.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{activity.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at!), { addSuffix: true })}
                  </span>
                  {activity.tool_used && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{activity.tool_used}</span>
                  )}
                  {activity.duration_minutes && (
                    <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                      <Clock className="h-3 w-3" />{activity.duration_minutes}m
                    </span>
                  )}
                  {activity.external_url && (
                    <a href={activity.external_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                {activity.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{activity.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log Activity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Activity Type</Label>
              <Select value={activityType} onValueChange={v => setActivityType(v as ActivityType)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="research">Research</SelectItem>
                  <SelectItem value="chat_external">External Chat</SelectItem>
                  <SelectItem value="build_session">Build Session</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="decision">Decision</SelectItem>
                  <SelectItem value="milestone">Milestone</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="What did you do?" className="mt-1" />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1" />
            </div>
            <div>
              <Label>External URL (optional)</Label>
              <Input value={externalUrl} onChange={e => setExternalUrl(e.target.value)} placeholder="Link to chat, doc, or resource" className="mt-1" />
            </div>
            <div>
              <Label>Tool Used (optional)</Label>
              <Select value={toolUsed} onValueChange={setToolUsed}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select tool" /></SelectTrigger>
                <SelectContent>
                  {TOOL_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Duration (minutes, optional)</Label>
              <Input type="number" value={durationMinutes} onChange={e => setDurationMinutes(e.target.value)} className="mt-1 w-24" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setLogOpen(false)}>Cancel</Button>
            <Button onClick={handleLog} disabled={!title.trim() || createActivity.isPending}>
              {createActivity.isPending ? 'Saving...' : 'Log Activity'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
