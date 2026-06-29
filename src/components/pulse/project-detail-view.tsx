'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { HealthScoreRing } from './health-score-ring';
import { ScoreBar } from './score-bar';
import {
  ArrowLeft, Play, Loader2, Clock, CheckCircle2, XCircle,
  Globe, ExternalLink, Zap, FileText, Smartphone, Upload,
  Gauge, Search, Eye, Shield, MousePointer, Layers, Cpu, Lock, Code,
} from 'lucide-react';
import { format } from 'date-fns';
import type { AuditFindings, AiSummary } from '@/types';

interface Audit {
  id: string;
  status: string;
  mode: string;
  healthScore: number | null;
  performanceScore: number | null;
  seoScore: number | null;
  accessibilityScore: number | null;
  securityScore: number | null;
  uxScore: number | null;
  responseTime: number | null;
  pageSize: number | null;
  findings: AuditFindings | any;
  aiSummary: AiSummary | null;
  createdAt: string;
}

interface ProjectData {
  id: string;
  name: string;
  url: string;
  type: string;
  audits: Audit[];
}

const webScoreConfig = [
  { key: 'performanceScore' as const, label: 'Performance', icon: <Gauge className="h-4 w-4" /> },
  { key: 'seoScore' as const, label: 'SEO', icon: <Search className="h-4 w-4" /> },
  { key: 'accessibilityScore' as const, label: 'Accessibility', icon: <Eye className="h-4 w-4" /> },
  { key: 'securityScore' as const, label: 'Security', icon: <Shield className="h-4 w-4" /> },
  { key: 'uxScore' as const, label: 'UX', icon: <MousePointer className="h-4 w-4" /> },
];

const androidScoreConfig = [
  { key: 'securityScore' as const, label: 'Security', icon: <Lock className="h-4 w-4" /> },
  { key: 'seoScore' as const, label: 'Configuration', icon: <Layers className="h-4 w-4" /> },
  { key: 'accessibilityScore' as const, label: 'Privacy', icon: <Eye className="h-4 w-4" /> },
  { key: 'uxScore' as const, label: 'Code Quality', icon: <Code className="h-4 w-4" /> },
  { key: 'performanceScore' as const, label: 'Performance', icon: <Cpu className="h-4 w-4" /> },
];

