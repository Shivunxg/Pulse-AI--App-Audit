'use client';

import { cn } from '@/lib/utils';

interface ScoreBarProps {
  label: string;
  score: number;
  icon?: React.ReactNode;
}

function getBarColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

export function ScoreBar({ label, score, icon }: ScoreBarProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium">{label}</span>
        </div>
        <span className="font-bold tabular-nums">{Math.round(clampedScore)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-out', getBarColor(clampedScore))}
          style={{ width: `${clampedScore}%` }}
        />
      </div>
    </div>
  );
}