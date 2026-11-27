import { apiClient } from './api-client';
import type {
  WhatsappCallLogItem,
  WhatsappCallPermissionState,
  WhatsappCallingSettings,
  WhatsappCallingWalletSummary,
} from '@/types/contracts';

export async function fetchWhatsappCallingWalletApi(): Promise<WhatsappCallingWalletSummary> {
  const { data } = await apiClient.get<WhatsappCallingWalletSummary>(
    '/whatsapp/calling/wallet',
  );
  return data;
}

export async function topupWhatsappCallingWalletApi(payload: {
  amountInr: number;
  note?: string;
}): Promise<WhatsappCallingWalletSummary> {
  const { data } = await apiClient.post<WhatsappCallingWalletSummary>(
    '/whatsapp/calling/wallet/topup',
    payload,
  );
  return data;
}

export async function fetchWhatsappCallingSettingsApi(): Promise<WhatsappCallingSettings> {
  const { data } = await apiClient.get<WhatsappCallingSettings>(
    '/whatsapp/calling/settings',
  );
  return data;
}

export async function enableWhatsappCallingSettingsApi(payload?: {
  phoneNumberId?: string;
  callIconVisibility?: 'DEFAULT' | 'DISABLE_ALL';
  callbackPermissionStatus?: 'ENABLED' | 'DISABLED';
}): Promise<WhatsappCallingSettings> {
  const { data } = await apiClient.post<WhatsappCallingSettings>(
    '/whatsapp/calling/settings',
    payload || {},
  );
  return data;
}

export async function fetchLeadWhatsappPermissionApi(
  leadId: string,
): Promise<WhatsappCallPermissionState> {
  const { data } = await apiClient.get<WhatsappCallPermissionState>(
    `/whatsapp/calling/permissions/${encodeURIComponent(leadId)}`,
  );
  return data;
}

export async function requestLeadWhatsappPermissionApi(
  leadId: string,
  payload?: { reasonText?: string; conversationId?: string },
): Promise<WhatsappCallPermissionState> {
  const { data } = await apiClient.post<WhatsappCallPermissionState>(
    `/whatsapp/calling/permissions/${encodeURIComponent(leadId)}/request`,
    payload || {},
  );
  return data;
}

export interface StartOutboundWhatsappCallResponse {
  callId: string;
  metaCallId: string;
  sdpAnswer: string;
  simulated: boolean;
  status: string;
  direction: 'outbound';
  leadId: string;
  leadName: string;
  displayPhone: string;
  outboundRateInrPerMin: number;
  iceServers: RTCIceServer[];
}

export async function startOutboundWhatsappCallApi(payload: {
  leadId: string;
  sdpOffer: string;
  conversationId?: string;
}): Promise<StartOutboundWhatsappCallResponse> {
  const { data } = await apiClient.post<StartOutboundWhatsappCallResponse>(
    '/whatsapp/calling/outbound',
    payload,
  );
  return data;
}

export async function acceptInboundWhatsappCallApi(
  callId: string,
  sdpAnswer: string,
): Promise<WhatsappCallLogItem> {
  const { data } = await apiClient.post<WhatsappCallLogItem>(
    `/whatsapp/calling/${encodeURIComponent(callId)}/accept`,
    { sdpAnswer },
  );
  return data;
}

export async function rejectWhatsappCallApi(
  callId: string,
  reason?: string,
): Promise<WhatsappCallLogItem> {
  const { data } = await apiClient.post<WhatsappCallLogItem>(
    `/whatsapp/calling/${encodeURIComponent(callId)}/reject`,
    reason ? { reason } : {},
  );
  return data;
}

export async function terminateWhatsappCallApi(
  callId: string,
  payload?: { durationSeconds?: number; reason?: string },
): Promise<WhatsappCallLogItem> {
  const { data } = await apiClient.post<WhatsappCallLogItem>(
    `/whatsapp/calling/${encodeURIComponent(callId)}/terminate`,
    payload || {},
  );
  return data;
}

export async function uploadWhatsappCallRecordingApi(
  callId: string,
  payload: { audioDataUrl: string; durationSeconds?: number },
): Promise<WhatsappCallLogItem> {
  const { data } = await apiClient.post<WhatsappCallLogItem>(
    `/whatsapp/calling/${encodeURIComponent(callId)}/recording`,
    payload,
  );
  return data;
}

export async function fetchWhatsappCallLogsApi(params?: {
  leadId?: string;
  conversationId?: string;
  limit?: number;
}): Promise<WhatsappCallLogItem[]> {
  const { data } = await apiClient.get<WhatsappCallLogItem[]>(
    '/whatsapp/calling/logs',
    { params },
  );
  return Array.isArray(data) ? data : [];
}

export async function triggerWhatsappCallPostprocessApi(
  callId: string,
  payload?: { transcript?: string },
): Promise<WhatsappCallLogItem> {
  const { data } = await apiClient.post<WhatsappCallLogItem>(
    `/whatsapp/calling/${encodeURIComponent(callId)}/ai-postprocess`,
    payload || {},
  );
  return data;
}
