'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HealthScoreRing } from './health-score-ring';
import { ScoreBar } from './score-bar';
import {
  ArrowLeft, Loader2, AlertTriangle, CheckCircle2, Info,
  AlertCircle, FileText, Lightbulb, Target, Zap, ChevronDown, ChevronUp,
  Gauge, Search, Eye, Shield, MousePointer, XCircle, Activity, Link2,
  Smartphone, Globe, Clock, BarChart3,
} from 'lucide-react';
import type { AuditFindings, AiSummary, AndroidFindings, Finding } from '@/types';

const webScoreConfig = [
  { key: 'performance' as const, label: 'Performance', icon: <Gauge className="h-4 w-4" /> },
  { key: 'seo' as const, label: 'SEO', icon: <Search className="h-4 w-4" /> },
  { key: 'accessibility' as const, label: 'Accessibility', icon: <Eye className="h-4 w-4" /> },
  { key: 'security' as const, label: 'Security', icon: <Shield className="h-4 w-4" /> },
  { key: 'ux' as const, label: 'UX', icon: <MousePointer className="h-4 w-4" /> },
  { key: 'technology' as const, label: 'Technology', icon: <Activity className="h-4 w-4" /> },
  { key: 'content' as const, label: 'Content', icon: <BarChart3 className="h-4 w-4" /> },
];

const androidScoreConfig = [
  { key: 'security' as const, label: 'Security', icon: <Shield className="h-4 w-4" /> },
  { key: 'configuration' as const, label: 'Configuration', icon: <Search className="h-4 w-4" /> },
  { key: 'privacy' as const, label: 'Privacy', icon: <Eye className="h-4 w-4" /> },
  { key: 'codeQuality' as const, label: 'Code Quality', icon: <Gauge className="h-4 w-4" /> },
  { key: 'performance' as const, label: 'Performance', icon: <AlertTriangle className="h-4 w-4" /> },
];

function SeverityIcon({ severity }: { severity: string }) {
  switch (severity) {
    case 'critical': return <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />;
    case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />;
    case 'info': return <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />;
    case 'passed': return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />;
    default: return null;
  }
}

function vitalStatus(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  if (metric === 'fcp') return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor';
  if (metric === 'lcp') return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
  if (metric === 'cls') return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
  if (metric === 'tti') return value <= 3800 ? 'good' : value <= 7300 ? 'needs-improvement' : 'poor';
  return 'good';
}

function vitalColor(status: string) {
  if (status === 'good') return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (status === 'needs-improvement') return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-red-600 bg-red-50 border-red-200';
}

