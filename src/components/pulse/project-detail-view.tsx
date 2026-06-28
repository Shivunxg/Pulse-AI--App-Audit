'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { HealthScoreRing } from './health-score-ring';
import { ScoreBar } from './score-bar';
import {
  ArrowLeft, Play, Loader2, Clock, CheckCircle2, XCircle,
  Globe, ExternalLink, Zap, FileText,
  Gauge, Search, Eye, Shield, MousePointer,
} from 'lucide-react';
import { format } from 'date-fns';
import type { AuditFindings, AiSummary } from '@/types';

interface Audit {
  id: string;
  status: string;
  healthScore: number | null;
  performanceScore: number | null;
  seoScore: number | null;
  accessibilityScore: number | null;
  securityScore: number | null;
  uxScore: number | null;
  responseTime: number | null;
  pageSize: number | null;
  findings: AuditFindings | null;
  aiSummary: AiSummary | null;
  createdAt: string;
}

interface ProjectData {
  id: string;
  name: string;
  url: string;
  audits: Audit[];
}

const scoreConfig = [
  { key: 'performanceScore' as const, label: 'Performance', icon: <Gauge className="h-4 w-4" /> },
  { key: 'seoScore' as const, label: 'SEO', icon: <Search className="h-4 w-4" /> },
  { key: 'accessibilityScore' as const, label: 'Accessibility', icon: <Eye className="h-4 w-4" /> },
  { key: 'securityScore' as const, label: 'Security', icon: <Shield className="h-4 w-4" /> },
  { key: 'uxScore' as const, label: 'UX', icon: <MousePointer className="h-4 w-4" /> },
];

