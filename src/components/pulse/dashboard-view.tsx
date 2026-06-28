'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HealthScoreRing } from './health-score-ring';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FolderKanban, Activity, TrendingUp, Plus, ArrowRight,
  Clock, CheckCircle2, XCircle, Loader2, Zap
} from 'lucide-react';
import type { DashboardStats } from '@/types';
import { format } from 'date-fns';

export function DashboardView() {
  const { token, dashboardStats, setDashboardStats, navigate, setSidebarOpen } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- re-trigger loading on token change
    setLoading(true);
    fetch('/api/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.totalProjects !== undefined) setDashboardStats(data);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [token, setDashboardStats]);

  const stats = dashboardStats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Overview of your product intelligence audits
          </p>
        </div>
        <Button
          onClick={() => navigate('projects')}
          className="shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Audit
        </Button>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FolderKanban className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Projects</p>
                  <p className="text-2xl font-bold">{stats?.totalProjects || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Audits</p>
                  <p className="text-2xl font-bold">{stats?.totalAudits || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Health Score</p>
                  <p className="text-2xl font-bold">
                    {stats?.avgHealthScore || 0}
                    <span className="text-sm text-muted-foreground font-normal">/100</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Audits */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">Recent Audits</CardTitle>
          {stats?.recentAudits && stats.recentAudits.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => navigate('projects')}>
              View all <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !stats?.recentAudits?.length ? (
            <div className="text-center py-12">
              <Zap className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm font-medium">No audits yet</p>
              <p className="text-muted-foreground text-xs mt-1">
                Create a project and run your first audit to see results here.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => navigate('projects')}
              >
                <Plus className="h-3 w-3 mr-1" /> Create Project
              </Button>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {stats.recentAudits.map((audit) => (
                <button
                  key={audit.id}
                  className="w-full flex items-center gap-4 rounded-lg border p-3 text-left hover:bg-accent/50 transition-colors"
                  onClick={() => {
                    navigate('project-detail', audit.project.id);
                    setSidebarOpen(false);
                  }}
                >
                  <div className="shrink-0">
                    {audit.status === 'completed' && audit.healthScore !== null ? (
                      <HealthScoreRing score={audit.healthScore} size={48} strokeWidth={5} showValue={false} />
                    ) : audit.status === 'running' ? (
                      <div className="flex h-12 w-12 items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : audit.status === 'failed' ? (
                      <div className="flex h-12 w-12 items-center justify-center">
                        <XCircle className="h-6 w-6 text-destructive" />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center">
                        <Clock className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{audit.project.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{audit.project.url}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {audit.healthScore !== null && (
                      <span className="text-sm font-bold">{Math.round(audit.healthScore)}</span>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(audit.createdAt), 'MMM d, HH:mm')}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}