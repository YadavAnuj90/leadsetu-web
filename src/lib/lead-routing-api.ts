import { apiClient } from './api-client';
import type {
  Lead,
  LeadRoutingConfigResponse,
  RepRoutingConfig,
  RoutingMode,
  SimulateLeadRoutingResponse,
  TerritoryRoutingRule,
} from '@/types/contracts';

export async function fetchLeadRoutingApi(): Promise<LeadRoutingConfigResponse> {
  const { data } = await apiClient.get<LeadRoutingConfigResponse>('/lead-routing');
  return data;
}

export async function updateLeadRoutingApi(payload: {
  enabled?: boolean;
  mode?: RoutingMode;
  applyToSources?: string[];
  applyOnManualCreate?: boolean;
  respectDailyCap?: boolean;
  defaultDailyCap?: number;
  repConfigs?: RepRoutingConfig[];
  rules?: TerritoryRoutingRule[];
}): Promise<LeadRoutingConfigResponse> {
  const { data } = await apiClient.patch<LeadRoutingConfigResponse>(
    '/lead-routing',
    payload,
  );
  return data;
}

export async function simulateLeadRoutingApi(payload: {
  city?: string;
  source?: string;
  estimatedValue?: number;
}): Promise<SimulateLeadRoutingResponse> {
  const { data } = await apiClient.post<SimulateLeadRoutingResponse>(
    '/lead-routing/simulate',
    payload,
  );
  return data;
}

export async function autoAssignLeadApi(leadId: string): Promise<{
  routing: SimulateLeadRoutingResponse;
  lead: Lead;
}> {
  const { data } = await apiClient.post<{
    routing: SimulateLeadRoutingResponse;
    lead: Lead;
  }>(`/leads/${leadId}/auto-assign`);
  return data;
}
