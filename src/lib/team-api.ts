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

export interface MyPerformanceResponse {
  userId: string;
  name: string;
  role: string;
  territory: string;
  monthlyTarget: number;
  aiDailyCallLimit: number;
  aiCallsToday: number;
  performance: TeamMember['performance'];
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
