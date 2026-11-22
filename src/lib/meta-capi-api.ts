import { apiClient } from './api-client';

export type MetaCapiEventName =
  | 'LeadSubmitted'
  | 'QualifiedLead'
  | 'Purchase'
  | 'Contact';

export type MetaCapiDispatchStatus =
  | 'sent'
  | 'local_simulated'
  | 'failed'
  | 'skipped';

export interface MetaCapiConfigDto {
  enabled: boolean;
  pixelId: string;
  hasAccessToken: boolean;
  accessTokenMask: string;
  testEventCode: string;
  autoFireOnCtwaInbound: boolean;
  autoFireOnLeadQualified: boolean;
  autoFireOnDealWon: boolean;
  autoFireOnInvoicePaid: boolean;
  lastFiredAt: string;
  lastStatus: string;
  lastError: string;
}

export interface MetaCapiStatsDto {
  totalEvents: number;
  sentEvents: number;
  simulatedEvents: number;
  failedEvents: number;
  ctwaLeadsCount: number;
  attributedRevenueInr: number;
  purchaseEventsCount: number;
}

export interface MetaCapiEventLogItem {
  id: string;
  eventId: string;
  eventName: MetaCapiEventName;
  status: MetaCapiDispatchStatus;
  entityType: 'lead' | 'deal' | 'invoice' | 'conversation';
  entityId: string;
  entityLabel: string;
  phone: string;
  email: string;
  ctwaClid: string;
  adId: string;
  adHeadline: string;
  adSourceUrl: string;
  valueInr: number;
  currency: string;
  pixelId: string;
  testEventCode: string;
  triggeredBy: string;
  requestPayload: Record<string, unknown>;
  metaResponse: Record<string, unknown>;
  errorMessage: string;
  httpStatus: number;
  createdAt: string;
}

export interface MetaAdRoasRow {
  adId: string;
  adHeadline: string;
  inquiries: number;
  qualifiedCount: number;
  wonDealsCount: number;
  closedRevenueInr: number;
  pipelineValueInr: number;
  capiEventsCount: number;
}

export interface MetaCapiOverviewResponse {
  config: MetaCapiConfigDto;
  stats: MetaCapiStatsDto;
  events: MetaCapiEventLogItem[];
  adRoasBreakdown: MetaAdRoasRow[];
}

export async function fetchMetaCapiOverviewApi(): Promise<MetaCapiOverviewResponse> {
  const { data } = await apiClient.get<MetaCapiOverviewResponse>('/meta-capi');
  return data;
}

export async function updateMetaCapiConfigApi(payload: {
  enabled?: boolean;
  pixelId?: string;
  accessToken?: string;
  testEventCode?: string;
  autoFireOnCtwaInbound?: boolean;
  autoFireOnLeadQualified?: boolean;
  autoFireOnDealWon?: boolean;
  autoFireOnInvoicePaid?: boolean;
}): Promise<MetaCapiOverviewResponse> {
  const { data } = await apiClient.patch<MetaCapiOverviewResponse>(
    '/meta-capi/config',
    payload,
  );
  return data;
}

export async function simulateCtwaClickApi(payload: {
  contactName?: string;
  phone?: string;
  message?: string;
  adId?: string;
  adHeadline?: string;
  sourceUrl?: string;
  estimatedValue?: number;
}): Promise<{
  leadId: string;
  conversationId: string;
  adId: string;
  adHeadline: string;
  ctwaClid: string;
  event: MetaCapiEventLogItem | null;
}> {
  const { data } = await apiClient.post('/meta-capi/simulate-ctwa', payload);
  return data;
}

export async function fireManualMetaCapiEventApi(payload: {
  entityType?: 'lead' | 'deal' | 'invoice' | 'conversation';
  entityId?: string;
  eventName?: MetaCapiEventName;
  valueInr?: number;
}): Promise<MetaCapiEventLogItem> {
  const { data } = await apiClient.post<MetaCapiEventLogItem>(
    '/meta-capi/fire',
    payload,
  );
  return data;
}

export async function retryMetaCapiEventApi(
  eventLogId: string,
): Promise<MetaCapiEventLogItem> {
  const { data } = await apiClient.post<MetaCapiEventLogItem>(
    `/meta-capi/events/${eventLogId}/retry`,
  );
  return data;
}
