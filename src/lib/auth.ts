import { apiClient } from './api-client';
import type {
  AuthResponse,
  AuthUser,
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