export function ProjectDetailView() {
  const { token, selectedProjectId, navigate, isAuditPolling, setIsAuditPolling } = useAppStore();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [auditMode, setAuditMode] = useState<'simple' | 'deep'>('simple');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAndroid = project?.type === 'android';
  const scoreConfig = isAndroid ? androidScoreConfig : webScoreConfig;

  const loadProject = useCallback(() => {
    if (!token || !selectedProjectId) return;
    fetch(`/api/projects/${selectedProjectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => { if (data.project) setProject(data.project); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, selectedProjectId]);

  useEffect(() => { loadProject(); }, [loadProject]);

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
            if (!data.project.audits.some((a: Audit) => a.status === 'running')) setIsAuditPolling(false);
          }
        })
        .catch(console.error);
    }, 3000);
    return () => clearInterval(interval);
  }, [isAuditPolling, token, selectedProjectId, setIsAuditPolling]);

  const handleRunAudit = async () => {
    if (!token || !selectedProjectId || running) return;
    setRunning(true);
    setIsAuditPolling(false);
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/audits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mode: auditMode }),
      });
      // Audit is now synchronous — response means it's done (or failed)
      loadProject();
    } catch {
      // network error — still reload to check state
      loadProject();
    } finally {
      setRunning(false);
    }
  };

  const handleApkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token || !selectedProjectId) return;

    setUploading(true);
    setIsAuditPolling(true);

    const formData = new FormData();
    formData.append('apk', file);

    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/upload-apk`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        setTimeout(() => loadProject(), 500);
      } else {
        const data = await res.json();
        alert(data.error || 'Upload failed');
        setIsAuditPolling(false);
      }
    } catch {
      alert('Upload failed');
      setIsAuditPolling(false);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportPdf = (audit: Audit) => {
    if (isAndroid && audit.findings?.security) {
      const f = audit.findings;
      const s = audit.aiSummary;
      const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Pulse AI — Android Audit Report</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, sans-serif; color: #1a1a1a; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }
  h1 { font-size: 24px; margin-bottom: 4px; }
  .subtitle { color: #666; font-size: 14px; margin-bottom: 24px; }
  .scores { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 32px; }
  .score-card { background: #f8f8f8; border-radius: 8px; padding: 16px; text-align: center; min-width: 100px; }
  .score-value { font-size: 28px; font-weight: 700; }
  .score-label { font-size: 12px; color: #888; text-transform: uppercase; }
  .section { margin-bottom: 24px; }
  .section h2 { font-size: 16px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #eee; }
  .finding { background: #f8f8f8; border-radius: 6px; padding: 12px; margin-bottom: 8px; }
  .finding h3 { font-size: 14px; margin-bottom: 4px; }
  .finding p { font-size: 13px; color: #555; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
  .badge-critical { background: #fecaca; color: #991b1b; }
  .badge-warning { background: #fef3c7; color: #92400e; }
  .badge-passed { background: #d1fae5; color: #065f46; }
  ul { padding-left: 20px; } li { font-size: 13px; margin-bottom: 4px; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee; font-size: 11px; color: #aaa; text-align: center; }
</style></head><body>
<h1>Pulse AI — Android Audit Report</h1>
<p class="subtitle">${project?.name}</p>
<div class="scores">
  <div class="score-card"><div class="score-value">${Math.round(audit.healthScore || 0)}</div><div class="score-label">Health</div></div>
  <div class="score-card"><div class="score-value">${Math.round(audit.securityScore || 0)}</div><div class="score-label">Security</div></div>
  <div class="score-card"><div class="score-value">${Math.round(audit.seoScore || 0)}</div><div class="score-label">Config</div></div>
  <div class="score-card"><div class="score-value">${Math.round(audit.accessibilityScore || 0)}</div><div class="score-label">Privacy</div></div>
  <div class="score-card"><div class="score-value">${Math.round(audit.uxScore || 0)}</div><div class="score-label">Code Quality</div></div>
</div>
${s?.executiveSummary ? `<div class="section"><h2>Executive Summary</h2><p>${s.executiveSummary}</p></div>` : ''}
<div class="section"><h2>All Findings</h2>
${[...f.security.issues, ...f.configuration.issues, ...f.privacy.issues, ...f.codeQuality.issues, ...f.performance.issues]
  .map(fi => `<div class="finding"><span class="badge badge-${fi.severity}">${fi.severity}</span> <strong>${fi.title}</strong><p>${fi.description}</p></div>`).join('')}
</div>
<div class="footer">Generated by Pulse AI</div></body></html>`;
      const win = window.open('', '_blank');
      if (win) { win.document.write(html); win.document.close(); }
      return;
    }

    const findings = audit.findings;
    const summary = audit.aiSummary;
    if (!findings) return;

    const allFindings = [
      ...findings.performance.issues, ...findings.seo.issues,
      ...findings.accessibility.issues, ...findings.security.issues, ...findings.ux.issues,
    ];

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Pulse AI Report — ${project?.name}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, sans-serif; color: #1a1a1a; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }
  h1 { font-size: 24px; } .subtitle { color: #666; font-size: 14px; margin-bottom: 24px; }
  .scores { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 32px; }
  .score-card { background: #f8f8f8; border-radius: 8px; padding: 16px; text-align: center; min-width: 100px; }
  .score-value { font-size: 28px; font-weight: 700; } .score-label { font-size: 12px; color: #888; text-transform: uppercase; }
  .section { margin-bottom: 24px; } .section h2 { font-size: 16px; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
  .finding { background: #f8f8f8; border-radius: 6px; padding: 12px; margin-bottom: 8px; }
  .finding h3 { font-size: 14px; } .finding p { font-size: 13px; color: #555; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
  .badge-critical { background: #fecaca; color: #991b1b; } .badge-warning { background: #fef3c7; color: #92400e; }
  .badge-passed { background: #d1fae5; color: #065f46; }
  ul { padding-left: 20px; } li { font-size: 13px; margin-bottom: 4px; }
  .footer { margin-top: 40px; border-top: 1px solid #eee; font-size: 11px; color: #aaa; text-align: center; }
</style></head><body>
<h1>Pulse AI — ${audit.mode === 'deep' ? 'Deep' : 'Simple'} Audit Report</h1>
<p class="subtitle">${project?.name} — ${project?.url}</p>
<div class="scores">
  <div class="score-card"><div class="score-value">${Math.round(audit.healthScore || 0)}</div><div class="score-label">Health</div></div>
  <div class="score-card"><div class="score-value">${Math.round(audit.performanceScore || 0)}</div><div class="score-label">Performance</div></div>
  <div class="score-card"><div class="score-value">${Math.round(audit.seoScore || 0)}</div><div class="score-label">SEO</div></div>
  <div class="score-card"><div class="score-value">${Math.round(audit.accessibilityScore || 0)}</div><div class="score-label">Accessibility</div></div>
  <div class="score-card"><div class="score-value">${Math.round(audit.securityScore || 0)}</div><div class="score-label">Security</div></div>
  <div class="score-card"><div class="score-value">${Math.round(audit.uxScore || 0)}</div><div class="score-label">UX</div></div>
</div>
${summary?.executiveSummary ? `<div class="section"><h2>Executive Summary</h2><p>${summary.executiveSummary}</p></div>` : ''}
<div class="section"><h2>All Findings (${allFindings.length})</h2>
${allFindings.map(f => `<div class="finding"><span class="badge badge-${f.severity}">${f.severity}</span> <strong>${f.title}</strong><p>${f.description}</p></div>`).join('')}
</div>
<div class="footer">Generated by Pulse AI</div></body></html>`;
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
  };

  if (loading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-64" /><Skeleton className="h-48 w-full" /><Skeleton className="h-64 w-full" /></div>;
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
          <div className="flex items-center gap-2">
            {isAndroid ? <Smartphone className="h-5 w-5 text-muted-foreground" /> : <Globe className="h-5 w-5 text-muted-foreground" />}
            <h1 className="text-2xl font-bold tracking-tight truncate">{project.name}</h1>
            <Badge variant="outline" className="text-xs shrink-0">
              {isAndroid ? 'Android' : 'Website'}
            </Badge>
          </div>
          {!isAndroid && (
            <div className="flex items-center gap-2 mt-1">
              <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground truncate flex items-center gap-1">
                {project.url} <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {isAndroid ? (
          <>
            <input ref={fileInputRef} type="file" accept=".apk" className="hidden" onChange={handleApkUpload} />
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploading || isAuditPolling}>
              {uploading || isAuditPolling ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {isAuditPolling ? 'Analyzing...' : 'Upload APK'}
            </Button>
          </>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={auditMode}
              onChange={(e) => setAuditMode(e.target.value as 'simple' | 'deep')}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="simple">Simple Audit</option>
              <option value="deep">Deep Audit (Playwright)</option>
            </select>
            <Button onClick={handleRunAudit} disabled={running || isAuditPolling}>
              {running || isAuditPolling ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {isAuditPolling ? 'Running...' : 'Run Audit'}
            </Button>
          </div>
        )}
      </div>

      {/* Simple/Deep badge for websites */}
      {!isAndroid && latestAudit && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-[10px]">
            {auditMode === 'deep' ? 'Deep audits use Playwright for real browser testing, Core Web Vitals, console error capture, and responsive checks' : 'Simple audits use fast HTTP analysis for immediate results'}
          </Badge>
        </div>
      )}

      {/* Latest Audit Summary */}
      {latestAudit && latestAudit.status === 'completed' && latestAudit.healthScore != null && (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <HealthScoreRing score={latestAudit.healthScore} size={130} strokeWidth={10} label="Product Health" />
              <div className="flex-1 w-full space-y-3">
                {scoreConfig.map(({ key, label, icon }) => (
                  <ScoreBar key={key} label={label} score={latestAudit[key] || 0} icon={icon} />
                ))}
              </div>
            </div>
            {!isAndroid && latestAudit.mode === 'deep' && (
              <p className="text-xs text-muted-foreground mt-4 text-center">
                Deep audit — includes Core Web Vitals (LCP, CLS, FCP), console errors, rendered DOM analysis, broken link detection, responsive checks
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {latestAudit?.status === 'running' && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
            <p className="font-medium">{isAndroid ? 'Analyzing APK...' : latestAudit.mode === 'deep' ? 'Deep Audit in Progress (Playwright)...' : 'Audit in Progress'}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {latestAudit.mode === 'deep' ? 'This may take 30-60 seconds as a real browser loads the page.' : 'This usually takes 10-20 seconds.'}
            </p>
          </CardContent>
        </Card>
      )}

      {latestAudit?.status === 'failed' && (
        <Card>
          <CardContent className="py-8 text-center">
            <XCircle className="h-8 w-8 text-destructive mx-auto mb-3" />
            <p className="font-medium">Audit Failed</p>
            <p className="text-sm text-muted-foreground mt-1">{isAndroid ? 'Could not analyze the APK. Ensure it is a valid Android APK file.' : `Could not reach ${project.url}. Check the URL and try again.`}</p>
          </CardContent>
        </Card>
      )}

      {/* Audit History */}
      <Card>
        <div className="flex items-center justify-between p-5 pb-0">
          <h2 className="text-base font-semibold">Audit History</h2>
        </div>
        <CardContent className="pt-3">
          {project.audits.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {isAndroid ? 'Upload an APK file to start.' : 'Click "Run Audit" to start.'}
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
                    {audit.status === 'completed' ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      : audit.status === 'running' ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      : audit.status === 'failed' ? <XCircle className="h-5 w-5 text-destructive" />
                      : <Clock className="h-5 w-5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{format(new Date(audit.createdAt), 'PPp')}</span>
                      <Badge variant="secondary" className="text-[10px]">{audit.mode || 'simple'}</Badge>
                      <Badge variant={audit.status === 'completed' ? 'default' : 'secondary'} className="text-xs">{audit.status}</Badge>
                    </div>
                    {!isAndroid && audit.responseTime != null && (
                      <p className="text-xs text-muted-foreground">
                        Response: {Math.round(audit.responseTime)}ms
                        {audit.pageSize != null && ` · ${(audit.pageSize / 1024).toFixed(0)}KB`}
                      </p>
                    )}
                    {isAndroid && audit.pageSize != null && (
                      <p className="text-xs text-muted-foreground">APK: {(audit.pageSize / 1024 / 1024).toFixed(1)}MB</p>
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

      {completedAudits.length > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => handleExportPdf(completedAudits[0])}>
            <FileText className="h-4 w-4 mr-2" /> Export Latest Report
          </Button>
        </div>
      )}
    </div>
  );
}