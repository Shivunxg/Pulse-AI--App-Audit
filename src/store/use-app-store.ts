import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ViewType, DashboardStats, AuditWithProject } from '@/types';

interface User {
  id: string;
  email: string;
  name: string | null;
}

interface AppState {
  // Auth
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;

  // Navigation
  currentView: ViewType;
  selectedProjectId: string | null;
  selectedAuditId: string | null;
  navigate: (view: ViewType, projectId?: string, auditId?: string) => void;

  // Dashboard
  dashboardStats: DashboardStats | null;
  setDashboardStats: (stats: DashboardStats) => void;

  // UI
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isAuditPolling: boolean;
  setIsAuditPolling: (polling: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Auth
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null, currentView: 'landing' }),

      // Navigation
      currentView: 'landing',
      selectedProjectId: null,
      selectedAuditId: null,
      navigate: (view, projectId, auditId) =>
        set({
          currentView: view,
          selectedProjectId: projectId || null,
          selectedAuditId: auditId || null,
        }),

      // Dashboard
      dashboardStats: null,
      setDashboardStats: (stats) => set({ dashboardStats: stats }),

      // UI
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      isAuditPolling: false,
      setIsAuditPolling: (polling) => set({ isAuditPolling: polling }),
    }),
    {
      name: 'pulse-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);