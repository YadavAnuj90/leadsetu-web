import { apiClient } from './api-client';
import type {
  AuthResponse,
  AuthUser,
  InviteInfoResponse,
  LoginPayload,
  RegisterPayload,
  TenantInfo,
} from '@/types/contracts';

export async function registerApi(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', payload);
  return data;
}

export async function loginApi(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
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
