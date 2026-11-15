'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser, TenantInfo } from '@/types/contracts';

export interface ImpersonationBackup {
  user: AuthUser;
  tenant: TenantInfo | null;
  accessToken: string;
  actorEmail: string;
  reason: string;
  expiresInMinutes: number;
}

interface AuthState {
  user: AuthUser | null;
  tenant: TenantInfo | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  impersonationBackup: ImpersonationBackup | null;
  setAuth: (data: {
    user: AuthUser;
    tenant: TenantInfo | null;
    accessToken: string;
  }) => void;
  updateProfile: (data: { user: AuthUser; tenant: TenantInfo | null }) => void;
  startImpersonation: (data: {
    targetUser: AuthUser;
    targetTenant: TenantInfo | null;
    targetAccessToken: string;
    actorEmail: string;
    reason: string;
    expiresInMinutes: number;
  }) => void;
  restoreFromImpersonation: () => boolean;
  clearAuth: () => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tenant: null,
      accessToken: null,
      isAuthenticated: false,
      isHydrated: false,
      impersonationBackup: null,

      setAuth: ({ user, tenant, accessToken }) =>
        set({
          user,
          tenant,
          accessToken,
          isAuthenticated: true,
        }),

      updateProfile: ({ user, tenant }) =>
        set({
          user,
          tenant,
          isAuthenticated: true,
        }),

      startImpersonation: ({
        targetUser,
        targetTenant,
        targetAccessToken,
        actorEmail,
        reason,
        expiresInMinutes,
      }) => {
        const current = get();
        if (!current.user || !current.accessToken) return;
        const backup: ImpersonationBackup = current.impersonationBackup || {
          user: current.user,
          tenant: current.tenant,
          accessToken: current.accessToken,
          actorEmail,
          reason,
          expiresInMinutes,
        };
        set({
          impersonationBackup: backup,
          user: {
            ...targetUser,
            isImpersonation: true,
            impersonatorEmail: actorEmail,
          },
          tenant: targetTenant,
          accessToken: targetAccessToken,
          isAuthenticated: true,
        });
      },

      restoreFromImpersonation: () => {
        const backup = get().impersonationBackup;
        if (!backup) return false;
        set({
          user: backup.user,
          tenant: backup.tenant,
          accessToken: backup.accessToken,
          impersonationBackup: null,
          isAuthenticated: true,
        });
        return true;
      },

      clearAuth: () =>
        set({
          user: null,
          tenant: null,
          accessToken: null,
          isAuthenticated: false,
          impersonationBackup: null,
        }),

      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
    }),
    {
      name: 'leadsetu-auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
