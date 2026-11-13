import { apiClient } from '@/lib/api-client';

export interface AnalyticsSummary {
  totalLeads: number;
  hotLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  avgAiScore: number;
  leadPipelineValue: number;
  totalDeals: number;
  openDealsCount: number;
  wonDealsCount: number;
  openDealsValue: number;
  weightedForecast: number;
  wonRevenue: number;
  totalInvoiced: number;
  paidInvoicesRevenue: number;
  pendingReceivables: number;
  gstOutputTax: number;
  totalContacts: number;
  gstVerifiedContacts: number;
  totalLtv: number;
  pendingTasksCount: number;
  completedTasksCount: number;
  campaignsSentMessages: number;
  campaignsAttributedRevenue: number;
  activeWorkflowsCount: number;
  totalWorkflowRuns: number;
  hoursSaved: number;
  teamMembersCount: number;
}

export interface AnalyticsSourceItem {
  key: string;
  label: string;
  color: string;
  count: number;
  sharePct: number;
  pipelineValue: number;
  winRatePct: number;
}

export interface AnalyticsCityItem {
  label: string;
  leadsCount: number;
  pipelineValue: number;
  sharePct: number;
}

export interface AnalyticsStageItem {
  stage: string;
  label: string;
  count: number;
  value: number;
}

export interface AnalyticsOverviewResponse {
  summary: AnalyticsSummary;
  sourceBreakdown: AnalyticsSourceItem[];
  cityBreakdown: AnalyticsCityItem[];
  stageFunnel: AnalyticsStageItem[];
}

export async function fetchAnalyticsOverview(): Promise<AnalyticsOverviewResponse> {
  const { data } = await apiClient.get<AnalyticsOverviewResponse>(
    '/analytics/overview',
  );
  return data;
}
