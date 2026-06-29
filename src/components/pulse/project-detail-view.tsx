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
  // v2 — auditModeRef fix + Anthropic AI summary
  const auditModeRef = useRef<'simple' | 'deep'>('simple');

  const handleAuditModeChange = (mode: 'simple' | 'deep') => {
    setAuditMode(mode);
    auditModeRef.current = mode;
  };
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
        body: JSON.stringify({ mode: auditModeRef.current }),
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
    const findings = audit.findings;
    const summary = audit.aiSummary;

    const isAndroidAudit = isAndroid && findings?.security && findings?.configuration;

    const scores = isAndroidAudit ? `
      <div class="score-card"><div class="score-value score-health">${Math.round(audit.healthScore || 0)}</div><div class="score-label">Health</div></div>
      <div class="score-card"><div class="score-value">${Math.round(audit.securityScore || 0)}</div><div class="score-label">Security</div></div>
      <div class="score-card"><div class="score-value">${Math.round(audit.seoScore || 0)}</div><div class="score-label">Config</div></div>
      <div class="score-card"><div class="score-value">${Math.round(audit.accessibilityScore || 0)}</div><div class="score-label">Privacy</div></div>
      <div class="score-card"><div class="score-value">${Math.round(audit.uxScore || 0)}</div><div class="score-label">Code Quality</div></div>
    ` : `
      <div class="score-card"><div class="score-value score-health">${Math.round(audit.healthScore || 0)}</div><div class="score-label">Health Score</div></div>
      <div class="score-card"><div class="score-value">${Math.round(audit.performanceScore || 0)}</div><div class="score-label">Performance</div></div>
      <div class="score-card"><div class="score-value">${Math.round(audit.seoScore || 0)}</div><div class="score-label">SEO</div></div>
      <div class="score-card"><div class="score-value">${Math.round(audit.accessibilityScore || 0)}</div><div class="score-label">Accessibility</div></div>
      <div class="score-card"><div class="score-value">${Math.round(audit.securityScore || 0)}</div><div class="score-label">Security</div></div>
      <div class="score-card"><div class="score-value">${Math.round(audit.uxScore || 0)}</div><div class="score-label">UX</div></div>
    `;

    const allIssues = isAndroidAudit
      ? [...(findings.security?.issues || []), ...(findings.configuration?.issues || []),
         ...(findings.privacy?.issues || []), ...(findings.codeQuality?.issues || []),
         ...(findings.performance?.issues || [])]
      : [...(findings?.performance?.issues || []), ...(findings?.seo?.issues || []),
         ...(findings?.accessibility?.issues || []), ...(findings?.security?.issues || []),
         ...(findings?.ux?.issues || [])];

    const allPassed = isAndroidAudit
      ? [...(findings.security?.passed || []), ...(findings.configuration?.passed || []),
         ...(findings.privacy?.passed || []), ...(findings.codeQuality?.passed || []),
         ...(findings.performance?.passed || [])]
      : [...(findings?.performance?.passed || []), ...(findings?.seo?.passed || []),
         ...(findings?.accessibility?.passed || []), ...(findings?.security?.passed || []),
         ...(findings?.ux?.passed || [])];

    const criticals = allIssues.filter(f => f.severity === 'critical');
    const warnings = allIssues.filter(f => f.severity === 'warning');

    const findingRows = (items: typeof allIssues) => items.map(f => `
      <div class="finding ${f.severity}">
        <div class="finding-header">
          <span class="badge badge-${f.severity}">${f.severity.toUpperCase()}</span>
          <strong>${f.title}</strong>
        </div>
        <p>${f.description}</p>
        ${f.recommendation ? `<p class="recommendation"><strong>Fix:</strong> ${f.recommendation}</p>` : ''}
      </div>`).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Pulse AI Report — ${project?.name}</title>
  <style>
    @page { margin: 20mm 15mm; size: A4; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111; font-size: 13px; line-height: 1.6; background: #fff; }
    .header { border-bottom: 3px solid #111; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
    .header-left h1 { font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
    .header-left p { color: #555; font-size: 12px; margin-top: 2px; }
    .header-right { text-align: right; font-size: 11px; color: #888; }
    .scores { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 28px; }
    .score-card { border: 1px solid #e5e5e5; border-radius: 8px; padding: 14px 18px; text-align: center; min-width: 90px; flex: 1; }
    .score-value { font-size: 30px; font-weight: 800; color: #111; }
    .score-health { font-size: 36px; color: #000; }
    .score-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }
    .section { margin-bottom: 24px; page-break-inside: avoid; }
    .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e5e5e5; padding-bottom: 6px; margin-bottom: 12px; color: #333; }
    .summary-box { background: #f8f8f8; border-left: 4px solid #111; padding: 14px 16px; border-radius: 0 6px 6px 0; font-size: 13px; color: #333; line-height: 1.7; }
    .strengths, .issues-list { list-style: none; }
    .strengths li { padding: 4px 0; padding-left: 16px; position: relative; font-size: 12px; color: #333; }
    .strengths li::before { content: '+'; position: absolute; left: 0; color: #16a34a; font-weight: 700; }
    .issues-list li { padding: 4px 0; padding-left: 16px; position: relative; font-size: 12px; color: #333; }
    .issues-list li::before { content: '!'; position: absolute; left: 0; color: #dc2626; font-weight: 700; }
    .actions-box { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; padding: 12px 14px; }
    .actions-box ol { padding-left: 16px; }
    .actions-box li { font-size: 12px; margin-bottom: 3px; }
    .finding { border-radius: 6px; padding: 10px 12px; margin-bottom: 8px; border: 1px solid #e5e5e5; page-break-inside: avoid; }
    .finding.critical { border-color: #fca5a5; background: #fff5f5; }
    .finding.warning { border-color: #fcd34d; background: #fffdf0; }
    .finding.passed { border-color: #86efac; background: #f0fdf4; }
    .finding-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .finding p { font-size: 12px; color: #444; margin-top: 2px; }
    .recommendation { color: #1d4ed8 !important; margin-top: 4px !important; font-style: italic; }
    .badge { font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 3px; letter-spacing: 0.05em; }
    .badge-critical { background: #fecaca; color: #991b1b; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .badge-passed { background: #d1fae5; color: #065f46; }
    .badge-info { background: #dbeafe; color: #1e40af; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .stat-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #f0f0f0; font-size: 12px; }
    .stat-row:last-child { border-bottom: none; }
    .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e5e5; display: flex; justify-content: space-between; font-size: 10px; color: #aaa; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none; }
      .page-break { page-break-before: always; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="background:#111;color:#fff;padding:12px 20px;font-size:13px;display:flex;justify-content:space-between;align-items:center;">
    <span>Pulse AI — PDF Report Preview</span>
    <button onclick="window.print()" style="background:#fff;color:#111;border:none;padding:8px 20px;border-radius:6px;font-weight:700;cursor:pointer;font-size:13px;">⬇ Save as PDF</button>
  </div>
  <div style="padding: 32px; max-width: 800px; margin: 0 auto;">
    <div class="header">
      <div class="header-left">
        <h1>Pulse AI — Audit Report</h1>
        <p>${project?.name} · ${project?.url || ''}</p>
        <p>Audit type: ${audit.mode === 'deep' ? 'Deep (Enhanced HTTP)' : 'Simple'} · ${new Date(audit.createdAt).toLocaleString()}</p>
      </div>
      <div class="header-right">
        <div style="font-size:10px;color:#aaa">Generated by</div>
        <div style="font-weight:700;font-size:14px;color:#111">Pulse AI</div>
        <div style="font-size:10px;color:#aaa">pulse-ai-app-audit.vercel.app</div>
      </div>
    </div>

    <div class="scores">${scores}</div>

    <div class="two-col" style="margin-bottom:24px;">
      <div class="section">
        <div class="section-title">Issue Summary</div>
        <div class="stat-row"><span>Critical issues</span><strong style="color:#dc2626">${criticals.length}</strong></div>
        <div class="stat-row"><span>Warnings</span><strong style="color:#d97706">${warnings.length}</strong></div>
        <div class="stat-row"><span>Passed checks</span><strong style="color:#16a34a">${allPassed.length}</strong></div>
        <div class="stat-row"><span>Total findings</span><strong>${allIssues.length + allPassed.length}</strong></div>
        ${audit.responseTime ? `<div class="stat-row"><span>Response time</span><strong>${Math.round(audit.responseTime)}ms</strong></div>` : ''}
        ${audit.pageSize ? `<div class="stat-row"><span>Page size</span><strong>${(audit.pageSize / 1024).toFixed(0)}KB</strong></div>` : ''}
      </div>
      ${summary?.keyStrengths?.length ? `
      <div class="section">
        <div class="section-title">Key Strengths</div>
        <ul class="strengths">${summary.keyStrengths.map((s: string) => `<li>${s}</li>`).join('')}</ul>
      </div>` : '<div></div>'}
    </div>

    ${summary?.executiveSummary ? `
    <div class="section">
      <div class="section-title">Executive Summary</div>
      <div class="summary-box">${summary.executiveSummary}</div>
    </div>` : ''}

    ${summary?.priorityActions?.length ? `
    <div class="section">
      <div class="section-title">Priority Actions</div>
      <div class="actions-box">
        <ol>${summary.priorityActions.map((a: string) => `<li>${a}</li>`).join('')}</ol>
      </div>
    </div>` : ''}

    ${summary?.criticalIssues?.length ? `
    <div class="section">
      <div class="section-title">Critical Issues</div>
      <ul class="issues-list">${summary.criticalIssues.map((s: string) => `<li>${s}</li>`).join('')}</ul>
    </div>` : ''}

    ${criticals.length > 0 ? `
    <div class="section page-break">
      <div class="section-title">Critical Findings (${criticals.length})</div>
      ${findingRows(criticals)}
    </div>` : ''}

    ${warnings.length > 0 ? `
    <div class="section">
      <div class="section-title">Warnings (${warnings.length})</div>
      ${findingRows(warnings)}
    </div>` : ''}

    ${allPassed.length > 0 ? `
    <div class="section">
      <div class="section-title">Passed Checks (${allPassed.length})</div>
      ${findingRows(allPassed)}
    </div>` : ''}

    <div class="footer">
      <span>Pulse AI — AI-Powered Product Intelligence Platform</span>
      <span>Report generated ${new Date().toLocaleString()}</span>
    </div>
  </div>
  <script>
    // Auto-trigger print dialog after a short delay so styles load
    setTimeout(() => {
      window.onload = function() { setTimeout(function() { window.print(); }, 800); };
      if (window.location.search.includes('autoprint')) window.print();
    }, 500);
  </script>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
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
              onChange={(e) => handleAuditModeChange(e.target.value as 'simple' | 'deep')}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="simple">Simple Audit</option>
              <option value="deep">Deep Audit (Enhanced)</option>
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
            {auditMode === 'deep' ? 'Deep audits add sitemap, robots.txt, www redirect, and extended SEO checks on top of Simple' : 'Simple audits use fast HTTP analysis for immediate results'}
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
            <p className="font-medium">{isAndroid ? 'Analyzing APK...' : latestAudit.mode === 'deep' ? 'Deep Audit in Progress...' : 'Audit in Progress'}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {latestAudit.mode === 'deep' ? 'This usually takes 15-30 seconds.' : 'This usually takes 10-20 seconds.'}
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