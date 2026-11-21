import axios from 'axios';
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
  pendingCallbacks?: number;
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

export interface TenantCallAggregateRow {
  tenantId: string;
  tenantName: string;
  accountId: string;
  totalCalls: number;
  connectedCalls: number;
  failedCalls: number;
  turnRelayCalls: number;
  turnUsagePct: number;
  avgRttMs: number;
  estimatedRelayBytes: number;
}

export interface AnonymizedCallTelemetryRow {
  id: string;
  callRef: string;
  tenantId: string;
  tenantName: string;
  accountId: string;
  callerRef: string;
  calleeRef: string;
  status: string;
  setupTimeMs: number;
  endReason: string;
  connection: {
    icePath: CallIcePath;
    turnUsed: boolean;
    relayProtocol: string;
    rttMs: number;
    maxRttMs: number;
    packetsLost: number;
    iceFailureReason: string;
  };
}

export interface CallAnalyticsResponse {
  scope?: 'workspace' | 'platform';
  privacyRedacted?: boolean;
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
  tenantAggregates?: TenantCallAggregateRow[];
  anonymizedCalls?: AnonymizedCallTelemetryRow[];
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

export async function fetchCallTelemetryApi(
  callId: string,
  supportReason?: string,
): Promise<{
  call: CallAnalyticsRecentRow;
  samples: CallTelemetrySampleRecord[];
}> {
  const { data } = await apiClient.get<{
    call: CallAnalyticsRecentRow;
    samples: CallTelemetrySampleRecord[];
  }>(`/calls/${callId}/telemetry`, {
    params: supportReason ? { supportReason } : undefined,
  });
  return data;
}

export interface CallSupportRevealResponse {
  callId: string;
  callRef: string;
  tenantName: string;
  accountId: string;
  callerName: string;
  calleeName: string;
  startedAt: string;
  durationSeconds: number;
  status: string;
  setupTimeMs: number;
  supportReason: string;
  connection: CallAnalyticsRecentRow['connection'];
  samples: CallTelemetrySampleRecord[];
}

export async function requestCallSupportRevealApi(
  callId: string,
  reason: string,
): Promise<CallSupportRevealResponse> {
  const { data } = await apiClient.post<CallSupportRevealResponse>(
    `/calls/${callId}/support-access`,
    { reason },
  );
  return data;
}

export interface CrmLinkableEntity {
  id: string;
  type: 'lead' | 'deal' | 'ticket' | 'contact';
  label: string;
  sublabel: string;
  phone: string;
  company: string;
  ownerId: string;
}

export interface SaveCallDispositionPayload {
  linkedEntityType?: '' | 'lead' | 'deal' | 'ticket' | 'contact';
  linkedEntityId?: string;
  outcomeTag?: string;
  notes?: string;
  createFollowUpTask?: boolean;
  taskTitle?: string;
  taskDueDate?: string;
  taskPriority?: 'high' | 'medium' | 'low';
  taskCategory?: 'call' | 'whatsapp' | 'meeting' | 'quote' | 'followup';
}

export interface LogSimCallPayload extends SaveCallDispositionPayload {
  contactName?: string;
  customerPhone?: string;
  status?: 'completed' | 'missed' | 'rejected';
  durationSeconds?: number;
}

export interface ShareCallLinkResponse {
  token: string;
  urlPath: string;
  agent: {
    userId: string;
    name: string;
    role: string;
    userCode: string;
  };
  companyName: string;
  entityType: '' | 'lead' | 'deal' | 'ticket';
  entityId: string;
  entityLabel: string;
  customerName: string;
  customerPhone: string;
  expiresInDays: number;
}

export interface PublicCallLinkInfo {
  valid: boolean;
  companyName: string;
  companyLogoUrl: string;
  agent: {
    name: string;
    role: string;
    territory: string;
    status: AgentPresenceStatus;
  };
  context: {
    entityType: '' | 'lead' | 'deal' | 'ticket';
    entityLabel: string;
    customerName: string;
    customerPhone: string;
  };
  iceServers: RTCIceServer[];
  iceTransportPolicy: RTCIceTransportPolicy;
}

export async function fetchCallCrmEntitiesApi(q?: string): Promise<{
  leads: CrmLinkableEntity[];
  deals: CrmLinkableEntity[];
  tickets: CrmLinkableEntity[];
  contacts: CrmLinkableEntity[];
}> {
  const { data } = await apiClient.get<{
    leads: CrmLinkableEntity[];
    deals: CrmLinkableEntity[];
    tickets: CrmLinkableEntity[];
    contacts: CrmLinkableEntity[];
  }>('/calls/crm-entities', { params: q ? { q } : undefined });
  return {
    leads: data.leads || [],
    deals: data.deals || [],
    tickets: data.tickets || [],
    contacts: data.contacts || [],
  };
}

export async function saveCallDispositionApi(
  callId: string,
  payload: SaveCallDispositionPayload,
): Promise<{
  call: CallHistoryEntry;
  followUpTaskId: string;
}> {
  const { data } = await apiClient.post<{
    call: CallHistoryEntry;
    followUpTaskId: string;
  }>(`/calls/${callId}/disposition`, payload);
  return data;
}

export async function createCallShareLinkApi(payload: {
  entityType?: '' | 'lead' | 'deal' | 'ticket';
  entityId?: string;
  expiresInDays?: number;
}): Promise<ShareCallLinkResponse> {
  const { data } = await apiClient.post<ShareCallLinkResponse>(
    '/calls/share-link',
    payload,
  );
  return data;
}

export async function fetchPublicCallLinkInfoApi(
  token: string,
): Promise<PublicCallLinkInfo> {
  const { data } = await axios.get<PublicCallLinkInfo>(
    `/api/calls/public/link/${encodeURIComponent(token)}`,
  );
  return data;
}

export async function submitPublicCallCallbackApi(
  token: string,
  payload: {
    customerName: string;
    customerPhone: string;
    preferredTime?: string;
    message?: string;
  },
): Promise<{ ok: boolean; message: string; followUpTaskId: string }> {
  const { data } = await axios.post<{
    ok: boolean;
    message: string;
    followUpTaskId: string;
  }>(`/api/calls/public/link/${encodeURIComponent(token)}/callback`, payload);
  return data;
}

export async function resolveCallCallbackApi(
  callId: string,
  resolved?: boolean,
): Promise<{ call: CallHistoryEntry }> {
  const { data } = await apiClient.post<{ call: CallHistoryEntry }>(
    `/calls/${callId}/resolve-callback`,
    resolved === undefined ? {} : { resolved },
  );
  return data;
}

export async function uploadCallRecordingApi(
  callId: string,
  payload: { audioDataUrl: string; durationSeconds?: number },
): Promise<{ call: CallHistoryEntry; recordingUrl: string }> {
  const { data } = await apiClient.post<{
    call: CallHistoryEntry;
    recordingUrl: string;
  }>(`/calls/${callId}/recording`, payload);
  return data;
}

export async function logSimCallApi(payload: LogSimCallPayload): Promise<{
  call: CallHistoryEntry;
  followUpTaskId: string;
}> {
  const { data } = await apiClient.post<{
    call: CallHistoryEntry;
    followUpTaskId: string;
  }>('/calls/sim-log', payload);
  return data;
}
