'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser, TenantInfo } from '@/types/contracts';

interface AuthState {
  user: AuthUser | null;
  tenant: TenantInfo | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setAuth: (data: {
    user: AuthUser;
    tenant: TenantInfo | null;
    accessToken: string;
  }) => void;
  updateProfile: (data: { user: AuthUser; tenant: TenantInfo | null }) => void;
  clearAuth: () => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tenant: null,
      accessToken: null,
      isAuthenticated: false,
      isHydrated: false,

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

      clearAuth: () =>
        set({
          user: null,
          tenant: null,
          accessToken: null,
          isAuthenticated: false,
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