export function ProjectDetailView() {
  const { token, selectedProjectId, navigate, isAuditPolling, setIsAuditPolling } = useAppStore();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const loadProject = useCallback(() => {
    if (!token || !selectedProjectId) return;
    fetch(`/api/projects/${selectedProjectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.project) setProject(data.project);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, selectedProjectId]);

  useEffect(() => { loadProject(); }, [loadProject]);

  // Poll for running audits
  useEffect(() => {
    if (!isAuditPolling || !token || !selectedProjectId) return;
    const interval = setInterval(() => {
      fetch(`/api/projects/${selectedProjectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.project) {
            setProject(data.project);
            const hasRunning = data.project.audits.some((a: Audit) => a.status === 'running');
            if (!hasRunning) setIsAuditPolling(false);
          }
        })
        .catch(console.error);
    }, 3000);
    return () => clearInterval(interval);
  }, [isAuditPolling, token, selectedProjectId, setIsAuditPolling]);

  const handleRunAudit = async () => {
    if (!token || !selectedProjectId || running) return;
    setRunning(true);
    setIsAuditPolling(true);
    try {
      await fetch(`/api/projects/${selectedProjectId}/audits`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      // Reload after short delay to show running audit
      setTimeout(() => { loadProject(); setRunning(false); }, 500);
    } catch {
      setRunning(false);
      setIsAuditPolling(false);
    }
  };

  const handleExportPdf = (audit: Audit) => {
    const findings = audit.findings;
    const summary = audit.aiSummary;
    if (!findings) return;

    const allFindings = [
      ...findings.performance.issues,
      ...findings.seo.issues,
      ...findings.accessibility.issues,
      ...findings.security.issues,
      ...findings.ux.issues,
    ];

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Pulse AI Report — ${project?.name}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }
  h1 { font-size: 24px; margin-bottom: 4px; }
  .subtitle { color: #666; font-size: 14px; margin-bottom: 24px; }
  .meta { display: flex; gap: 24px; font-size: 13px; color: #888; margin-bottom: 32px; }
  .scores { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 32px; }
  .score-card { background: #f8f8f8; border-radius: 8px; padding: 16px; text-align: center; min-width: 120px; }
  .score-value { font-size: 28px; font-weight: 700; }
  .score-label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
  .section { margin-bottom: 24px; }
  .section h2 { font-size: 16px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #eee; }
  .finding { background: #f8f8f8; border-radius: 6px; padding: 12px; margin-bottom: 8px; }
  .finding h3 { font-size: 14px; margin-bottom: 4px; }
  .finding p { font-size: 13px; color: #555; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
  .badge-critical { background: #fecaca; color: #991b1b; }
  .badge-warning { background: #fef3c7; color: #92400e; }
  .badge-info { background: #e0e7ff; color: #3730a3; }
  .badge-passed { background: #d1fae5; color: #065f46; }
  .ai-section { background: #fafafa; border: 1px solid #eee; border-radius: 8px; padding: 20px; margin-bottom: 24px; }
  .ai-section h2 { border: none; padding: 0; margin-bottom: 8px; }
  ul { padding-left: 20px; }
  li { font-size: 13px; margin-bottom: 4px; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee; font-size: 11px; color: #aaa; text-align: center; }
  @media print { body { padding: 20px; } }
</style></head><body>
<h1>Pulse AI — Product Intelligence Report</h1>
<p class="subtitle">${project?.name}</p>
<div class="meta">
  <span>URL: ${project?.url}</span>
  <span>Date: ${audit.createdAt ? format(new Date(audit.createdAt), 'PPpp') : 'N/A'}</span>
</div>
<div class="scores">
  <div class="score-card"><div class="score-value">${Math.round(audit.healthScore || 0)}</div><div class="score-label">Health Score</div></div>
  <div class="score-card"><div class="score-value">${Math.round(audit.performanceScore || 0)}</div><div class="score-label">Performance</div></div>
  <div class="score-card"><div class="score-value">${Math.round(audit.seoScore || 0)}</div><div class="score-label">SEO</div></div>
  <div class="score-card"><div class="score-value">${Math.round(audit.accessibilityScore || 0)}</div><div class="score-label">Accessibility</div></div>
  <div class="score-card"><div class="score-value">${Math.round(audit.securityScore || 0)}</div><div class="score-label">Security</div></div>
  <div class="score-card"><div class="score-value">${Math.round(audit.uxScore || 0)}</div><div class="score-label">UX</div></div>
</div>
${summary?.executiveSummary ? `<div class="ai-section"><h2>Executive Summary</h2><p>${summary.executiveSummary}</p></div>` : ''}
${summary?.criticalIssues?.length ? `<div class="ai-section"><h2>Critical Issues</h2><ul>${summary.criticalIssues.map(i => `<li>${i}</li>`).join('')}</ul></div>` : ''}
${summary?.recommendations?.length ? `<div class="ai-section"><h2>Recommendations</h2><ul>${summary.recommendations.map(r => `<li>${r}</li>`).join('')}</ul></div>` : ''}
<div class="section"><h2>All Findings (${allFindings.length})</h2>
${allFindings.map(f => `<div class="finding"><span class="badge badge-${f.severity}">${f.severity}</span> <strong>${f.title}</strong><p>${f.description}</p>${f.recommendation ? `<p style="color:#666;margin-top:4px">Recommendation: ${f.recommendation}</p>` : ''}</div>`).join('')}
</div>
<div class="footer">Generated by Pulse AI — AI-Powered Product Intelligence Platform</div>
</body></html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Project not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('projects')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Projects
        </Button>
      </div>
    );
  }

  const latestAudit = project.audits[0];
  const completedAudits = project.audits.filter(a => a.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('projects')} className="shrink-0 mt-0.5">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight truncate">{project.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground truncate flex items-center gap-1"
            >
              {project.url} <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          </div>
        </div>
        <Button onClick={handleRunAudit} disabled={running || isAuditPolling}>
          {running || isAuditPolling ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          {isAuditPolling ? 'Audit Running...' : 'Run Audit'}
        </Button>
      </div>

      {/* Latest Audit Summary */}
      {latestAudit && latestAudit.status === 'completed' && latestAudit.healthScore != null && (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <HealthScoreRing
                score={latestAudit.healthScore}
                size={130}
                strokeWidth={10}
                label="Product Health"
              />
              <div className="flex-1 w-full space-y-3">
                {scoreConfig.map(({ key, label, icon }) => (
                  <ScoreBar
                    key={key}
                    label={label}
                    score={latestAudit[key] || 0}
                    icon={icon}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {latestAudit?.status === 'running' && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
            <p className="font-medium">Audit in Progress</p>
            <p className="text-sm text-muted-foreground mt-1">
              Analyzing {project.url}... This usually takes 10-20 seconds.
            </p>
          </CardContent>
        </Card>
      )}

      {latestAudit?.status === 'failed' && (
        <Card>
          <CardContent className="py-8 text-center">
            <XCircle className="h-8 w-8 text-destructive mx-auto mb-3" />
            <p className="font-medium">Audit Failed</p>
            <p className="text-sm text-muted-foreground mt-1">
              Could not reach {project.url}. Check the URL and try again.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Audit History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Audit History</CardTitle>
        </CardHeader>
        <CardContent>
          {project.audits.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No audits yet. Click &quot;Run Audit&quot; to start.
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {project.audits.map((audit) => (
                <div
                  key={audit.id}
                  className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => navigate('audit-results', project.id, audit.id)}
                >
                  <div className="shrink-0">
                    {audit.status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : audit.status === 'running' ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : audit.status === 'failed' ? (
                      <XCircle className="h-5 w-5 text-destructive" />
                    ) : (
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {format(new Date(audit.createdAt), 'PPp')}
                      </span>
                      <Badge
                        variant={audit.status === 'completed' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {audit.status}
                      </Badge>
                    </div>
                    {audit.responseTime != null && (
                      <p className="text-xs text-muted-foreground">
                        Response: {Math.round(audit.responseTime)}ms
                        {audit.pageSize != null && ` · Size: ${(audit.pageSize / 1024).toFixed(0)}KB`}
                      </p>
                    )}
                  </div>
                  {audit.healthScore != null && (
                    <div className="text-right shrink-0">
                      <span className="text-lg font-bold">{Math.round(audit.healthScore)}</span>
                      <p className="text-xs text-muted-foreground">score</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick PDF Export for latest completed audit */}
      {completedAudits.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportPdf(completedAudits[0])}
          >
            <FileText className="h-4 w-4 mr-2" />
            Export Latest Report (PDF)
          </Button>
        </div>
      )}
    </div>
  );
}