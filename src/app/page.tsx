'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { AppSidebar } from '@/components/pulse/app-sidebar';
import { AuthForm } from '@/components/pulse/auth-form';
import { DashboardView } from '@/components/pulse/dashboard-view';
import { ProjectsView } from '@/components/pulse/projects-view';
import { ProjectDetailView } from '@/components/pulse/project-detail-view';
import { AuditResultsView } from '@/components/pulse/audit-results-view';
import { PricingView } from '@/components/pulse/pricing-view';
import { SettingsView } from '@/components/pulse/settings-view';
import { TrendsView } from '@/components/pulse/trends-view';
import { LandingPage } from '@/components/pulse/landing-page';
import { BlogPostView } from '@/components/pulse/blog-post-view';
import { PrivacyPolicyView } from '@/components/pulse/privacy-policy-view';
import { TermsView } from '@/components/pulse/terms-view';
import { Button } from '@/components/ui/button';
import { Menu, HeartPulse } from 'lucide-react';

export default function Home() {
  const { user, currentView, setSidebarOpen, token, clearIfExpired, setAuth, logout } = useAppStore();
  const [restoring, setRestoring] = useState(true);

  // Restore / validate session on mount.
  // The httpOnly cookie (set at login) authenticates this request automatically
  // via `credentials: 'include'` — we don't need the in-memory token to make
  // this specific call. The response then repopulates the in-memory token for
  // existing Bearer-header call sites elsewhere in the app.
  useEffect(() => {
    clearIfExpired();
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => {
        if (r.ok) return r.json();
        throw new Error('Invalid session');
      })
      .then((data) => {
        if (!data.user) throw new Error('No user');
        setAuth(data.user, data.token || token || '');
      })
      .catch(() => {
        logout();
      })
      .finally(() => setRestoring(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (restoring && !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <HeartPulse className="h-8 w-8 text-primary animate-pulse" />
      </div>
    );
  }

  // Redirect to landing if not authenticated
  if (!user) {
    if (currentView === 'auth') return <AuthForm />;
    if (currentView === 'blog') return <BlogPostView />;
    if (currentView === 'privacy') return <PrivacyPolicyView />;
    if (currentView === 'terms') return <TermsView />;
    return <LandingPage />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <DashboardView />;
      case 'projects': return <ProjectsView />;
      case 'project-detail': return <ProjectDetailView />;
      case 'audit-results': return <AuditResultsView />;
      case 'pricing': return <PricingView />;
      case 'settings': return <SettingsView />;
      case 'trends': return <TrendsView />;
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