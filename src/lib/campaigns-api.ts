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

export async function toggleCampaignRecipientOptOut(
  campaignId: string,
  payload: { phone: string; optOut: boolean },
): Promise<Campaign> {
  const { data } = await apiClient.post<Campaign>(
    `/campaigns/${campaignId}/opt-out`,
    payload,
  );
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
