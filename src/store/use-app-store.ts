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
  clearIfExpired: () => void;

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

// Decode JWT expiry without a library
function isJwtExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return false;
    // Add 30s buffer
    return Date.now() / 1000 > payload.exp - 30;
  } catch {
    return false;
  }
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null, currentView: 'landing' }),
      clearIfExpired: () => {
        const { token } = get();
        if (token && isJwtExpired(token)) {
          set({ user: null, token: null, currentView: 'landing' });
        }
      },

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
      // SECURITY: token is intentionally NOT persisted to localStorage.
      // It's now carried via an httpOnly cookie (set by the login/register API
      // routes) which JavaScript cannot read — this closes the XSS token-theft
      // vector that plain localStorage persistence had. `token` still lives in
      // memory for this tab's session (so existing Bearer-header API calls keep
      // working during the migration), it's just not written to disk.
      partialize: (state) => ({ user: state.user }),
    }
  )
);