function FindingCard({ finding }: { finding: Finding }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`rounded-lg border p-3 transition-colors ${
      finding.severity === 'critical' ? 'border-red-200 bg-red-50/50 dark:bg-red-950/10' :
      finding.severity === 'warning' ? 'border-amber-200 bg-amber-50/50 dark:bg-amber-950/10' :
      finding.severity === 'passed' ? 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/10' :
      'border-muted'
    }`}>
      <div className="flex items-start gap-2">
        <SeverityIcon severity={finding.severity} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{finding.title}</span>
            <Badge variant={finding.severity === 'critical' ? 'destructive' : 'secondary'} className="text-[10px] px-1.5 py-0">
              {finding.severity}
            </Badge>
            {finding.category && (
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{finding.category}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{finding.description}</p>
          {finding.recommendation && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                className="flex items-center gap-1 text-xs text-primary mt-1.5 hover:underline font-medium"
              >
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {expanded ? 'Hide' : 'Show'} fix recommendation
              </button>
              {expanded && (
                <div className="mt-2 text-xs bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-100 dark:border-blue-900">
                  <div className="flex items-start gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-blue-700 dark:text-blue-400">How to fix: </span>
                      <span className="text-blue-700 dark:text-blue-300">{finding.recommendation}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DeepAuditBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
      <Activity className="h-2.5 w-2.5" /> DEEP
    </span>
  );
}

export function AuditResultsView() {
  const { token, selectedProjectId, selectedAuditId, navigate } = useAppStore();
  const [audit, setAudit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const isAndroid = audit?.findings?.security !== undefined && audit?.findings?.configuration !== undefined;
  const isDeep = audit?.mode === 'deep';
  const scoreConfig = isAndroid ? androidScoreConfig : webScoreConfig;

  const loadAudit = useCallback(() => {
    if (!token || !selectedProjectId || !selectedAuditId) return;
    fetch(`/api/projects/${selectedProjectId}/audits/${selectedAuditId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.audit) { setAudit(data.audit); }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, selectedProjectId, selectedAuditId]);

  useEffect(() => { loadAudit(); }, [loadAudit]);

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );

  if (!audit) return (
    <div className="text-center py-16">
      <p className="text-muted-foreground">Audit not found.</p>
      <Button variant="outline" className="mt-4" onClick={() => navigate('projects')}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>
    </div>
  );

  if (audit.status === 'running') return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('project-detail', selectedProjectId!)}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Project
      </Button>
      <Card>
        <CardContent className="py-16 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium">Audit in Progress</p>
          <p className="text-sm text-muted-foreground mt-2">Running analysis — this may take 20–40 seconds for deep audits.</p>
          <Button variant="outline" className="mt-6" onClick={loadAudit}>
            <Zap className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const findings = audit.findings as AuditFindings | null;
  const summary = audit.aiSummary as AiSummary | null;

  // ── PDF Export ──────────────────────────────────────────────────────────────
  const handleExportPdf = () => {
    if (!audit || !audit.findings) return;
    const f = audit.findings;
    const s = audit.aiSummary;
    const deep = audit.mode === 'deep';

    const allIssues = isAndroid
      ? [...(f.security?.issues||[]),...(f.configuration?.issues||[]),...(f.privacy?.issues||[]),...(f.codeQuality?.issues||[]),...(f.performance?.issues||[])]
      : [...(f.performance?.issues||[]),...(f.seo?.issues||[]),...(f.accessibility?.issues||[]),...(f.security?.issues||[]),...(f.ux?.issues||[])];
    const allPassed = isAndroid
      ? [...(f.security?.passed||[]),...(f.configuration?.passed||[]),...(f.privacy?.passed||[]),...(f.codeQuality?.passed||[]),...(f.performance?.passed||[])]
      : [...(f.performance?.passed||[]),...(f.seo?.passed||[]),...(f.accessibility?.passed||[]),...(f.security?.passed||[]),...(f.ux?.passed||[])];
    const criticals = allIssues.filter((i:any)=>i.severity==='critical');
    const warnings = allIssues.filter((i:any)=>i.severity==='warning');

    const findingRows = (items: any[]) => items.map(fi=>`
      <div class="finding ${fi.severity}">
        <div class="finding-header">
          <span class="badge badge-${fi.severity}">${fi.severity.toUpperCase()}</span>
          <span class="finding-cat">${fi.category||''}</span>
          <strong>${fi.title}</strong>
        </div>
        <p class="finding-desc">${fi.description}</p>
        ${fi.recommendation?`<div class="rec"><span class="rec-label">⚡ How to fix:</span> ${fi.recommendation}</div>`:''}
      </div>`).join('');

    const cwvSection = deep && f.performance?.fcp != null ? `
      <div class="section">
        <div class="section-title">Core Web Vitals <span class="deep-tag">DEEP AUDIT</span></div>
        <div class="vitals-grid">
          ${f.performance.fcp!=null?`<div class="vital ${f.performance.fcp<=1800?'good':f.performance.fcp<=3000?'warn':'poor'}"><div class="vital-val">${f.performance.fcp}ms</div><div class="vital-label">First Contentful Paint</div><div class="vital-target">Target: &lt;1.8s</div></div>`:''}
          ${f.performance.lcp!=null?`<div class="vital ${f.performance.lcp<=2500?'good':f.performance.lcp<=4000?'warn':'poor'}"><div class="vital-val">${f.performance.lcp}ms</div><div class="vital-label">Largest Contentful Paint</div><div class="vital-target">Target: &lt;2.5s</div></div>`:''}
          ${f.performance.cls!=null?`<div class="vital ${f.performance.cls<=0.1?'good':f.performance.cls<=0.25?'warn':'poor'}"><div class="vital-val">${f.performance.cls}</div><div class="vital-label">Cumulative Layout Shift</div><div class="vital-target">Target: &lt;0.1</div></div>`:''}
          ${f.performance.tti!=null?`<div class="vital ${f.performance.tti<=3800?'good':f.performance.tti<=7300?'warn':'poor'}"><div class="vital-val">${f.performance.tti}ms</div><div class="vital-label">Time to Interactive</div><div class="vital-target">Target: &lt;3.8s</div></div>`:''}
          ${f.performance.domNodes!=null?`<div class="vital ${f.performance.domNodes<=1500?'good':'warn'}"><div class="vital-val">${f.performance.domNodes}</div><div class="vital-label">DOM Nodes</div><div class="vital-target">Target: &lt;1500</div></div>`:''}
          ${f.performance.consoleErrors!=null?`<div class="vital ${f.performance.consoleErrors===0?'good':'poor'}"><div class="vital-val">${f.performance.consoleErrors}</div><div class="vital-label">Console Errors</div><div class="vital-target">Target: 0</div></div>`:''}
        </div>
      </div>` : '';

    const deepSeoSection = deep ? `
      <div class="section">
        <div class="section-title">Technical SEO Checks <span class="deep-tag">DEEP AUDIT</span></div>
        <div class="checklist">
          ${f.seo?.hasSitemap!=null?`<div class="check-row ${f.seo.hasSitemap?'ok':'fail'}"><span class="check-icon">${f.seo.hasSitemap?'✓':'✗'}</span><span>XML Sitemap (sitemap.xml)</span><span class="check-status">${f.seo.hasSitemap?'Found':'Missing'}</span></div>`:''}
          ${f.seo?.hasRobotsTxt!=null?`<div class="check-row ${f.seo.hasRobotsTxt?'ok':'fail'}"><span class="check-icon">${f.seo.hasRobotsTxt?'✓':'✗'}</span><span>Crawler Control (robots.txt)</span><span class="check-status">${f.seo.hasRobotsTxt?'Found':'Missing'}</span></div>`:''}
          ${f.seo?.brokenLinks!=null?`<div class="check-row ${f.seo.brokenLinks===0?'ok':'fail'}"><span class="check-icon">${f.seo.brokenLinks===0?'✓':'✗'}</span><span>Broken Internal Links</span><span class="check-status">${f.seo.brokenLinks===0?'None found':`${f.seo.brokenLinks} broken`}</span></div>`:''}
        </div>
      </div>` : '';

    const mobileSection = deep && f.ux?.mobileScore != null ? `
      <div class="section">
        <div class="section-title">Mobile Experience <span class="deep-tag">DEEP AUDIT</span></div>
        <div class="check-row ${f.ux.mobileScore>=80?'ok':'fail'}">
          <span class="check-icon">${f.ux.mobileScore>=80?'✓':'✗'}</span>
          <span>Mobile Viewport Rendering (375px)</span>
          <span class="check-status">${f.ux.mobileScore>=80?'No horizontal scroll detected':'Horizontal scroll / overflow detected'}</span>
        </div>
      </div>` : '';

    const secHeadersSection = f.security?.headers ? `
      <div class="section">
        <div class="section-title">Security Headers</div>
        <div class="checklist">
          ${Object.entries(f.security.headers).map(([h,v]:any)=>`
            <div class="check-row ${v?'ok':'fail'}">
              <span class="check-icon">${v?'✓':'✗'}</span>
              <span class="mono">${h}</span>
              <span class="check-status">${v?'Set':'Missing'}</span>
            </div>`).join('')}
        </div>
      </div>` : '';

    const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>Pulse AI ${deep?'Deep':'Simple'} Audit Report</title>
<style>
  @page { margin: 18mm 14mm; size: A4; }
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111;font-size:12.5px;line-height:1.6;background:#fff}
  .no-print{background:#18181b;color:#fff;padding:12px 20px;font-size:13px;display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:100}
  .no-print button{background:#fff;color:#111;border:none;padding:8px 20px;border-radius:6px;font-weight:700;cursor:pointer;font-size:13px}
  .no-print .hint{font-size:11px;color:#aaa;margin-left:12px}
  .wrap{padding:28px;max-width:800px;margin:0 auto}
  /* Header */
  .report-header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:16px;border-bottom:3px solid #111;margin-bottom:20px}
  .report-header h1{font-size:20px;font-weight:800;letter-spacing:-0.3px}
  .report-header p{color:#555;font-size:11px;margin-top:3px}
  .mode-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:0.05em;${deep?'background:#f3e8ff;color:#7c3aed;border:1px solid #d8b4fe':'background:#f0fdf4;color:#16a34a;border:1px solid #86efac'}}
  .logo{text-align:right;font-size:11px;color:#888}
  .logo strong{display:block;font-size:14px;color:#111;font-weight:800}
  /* Scores */
  .scores{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px}
  .score-card{border:1px solid #e5e5e5;border-radius:8px;padding:12px 16px;text-align:center;flex:1;min-width:80px}
  .score-val{font-size:28px;font-weight:800;color:#111}
  .score-health{font-size:34px}
  .score-lbl{font-size:9px;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-top:2px}
  /* Two col */
  .two-col{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px}
  /* Section */
  .section{margin-bottom:20px;page-break-inside:avoid}
  .section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#444;border-bottom:1px solid #e5e5e5;padding-bottom:5px;margin-bottom:10px;display:flex;align-items:center;gap:8px}
  .deep-tag{font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px;background:#f3e8ff;color:#7c3aed;border:1px solid #d8b4fe;letter-spacing:0.05em}
  /* Summary */
  .summary-box{background:#f8f8f8;border-left:4px solid #111;padding:12px 14px;border-radius:0 6px 6px 0;font-size:12px;color:#333;line-height:1.7}
  /* Stats */
  .stat-row{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f3f3f3;font-size:11.5px}
  .stat-row:last-child{border-bottom:none}
  /* Strengths / lists */
  .strengths{list-style:none}
  .strengths li{padding:3px 0 3px 14px;position:relative;font-size:11.5px}
  .strengths li::before{content:'+';position:absolute;left:0;color:#16a34a;font-weight:700}
  .issues-list li{padding:3px 0 3px 14px;position:relative;font-size:11.5px}
  .issues-list li::before{content:'!';position:absolute;left:0;color:#dc2626;font-weight:700}
  /* Priority actions */
  .actions-box{background:#fffbeb;border:1px solid #fcd34d;border-radius:6px;padding:11px 14px}
  .actions-box ol{padding-left:16px}
  .actions-box li{font-size:11.5px;margin-bottom:3px}
  /* Findings */
  .finding{border-radius:6px;padding:9px 12px;margin-bottom:7px;border:1px solid #e5e5e5;page-break-inside:avoid}
  .finding.critical{border-color:#fca5a5;background:#fff5f5}
  .finding.warning{border-color:#fcd34d;background:#fffdf0}
  .finding.passed{border-color:#86efac;background:#f0fdf4}
  .finding.info{border-color:#bfdbfe;background:#eff6ff}
  .finding-header{display:flex;align-items:center;gap:6px;margin-bottom:3px;flex-wrap:wrap}
  .finding-cat{font-size:9px;text-transform:uppercase;color:#aaa;letter-spacing:0.06em}
  .finding-desc{font-size:11px;color:#444;margin-top:2px;line-height:1.5}
  .rec{font-size:11px;color:#1d4ed8;font-style:italic;margin-top:5px;padding:6px 10px;background:#eff6ff;border-radius:4px;border:1px solid #bfdbfe}
  .rec-label{font-weight:700;font-style:normal}
  .badge{font-size:8.5px;font-weight:700;padding:2px 5px;border-radius:3px;letter-spacing:0.04em}
  .badge-critical{background:#fecaca;color:#991b1b}
  .badge-warning{background:#fef3c7;color:#92400e}
  .badge-passed{background:#d1fae5;color:#065f46}
  .badge-info{background:#dbeafe;color:#1e40af}
  /* Core Web Vitals */
  .vitals-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
  .vital{border-radius:8px;padding:12px;text-align:center;border:1px solid}
  .vital.good{background:#f0fdf4;border-color:#86efac}
  .vital.warn{background:#fffbeb;border-color:#fcd34d}
  .vital.poor{background:#fff5f5;border-color:#fca5a5}
  .vital-val{font-size:22px;font-weight:800}
  .vital.good .vital-val{color:#16a34a}
  .vital.warn .vital-val{color:#d97706}
  .vital.poor .vital-val{color:#dc2626}
  .vital-label{font-size:10px;color:#555;margin-top:2px}
  .vital-target{font-size:9px;color:#aaa;margin-top:1px}
  /* Checklist */
  .checklist{border:1px solid #e5e5e5;border-radius:6px;overflow:hidden}
  .check-row{display:flex;align-items:center;gap:8px;padding:7px 12px;border-bottom:1px solid #f3f3f3;font-size:11.5px}
  .check-row:last-child{border-bottom:none}
  .check-row.ok{background:#f0fdf4}
  .check-row.fail{background:#fff5f5}
  .check-icon{font-size:13px;font-weight:700;width:18px;text-align:center}
  .check-row.ok .check-icon{color:#16a34a}
  .check-row.fail .check-icon{color:#dc2626}
  .check-status{margin-left:auto;font-size:10.5px;font-weight:600}
  .check-row.ok .check-status{color:#16a34a}
  .check-row.fail .check-status{color:#dc2626}
  .mono{font-family:monospace;font-size:11px}
  /* Footer */
  .footer{margin-top:28px;padding-top:10px;border-top:1px solid #e5e5e5;display:flex;justify-content:space-between;font-size:9.5px;color:#bbb}
  .page-break{page-break-before:always}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.no-print{display:none}}
</style></head>
<body>
<div class="no-print">
  <span>Pulse AI — ${deep ? 'Deep' : 'Simple'} Audit Report</span>
  <div style="display:flex;align-items:center;gap:12px">
    <span class="hint">Or press Cmd+P / Ctrl+P</span>
    <button onclick="window.print()">⬇ Save as PDF</button>
  </div>
</div>
<div class="wrap">
  <div class="report-header">
    <div>
      <h1>Pulse AI Audit Report</h1>
      <p style="margin-top:6px"><span class="mode-badge">${deep?'⚡ DEEP AUDIT':'◎ SIMPLE AUDIT'}</span></p>
      <p style="margin-top:6px">${audit.createdAt?new Date(audit.createdAt).toLocaleString():''}</p>
      ${audit.responseTime?`<p>Response: ${Math.round(audit.responseTime)}ms${audit.pageSize?` · Page: ${(audit.pageSize/1024).toFixed(0)}KB`:''}</p>`:''}
      ${deep?`<p style="font-size:10px;color:#7c3aed;margin-top:4px">Includes Core Web Vitals, mobile rendering, broken links, rendered DOM analysis</p>`:`<p style="font-size:10px;color:#16a34a;margin-top:4px">HTTP-based analysis: headers, meta tags, accessibility tree, security headers</p>`}
    </div>
    <div class="logo"><strong>Pulse AI</strong>pulse-ai-app-audit.vercel.app</div>
  </div>

  <div class="scores">
    <div class="score-card"><div class="score-val score-health">${Math.round(audit.healthScore||0)}</div><div class="score-lbl">Health Score</div></div>
    <div class="score-card"><div class="score-val">${Math.round(audit.performanceScore||0)}</div><div class="score-lbl">Performance</div></div>
    <div class="score-card"><div class="score-val">${Math.round(audit.seoScore||0)}</div><div class="score-lbl">SEO</div></div>
    <div class="score-card"><div class="score-val">${Math.round(audit.accessibilityScore||0)}</div><div class="score-lbl">Accessibility</div></div>
    <div class="score-card"><div class="score-val">${Math.round(audit.securityScore||0)}</div><div class="score-lbl">Security</div></div>
    <div class="score-card"><div class="score-val">${Math.round(audit.uxScore||0)}</div><div class="score-lbl">UX</div></div>
  </div>

  <div class="two-col">
    <div class="section">
      <div class="section-title">Issue Summary</div>
      <div class="stat-row"><span>Critical issues</span><strong style="color:#dc2626">${criticals.length}</strong></div>
      <div class="stat-row"><span>Warnings</span><strong style="color:#d97706">${warnings.length}</strong></div>
      <div class="stat-row"><span>Passed checks</span><strong style="color:#16a34a">${allPassed.length}</strong></div>
      <div class="stat-row"><span>Total findings</span><strong>${allIssues.length+allPassed.length}</strong></div>
      ${audit.responseTime?`<div class="stat-row"><span>Response time</span><strong>${Math.round(audit.responseTime)}ms</strong></div>`:''}
      ${audit.pageSize?`<div class="stat-row"><span>Page size</span><strong>${(audit.pageSize/1024).toFixed(0)}KB</strong></div>`:''}
      ${deep&&f.performance?.consoleErrors!=null?`<div class="stat-row"><span>Console errors</span><strong style="color:${f.performance.consoleErrors>0?'#dc2626':'#16a34a'}">${f.performance.consoleErrors}</strong></div>`:''}
      ${deep&&f.seo?.brokenLinks!=null?`<div class="stat-row"><span>Broken links</span><strong style="color:${f.seo.brokenLinks>0?'#dc2626':'#16a34a'}">${f.seo.brokenLinks}</strong></div>`:''}
    </div>
    ${s?.keyStrengths?.length?`
    <div class="section">
      <div class="section-title">Key Strengths</div>
      <ul class="strengths">${s.keyStrengths.map((st:string)=>`<li>${st}</li>`).join('')}</ul>
    </div>`:'<div></div>'}
  </div>

  ${s?.executiveSummary?`<div class="section"><div class="section-title">Executive Summary</div><div class="summary-box">${s.executiveSummary}</div></div>`:''}
  ${s?.priorityActions?.length?`<div class="section"><div class="section-title">Priority Actions This Week</div><div class="actions-box"><ol>${s.priorityActions.map((a:string)=>`<li>${a}</li>`).join('')}</ol></div></div>`:''}
  ${s?.criticalIssues?.length?`<div class="section"><div class="section-title">Critical Issues</div><ul class="issues-list">${s.criticalIssues.map((i:string)=>`<li>${i}</li>`).join('')}</ul></div>`:''}

  ${cwvSection}
  ${deepSeoSection}
  ${mobileSection}
  ${secHeadersSection}

  ${criticals.length>0?`<div class="section page-break"><div class="section-title">Critical Findings — Fix Immediately (${criticals.length})</div>${findingRows(criticals)}</div>`:''}
  ${warnings.length>0?`<div class="section"><div class="section-title">Warnings — Fix Soon (${warnings.length})</div>${findingRows(warnings)}</div>`:''}
  ${allPassed.length>0?`<div class="section"><div class="section-title">Passed Checks (${allPassed.length})</div>${findingRows(allPassed)}</div>`:''}

  <div class="footer">
    <span>Pulse AI — AI-Powered Product Intelligence Platform · ${deep?'Deep Audit (Playwright + CWV + Mobile)':'Simple Audit (HTTP Analysis)'}</span>
    <span>Generated ${new Date().toLocaleString()}</span>
  </div>
</div>
<script>
  // Auto-trigger print dialog after styles and content fully render
  window.onload = function() {
    setTimeout(function() { window.print(); }, 800);
  };
  // Keyboard shortcut fallback
  document.addEventListener('keydown', function(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
      e.preventDefault();
      window.print();
    }
  });
</script>
</body></html>`;

    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('project-detail', selectedProjectId!)} className="shrink-0 mt-0.5">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">Audit Results</h1>
            {isDeep ? <DeepAuditBadge /> : (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">◎ SIMPLE</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date(audit.createdAt).toLocaleString()}
            {audit.responseTime != null && ` · Response: ${Math.round(audit.responseTime)}ms`}
            {audit.pageSize != null && ` · Size: ${(audit.pageSize / 1024).toFixed(0)}KB`}
          </p>
          {isDeep && (
            <p className="text-xs text-violet-600 dark:text-violet-400 mt-1">
              Playwright deep analysis — Core Web Vitals, mobile rendering, broken links, rendered DOM
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handleExportPdf}>
          <FileText className="h-4 w-4 mr-2" /> Export PDF
        </Button>
      </div>

      {/* Deep audit — extra metrics bar */}
      {isDeep && findings?.performance?.fcp != null && (
        <Card className="border-violet-200 dark:border-violet-800 bg-violet-50/30 dark:bg-violet-950/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-violet-600" />
              <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">Core Web Vitals</span>
              <DeepAuditBadge />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'FCP', value: findings.performance.fcp, unit: 'ms', metric: 'fcp', target: '<1.8s' },
                { label: 'LCP', value: findings.performance.lcp, unit: 'ms', metric: 'lcp', target: '<2.5s' },
                { label: 'CLS', value: findings.performance.cls, unit: '', metric: 'cls', target: '<0.1' },
                { label: 'TTI', value: findings.performance.tti, unit: 'ms', metric: 'tti', target: '<3.8s' },
                { label: 'DOM Nodes', value: findings.performance.domNodes, unit: '', metric: 'domNodes', target: '<1500' },
                { label: 'JS Errors', value: findings.performance.consoleErrors, unit: '', metric: 'errors', target: '0' },
              ].filter(v => v.value != null).map(({ label, value, unit, metric, target }) => {
                const status = metric === 'errors' ? (value === 0 ? 'good' : 'poor')
                  : metric === 'domNodes' ? (value! <= 1500 ? 'good' : 'needs-improvement')
                  : vitalStatus(metric, value!);
                return (
                  <div key={label} className={`rounded-lg border p-3 text-center ${vitalColor(status)}`}>
                    <div className="text-xl font-bold">{metric === 'cls' ? value!.toFixed(3) : value}{unit}</div>
                    <div className="text-[10px] font-medium mt-0.5">{label}</div>
                    <div className="text-[9px] opacity-70">target {target}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deep audit — extra checks */}
      {isDeep && (findings?.seo?.hasSitemap != null || findings?.ux?.mobileScore != null) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {findings?.seo?.hasSitemap != null && (
            <Card className={`border ${findings.seo.hasSitemap ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/30'}`}>
              <CardContent className="p-3 flex items-center gap-3">
                <Globe className={`h-5 w-5 ${findings.seo.hasSitemap ? 'text-emerald-500' : 'text-red-500'}`} />
                <div>
                  <p className="text-xs font-semibold">XML Sitemap</p>
                  <p className="text-xs text-muted-foreground">{findings.seo.hasSitemap ? 'Found' : 'Missing — add sitemap.xml'}</p>
                </div>
                {findings.seo.hasSitemap ? <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto" /> : <XCircle className="h-4 w-4 text-red-500 ml-auto" />}
              </CardContent>
            </Card>
          )}
          {findings?.seo?.hasRobotsTxt != null && (
            <Card className={`border ${findings.seo.hasRobotsTxt ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/30'}`}>
              <CardContent className="p-3 flex items-center gap-3">
                <FileText className={`h-5 w-5 ${findings.seo.hasRobotsTxt ? 'text-emerald-500' : 'text-red-500'}`} />
                <div>
                  <p className="text-xs font-semibold">robots.txt</p>
                  <p className="text-xs text-muted-foreground">{findings.seo.hasRobotsTxt ? 'Found' : 'Missing — add robots.txt'}</p>
                </div>
                {findings.seo.hasRobotsTxt ? <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto" /> : <XCircle className="h-4 w-4 text-red-500 ml-auto" />}
              </CardContent>
            </Card>
          )}
          {findings?.ux?.mobileScore != null && (
            <Card className={`border ${findings.ux.mobileScore >= 80 ? 'border-emerald-200 bg-emerald-50/30' : 'border-amber-200 bg-amber-50/30'}`}>
              <CardContent className="p-3 flex items-center gap-3">
                <Smartphone className={`h-5 w-5 ${findings.ux.mobileScore >= 80 ? 'text-emerald-500' : 'text-amber-500'}`} />
                <div>
                  <p className="text-xs font-semibold">Mobile Rendering</p>
                  <p className="text-xs text-muted-foreground">{findings.ux.mobileScore >= 80 ? 'No overflow at 375px' : 'Horizontal scroll detected'}</p>
                </div>
                {findings.ux.mobileScore >= 80 ? <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto" /> : <AlertTriangle className="h-4 w-4 text-amber-500 ml-auto" />}
              </CardContent>
            </Card>
          )}
          {findings?.seo?.brokenLinks != null && (
            <Card className={`border ${findings.seo.brokenLinks === 0 ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/30'}`}>
              <CardContent className="p-3 flex items-center gap-3">
                <Link2 className={`h-5 w-5 ${findings.seo.brokenLinks === 0 ? 'text-emerald-500' : 'text-red-500'}`} />
                <div>
                  <p className="text-xs font-semibold">Broken Links</p>
                  <p className="text-xs text-muted-foreground">{findings.seo.brokenLinks === 0 ? 'None detected' : `${findings.seo.brokenLinks} broken links`}</p>
                </div>
                {findings.seo.brokenLinks === 0 ? <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto" /> : <XCircle className="h-4 w-4 text-red-500 ml-auto" />}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {scoreConfig.map(({ key, label }) => (
            <TabsTrigger key={key} value={key} className="hidden lg:flex items-center gap-1.5 text-xs">{label}</TabsTrigger>
          ))}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <HealthScoreRing score={audit.healthScore || 0} size={150} strokeWidth={12} label="Product Health Score" />
                <div className="flex-1 w-full space-y-4">
                  {scoreConfig.map(({ key, label, icon }) => {
                    const score = audit[`${key}Score` as keyof typeof audit] as number || 0;
                    return <ScoreBar key={key} label={label} score={score} icon={icon} />;
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audit mode comparison */}
          <Card className={`border-2 ${isDeep ? 'border-violet-200 dark:border-violet-800' : 'border-emerald-200 dark:border-emerald-800'}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <BarChart3 className={`h-5 w-5 mt-0.5 ${isDeep ? 'text-violet-500' : 'text-emerald-500'}`} />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{isDeep ? 'Deep Audit Coverage' : 'Simple Audit Coverage'}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isDeep
                      ? 'This report includes Core Web Vitals (FCP, LCP, CLS, TTI), real browser rendering via Playwright, mobile viewport test, broken link detection, JS error capture, and full rendered DOM analysis.'
                      : 'This report covers HTTP-level analysis: response headers, HTML meta tags, accessibility tree, security headers, and basic SEO tags. Run a Deep Audit for Core Web Vitals, mobile rendering, and broken links.'}
                  </p>
                  {!isDeep && (
                    <p className="text-xs text-violet-600 dark:text-violet-400 mt-2 font-medium">
                      ↑ Switch to Deep Audit for Playwright-powered CWV, mobile checks, and JS error detection
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Summary */}
          {summary && summary.executiveSummary && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  <CardTitle className="text-base">AI-Powered Insights</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-1">Executive Summary</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{summary.executiveSummary}</p>
                </div>
                {summary.keyStrengths?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Key Strengths
                    </h3>
                    <ul className="space-y-1.5">
                      {summary.keyStrengths.map((s, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-emerald-500 mt-0.5 font-bold">+</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {summary.criticalIssues?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 text-red-500" /> Critical Issues
                    </h3>
                    <ul className="space-y-1.5">
                      {summary.criticalIssues.map((s, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-red-500 mt-0.5 font-bold">!</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {summary.priorityActions?.length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                      <Target className="h-4 w-4 text-amber-600" /> Priority Actions This Week
                    </h3>
                    <ol className="space-y-2 list-decimal list-inside">
                      {summary.priorityActions.map((a, i) => (
                        <li key={i} className="text-sm leading-relaxed">{a}</li>
                      ))}
                    </ol>
                  </div>
                )}
                {summary.recommendations?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">All Recommendations</h3>
                    <ul className="space-y-1.5">
                      {summary.recommendations.map((r, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-0.5 font-semibold shrink-0">{i + 1}.</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Findings summary grid */}
          {findings && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Findings by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {scoreConfig.map(({ key, label }) => {
                    const cat = findings[key];
                    const crits = cat.issues.filter(i => i.severity === 'critical').length;
                    const warns = cat.issues.filter(i => i.severity === 'warning').length;
                    const pass = cat.passed.length;
                    return (
                      <button key={key} className="text-left rounded-lg border p-3 hover:bg-accent/50 transition-colors" onClick={() => setActiveTab(key)}>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
                        <p className="text-2xl font-bold mt-1">{Math.round(cat.score)}</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {crits > 0 && <span className="text-[10px] font-bold text-red-500">{crits} critical</span>}
                          {warns > 0 && <span className="text-[10px] font-medium text-amber-500">{warns} warn</span>}
                          {crits === 0 && warns === 0 && <span className="text-[10px] font-medium text-emerald-500">{pass} passed</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Category Tabs */}
        {scoreConfig.map(({ key, label }) => {
          const cat = findings?.[key];
          if (!cat) return null;
          const crits = cat.issues.filter(i => i.severity === 'critical');
          const warns = cat.issues.filter(i => i.severity === 'warning');
          const infos = cat.issues.filter(i => i.severity === 'info');
          const allFindings = [...cat.issues, ...cat.passed];

          return (
            <TabsContent key={key} value={key} className="space-y-4 mt-4">
              <Card>
                <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4">
                  <HealthScoreRing score={cat.score} size={80} strokeWidth={6} label={label} />
                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex flex-wrap gap-4 text-sm">
                      {crits.length > 0 && <span className="flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5 text-red-500" /><strong>{crits.length}</strong> critical</span>}
                      {warns.length > 0 && <span className="flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5 text-amber-500" /><strong>{warns.length}</strong> warning{warns.length !== 1 ? 's' : ''}</span>}
                      {infos.length > 0 && <span className="flex items-center gap-1"><Info className="h-3.5 w-3.5 text-blue-500" /><strong>{infos.length}</strong> info</span>}
                      <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /><strong>{cat.passed.length}</strong> passed</span>
                    </div>
                    <ScoreBar label={label} score={cat.score} />
                  </div>
                </CardContent>
              </Card>

              {/* Deep-only: Core Web Vitals in Performance tab */}
              {key === 'performance' && isDeep && findings.performance?.fcp != null && (
                <Card className="border-violet-200 dark:border-violet-800">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm">Core Web Vitals</CardTitle>
                      <DeepAuditBadge />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { label: 'First Contentful Paint', short: 'FCP', value: findings.performance.fcp, unit: 'ms', metric: 'fcp', target: 'Good: <1.8s' },
                        { label: 'Largest Contentful Paint', short: 'LCP', value: findings.performance.lcp, unit: 'ms', metric: 'lcp', target: 'Good: <2.5s' },
                        { label: 'Cumulative Layout Shift', short: 'CLS', value: findings.performance.cls, unit: '', metric: 'cls', target: 'Good: <0.1' },
                        { label: 'Time to Interactive', short: 'TTI', value: findings.performance.tti, unit: 'ms', metric: 'tti', target: 'Good: <3.8s' },
                        { label: 'DOM Complexity', short: 'Nodes', value: findings.performance.domNodes, unit: '', metric: 'domNodes', target: 'Good: <1500' },
                        { label: 'JavaScript Errors', short: 'Errors', value: findings.performance.consoleErrors, unit: '', metric: 'errors', target: 'Good: 0' },
                      ].filter(v => v.value != null).map(({ label, short, value, unit, metric, target }) => {
                        const status = metric === 'errors' ? (value === 0 ? 'good' : 'poor')
                          : metric === 'domNodes' ? (value! <= 1500 ? 'good' : 'needs-improvement')
                          : vitalStatus(metric, value!);
                        return (
                          <div key={short} className={`rounded-lg border p-3 ${vitalColor(status)}`}>
                            <div className="text-xl font-bold">{metric === 'cls' ? value!.toFixed(3) : value}{unit}</div>
                            <div className="text-xs font-semibold mt-0.5">{short}</div>
                            <div className="text-[10px] opacity-70 mt-0.5">{label}</div>
                            <div className="text-[9px] opacity-60 mt-1">{target}</div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* SEO: heading structure */}
              {key === 'seo' && findings.seo.headingStructure?.length > 0 && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Heading Structure</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {findings.seo.headingStructure.map((h, i) => (
                        <div key={i} className="flex items-center gap-2" style={{ paddingLeft: `${(h.level - 1) * 16}px` }}>
                          <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 shrink-0">H{h.level}</Badge>
                          <span className="text-sm truncate">{h.text}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Deep-only: SEO technical checks */}
              {key === 'seo' && isDeep && (findings.seo?.hasSitemap != null || findings.seo?.brokenLinks != null) && (
                <Card className="border-violet-200 dark:border-violet-800">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm">Technical SEO Checks</CardTitle>
                      <DeepAuditBadge />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {[
                        { label: 'XML Sitemap (sitemap.xml)', ok: findings.seo.hasSitemap, fix: 'Generate a sitemap and submit to Google Search Console' },
                        { label: 'Crawler Control (robots.txt)', ok: findings.seo.hasRobotsTxt, fix: 'Add a robots.txt file to control crawler access' },
                        { label: `Broken Links (${findings.seo.brokenLinks ?? 0} found)`, ok: findings.seo.brokenLinks === 0, fix: 'Fix or remove broken internal links' },
                      ].filter(c => c.ok !== undefined && c.ok !== null).map(({ label, ok, fix }) => (
                        <div key={label} className={`flex items-start gap-2 p-2 rounded-lg ${ok ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}>
                          {ok ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />}
                          <div>
                            <p className="text-sm font-medium">{label}</p>
                            {!ok && <p className="text-xs text-muted-foreground mt-0.5">Fix: {fix}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Security headers */}
              {key === 'security' && findings.security.headers && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Security Headers</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(findings.security.headers).map(([header, value]) => (
                        <div key={header} className={`flex items-start gap-2 p-2 rounded-lg ${value ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}>
                          {value ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />}
                          <div className="min-w-0">
                            <span className="font-mono font-semibold text-sm">{header}</span>
                            {value && <p className="text-xs text-muted-foreground mt-0.5 font-mono break-all">{String(value)}</p>}
                            {!value && (
                              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                                {header === 'Content-Security-Policy' ? "Add: Content-Security-Policy: default-src 'self'" :
                                 header === 'X-Frame-Options' ? 'Add: X-Frame-Options: SAMEORIGIN' :
                                 header === 'Strict-Transport-Security' ? 'Add: Strict-Transport-Security: max-age=31536000; includeSubDomains' :
                                 header === 'X-Content-Type-Options' ? 'Add: X-Content-Type-Options: nosniff' :
                                 'Configure this header in your server/CDN settings'}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Deep-only: UX mobile check */}
              {key === 'ux' && isDeep && findings.ux?.mobileScore != null && (
                <Card className="border-violet-200 dark:border-violet-800">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm">Mobile Rendering Test</CardTitle>
                      <DeepAuditBadge />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className={`flex items-start gap-3 p-3 rounded-lg ${findings.ux.mobileScore >= 80 ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'bg-amber-50 dark:bg-amber-950/20'}`}>
                      <Smartphone className={`h-5 w-5 shrink-0 mt-0.5 ${findings.ux.mobileScore >= 80 ? 'text-emerald-500' : 'text-amber-500'}`} />
                      <div>
                        <p className="text-sm font-semibold">375px Viewport Test (iPhone SE)</p>
                        <p className="text-sm mt-1">{findings.ux.mobileScore >= 80 ? 'No horizontal overflow — page renders correctly on mobile.' : 'Horizontal scroll detected. Content overflows the mobile viewport.'}</p>
                        {findings.ux.mobileScore < 80 && (
                          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">Fix: Check for fixed-width elements wider than the viewport. Use max-width: 100% and overflow: hidden.</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* All findings */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Issues & Findings ({allFindings.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {allFindings.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No findings in this category.</p>
                  ) : (
                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                      {crits.length > 0 && (
                        <>
                          <p className="text-xs font-bold text-red-500 uppercase tracking-wide pt-1">Critical — Fix Immediately</p>
                          {crits.map((f, i) => <FindingCard key={`c${i}`} finding={f} />)}
                        </>
                      )}
                      {warns.length > 0 && (
                        <>
                          <p className="text-xs font-bold text-amber-500 uppercase tracking-wide pt-2">Warnings — Fix Soon</p>
                          {warns.map((f, i) => <FindingCard key={`w${i}`} finding={f} />)}
                        </>
                      )}
                      {infos.length > 0 && (
                        <>
                          <p className="text-xs font-bold text-blue-500 uppercase tracking-wide pt-2">Informational</p>
                          {infos.map((f, i) => <FindingCard key={`i${i}`} finding={f} />)}
                        </>
                      )}
                      {cat.passed.length > 0 && (
                        <>
                          <p className="text-xs font-bold text-emerald-500 uppercase tracking-wide pt-2">Passed Checks</p>
                          {cat.passed.map((f, i) => <FindingCard key={`p${i}`} finding={f} />)}
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
