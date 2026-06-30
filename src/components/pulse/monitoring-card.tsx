'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/use-app-store';
import { Activity, Loader2, Lock, Bell } from 'lucide-react';

interface MonitorSchedule {
  id: string;
  enabled: boolean;
  frequency: string;
  mode: string;
  nextRunAt: string | null;
  lastRunAt: string | null;
  dropThreshold: number;
}

export function MonitoringCard({ projectId }: { projectId: string }) {
  const { token, navigate } = useAppStore();
  const [schedule, setSchedule] = useState<MonitorSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/projects/${projectId}/monitor`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setSchedule(data.schedule))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, projectId]);

  const handleToggle = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/monitor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          enabled: !schedule?.enabled,
          frequency: schedule?.frequency || 'weekly',
          mode: schedule?.mode || 'simple',
          dropThreshold: schedule?.dropThreshold || 10,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update monitoring');
        return;
      }
      setSchedule(data.schedule);
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <Card className={schedule?.enabled ? 'border-emerald-200 dark:border-emerald-800' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className={`h-4 w-4 ${schedule?.enabled ? 'text-emerald-500' : 'text-muted-foreground'}`} />
            <CardTitle className="text-sm">Continuous Monitoring</CardTitle>
          </div>
          {schedule?.enabled && <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">Active</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">
          {schedule?.enabled
            ? `Auto-re-auditing ${schedule.frequency}.${schedule.nextRunAt ? ` Next run: ${new Date(schedule.nextRunAt).toLocaleDateString()}.` : ''} You'll be alerted if health score drops ${schedule.dropThreshold}+ points.`
            : 'Automatically re-audit this project on a schedule and get alerted if scores regress.'}
        </p>
        {error && (
          <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/20 rounded-lg p-2.5 mb-3">
            <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>
              {error}{' '}
              <button onClick={() => navigate('pricing')} className="underline font-medium">Upgrade</button>
            </span>
          </div>
        )}
        <Button size="sm" variant={schedule?.enabled ? 'outline' : 'default'} onClick={handleToggle} disabled={saving}>
          {saving ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Bell className="h-3.5 w-3.5 mr-2" />}
          {schedule?.enabled ? 'Disable Monitoring' : 'Enable Weekly Monitoring'}
        </Button>
      </CardContent>
    </Card>
  );
}
