import { apiClient } from '@/lib/api-client';
import type {
  AddTeamMemberPayload,
  MemberCredentials,
  TeamListResponse,
  TeamMember,
  UpdateTeamMemberPayload,
} from '@/types/contracts';

export async function fetchTeam(params?: {
  search?: string;
  role?: string;
  status?: string;
}): Promise<TeamListResponse> {
  const { data } = await apiClient.get<TeamListResponse>('/team', { params });
  return data;
}

export async function addTeamMember(
  payload: AddTeamMemberPayload,
): Promise<{ member: TeamMember; credentials: MemberCredentials }> {
  const { data } = await apiClient.post('/team', payload);
  return data;
}

export async function updateTeamMember(
  id: string,
  payload: UpdateTeamMemberPayload,
): Promise<TeamMember> {
  const { data } = await apiClient.patch<TeamMember>(`/team/${id}`, payload);
  return data;
}

export async function setTeamMemberStatus(
  id: string,
  isActive: boolean,
): Promise<TeamMember> {
  const { data } = await apiClient.patch<TeamMember>(`/team/${id}/status`, {
    isActive,
  });
  return data;
}

export async function resetTeamMemberPassword(
  id: string,
): Promise<{ member: TeamMember; credentials: MemberCredentials }> {
  const { data } = await apiClient.post(`/team/${id}/reset-password`);
  return data;
}

export async function resendTeamInvite(
  id: string,
): Promise<{ member: TeamMember; credentials: MemberCredentials }> {
  const { data } = await apiClient.post(`/team/${id}/resend-invite`);
  return data;
}

export async function removeTeamMember(id: string): Promise<{
  success: boolean;
  reassignedTo: { id: string; name: string } | null;
  reassigned: Record<string, number>;
}> {
  const { data } = await apiClient.delete(`/team/${id}`);
  return data;
}

export interface RepAvailabilityPayload {
  availabilityStatus?: 'available' | 'away' | 'on_leave';
  shiftStart?: string;
  shiftEnd?: string;
  leaveNote?: string;
}

export interface UserScorecardResponse {
  member: TeamMember;
  security: {
    lastLoginAt: string | null;
    twoFactorEnabled: boolean;
    sessionVersion: number;
    maskPhones: boolean;
    authProvider: string;
    inviteStatus: string;
  };
  workload: {
    openLeadsCount: number;
    newUncontactedLeadsCount: number;
    pendingTasksCount: number;
    openTicketsCount: number;
    openPipelineInr: number;
    wonDealsCount: number;
    wonRevenueInr: number;
    avgSlaResponseMinutes: number | null;
    calls: {
      totalCalls: number;
      answeredCalls: number;
      missedCalls: number;
      totalDurationSec: number;
    };
  };
  recentAuditEvents: Array<{
    id: string;
    action: string;
    entityType: string;
    entityLabel: string;
    summary: string;
    actorName: string;
    createdAt: string;
  }>;
}

export async function updateMyAvailabilityApi(
  payload: RepAvailabilityPayload,
): Promise<TeamMember> {
  const { data } = await apiClient.patch<TeamMember>('/team/me/availability', payload);
  return data;
}

export async function updateMemberAvailabilityApi(
  id: string,
  payload: RepAvailabilityPayload,
): Promise<TeamMember> {
  const { data } = await apiClient.patch<TeamMember>(
    `/team/${encodeURIComponent(id)}/availability`,
    payload,
  );
  return data;
}

export async function fetchMemberScorecardApi(
  id: string,
): Promise<UserScorecardResponse> {
  const { data } = await apiClient.get<UserScorecardResponse>(
    `/team/${encodeURIComponent(id)}/scorecard`,
  );
  return data;
}

export async function revokeMemberSessionsApi(
  id: string,
): Promise<{ success: boolean; userId: string; sessionVersion: number }> {
  const { data } = await apiClient.post(
    `/team/${encodeURIComponent(id)}/revoke-sessions`,
  );
  return data;
}

export interface CommissionSlabItem {
  minRevenueInr: number;
  maxRevenueInr: number | null;
  ratePct: number;
  label: string;
}

export interface TenantCommissionPolicy {
  enabled: boolean;
  basis: 'max_won_or_paid' | 'won_deals' | 'paid_invoices';
  quotaBonusPct: number;
  slabs: CommissionSlabItem[];
}

export interface CommissionComputedSummary {
  eligibleRevenueInr: number;
  baseCommissionInr: number;
  quotaBonusInr: number;
  totalCommissionInr: number;
  activeTierLabel: string;
  activeTierRatePct: number;
  nextTierMinRevenueInr: number | null;
  nextTierRemainingInr: number;
  nextTierRatePct: number | null;
  quotaAchieved: boolean;
  slabBreakdown: Array<{
    label: string;
    ratePct: number;
    eligibleAmountInr: number;
    earnedInr: number;
    isActive: boolean;
  }>;
}

export interface MyPerformanceResponse {
  userId: string;
  name: string;
  role: string;
  territory: string;
  monthlyTarget: number;
  aiDailyCallLimit: number;
  aiCallsToday: number;
  performance: TeamMember['performance'] & {
    dealsCount?: number;
    paidRevenue?: number;
    callsCount?: number;
    achievedRevenue?: number;
    winRatePct?: number;
  };
  commissionPolicy?: TenantCommissionPolicy;
  commission?: CommissionComputedSummary;
  rankInTeam?: number;
  teamTotalReps?: number;
}

export async function fetchCommissionPolicyApi(): Promise<TenantCommissionPolicy> {
  const { data } = await apiClient.get<TenantCommissionPolicy>('/team/commission-policy');
  return data;
}

export async function updateCommissionPolicyApi(
  payload: Partial<TenantCommissionPolicy>,
): Promise<TenantCommissionPolicy> {
  const { data } = await apiClient.patch<TenantCommissionPolicy>(
    '/team/commission-policy',
    payload,
  );
  return data;
}

export interface MyTeamResponse {
  territory: string;
  summary: {
    repCount: number;
    totalWonRevenue: number;
    totalOpenPipeline: number;
    avgTargetPct: number;
  };
  data: Array<TeamMember & { pendingTasks: number }>;
}

export async function fetchMyPerformanceApi(): Promise<MyPerformanceResponse> {
  const { data } = await apiClient.get<MyPerformanceResponse>('/team/me/performance');
  return data;
}

export async function fetchMyTeamApi(): Promise<MyTeamResponse> {
  const { data } = await apiClient.get<MyTeamResponse>('/team/my-team');
  return data;
}
