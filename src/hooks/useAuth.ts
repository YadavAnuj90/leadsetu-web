'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { loginApi, registerApi, logoutApi, getMeApi } from '@/lib/auth';
import { getErrorMessage } from '@/lib/api-client';
import type { LoginPayload, RegisterPayload } from '@/types/contracts';

export function useAuth() {
  const router = useRouter();
  const {
    user,
    tenant,
    accessToken,
    isAuthenticated,
    isHydrated,
    setAuth,
    updateProfile,
    clearAuth,
  } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await loginApi(payload);
        setAuth({
          user: res.user,
          tenant: res.tenant,
          accessToken: res.accessToken,
        });
        router.push('/dashboard');
        return res;
      } catch (err) {
        const message = getErrorMessage(err);
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [router, setAuth]
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await registerApi(payload);
        setAuth({
          user: res.user,
          tenant: res.tenant,
          accessToken: res.accessToken,
        });
        router.push('/dashboard');
        return res;
      } catch (err) {
        const message = getErrorMessage(err);
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [router, setAuth]
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await logoutApi();
    } finally {
      clearAuth();
      setIsLoading(false);
      router.push('/login');
    }
  }, [clearAuth, router]);

  const refreshProfile = useCallback(async () => {
    if (!accessToken) return null;
    try {
      const data = await getMeApi();
      updateProfile({ user: data.user, tenant: data.tenant });
      return data;
    } catch {
      clearAuth();
      return null;
    }
  }, [accessToken, updateProfile, clearAuth]);

  return {
    user,
    tenant,
    accessToken,
    isAuthenticated,
    isHydrated,
    isLoading,
    error,
    clearError,
    login,
    register,
    logout,
    refreshProfile,
  };
}
