'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { HealthScoreRing } from './health-score-ring';
import {
  Plus, Globe, Trash2, Loader2, ChevronRight,
  Smartphone, Monitor, Upload, FileUp,
} from 'lucide-react';
import { format } from 'date-fns';

interface Project {
  id: string;
  name: string;
  url: string;
  type: string;
  auditCount: number;
  latestAudit: { id: string; status: string; healthScore: number | null; createdAt: string } | null;
  createdAt: string;
}

export function ProjectsView() {
  const { token, navigate, setSidebarOpen } = useAppStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [projectType, setProjectType] = useState('website');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const loadProjects = useCallback(() => {
    if (!token) return;
    setLoading(true);
    fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => { if (data.projects) setProjects(data.projects); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const handleCreate = async () => {
    setError('');
    setCreating(true);
    try {
      const body: Record<string, string> = { name: newName, type: projectType };
      if (projectType === 'website' || projectType === 'playstore') body.url = newUrl;

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed'); return; }
      setDialogOpen(false);
      setNewName('');
      setNewUrl('');
      setProjectType('website');
      loadProjects();
    } catch { setError('Network error'); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this project and all its audits?')) return;
    await fetch(`/api/projects/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    loadProjects();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Audit websites (simple &amp; deep) and Android APKs
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); setError(''); }}>
          <DialogTrigger asChild>
            <Button className="shrink-0">
              <Plus className="h-4 w-4 mr-2" /> New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Project</DialogTitle>
              <DialogDescription>Choose a platform type and provide the required information.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <RadioGroup value={projectType} onValueChange={(v) => { setProjectType(v); setError(''); }}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="website" id="type-website" />
                  <Label htmlFor="type-website" className="flex items-center gap-2 cursor-pointer">
                    <Monitor className="h-4 w-4" /> Website
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="android" id="type-android" />
                  <Label htmlFor="type-android" className="flex items-center gap-2 cursor-pointer">
                    <Smartphone className="h-4 w-4" /> Android App (APK)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="playstore" id="type-playstore" />
                  <Label htmlFor="type-playstore" className="flex items-center gap-2 cursor-pointer">
                    <Smartphone className="h-4 w-4" /> Play Store Listing (URL only)
                  </Label>
                </div>
              </RadioGroup>

              <div className="space-y-2">
                <Label htmlFor="proj-name">Project Name</Label>
                <Input id="proj-name" placeholder={projectType === 'android' ? 'My App' : projectType === 'playstore' ? 'My App (Store Listing)' : 'My Website'} value={newName} onChange={(e) => setNewName(e.target.value)} />
              </div>

              {projectType === 'website' && (
                <div className="space-y-2">
                  <Label htmlFor="proj-url">Website URL</Label>
                  <Input id="proj-url" placeholder="https://example.com" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} />
                </div>
              )}

              {projectType === 'playstore' && (
                <div className="space-y-2">
                  <Label htmlFor="proj-url">Play Store URL</Label>
                  <Input id="proj-url" placeholder="https://play.google.com/store/apps/details?id=com.example.app" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Audits the live store listing — rating, screenshots, description quality. No APK needed.</p>
                </div>
              )}

              {projectType === 'android' && (
                <div className="rounded-lg border p-3 bg-muted/50 text-sm text-muted-foreground">
                  After creating the project, you can upload an APK file to start the audit.
                </div>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={creating || !newName}>
                {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create Project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Globe className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="font-medium text-muted-foreground">No projects yet</p>
            <p className="text-sm text-muted-foreground mt-1">Add a website or Android app to start auditing.</p>
            <Button className="mt-4" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="group cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => { navigate('project-detail', project.id); setSidebarOpen(false); }}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {project.type === 'android' || project.type === 'playstore' ? (
                        <Smartphone className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <h3 className="font-semibold text-sm truncate">{project.name}</h3>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {project.auditCount} audit{project.auditCount !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                        {project.type === 'android' ? 'Android' : project.type === 'playstore' ? 'Play Store' : 'Website'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {project.latestAudit?.healthScore != null && (
                      <HealthScoreRing score={project.latestAudit.healthScore} size={40} strokeWidth={4} showValue={false} />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleDelete(project.id, e)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </div>
                {project.latestAudit && (
                  <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                    <span>Last audit: {format(new Date(project.latestAudit.createdAt), 'MMM d, HH:mm')}</span>
                    <div className="flex items-center gap-1 text-primary font-medium">
                      View <ChevronRight className="h-3 w-3" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}