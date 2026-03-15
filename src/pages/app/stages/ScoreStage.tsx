import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, ArrowUpRight, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useSignals, useUpdateSignal, useCreateEvaluation, useProject, useAdvanceStage } from '@/hooks/use-queries';
import { supabase } from '@/integrations/supabase/client';
import type { AiAssessment } from '@/lib/types';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const SCORE_LABELS = ['', 'Weak signal', 'Mild interest', 'Worth exploring', 'Strong signal', 'Must investigate'];

const VERDICT_STYLES: Record<string, string> = {
  skip: 'bg-muted text-muted-foreground',
  weak: 'bg-destructive/10 text-destructive',
  interesting: 'bg-stage-decide-subtle stage-decide',
  strong: 'bg-stage-capture-subtle stage-capture',
  must_build: 'bg-stage-execute-subtle stage-execute',
};

export default function ScoreStage() {
  const { id } = useParams<{ id: string }>();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [assessingIds, setAssessingIds] = useState<Set<string>>(new Set());
  const [bulkAssessing, setBulkAssessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });

  const { data: project } = useProject(id);
  const { data: allSignals = [], isLoading } = useSignals(id);
  const updateSignal = useUpdateSignal();
  const createEvaluation = useCreateEvaluation();
  const advanceStage = useAdvanceStage();

  if (!id) return null;

  const scored = allSignals.filter(s => s.score !== null).length;
  const promoted = allSignals.filter(s => s.status === 'promoted').length;

  const handleScore = (signalId: string, score: number) => {
    updateSignal.mutate({ id: signalId, updates: { score, status: score > 0 ? 'scored' : 'inbox' } as never });
  };

  const handleAssess = async (signalId: string) => {
    setAssessingIds(prev => new Set(prev).add(signalId));
    try {
      const { data, error } = await supabase.functions.invoke('assess-signal', {
        body: { signal_id: signalId },
      });
      if (error) throw error;
      // Signal is updated server-side, just invalidate
      updateSignal.mutate({ id: signalId, updates: {} }); // triggers refetch
      toast.success('AI assessment complete!');
    } catch (err) {
      toast.error('AI assessment failed. Check that your Anthropic API key is set.');
    } finally {
      setAssessingIds(prev => { const s = new Set(prev); s.delete(signalId); return s; });
    }
  };

  const handleBulkAssess = async () => {
    const unscored = allSignals.filter(s => s.status === 'inbox' && s.score === null);
    if (unscored.length === 0) { toast.info('No unscored signals'); return; }
    setBulkAssessing(true);
    setBulkProgress({ current: 0, total: unscored.length });
    for (let i = 0; i < unscored.length; i++) {
      setBulkProgress({ current: i + 1, total: unscored.length });
      await handleAssess(unscored[i].id);
    }
    setBulkAssessing(false);
    toast.success('All signals assessed!');
  };

  const handlePromote = async (signalId: string) => {
    try {
      await createEvaluation.mutateAsync({ project_id: id, signal_id: signalId });
      updateSignal.mutate({ id: signalId, updates: { status: 'promoted' } as never });
      toast.success('Signal promoted to evaluation!');
    } catch {
      toast.error('Failed to promote signal');
    }
  };

  const handleAdvance = async () => {
    if (promoted < 1) {
      toast.error('Promote at least 1 signal before moving on.');
      return;
    }
    try {
      await advanceStage.mutateAsync({ projectId: id, currentStage: 'score' });
      toast.success('Moving to Evaluate stage!');
    } catch {
      toast.error('Failed to advance stage');
    }
  };

  if (isLoading) {
    return <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
      <div className="mb-4 flex items-center justify-between">
        <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
          {scored} of {allSignals.length} signals scored. {promoted} promoted to evaluation.
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleBulkAssess}
          disabled={bulkAssessing}
          className="gap-1"
        >
          {bulkAssessing ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Scoring {bulkProgress.current} of {bulkProgress.total}...
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" /> Score All Unscored
            </>
          )}
        </Button>
      </div>

      {allSignals.length === 0 ? (
        <div className="card-surface p-8 text-center">
          <p className="text-sm text-muted-foreground">No signals to score. Go back to Capture to add some.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {allSignals.map(signal => {
            const expanded = expandedId === signal.id;
            const assessing = assessingIds.has(signal.id);
            const assessment = signal.ai_assessment as AiAssessment | null;

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
                  {assessment && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${VERDICT_STYLES[assessment.verdict] || 'bg-muted text-muted-foreground'}`}>
                      {assessment.verdict}
                    </span>
                  )}
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

                    {/* AI Assessment button */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAssess(signal.id)}
                      disabled={assessing}
                      className="gap-1"
                    >
                      {assessing ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Assessing...</>
                      ) : (
                        <><Sparkles className="h-3.5 w-3.5" /> Assess with AI</>
                      )}
                    </Button>

                    {/* AI Assessment display */}
                    {assessment && (
                      <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${VERDICT_STYLES[assessment.verdict] || 'bg-muted'}`}>
                            {assessment.verdict}
                          </span>
                          <span className="text-lg font-bold tabular-nums">{assessment.score}/5</span>
                        </div>
                        <p className="text-sm text-foreground">{assessment.reasoning}</p>
                        <div className="flex flex-wrap gap-1">
                          {assessment.green_flags?.map((f, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-stage-execute-subtle stage-execute">{f}</span>
                          ))}
                          {assessment.red_flags?.map((f, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">{f}</span>
                          ))}
                        </div>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          {assessment.market_guess && <p>📊 {assessment.market_guess}</p>}
                          {assessment.competition_note && <p>⚔️ {assessment.competition_note}</p>}
                          {assessment.build_effort && <p>🔨 {assessment.build_effort}</p>}
                        </div>
                      </div>
                    )}

                    {/* Manual score slider */}
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">
                        Manual Score: {signal.score ?? 0}/5 — {SCORE_LABELS[signal.score ?? 0] || 'Not scored'}
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
                        onChange={e => updateSignal.mutate({ id: signal.id, updates: { score_reasoning: e.target.value } as never })}
                        placeholder="Why this score?"
                        rows={2}
                      />
                    </div>

                    {signal.status !== 'promoted' && signal.score !== null && signal.score >= 3 && (
                      <Button size="sm" onClick={() => handlePromote(signal.id)} className="gap-1">
                        <ArrowUpRight className="h-3.5 w-3.5" /> Promote to Evaluation
                      </Button>
                    )}
                    {signal.status !== 'promoted' && signal.score !== null && signal.score < 3 && (
                      <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => updateSignal.mutate({ id: signal.id, updates: { status: 'archived' } as never })}>
                        Archive (low score)
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
          <Button onClick={handleAdvance} disabled={advanceStage.isPending} className="gap-1">
            Move to Evaluate <span className="text-xs opacity-70">→</span>
          </Button>
        </div>
      )}
    </motion.div>
  );
}
