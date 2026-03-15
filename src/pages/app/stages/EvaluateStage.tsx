import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useEvaluations, useUpdateEvaluation, useProject, useAdvanceStage } from '@/hooks/use-queries';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface ScoreFieldProps {
  label: string;
  question: string;
  textValue: string | null;
  scoreValue: number | null;
  lowLabel: string;
  highLabel: string;
  onTextChange: (v: string) => void;
  onScoreChange: (v: number) => void;
  extraField?: React.ReactNode;
}

function ScoreField({ label, question, textValue, scoreValue, lowLabel, highLabel, onTextChange, onScoreChange, extraField }: ScoreFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <p className="text-xs text-muted-foreground">{question}</p>
      <Textarea value={textValue || ''} onChange={e => onTextChange(e.target.value)} rows={2} />
      {extraField}
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>1 — {lowLabel}</span>
          <span>5 — {highLabel}</span>
        </div>
        <Slider value={[scoreValue ?? 0]} onValueChange={([v]) => onScoreChange(v)} min={0} max={5} step={1} />
        <p className="text-xs text-muted-foreground mt-1 text-right tabular-nums">{scoreValue ?? 0}/5</p>
      </div>
    </div>
  );
}

export default function EvaluateStage() {
  const { id } = useParams<{ id: string }>();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: project } = useProject(id);
  const { data: evals = [], isLoading } = useEvaluations(id);
  const updateEvaluation = useUpdateEvaluation();
  const advanceStage = useAdvanceStage();

  if (!id) return null;

  const sortedEvals = [...evals].sort((a, b) => (b.overall_score ?? 0) - (a.overall_score ?? 0));
  const complete = sortedEvals.filter(e => e.status === 'complete').length;

  const save = (evalId: string, updates: Record<string, unknown>) => {
    updateEvaluation.mutate({ id: evalId, updates: updates as never });
  };

  const scoreColor = (score: number | null) =>
    score === null ? 'text-muted-foreground' : score >= 3.5 ? 'stage-execute' : score >= 2 ? 'stage-decide' : 'text-destructive';

  const handleAdvance = async () => {
    if (complete < 1) { toast.error('Complete at least 1 evaluation.'); return; }
    try {
      await advanceStage.mutateAsync({ projectId: id, currentStage: 'evaluate' });
      toast.success('Moving to Decide stage!');
    } catch {
      toast.error('Failed to advance stage');
    }
  };

  if (isLoading) {
    return <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
      <div className="mb-4 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
        {complete} of {sortedEvals.length} evaluations complete.
      </div>

      {sortedEvals.length === 0 ? (
        <div className="card-surface p-8 text-center">
          <p className="text-sm text-muted-foreground">No evaluations yet. Promote signals from the Score stage first.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedEvals.map(ev => {
            const expanded = expandedId === ev.id;
            const filledCount = [ev.market_size_score, ev.pain_severity_score, ev.competition_score, ev.tech_fit_score, ev.build_effort_score, ev.revenue_score].filter(s => s !== null && s > 0).length;

            return (
              <div key={ev.id} className="card-surface">
                <button className="w-full p-4 flex items-center gap-3 text-left" onClick={() => setExpandedId(expanded ? null : ev.id)}>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground truncate">{ev.signal?.title || 'Evaluation'}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{filledCount}/6 fields • {ev.status}</p>
                  </div>
                  <span className={`text-lg font-bold tabular-nums ${scoreColor(ev.overall_score)}`}>
                    {ev.overall_score?.toFixed(1) ?? '—'}
                  </span>
                  {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>

                {expanded && (
                  <div className="px-4 pb-4 space-y-6 border-t border-border/50 pt-4">
                    <ScoreField label="Market Size" question="How big is this market?" textValue={ev.market_size_estimate} scoreValue={ev.market_size_score} lowLabel="Tiny niche" highLabel="Massive market" onTextChange={v => save(ev.id, { market_size_estimate: v })} onScoreChange={v => save(ev.id, { market_size_score: v || null })} />
                    <ScoreField label="Pain Severity" question="How badly do people need this solved?" textValue={ev.pain_description} scoreValue={ev.pain_severity_score} lowLabel="Mild annoyance" highLabel="Hair on fire" onTextChange={v => save(ev.id, { pain_description: v })} onScoreChange={v => save(ev.id, { pain_severity_score: v || null })} />
                    <ScoreField label="Competition" question="Who else is solving this? What's your edge?" textValue={ev.competitors} scoreValue={ev.competition_score} lowLabel="Red ocean" highLabel="Blue ocean" onTextChange={v => save(ev.id, { competitors: v })} onScoreChange={v => save(ev.id, { competition_score: v || null })} />
                    <ScoreField label="Tech Fit" question="Can you build this with your current stack?" textValue={ev.tech_fit_notes} scoreValue={ev.tech_fit_score} lowLabel="Need to learn everything" highLabel="Perfect fit" onTextChange={v => save(ev.id, { tech_fit_notes: v })} onScoreChange={v => save(ev.id, { tech_fit_score: v || null })} />
                    <ScoreField label="Build Effort" question="How long to reach MVP?" textValue={ev.complexity_notes} scoreValue={ev.build_effort_score} lowLabel="Months of work" highLabel="Ship in a week" onTextChange={v => save(ev.id, { complexity_notes: v })} onScoreChange={v => save(ev.id, { build_effort_score: v || null })}
                      extraField={
                        <div>
                          <Label className="text-xs text-muted-foreground">Estimated weeks to MVP</Label>
                          <Input type="number" min={1} max={52} value={ev.estimated_weeks ?? ''} onChange={e => save(ev.id, { estimated_weeks: e.target.value ? parseInt(e.target.value) : null })} className="mt-1 w-24" />
                        </div>
                      }
                    />
                    <ScoreField label="Revenue Potential" question="How will this make money? How much?" textValue={ev.revenue_estimate} scoreValue={ev.revenue_score} lowLabel="Unclear path" highLabel="Proven model" onTextChange={v => save(ev.id, { revenue_estimate: v })} onScoreChange={v => save(ev.id, { revenue_score: v || null })} />

                    <div>
                      <Label className="text-sm font-medium">Research Notes</Label>
                      <Textarea value={ev.research_notes || ''} onChange={e => save(ev.id, { research_notes: e.target.value })} rows={3} className="mt-1" />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`text-2xl font-bold tabular-nums ${scoreColor(ev.overall_score)}`}>
                        {ev.overall_score?.toFixed(1) ?? '—'} <span className="text-sm font-normal text-muted-foreground">/ 5.0</span>
                      </span>
                      {ev.status !== 'complete' && (
                        <Button size="sm" onClick={() => { save(ev.id, { status: 'complete' }); toast.success('Evaluation marked complete!'); }} className="gap-1">
                          <Check className="h-3.5 w-3.5" /> Mark Complete
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {complete >= 1 && project?.current_stage === 'evaluate' && (
        <div className="mt-6 text-center">
          <Button onClick={handleAdvance} disabled={advanceStage.isPending} className="gap-1">
            Move to Decide <span className="text-xs opacity-70">→</span>
          </Button>
        </div>
      )}
    </motion.div>
  );
}
