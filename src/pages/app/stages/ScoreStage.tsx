import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getSignals, updateSignal, createEvaluation, getProject, advanceStage } from '@/lib/store';
import { toast } from 'sonner';

const SCORE_LABELS = ['', 'Weak signal', 'Mild interest', 'Worth exploring', 'Strong signal', 'Must investigate'];

export default function ScoreStage() {
  const { id } = useParams<{ id: string }>();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [, setRefresh] = useState(0);

  if (!id) return null;

  const project = getProject(id);
  const allSignals = getSignals(id);
  const scored = allSignals.filter(s => s.score !== null).length;
  const promoted = allSignals.filter(s => s.status === 'promoted').length;

  const handleScore = (signalId: string, score: number) => {
    updateSignal(signalId, { score, status: score > 0 ? 'scored' : 'inbox' });
    setRefresh(r => r + 1);
  };

  const handlePromote = (signalId: string) => {
    const signal = allSignals.find(s => s.id === signalId);
    if (!signal) return;
    createEvaluation({ project_id: id, signal_id: signalId });
    updateSignal(signalId, { status: 'promoted' });
    toast.success('Signal promoted to evaluation!');
    setRefresh(r => r + 1);
  };

  const handleAdvance = () => {
    if (promoted < 1) {
      toast.error('Promote at least 1 signal before moving on.');
      return;
    }
    advanceStage(id);
    toast.success('Moving to Evaluate stage!');
    setRefresh(r => r + 1);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
      <div className="mb-4 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
        {scored} of {allSignals.length} signals scored. {promoted} promoted to evaluation.
      </div>

      {allSignals.length === 0 ? (
        <div className="card-surface p-8 text-center">
          <p className="text-sm text-muted-foreground">No signals to score. Go back to Capture to add some.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {allSignals.map(signal => {
            const expanded = expandedId === signal.id;
            return (
              <div key={signal.id} className="card-surface">
                <button
                  className="w-full p-4 flex items-center gap-3 text-left"
                  onClick={() => setExpandedId(expanded ? null : signal.id)}
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground truncate">{signal.title}</h4>
                    {!expanded && signal.body && <p className="text-xs text-muted-foreground mt-0.5 truncate">{signal.body}</p>}
                  </div>
                  {signal.score !== null && (
                    <span className={`text-sm font-semibold tabular-nums px-2 py-0.5 rounded-full ${
                      signal.score >= 4 ? 'bg-stage-execute-subtle stage-execute' :
                      signal.score >= 3 ? 'bg-stage-decide-subtle stage-decide' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {signal.score}/5
                    </span>
                  )}
                  {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>

                {expanded && (
                  <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-4">
                    {signal.body && <p className="text-sm text-foreground">{signal.body}</p>}

                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">
                        Score: {signal.score ?? 0}/5 — {SCORE_LABELS[signal.score ?? 0] || 'Not scored'}
                      </Label>
                      <Slider
                        value={[signal.score ?? 0]}
                        onValueChange={([v]) => handleScore(signal.id, v)}
                        min={0}
                        max={5}
                        step={1}
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Reasoning</Label>
                      <Textarea
                        value={signal.score_reasoning || ''}
                        onChange={e => { updateSignal(signal.id, { score_reasoning: e.target.value }); setRefresh(r => r + 1); }}
                        placeholder="Why this score?"
                        rows={2}
                      />
                    </div>

                    {signal.status !== 'promoted' && signal.score !== null && signal.score >= 3 && (
                      <Button size="sm" onClick={() => handlePromote(signal.id)} className="gap-1">
                        <ArrowUpRight className="h-3.5 w-3.5" /> Promote to Evaluation
                      </Button>
                    )}
                    {signal.status === 'promoted' && (
                      <span className="text-xs text-muted-foreground bg-stage-evaluate-subtle stage-evaluate px-2 py-1 rounded-full">Promoted</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {promoted >= 1 && project?.current_stage === 'score' && (
        <div className="mt-6 text-center">
          <Button onClick={handleAdvance} className="gap-1">
            Move to Evaluate <span className="text-xs opacity-70">→</span>
          </Button>
        </div>
      )}
    </motion.div>
  );
}
