import { apiClient } from '@/lib/api-client';
import type {
  Campaign,
  CampaignSegment,
  CampaignSegmentFilters,
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

export interface PreviewAudienceResponse {
  targetSegment: CampaignSegment;
  totalMatched: number;
  willDispatchCount: number;
  excludedDndCount: number;
  sampleRecipients: Array<{
    id: string;
    name: string;
    company: string;
    city: string;
    accountKind: 'business' | 'consumer';
  }>;
}

export async function previewCampaignAudience(payload: {
  targetSegment?: CampaignSegment;
  segmentFilters?: CampaignSegmentFilters;
}): Promise<PreviewAudienceResponse> {
  const { data } = await apiClient.post<PreviewAudienceResponse>(
    '/campaigns/preview-audience',
    payload,
  );
  return data;
}

export async function retargetCampaignNonResponders(
  campaignId: string,
  payload?: {
    name?: string;
    messageBody?: string;
    ctaLabel?: string;
    sendNow?: boolean;
  },
): Promise<Campaign> {
  const { data } = await apiClient.post<Campaign>(
    `/campaigns/${campaignId}/retarget-non-responders`,
    payload || {},
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
