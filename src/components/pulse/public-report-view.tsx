'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HealthScoreRing } from './health-score-ring';
import { ScoreBar } from './score-bar';
import {
  HeartPulse, AlertCircle, AlertTriangle, CheckCircle2, Info,
  ExternalLink, Sparkles, ArrowRight,
} from 'lucide-react';

interface PublicAudit {
  id: string;
  mode: string;
  healthScore: number | null;
  performanceScore: number | null;
  seoScore: number | null;
  accessibilityScore: number | null;
  securityScore: number | null;
  uxScore: number | null;
  technologyScore: number | null;
  contentScore: number | null;
  findings: any;
  aiSummary: any;
  responseTime: number | null;
  pageSize: number | null;
  createdAt: string;
  project: { name: string; url: string; type: string };
}

const SCORE_CONFIG = [
  { key: 'performanceScore', label: 'Performance' },
  { key: 'seoScore', label: 'SEO' },
  { key: 'accessibilityScore', label: 'Accessibility' },
  { key: 'securityScore', label: 'Security' },
  { key: 'uxScore', label: 'UX' },
] as const;

function SeverityIcon({ severity }: { severity: string }) {
  switch (severity) {
    case 'critical': return <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />;
    case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />;
    case 'info': return <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />;
    case 'passed': return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />;
    default: return null;
  }
}

export function PublicReportView({ audit }: { audit: PublicAudit }) {
  const findings = audit.findings || {};
  const summary = audit.aiSummary || {};

  const allIssues = Object.values(findings).flatMap((cat: any) => cat?.issues || []);
  const criticals = allIssues.filter((i: any) => i.severity === 'critical');
  const warnings = allIssues.filter((i: any) => i.severity === 'warning');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <HeartPulse className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">Pulse AI</span>
          </a>
          <Button size="sm" asChild>
            <a href="/">
              Audit Your Site Free <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </a>
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{audit.project.name}</h1>
            <Badge variant="outline" className="text-xs">{audit.mode === 'deep' ? 'Deep Audit' : 'Simple Audit'}</Badge>
          </div>
          <a href={audit.project.url} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mt-1">
            {audit.project.url} <ExternalLink className="h-3 w-3" />
          </a>
          <p className="text-xs text-muted-foreground mt-1">Audited {new Date(audit.createdAt).toLocaleDateString()}</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <HealthScoreRing score={audit.healthScore || 0} size={150} strokeWidth={12} label="Product Health Score" />
              <div className="flex-1 w-full space-y-4">
                {SCORE_CONFIG.map(({ key, label }) => (
                  <ScoreBar key={key} label={label} score={(audit[key as keyof PublicAudit] as number) || 0} />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-500">{criticals.length}</p><p className="text-xs text-muted-foreground">Critical</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-500">{warnings.length}</p><p className="text-xs text-muted-foreground">Warnings</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-500">{Object.values(findings).flatMap((c: any) => c?.passed || []).length}</p><p className="text-xs text-muted-foreground">Passed</p></CardContent></Card>
        </div>

        {summary.executiveSummary && !summary._locked && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-base">AI Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{summary.executiveSummary}</p>
            </CardContent>
          </Card>
        )}

        {criticals.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Critical Issues</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {criticals.slice(0, 5).map((f: any, i: number) => (
                <div key={i} className="rounded-lg border border-red-200 bg-red-50/50 dark:bg-red-950/10 p-3">
                  <div className="flex items-start gap-2">
                    <SeverityIcon severity="critical" />
                    <div>
                      <p className="text-sm font-medium">{f.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{f.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="border-2 border-primary">
          <CardContent className="p-6 text-center space-y-3">
            <h2 className="text-lg font-semibold">Want the full report and fix recommendations?</h2>
            <p className="text-sm text-muted-foreground">Get detailed findings, AI-powered priority actions, and PDF export — free for 5 audits a month.</p>
            <Button size="lg" asChild>
              <a href="/">
                Run Your Free Audit <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground pb-8">
          Powered by <a href="/" className="underline">Pulse AI</a> — AI-Powered Product Intelligence Platform
        </p>
      </main>
    </div>
  );
}
