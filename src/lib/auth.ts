import { apiClient } from './api-client';
import type {
  AuthResponse,
  AuthUser,
  InviteInfoResponse,
  LoginPayload,
  LoginResult,
  RegisterPayload,
  TenantInfo,
  TwoFactorSetupResponse,
  TwoFactorStatusResponse,
} from '@/types/contracts';

export async function registerApi(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', payload);
  return data;
}

export async function loginApi(payload: LoginPayload): Promise<LoginResult> {
  const { data } = await apiClient.post<LoginResult>('/auth/login', payload);
  return data;
}

export async function getGoogleConfigApi(): Promise<{ enabled: boolean; clientId: string }> {
  const { data } = await apiClient.get<{ enabled: boolean; clientId: string }>('/auth/google/config');
  return data;
}

export async function googleLoginApi(payload: {
  idToken: string;
  companyName?: string;
}): Promise<LoginResult> {
  const { data } = await apiClient.post<LoginResult>('/auth/google', payload);
  return data;
}

export async function verifyTwoFactorLoginApi(payload: {
  challengeToken: string;
  code: string;
}): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/2fa/verify-login', payload);
  return data;
}

export async function getTwoFactorStatusApi(): Promise<TwoFactorStatusResponse> {
  const { data } = await apiClient.get<TwoFactorStatusResponse>('/auth/2fa/status');
  return data;
}

export async function setupTwoFactorApi(): Promise<TwoFactorSetupResponse> {
  const { data } = await apiClient.post<TwoFactorSetupResponse>('/auth/2fa/setup');
  return data;
}

export async function enableTwoFactorApi(code: string): Promise<{
  enabled: boolean;
  backupCodes: string[];
}> {
  const { data } = await apiClient.post<{ enabled: boolean; backupCodes: string[] }>(
    '/auth/2fa/enable',
    { code },
  );
  return data;
}

export async function disableTwoFactorApi(payload: {
  code?: string;
  currentPassword?: string;
}): Promise<{ enabled: boolean }> {
  const { data } = await apiClient.post<{ enabled: boolean }>('/auth/2fa/disable', payload);
  return data;
}

export async function getMeApi(): Promise<{
  user: AuthUser;
  tenant: TenantInfo | null;
}> {
  const { data } = await apiClient.get<{
    user: AuthUser;
    tenant: TenantInfo | null;
  }>('/auth/me');
  return data;
}

export async function logoutApi(): Promise<void> {
  try {
    await apiClient.post('/auth/logout');
  } catch {
    // Ignore network error on logout
  }
}

export async function getInviteInfoApi(token: string): Promise<InviteInfoResponse> {
  const { data } = await apiClient.get<InviteInfoResponse>('/auth/invite-info', {
    params: { token },
  });
  return data;
}

export async function acceptInviteApi(payload: {
  token: string;
  email: string;
  password?: string;
  newPassword?: string;
  mode?: 'login' | 'set_password';
}): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/accept-invite', payload);
  return data;
}

export async function updateSelfProfileApi(payload: {
  name?: string;
  phone?: string;
  territory?: string;
}): Promise<{ user: AuthUser; tenant: TenantInfo | null }> {
  const { data } = await apiClient.patch<{ user: AuthUser; tenant: TenantInfo | null }>(
    '/auth/profile',
    payload,
  );
  return data;
}

export async function changePasswordApi(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ success: boolean }> {
  const { data } = await apiClient.post<{ success: boolean }>(
    '/auth/change-password',
    payload,
  );
  return data;
}

export async function forgotPasswordApi(email: string): Promise<{
  success: boolean;
  message: string;
  devPreviewUrl?: string;
}> {
  const { data } = await apiClient.post<{
    success: boolean;
    message: string;
    devPreviewUrl?: string;
  }>('/auth/forgot-password', { email });
  return data;
}

export async function verifyResetTokenApi(token: string): Promise<{
  valid: boolean;
  maskedEmail: string;
  workspaceName: string;
  expiresAt: string;
}> {
  const { data } = await apiClient.get<{
    valid: boolean;
    maskedEmail: string;
    workspaceName: string;
    expiresAt: string;
  }>('/auth/reset-password/verify', {
    params: { token },
  });
  return data;
}

export async function resetPasswordApi(payload: {
  token: string;
  newPassword: string;
}): Promise<{
  success: boolean;
  maskedEmail: string;
  message: string;
}> {
  const { data } = await apiClient.post<{
    success: boolean;
    maskedEmail: string;
    message: string;
  }>('/auth/reset-password', payload);
  return data;
}
