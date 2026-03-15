import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useEvaluations, useCreateDecision, useAdvanceStage, useProject } from '@/hooks/use-queries';
import type { DecisionType } from '@/lib/types';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function DecideStage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedEvalId, setSelectedEvalId] = useState<string>('');
  const [decision, setDecision] = useState<DecisionType | ''>('');
  const [reasoning, setReasoning] = useState('');
  const [confidence, setConfidence] = useState(3);

  const { data: project } = useProject(id);
  const { data: allEvals = [], isLoading } = useEvaluations(id);
  const createDecision = useCreateDecision();
  const advanceStage = useAdvanceStage();

  if (!id) return null;

  const evals = allEvals.filter(e => e.status === 'complete').sort((a, b) => (b.overall_score ?? 0) - (a.overall_score ?? 0));

  if (!selectedEvalId && evals.length > 0) {
    setSelectedEvalId(evals[0].id);
  }

  const scoreColor = (score: number | null) =>
    score === null ? 'text-muted-foreground' : score >= 3.5 ? 'stage-execute' : score >= 2 ? 'stage-decide' : 'text-destructive';

  const handleDecide = async () => {
    if (!decision) { toast.error('Select a decision.'); return; }
    if (decision === 'commit' && !reasoning) { toast.error('Add reasoning for your commitment.'); return; }

    try {
      await createDecision.mutateAsync({
        project_id: id,
        chosen_evaluation_id: decision === 'commit' ? selectedEvalId : undefined,
        decision: decision as DecisionType,
        reasoning,
        confidence,
      });

      if (decision === 'commit') {
        await advanceStage.mutateAsync({ projectId: id, currentStage: 'decide' });
        toast.success('Committed! Moving to Execute stage.');
        navigate(`/app/project/${id}/execute`);
      } else {
        toast.success('Decision recorded.');
      }
    } catch {
      toast.error('Failed to save decision');
    }
  };

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-40 w-full" /><Skeleton className="h-60 w-full" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
      {evals.length === 0 ? (
        <div className="card-surface p-8 text-center">
          <p className="text-sm text-muted-foreground">No completed evaluations. Complete at least one evaluation first.</p>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {evals.map(ev => (
              <div
                key={ev.id}
                className={`card-surface p-4 cursor-pointer transition-all duration-200 ${
                  selectedEvalId === ev.id ? 'ring-2 ring-foreground' : ''
                }`}
                onClick={() => setSelectedEvalId(ev.id)}
              >
                <h4 className="text-sm font-medium text-foreground mb-2 truncate">{ev.signal?.title || 'Evaluation'}</h4>
                <span className={`text-2xl font-bold tabular-nums ${scoreColor(ev.overall_score)}`}>
                  {ev.overall_score?.toFixed(1) ?? '—'}
                </span>
                <div className="mt-3 space-y-1">
                  {[
                    { label: 'Market', score: ev.market_size_score },
                    { label: 'Pain', score: ev.pain_severity_score },
                    { label: 'Competition', score: ev.competition_score },
                    { label: 'Tech Fit', score: ev.tech_fit_score },
                    { label: 'Effort', score: ev.build_effort_score },
                    { label: 'Revenue', score: ev.revenue_score },
                  ].map(({ label, score }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-16">{label}</span>
                      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-foreground/30 rounded-full" style={{ width: `${((score ?? 0) / 5) * 100}%` }} />
                      </div>
                      <span className="text-xs tabular-nums text-muted-foreground w-4">{score ?? '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="card-surface p-6 max-w-lg mx-auto">
            <h3 className="text-base font-semibold text-foreground mb-4">Make your decision</h3>

            <div className="space-y-4">
              <div>
                <Label className="text-sm mb-2 block">Decision</Label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: 'commit', label: 'Commit & Build', color: 'bg-stage-execute-subtle stage-execute' },
                    { value: 'pass', label: 'Pass on All', color: 'bg-muted text-muted-foreground' },
                    { value: 'revisit', label: 'Revisit Later', color: 'bg-stage-decide-subtle stage-decide' },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setDecision(opt.value)}
                      className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        decision === opt.value ? `${opt.color} ring-2 ring-offset-1 ring-foreground/20` : 'bg-muted text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Reasoning {decision === 'commit' && <span className="text-destructive">*</span>}</Label>
                <Textarea value={reasoning} onChange={e => setReasoning(e.target.value)} placeholder="Why this decision?" rows={3} className="mt-1" />
              </div>

              <div>
                <Label className="text-sm mb-2 block">Confidence: {confidence}/5</Label>
                <Slider value={[confidence]} onValueChange={([v]) => setConfidence(v)} min={1} max={5} step={1} />
              </div>

              <Button onClick={handleDecide} disabled={!decision || createDecision.isPending} className="w-full">
                {createDecision.isPending ? 'Saving...' :
                  decision === 'commit' ? 'Commit and Build →' : decision === 'pass' ? 'Pass on All' : decision === 'revisit' ? 'Revisit Later' : 'Select a decision'}
              </Button>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
