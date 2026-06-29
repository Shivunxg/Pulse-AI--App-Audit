'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { AppSidebar } from '@/components/pulse/app-sidebar';
import { AuthForm } from '@/components/pulse/auth-form';
import { DashboardView } from '@/components/pulse/dashboard-view';
import { ProjectsView } from '@/components/pulse/projects-view';
import { ProjectDetailView } from '@/components/pulse/project-detail-view';
import { AuditResultsView } from '@/components/pulse/audit-results-view';
import { Button } from '@/components/ui/button';
import { Menu, HeartPulse } from 'lucide-react';

export default function Home() {
  const { user, currentView, setSidebarOpen, token, clearIfExpired } = useAppStore();

  // Validate session on mount
  useEffect(() => {
    // Clear immediately if JWT is expired (avoids stale token hitting API)
    clearIfExpired();
    if (!token) return;
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (r.ok) return r.json();
        throw new Error('Invalid session');
      })
      .then((data) => {
        if (!data.user) throw new Error('No user');
      })
      .catch(() => {
        useAppStore.getState().logout();
      });
  }, [token, clearIfExpired]);

  // Redirect to landing if not authenticated
  if (!user) {
    return <AuthForm />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <DashboardView />;
      case 'projects': return <ProjectsView />;
      case 'project-detail': return <ProjectDetailView />;
      case 'audit-results': return <AuditResultsView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="flex items-center gap-3 border-b px-4 py-3 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <HeartPulse className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">Pulse AI</span>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
}