import { apiClient } from './api-client';

export interface MetaFieldMappingItem {
  metaFieldKey: string;
  crmFieldKey: string;
}

export interface MetaFormQuestionItem {
  key: string;
  label: string;
}

export interface MetaLeadFormConfigDto {
  formId: string;
  formName: string;
  status: string;
  autoReplyEnabled: boolean;
  whatsappTemplateId: string;
  defaultAssigneeId: string;
  questions: MetaFormQuestionItem[];
  fieldMappings: MetaFieldMappingItem[];
}

export interface MetaPageConnectionDto {
  id: string;
  tenantId: string;
  pageId: string;
  pageName: string;
  isSubscribed: boolean;
  status: 'active' | 'needs_reconnect' | 'disconnected';
  lastError: string;
  lastLeadReceivedAt: string | null;
  forms: MetaLeadFormConfigDto[];
}

export interface MetaConnectionsOverviewResponse {
  connections: MetaPageConnectionDto[];
  webhookCallbackPath: string;
  verifyToken: string;
  graphVersion: string;
  isLiveMetaAppConfigured: boolean;
  teamMembers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
}

export async function fetchMetaOAuthUrlApi(redirectUri?: string): Promise<{
  oauthUrl: string;
  state: string;
  scopes: string[];
  redirectUri: string;
  isLiveMetaAppConfigured: boolean;
  graphVersion: string;
}> {
  const { data } = await apiClient.get('/integrations/meta/oauth-url', {
    params: redirectUri ? { redirectUri } : undefined,
  });
  return data;
}

export async function exchangeMetaOAuthCodeApi(payload: {
  code: string;
  state: string;
  redirectUri?: string;
}): Promise<{
  connectedCount: number;
  connections: MetaPageConnectionDto[];
}> {
  const { data } = await apiClient.post(
    '/integrations/meta/oauth/exchange',
    payload,
  );
  return data;
}

export async function fetchMetaConnectionsApi(): Promise<MetaConnectionsOverviewResponse> {
  const { data } = await apiClient.get<MetaConnectionsOverviewResponse>(
    '/integrations/meta/connections',
  );
  return data;
}

export async function subscribeMetaPageApi(
  pageId: string,
): Promise<MetaPageConnectionDto> {
  const { data } = await apiClient.post<MetaPageConnectionDto>(
    `/integrations/meta/pages/${encodeURIComponent(pageId)}/subscribe`,
  );
  return data;
}

export async function unsubscribeMetaPageApi(
  pageId: string,
): Promise<MetaPageConnectionDto> {
  const { data } = await apiClient.delete<MetaPageConnectionDto>(
    `/integrations/meta/pages/${encodeURIComponent(pageId)}/unsubscribe`,
  );
  return data;
}

export async function updateMetaFormConfigApi(
  pageId: string,
  formId: string,
  payload: {
    autoReplyEnabled?: boolean;
    whatsappTemplateId?: string;
    defaultAssigneeId?: string;
    fieldMappings?: MetaFieldMappingItem[];
  },
): Promise<MetaPageConnectionDto> {
  const { data } = await apiClient.patch<MetaPageConnectionDto>(
    `/integrations/meta/pages/${encodeURIComponent(
      pageId,
    )}/forms/${encodeURIComponent(formId)}`,
    payload,
  );
  return data;
}

export async function simulateMetaTestLeadApi(payload?: {
  pageId?: string;
  formId?: string;
}): Promise<{
  leadgenId: string;
  pageId: string;
  pageName: string;
  formName: string;
  outcome: 'created' | 'merged' | 'skipped';
  leadId?: string;
  whatsAppSent?: boolean;
}> {
  const { data } = await apiClient.post(
    '/integrations/meta/simulate-lead',
    payload || {},
  );
  return data;
}

export async function backfillMetaLeadsApi(payload?: {
  pageId?: string;
  formId?: string;
  limit?: number;
}): Promise<{
  checkedPages: number;
  checkedForms: number;
  pulledCount: number;
  createdCount: number;
  deduplicatedCount: number;
  formErrors: Array<{ pageId: string; formId: string; error: string }>;
  syncedAt: string;
}> {
  const { data } = await apiClient.post(
    '/integrations/meta/backfill',
    payload || {},
  );
  return data;
}
