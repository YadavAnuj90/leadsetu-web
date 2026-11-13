import { apiClient } from '@/lib/api-client';
import type {
  Campaign,
  CampaignStats,
  CreateCampaignPayload,
} from '@/types/contracts';

export interface CampaignsListResponse {
  data: Campaign[];
  stats: CampaignStats;
}

export async function fetchCampaigns(params?: {
  search?: string;
  status?: string;
  targetSegment?: string;
}): Promise<CampaignsListResponse> {
  const { data } = await apiClient.get<CampaignsListResponse>('/campaigns', {
    params,
  });
  return data;
}

export async function createCampaign(
  payload: CreateCampaignPayload,
): Promise<Campaign> {
  const { data } = await apiClient.post<Campaign>('/campaigns', payload);
  return data;
}

export async function launchCampaign(id: string): Promise<Campaign> {
  const { data } = await apiClient.post<Campaign>(`/campaigns/${id}/launch`);
  return data;
}

export async function deleteCampaign(
  id: string,
): Promise<{ success: boolean }> {
  const { data } = await apiClient.delete<{ success: boolean }>(
    `/campaigns/${id}`,
  );
  return data;
}

export async function seedCampaigns(): Promise<{
  count: number;
  data: Campaign[];
}> {
  const { data } = await apiClient.post<{ count: number; data: Campaign[] }>(
    '/campaigns/seed',
  );
  return data;
}
