'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft, TrendingUp, TrendingDown, Minus, AlertTriangle,
  LineChart as LineChartIcon, BarChart3, Lock,
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { format } from 'date-fns';

interface ProjectTrend {
  projectId: string;
  projectName: string;
  projectUrl: string;
  type: string;
  auditCount: number;
  series: {
    date: string;
    mode: string;
    health: number | null;
    performance: number | null;
    seo: number | null;
    accessibility: number | null;
    security: number | null;
    ux: number | null;
    technology: number | null;
    content: number | null;
  }[];
  delta: number | null;
  latest: number | null;
}

interface TrendsData {
  projectTrends: ProjectTrend[];
  aggregateSeries: { date: string; avgHealth: number }[];
  summary: {
    totalProjects: number;
    totalAudits: number;
    decliningCount: number;
    improvingCount: number;
    decliningProjects: { name: string; delta: number; latest: number | null }[];
  };
}

interface UsageData {
  tier: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  health: '#18181b',
  performance: '#3b82f6',
  seo: '#10b981',
  accessibility: '#f59e0b',
  security: '#ef4444',
  ux: '#8b5cf6',
};

export function TrendsView() {
  const { token, navigate } = useAppStore();
  const [data, setData] = useState<TrendsData | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch('/api/trends', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/usage', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ])
      .then(([trendsData, usageData]) => {
        if (trendsData.projectTrends) setData(trendsData);
        if (usageData.tier) setUsage(usageData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const isFree = usage?.tier === 'free';

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data || data.projectTrends.length === 0) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </Button>
        <Card>
          <CardContent className="py-16 text-center">
            <LineChartIcon className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No trend data yet</p>
            <p className="text-sm text-muted-foreground mt-2">Run at least 2 audits on a project to see score trends over time.</p>
            <Button className="mt-6" onClick={() => navigate('projects')}>Go to Projects</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const projectsWithMultipleAudits = data.projectTrends.filter(p => p.series.length >= 2);
  const selected = selectedProjectId
    ? data.projectTrends.find(p => p.projectId === selectedProjectId)
    : projectsWithMultipleAudits[0] || data.projectTrends[0];

  const chartData = selected?.series.map(s => ({
    date: format(new Date(s.date), 'MMM d'),
    fullDate: s.date,
    Health: s.health,
    Performance: s.performance,
    SEO: s.seo,
    Accessibility: s.accessibility,
    Security: s.security,
    UX: s.ux,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trends</h1>
        <p className="text-sm text-muted-foreground mt-1">Track how your product health changes over time across audits</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Projects Tracked</p>
            <p className="text-2xl font-bold mt-1">{data.summary.totalProjects}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Audits</p>
            <p className="text-2xl font-bold mt-1">{data.summary.totalAudits}</p>
          </CardContent>
        </Card>
        <Card className={data.summary.improvingCount > 0 ? 'border-emerald-200 bg-emerald-50/30' : ''}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" /> Improving
            </p>
            <p className="text-2xl font-bold mt-1 text-emerald-600">{data.summary.improvingCount}</p>
          </CardContent>
        </Card>
        <Card className={data.summary.decliningCount > 0 ? 'border-red-200 bg-red-50/30' : ''}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-red-500" /> Declining
            </p>
            <p className="text-2xl font-bold mt-1 text-red-600">{data.summary.decliningCount}</p>
          </CardContent>
        </Card>
      </div>

      {data.summary.decliningProjects.length > 0 && (
        <Card className="border-amber-300 bg-amber-50/50 dark:bg-amber-950/10">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Health Score Regression Detected</p>
              <ul className="mt-2 space-y-1">
                {data.summary.decliningProjects.map((p, i) => (
                  <li key={i} className="text-sm text-amber-700 dark:text-amber-400">
                    <strong>{p.name}</strong> dropped {Math.abs(p.delta)} points — now at {p.latest}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {data.projectTrends.map(p => (
          <button
            key={p.projectId}
            onClick={() => setSelectedProjectId(p.projectId)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              selected?.projectId === p.projectId
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-accent border-border'
            }`}
          >
            {p.projectName}
            {p.delta != null && (
              <span className={`ml-1.5 ${p.delta > 0 ? 'text-emerald-300' : p.delta < 0 ? 'text-red-300' : ''}`}>
                {p.delta > 0 ? `+${p.delta}` : p.delta}
              </span>
            )}
          </button>
        ))}
      </div>

      {selected && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">{selected.projectName}</CardTitle>
                <CardDescription>{selected.auditCount} audits · {selected.projectUrl}</CardDescription>
              </div>
              {selected.delta != null && (
                <Badge variant={selected.delta > 0 ? 'default' : selected.delta < 0 ? 'destructive' : 'secondary'} className="flex items-center gap-1">
                  {selected.delta > 0 ? <TrendingUp className="h-3 w-3" /> : selected.delta < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                  {selected.delta > 0 ? `+${selected.delta}` : selected.delta} pts
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {chartData.length < 2 ? (
              <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                Run at least 2 audits on this project to see a trend line.
              </div>
            ) : isFree ? (
              <div className="h-64 flex flex-col items-center justify-center gap-3 bg-muted/30 rounded-lg border border-dashed">
                <Lock className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center max-w-xs">
                  Detailed category trends (Performance, SEO, Security breakdown) are a Pro feature.
                  <br />Free tier shows Health Score trend only.
                </p>
                <ResponsiveContainer width="90%" height={120}>
                  <LineChart data={chartData}>
                    <Line type="monotone" dataKey="Health" stroke={CATEGORY_COLORS.health} strokeWidth={2} dot={{ r: 3 }} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} width={28} />
                  </LineChart>
                </ResponsiveContainer>
                <Button size="sm" onClick={() => navigate('pricing')}>Upgrade to Pro</Button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="Health" stroke={CATEGORY_COLORS.health} strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Performance" stroke={CATEGORY_COLORS.performance} strokeWidth={1.5} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="SEO" stroke={CATEGORY_COLORS.seo} strokeWidth={1.5} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="Accessibility" stroke={CATEGORY_COLORS.accessibility} strokeWidth={1.5} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="Security" stroke={CATEGORY_COLORS.security} strokeWidth={1.5} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="UX" stroke={CATEGORY_COLORS.ux} strokeWidth={1.5} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

      {data.aggregateSeries.length >= 2 && !isFree && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Overall Average Health Score</CardTitle>
            </div>
            <CardDescription>Average across all your projects, per day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data.aggregateSeries.map(d => ({ ...d, date: format(new Date(d.date), 'MMM d') }))}>
                <defs>
                  <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#18181b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#18181b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Area type="monotone" dataKey="avgHealth" stroke="#18181b" fillOpacity={1} fill="url(#colorHealth)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
