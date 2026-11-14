import { apiClient } from '@/lib/api-client';

export type AnalyticsRange = '7d' | '30d' | '90d' | 'all';

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
  lostDealsCount: number;
  dealWinRatePct: number;
  openDealsValue: number;
  weightedForecast: number;
  wonRevenue: number;
  totalInvoiced: number;
  paidInvoicesRevenue: number;
  pendingReceivables: number;
  gstOutputTax: number;
  collectionRatePct: number;
  overdueInvoicesCount: number;
  proformaQuotesCount: number;
  approvedQuotesCount: number;
  convertedQuotesCount: number;
  quoteConversionRatePct: number;
  cgstSgstTotal: number;
  igstTotal: number;
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
  openTicketsCount: number;
  urgentTicketsCount: number;
  resolvedTicketsCount: number;
  catalogSkusCount: number;
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

export interface AnalyticsAiTierItem {
  tier: 'Hot' | 'Warm' | 'Cold';
  label: string;
  color: string;
  count: number;
  value: number;
  sharePct: number;
}

export interface AnalyticsAgingBuckets {
  paid: { count: number; amount: number };
  current: { count: number; amount: number };
  days1to15: { count: number; amount: number };
  days16to30: { count: number; amount: number };
  days30Plus: { count: number; amount: number };
}

export interface AnalyticsMonthlyPoint {
  monthKey: string;
  label: string;
  leadsCount: number;
  pipelineValue: number;
  invoicedAmount: number;
  paidAmount: number;
}

export interface AnalyticsRepLeaderboardItem {
  userId: string;
  name: string;
  role: string;
  territory: string;
  leadsCount: number;
  hotLeadsCount: number;
  wonDealsCount: number;
  achievedRevenue: number;
  monthlyTarget: number;
  targetAchievementPct: number;
}

export interface AnalyticsTopCampaignItem {
  id: string;
  name: string;
  status: string;
  sentCount: number;
  readRate: number;
  replyRate: number;
  attributedRevenue: number;
}

export interface AnalyticsOverviewResponse {
  range: AnalyticsRange;
  summary: AnalyticsSummary;
  sourceBreakdown: AnalyticsSourceItem[];
  cityBreakdown: AnalyticsCityItem[];
  stageFunnel: AnalyticsStageItem[];
  aiTierBreakdown: AnalyticsAiTierItem[];
  agingBuckets: AnalyticsAgingBuckets;
  monthlyTrend: AnalyticsMonthlyPoint[];
  repLeaderboard: AnalyticsRepLeaderboardItem[];
  topCampaigns: AnalyticsTopCampaignItem[];
}

export async function fetchAnalyticsOverview(
  range: AnalyticsRange = 'all',
): Promise<AnalyticsOverviewResponse> {
  const { data } = await apiClient.get<AnalyticsOverviewResponse>(
    '/analytics/overview',
    { params: { range } },
  );
  return data;
}
