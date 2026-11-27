'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useAuthUxStore } from '@/store/auth-ux.store';
import {
  loginApi,
  registerApi,
  logoutApi,
  getMeApi,
  googleLoginApi,
  verifyTwoFactorLoginApi,
} from '@/lib/auth';
import { getErrorMessage } from '@/lib/api-client';
import type {
  AuthResponse,
  LoginPayload,
  LoginResult,
  RegisterPayload,
} from '@/types/contracts';

function isTwoFactorChallenge(
  res: LoginResult,
): res is Extract<LoginResult, { requiresTwoFactor: true }> {
  return 'requiresTwoFactor' in res && res.requiresTwoFactor === true;
}

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

  const completeAuthSession = useCallback(
    (res: AuthResponse, isNewWorkspace = false) => {
      setAuth({
        user: res.user,
        tenant: res.tenant,
        accessToken: res.accessToken,
      });
      useAuthUxStore.getState().triggerWelcomeAnimation({
        userName: res.user.name,
        companyName: res.tenant?.companyName || res.tenant?.name,
        roleLabel: isNewWorkspace
          ? 'Workspace Owner'
          : res.user.role === 'super_admin'
            ? 'Super Admin'
            : res.user.role === 'owner'
              ? 'Workspace Owner'
              : res.user.role === 'admin'
                ? 'Workspace Admin'
                : res.user.role === 'support'
                  ? 'Support Engineer'
                  : 'CRM Member',
        ...(isNewWorkspace ? { isNewWorkspace: true } : {}),
      });
      router.push(
        res.user.role === 'super_admin'
          ? '/super-admin'
          : res.user.role === 'support'
            ? '/tickets'
            : '/dashboard',
      );
      return res;
    },
    [router, setAuth],
  );

  const login = useCallback(
    async (payload: LoginPayload): Promise<LoginResult> => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await loginApi(payload);
        if (isTwoFactorChallenge(res)) {
          return res;
        }
        return completeAuthSession(res);
      } catch (err) {
        const message = getErrorMessage(err);
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [completeAuthSession],
  );

  const verifyTwoFactorLogin = useCallback(
    async (payload: { challengeToken: string; code: string }): Promise<AuthResponse> => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await verifyTwoFactorLoginApi(payload);
        return completeAuthSession(res);
      } catch (err) {
        const message = getErrorMessage(err);
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [completeAuthSession],
  );

  const loginWithGoogle = useCallback(
    async (payload: { idToken: string; companyName?: string }): Promise<LoginResult> => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await googleLoginApi(payload);
        if (isTwoFactorChallenge(res)) {
          return res;
        }
        return completeAuthSession(res);
      } catch (err) {
        const message = getErrorMessage(err);
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [completeAuthSession],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await registerApi(payload);
        return completeAuthSession(res, true);
      } catch (err) {
        const message = getErrorMessage(err);
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [completeAuthSession],
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

  const requestLogout = useCallback(() => {
    useAuthUxStore.getState().requestLogoutConfirm({
      userName: user?.name,
      email: user?.email,
      scopeLabel: tenant?.companyName || tenant?.name || 'Leadsetu CRM',
      onConfirm: logout,
    });
  }, [user?.name, user?.email, tenant?.companyName, tenant?.name, logout]);

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
    verifyTwoFactorLogin,
    loginWithGoogle,
    register,
    logout,
    requestLogout,
    refreshProfile,
  };
}
