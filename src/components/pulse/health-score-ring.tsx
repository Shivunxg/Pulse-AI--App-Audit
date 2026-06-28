'use client';

import { cn } from '@/lib/utils';

interface HealthScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  showValue?: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-500';
  if (score >= 60) return 'text-amber-500';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-500';
}

function getScoreStrokeColor(score: number): string {
  if (score >= 80) return 'stroke-emerald-500';
  if (score >= 60) return 'stroke-amber-500';
  if (score >= 40) return 'stroke-orange-500';
  return 'stroke-red-500';
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Poor';
  return 'Critical';
}

export function HealthScoreRing({ score, size = 120, strokeWidth = 8, label, showValue = true }: HealthScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = getScoreColor(score);
  const strokeColor = getScoreStrokeColor(score);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className="stroke-muted"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            className={cn(strokeColor, 'transition-all duration-700 ease-out')}
          />
        </svg>
        {showValue && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn('text-2xl font-bold', color)}>
              {Math.round(score)}
            </span>
          </div>
        )}
      </div>
      {label && (
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      )}
      <span className={cn('text-xs font-medium', color)}>
        {getScoreLabel(score)}
      </span>
    </div>
  );
}