import { apiClient } from '@/lib/api-client';
import type { AuditListResponse, SecuritySettings } from '@/types/contracts';

export async function fetchAuditLogsApi(params?: {
  entityType?: string;
  search?: string;
  limit?: number;
}): Promise<AuditListResponse> {
  const { data } = await apiClient.get<AuditListResponse>('/audit', { params });
  return data;
}

export async function fetchSecuritySettingsApi(): Promise<SecuritySettings> {
  const { data } = await apiClient.get<SecuritySettings>('/audit/security');
  return data;
}

export async function updateSecuritySettingsApi(payload: {
  maskPhoneForAgents?: boolean;
  blockAgentExport?: boolean;
}): Promise<SecuritySettings> {
  const { data } = await apiClient.patch<SecuritySettings>(
    '/audit/security',
    payload,
  );
  return data;
}
