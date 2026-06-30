'use client';

import { Activity, BarChart3, FolderKanban, LayoutDashboard, LogOut, Plus, HeartPulse, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/store/use-app-store';
import { cn } from '@/lib/utils';
import { useRouter, usePathname } from 'next/navigation';

const navItems = [
  { view: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
  { view: 'projects' as const, label: 'Projects', icon: FolderKanban },
  { view: 'pricing' as const, label: 'Pricing', icon: Sparkles },
];

export function AppSidebar() {
  const { currentView, navigate, sidebarOpen, setSidebarOpen, logout, user } = useAppStore();

  const handleNav = (view: 'dashboard' | 'projects' | 'pricing') => {
    navigate(view);
    setSidebarOpen(false);
  };

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r bg-card transition-transform duration-200 lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center gap-2 px-4 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <HeartPulse className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">Pulse AI</span>
        </div>

        <Separator />

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.view;
            return (
              <Button
                key={item.view}
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn('w-full justify-start gap-3', isActive && 'font-medium')}
                onClick={() => handleNav(item.view)}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>

        <Separator />

        <div className="p-3 space-y-2">
          <div className="px-3 py-2 text-sm text-muted-foreground truncate">
            {user?.email}
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground"
            onClick={async () => {
              if (useAppStore.getState().token) {
                await fetch('/api/auth/me', {
                  method: 'DELETE',
                  headers: { Authorization: `Bearer ${useAppStore.getState().token}` },
                });
              }
              logout();
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>
    </>
  );
}