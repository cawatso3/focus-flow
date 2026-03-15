import { useEffect, useRef, useState } from 'react';
import { STAGE_CONFIG, type PipelineStage } from '@/lib/types';

interface StageTimerProps {
  stage: PipelineStage;
  timeSpentSeconds: number;
  budgetSeconds: number | null;
}

export function StageTimer({ stage, timeSpentSeconds, budgetSeconds }: StageTimerProps) {
  const [elapsed, setElapsed] = useState(timeSpentSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    setElapsed(timeSpentSeconds);
    intervalRef.current = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [timeSpentSeconds]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isOverBudget = budgetSeconds ? elapsed > budgetSeconds : false;
  const progress = budgetSeconds ? Math.min((elapsed / budgetSeconds) * 100, 100) : 0;
  const config = STAGE_CONFIG[stage];

  if (!budgetSeconds) return null;

  return (
    <div className="flex items-center gap-3">
      <div className="text-xs tabular-nums text-muted-foreground">
        <span className={isOverBudget ? 'text-destructive font-medium' : ''}>
          {formatTime(elapsed)}
        </span>
        <span className="text-muted-foreground"> / {formatTime(budgetSeconds)}</span>
      </div>
      <div className="w-24 h-1 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${isOverBudget ? 'bg-destructive' : config.bgClass}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      {isOverBudget && (
        <span className="text-xs text-destructive">
          {formatTime(elapsed - budgetSeconds)} over
        </span>
      )}
    </div>
  );
}
