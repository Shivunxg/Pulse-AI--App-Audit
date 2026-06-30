'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
}

function ringColor(score: number): string {
  if (score >= 80) return '#16a34a';
  if (score >= 60) return '#d97706';
  return '#dc2626';
}

interface WidgetResult {
  url: string;
  healthScore: number;
  performanceScore: number;
  seoScore: number;
  securityScore: number;
  criticalCount: number;
  topIssue: string | null;
}

export function LiveAuditWidget() {
  const { navigate } = useAppStore();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WidgetResult | null>(null);

  const runAudit = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/widget/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }
      setResult(data);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border bg-card p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          id="hero-widget-input"
          placeholder="yourwebsite.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && runAudit()}
          className="h-11"
        />
        <Button onClick={runAudit} disabled={loading || !url.trim()} className="h-11 sm:px-6">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Run Free Audit'}
        </Button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {result && (
        <div className="mt-5 pt-5 border-t">
          <div className="flex items-center gap-4">
            <div
              className="h-16 w-16 rounded-full flex items-center justify-center shrink-0"
              style={{ border: `5px solid ${ringColor(result.healthScore)}` }}
            >
              <span className={`text-xl font-extrabold ${scoreColor(result.healthScore)}`}>
                {Math.round(result.healthScore)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Health Score for {result.url}</p>
              <p className={`text-sm font-semibold flex items-center gap-1.5 mt-0.5 ${result.criticalCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {result.criticalCount > 0 ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                {result.criticalCount > 0
                  ? `${result.criticalCount} critical issue${result.criticalCount > 1 ? 's' : ''} found`
                  : 'No critical issues'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-muted/50 rounded-lg p-2.5 text-center">
              <p className={`text-base font-bold ${scoreColor(result.performanceScore)}`}>{Math.round(result.performanceScore)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Performance</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2.5 text-center">
              <p className={`text-base font-bold ${scoreColor(result.seoScore)}`}>{Math.round(result.seoScore)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">SEO</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2.5 text-center">
              <p className={`text-base font-bold ${scoreColor(result.securityScore)}`}>{Math.round(result.securityScore)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Security</p>
            </div>
          </div>

          {result.topIssue && (
            <div className="mt-3 text-xs bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2 text-red-700 dark:text-red-400">
              {result.topIssue}
            </div>
          )}

          <Button className="w-full mt-4" onClick={() => navigate('auth')}>
            See Full Report & Fix Recommendations <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
