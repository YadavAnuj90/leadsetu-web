import { apiClient } from '@/lib/api-client';
import type {
  AgentPresenceStatus,
  CallHistoryEntry,
  CallIcePath,
} from '@/store/call-ui.store';

export interface IceServerResponse {
  iceServers: RTCIceServer[];
  iceTransportPolicy: RTCIceTransportPolicy;
  turnConfigured: boolean;
  ttlSeconds: number;
}

export interface TenantPresenceMember {
  userId: string;
  name: string;
  role: string;
  userCode: string;
  territory: string;
  status: AgentPresenceStatus;
  inCall: boolean;
}

export interface CallHistoryStats {
  total: number;
  answered: number;
  missed: number;
  avgDurationSec: number;
}

export interface CallTelemetryPayload {
  icePath: CallIcePath;
  turnUsed: boolean;
  localCandidateType?: string;
  remoteCandidateType?: string;
  relayProtocol?: string;
  rttMs?: number;
  jitterMs?: number;
  packetsLost?: number;
  bytesSent?: number;
  bytesReceived?: number;
  iceConnectionState?: string;
  iceFailureReason?: string;
}

export async function fetchIceServersApi(): Promise<IceServerResponse> {
  const { data } = await apiClient.get<IceServerResponse>('/calls/ice-servers');
  return data;
}

export async function fetchCallsPresenceApi(): Promise<{
  data: TenantPresenceMember[];
  selfStatus: AgentPresenceStatus;
}> {
  const { data } = await apiClient.get<{
    data: TenantPresenceMember[];
    selfStatus: AgentPresenceStatus;
  }>('/calls/presence');
  return data;
}

export async function fetchCallHistoryApi(params?: {
  filter?: string;
  limit?: number;
  scope?: string;
}): Promise<{
  data: CallHistoryEntry[];
  stats: CallHistoryStats;
}> {
  const { data } = await apiClient.get<{
    data: CallHistoryEntry[];
    stats: CallHistoryStats;
  }>('/calls/history', { params });
  return data;
}

export async function postCallTelemetryApi(
  callId: string,
  payload: CallTelemetryPayload,
): Promise<void> {
  await apiClient.post(`/calls/${callId}/telemetry`, payload);
}

export interface CallAnalyticsRecentRow {
  id: string;
  tenantId: string;
  callerName: string;
  calleeName: string;
  status: string;
  durationSeconds: number;
  setupTimeMs: number;
  startedAt: string;
  endReason: string;
  connection: {
    icePath: CallIcePath;
    turnUsed: boolean;
    relayProtocol: string;
    rttMs: number;
    maxRttMs: number;
    packetsLost: number;
    bytesSent: number;
    bytesReceived: number;
    iceFailureReason: string;
  };
}

export interface CallAnalyticsResponse {
  totalCalls: number;
  connectedCalls: number;
  directP2pCalls: number;
  failedCalls: number;
  missedOrRejectedCalls: number;
  successRatePct: number;
  avgSetupTimeMs: number;
  turnRelayCalls: number;
  turnUsagePct: number;
  avgRttMs: number;
  estimatedRelayBytes: number;
  protocolBreakdown: {
    direct: number;
    udp: number;
    tcp: number;
    tls: number;
    otherRelay: number;
  };
  recentCalls: CallAnalyticsRecentRow[];
}

export interface CallTelemetrySampleRecord {
  id: string;
  sampledAt: string;
  reporterUserId: string;
  icePath: CallIcePath;
  turnUsed: boolean;
  localCandidateType: string;
  remoteCandidateType: string;
  relayProtocol: string;
  rttMs: number;
  jitterMs: number;
  packetsLost: number;
  bytesSent: number;
  bytesReceived: number;
  iceConnectionState: string;
}

export interface UserCallAnalyticsItem {
  userId: string;
  name: string;
  role: string;
  userCode: string;
  territory: string;
  totalCalls: number;
  answeredCalls: number;
  missedCalls: number;
  outgoingCalls: number;
  incomingCalls: number;
  totalDurationSeconds: number;
  answerRatePct: number;
}

export interface UserCallAnalyticsResponse {
  isAdminView: boolean;
  myStats: UserCallAnalyticsItem | null;
  users: UserCallAnalyticsItem[];
}

export async function fetchUserCallAnalyticsApi(): Promise<UserCallAnalyticsResponse> {
  const { data } = await apiClient.get<UserCallAnalyticsResponse>(
    '/calls/user-analytics',
  );
  return data;
}

export async function fetchCallAnalyticsApi(
  scope: 'workspace' | 'platform' = 'platform',
): Promise<CallAnalyticsResponse> {
  const { data } = await apiClient.get<CallAnalyticsResponse>(
    '/calls/analytics',
    { params: { scope } },
  );
  return data;
}

export async function fetchCallTelemetryApi(callId: string): Promise<{
  call: CallAnalyticsRecentRow;
  samples: CallTelemetrySampleRecord[];
}> {
  const { data } = await apiClient.get<{
    call: CallAnalyticsRecentRow;
    samples: CallTelemetrySampleRecord[];
  }>(`/calls/${callId}/telemetry`);
  return data;
}
