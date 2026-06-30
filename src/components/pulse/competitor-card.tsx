'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/store/use-app-store';
import { Swords, Loader2, Lock, Plus, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Competitor {
  id: string;
  name: string;
  url: string;
  comparison: {
    yours: Record<string, any>;
    competitor: Record<string, any>;
    deltas: Record<string, number>;
  };
  createdAt: string;
}

const METRICS = [
  { key: 'health', label: 'Health' },
  { key: 'performance', label: 'Performance' },
  { key: 'seo', label: 'SEO' },
  { key: 'accessibility', label: 'Accessibility' },
  { key: 'security', label: 'Security' },
  { key: 'ux', label: 'UX' },
];

export function CompetitorCard({ projectId }: { projectId: string }) {
  const { token, navigate } = useAppStore();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/projects/${projectId}/competitors`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setCompetitors(data.competitors || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, projectId]);

  const handleAdd = async () => {
    if (!name || !url) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/competitors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to add competitor');
        return;
      }
      setCompetitors([data.competitor, ...competitors]);
      setName('');
      setUrl('');
      setShowForm(false);
    } catch {
      setError('Network error');
    } finally {
      setAdding(false);
    }
  };

  if (loading) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Swords className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Competitor Benchmarking</CardTitle>
          </div>
          {!showForm && (
            <Button size="sm" variant="ghost" onClick={() => setShowForm(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm && (
          <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
            <Input placeholder="Competitor name" value={name} onChange={e => setName(e.target.value)} className="h-8 text-sm" />
            <Input placeholder="https://competitor.com" value={url} onChange={e => setUrl(e.target.value)} className="h-8 text-sm" />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={adding || !name || !url}>
                {adding ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : null}
                Compare
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); setError(null); }}>Cancel</Button>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/20 rounded-lg p-2.5">
            <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>{error} <button onClick={() => navigate('pricing')} className="underline font-medium">Upgrade</button></span>
          </div>
        )}

        {competitors.length === 0 && !showForm ? (
          <p className="text-xs text-muted-foreground">Add a competitor URL to compare scores side-by-side.</p>
        ) : (
          competitors.map(c => (
            <div key={c.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{c.name}</span>
                <span className="text-xs text-muted-foreground">{c.url}</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {METRICS.map(m => {
                  const delta = c.comparison.deltas?.[m.key] ?? 0;
                  const yours = c.comparison.yours?.[`${m.key}Score`];
                  return (
                    <div key={m.key} className="text-center">
                      <p className="text-[10px] text-muted-foreground">{m.label}</p>
                      <p className="text-sm font-bold">{Math.round(yours || 0)}</p>
                      <p className={`text-[10px] flex items-center justify-center gap-0.5 ${delta > 0 ? 'text-emerald-500' : delta < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                        {delta > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : delta < 0 ? <TrendingDown className="h-2.5 w-2.5" /> : <Minus className="h-2.5 w-2.5" />}
                        {delta > 0 ? `+${Math.round(delta)}` : Math.round(delta)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
