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
  Gauge, Search, Eye, Shield, MousePointer, XCircle,
} from 'lucide-react';
import type { AuditFindings, AiSummary, AndroidFindings, Finding } from '@/types';

const webScoreConfig = [
  { key: 'performance' as const, label: 'Performance', icon: <Gauge className="h-4 w-4" /> },
  { key: 'seo' as const, label: 'SEO', icon: <Search className="h-4 w-4" /> },
  { key: 'accessibility' as const, label: 'Accessibility', icon: <Eye className="h-4 w-4" /> },
  { key: 'security' as const, label: 'Security', icon: <Shield className="h-4 w-4" /> },
  { key: 'ux' as const, label: 'UX', icon: <MousePointer className="h-4 w-4" /> },
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

function FindingCard({ finding }: { finding: Finding }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className={`rounded-lg border p-3 transition-colors ${
        finding.severity === 'critical' ? 'border-red-200 bg-red-50/50 dark:bg-red-950/10' :
        finding.severity === 'warning' ? 'border-amber-200 bg-amber-50/50 dark:bg-amber-950/10' :
        finding.severity === 'passed' ? 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/10' :
        'border-muted'
      }`}
    >
      <div className="flex items-start gap-2">
        <SeverityIcon severity={finding.severity} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{finding.title}</span>
            <Badge
              variant={finding.severity === 'critical' ? 'destructive' : 'secondary'}
              className="text-[10px] px-1.5 py-0"
            >
              {finding.severity}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{finding.description}</p>
          {finding.recommendation && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
              className="flex items-center gap-1 text-xs text-primary mt-1.5 hover:underline"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? 'Hide' : 'Show'} recommendation
            </button>
          )}
          {expanded && finding.recommendation && (
            <div className="mt-2 text-xs bg-background rounded p-2 border">
              <span className="font-medium">Recommendation: </span>
              {finding.recommendation}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AuditResultsView() {
  const { token, selectedProjectId, selectedAuditId, navigate } = useAppStore();
  const [audit, setAudit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const isAndroid = audit?.findings?.security !== undefined && audit?.findings?.configuration !== undefined;
  const scoreConfig = isAndroid ? androidScoreConfig : webScoreConfig;

  const loadAudit = useCallback(() => {
    if (!token || !selectedProjectId || !selectedAuditId) return;
    fetch(`/api/projects/${selectedProjectId}/audits/${selectedAuditId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.audit) {
          setAudit(data.audit);
          if (data.audit.status === 'completed') setActiveTab('overview');
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, selectedProjectId, selectedAuditId]);

  useEffect(() => { loadAudit(); }, [loadAudit]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Audit not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('projects')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      </div>
    );
  }

  if (audit.status === 'running') {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('project-detail', selectedProjectId!)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Project
        </Button>
        <Card>
          <CardContent className="py-16 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg font-medium">Audit in Progress</p>
            <p className="text-sm text-muted-foreground mt-2">
              Running deterministic analysis and AI interpretation...
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={loadAudit}
            >
              <Zap className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const findings = audit.findings as AuditFindings | null;
  const summary = audit.aiSummary as AiSummary | null;

  const handleExportPdf = () => {
    // Navigate to project detail which has the export button
    navigate('project-detail', selectedProjectId!);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('project-detail', selectedProjectId!)}
          className="shrink-0 mt-0.5"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Audit Results</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date(audit.createdAt).toLocaleString()}
            {audit.responseTime != null && ` · Response: ${Math.round(audit.responseTime)}ms`}
            {audit.pageSize != null && ` · Size: ${(audit.pageSize / 1024).toFixed(0)}KB`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportPdf}>
          <FileText className="h-4 w-4 mr-2" /> Export PDF
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {scoreConfig.map(({ key, label }) => (
            <TabsTrigger key={key} value={key} className="hidden lg:flex items-center gap-1.5">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* Health Score + Sub-scores */}
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
                  <p className="text-sm text-muted-foreground">{summary.executiveSummary}</p>
                </div>

                {summary.keyStrengths?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Key Strengths
                    </h3>
                    <ul className="space-y-1">
                      {summary.keyStrengths.map((s, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-emerald-500 mt-0.5">+</span> {s}
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
                    <ul className="space-y-1">
                      {summary.criticalIssues.map((s, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-red-500 mt-0.5">!</span> {s}
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
                    <ol className="space-y-1 list-decimal list-inside">
                      {summary.priorityActions.map((a, i) => (
                        <li key={i} className="text-sm">{a}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {summary.recommendations?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">All Recommendations</h3>
                    <ul className="space-y-1">
                      {summary.recommendations.map((r, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-0.5">{i + 1}.</span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick findings summary */}
          {findings && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Findings Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  {scoreConfig.map(({ key, label }) => {
                    const cat = findings[key];
                    const criticals = cat.issues.filter(i => i.severity === 'critical').length;
                    const warnings = cat.issues.filter(i => i.severity === 'warning').length;
                    const passed = cat.passed.length;
                    return (
                      <button
                        key={key}
                        className="text-left rounded-lg border p-3 hover:bg-accent/50 transition-colors"
                        onClick={() => setActiveTab(key)}
                      >
                        <p className="text-xs font-medium text-muted-foreground">{label}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {criticals > 0 && (
                            <span className="text-xs font-bold text-red-500">{criticals} critical</span>
                          )}
                          {warnings > 0 && (
                            <span className="text-xs font-medium text-amber-500">{warnings} warning{warnings > 1 ? 's' : ''}</span>
                          )}
                          {criticals === 0 && warnings === 0 && passed > 0 && (
                            <span className="text-xs font-medium text-emerald-500">{passed} passed</span>
                          )}
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
          const allFindings = [...cat.issues, ...cat.passed];
          const criticals = cat.issues.filter(i => i.severity === 'critical');
          const warnings = cat.issues.filter(i => i.severity === 'warning');
          const infos = cat.issues.filter(i => i.severity === 'info');

          return (
            <TabsContent key={key} value={key} className="space-y-4 mt-4">
              <Card>
                <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4">
                  <HealthScoreRing score={cat.score} size={80} strokeWidth={6} label={label} />
                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex gap-4 text-sm">
                      {criticals.length > 0 && <span className="flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5 text-red-500" /> <strong>{criticals.length}</strong> critical</span>}
                      {warnings.length > 0 && <span className="flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> <strong>{warnings.length}</strong> warning{warnings.length !== 1 ? 's' : ''}</span>}
                      {infos.length > 0 && <span className="flex items-center gap-1"><Info className="h-3.5 w-3.5 text-blue-500" /> <strong>{infos.length}</strong> info</span>}
                      <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> <strong>{cat.passed.length}</strong> passed</span>
                    </div>
                    <ScoreBar label={label} score={cat.score} />
                  </div>
                </CardContent>
              </Card>

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

              {key === 'security' && findings.security.headers && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Security Headers</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(findings.security.headers).map(([header, value]) => (
                        <div key={header} className="flex items-start gap-2 text-sm">
                          {value ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <span className="font-mono font-medium">{header}</span>
                            {value && (
                              <p className="text-xs text-muted-foreground mt-0.5 font-mono break-all">{value}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Android-specific: Security details */}
              {key === 'security' && findings.dangerousPermissions && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Permissions ({findings.totalPermissions})</CardTitle></CardHeader>
                  <CardContent>
                    {findings.dangerousPermissions.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-red-500 mb-1">Dangerous Permissions</p>
                        <div className="flex flex-wrap gap-1">
                          {findings.dangerousPermissions.map((p: string) => (
                            <Badge key={p} variant="destructive" className="text-[10px] font-mono">{p.replace('android.permission.', '')}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {findings.hardcodedSecrets?.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-red-500 mb-1">Hardcoded Secrets</p>
                        <div className="space-y-1">
                          {findings.hardcodedSecrets.map((s: string, i: number) => (
                            <p key={i} className="text-xs font-mono text-muted-foreground bg-red-50 dark:bg-red-950/20 rounded p-1.5">{s}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Android-specific: Configuration details */}
              {key === 'configuration' && findings.packageName && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">App Information</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Package:</span></div>
                      <div className="font-mono text-xs truncate">{findings.packageName}</div>
                      {findings.versionName && <><div><span className="text-muted-foreground">Version:</span></div><div>{findings.versionName}</div></>}
                      {findings.minSdkVersion != null && <><div><span className="text-muted-foreground">Min SDK:</span></div><div>{findings.minSdkVersion}</div></>}
                      {findings.targetSdkVersion != null && <><div><span className="text-muted-foreground">Target SDK:</span></div><div>{findings.targetSdkVersion}</div></>}
                      {findings.supportedArchitectures?.length > 0 && <><div><span className="text-muted-foreground">Architectures:</span></div><div>{findings.supportedArchitectures.join(', ')}</div></>}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Android-specific: Privacy details */}
              {key === 'privacy' && findings.trackersFound?.length > 0 && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Trackers &amp; SDKs</CardTitle></CardHeader>
                  <CardContent>
                    {findings.analyticsSdks?.length > 0 && (
                      <div className="mb-2"><p className="text-xs font-medium mb-1">Analytics</p><div className="flex flex-wrap gap-1">{findings.analyticsSdks.map((s: string) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}</div></div>
                    )}
                    {findings.adSdks?.length > 0 && (
                      <div className="mb-2"><p className="text-xs font-medium mb-1">Advertising</p><div className="flex flex-wrap gap-1">{findings.adSdks.map((s: string) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}</div></div>
                    )}
                    {findings.socialSdks?.length > 0 && (
                      <div><p className="text-xs font-medium mb-1">Social</p><div className="flex flex-wrap gap-1">{findings.socialSdks.map((s: string) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}</div></div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Android-specific: Code Quality details */}
              {key === 'codeQuality' && findings.thirdPartyLibraries && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Libraries</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {findings.thirdPartyLibraries.map((lib: string) => (
                        <Badge key={lib} variant="outline" className="text-xs font-mono">{lib}</Badge>
                      ))}
                    </div>
                    {findings.nativeLibraries?.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium mb-1">Native Libraries ({findings.nativeLibraries.length})</p>
                        <div className="flex flex-wrap gap-1">
                          {findings.nativeLibraries.map((lib: string) => (
                            <Badge key={lib} variant="secondary" className="text-xs font-mono">{lib}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Deep audit extras */}
              {key === 'performance' && findings.fcp != null && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Core Web Vitals (Deep Audit)</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {findings.fcp != null && <div><span className="text-muted-foreground">FCP:</span> <span className="font-bold">{findings.fcp}ms</span></div>}
                      {findings.lcp != null && <div><span className="text-muted-foreground">LCP:</span> <span className="font-bold">{findings.lcp}ms</span></div>}
                      {findings.cls != null && <div><span className="text-muted-foreground">CLS:</span> <span className="font-bold">{findings.cls}</span></div>}
                      {findings.domNodes != null && <div><span className="text-muted-foreground">DOM Nodes:</span> <span className="font-bold">{findings.domNodes}</span></div>}
                      {findings.consoleErrors != null && <div><span className="text-muted-foreground">Console Errors:</span> <span className="font-bold">{findings.consoleErrors}</span></div>}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Deep audit SEO extras */}
              {key === 'seo' && (findings.hasSitemap != null || findings.brokenLinks != null) && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">SEO Details (Deep Audit)</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {findings.hasSitemap != null && <div className="flex items-center gap-2">{findings.hasSitemap ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-red-500" />} Sitemap found</div>}
                      {findings.hasRobotsTxt != null && <div className="flex items-center gap-2">{findings.hasRobotsTxt ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-red-500" />} robots.txt found</div>}
                      {findings.brokenLinks != null && <div className="flex items-center gap-2">{findings.brokenLinks > 0 ? <XCircle className="h-4 w-4 text-red-500" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />} {findings.brokenLinks} broken links</div>}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    Issues & Findings ({allFindings.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {allFindings.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No findings in this category.</p>
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {allFindings.map((f, i) => <FindingCard key={i} finding={f} />)}
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