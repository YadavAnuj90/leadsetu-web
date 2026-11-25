import { apiClient } from './api-client';

export type WebhookMethod = 'GET' | 'POST';
export type WebhookTargetAction = 'create_lead' | 'create_contact' | 'create_deal';
export type WebhookStatus = 'listening' | 'active' | 'paused';
export type DuplicateStrategy = 'fill_empty' | 'overwrite_non_empty';

export interface WebhookFieldMapping {
  sourceKey: string;
  targetField: string;
}

export interface UniversalWebhookActionField {
  key: string;
  label: string;
  required?: boolean;
  type?: string;
}

export interface UniversalWebhookActionMeta {
  action: WebhookTargetAction;
  label: string;
  entityType?: 'lead' | 'contact' | 'deal';
  description: string;
  fields: UniversalWebhookActionField[];
}

export interface UniversalWebhookItem {
  id: string;
  _id?: string;
  tenantId: string;
  name: string;
  webhookId: string;
  secretToken: string;
  endpointPath: string;
  httpsEndpointUrl?: string;
  allowedMethod: WebhookMethod;
  targetAction: WebhookTargetAction;
  status: WebhookStatus;
  duplicateStrategy: DuplicateStrategy;
  triggerWhatsappOnNew: boolean;
  triggerWhatsappOnRepeat: boolean;
  whatsappTemplateId?: string;
  defaultAssigneeId?: string;
  optionalHeaderSecret?: string;
  fieldMappings: WebhookFieldMapping[];
  stats: {
    created: number;
    updated: number;
    failed: number;
  };
  lastReceivedAt?: string | null;
}

export interface WebhookDeliveryLogItem {
  id: string;
  _id?: string;
  webhookId: string;
  method: string;
  rawPayload: Record<string, any>;
  flattenedPayload: Record<string, any>;
  normalizedPhone?: string;
  outcome: 'created' | 'updated' | 'failed' | 'sample_captured';
  matchedRecordId?: string;
  matchedEntityType?: string;
  errorReason?: string;
  createdAt: string;
}

export async function fetchUniversalWebhookActionsApi(): Promise<{
  actions: UniversalWebhookActionMeta[];
}> {
  const { data } = await apiClient.get('/webhooks/universal/actions');
  return data;
}

export async function listUniversalWebhooksApi(): Promise<{
  webhooks: UniversalWebhookItem[];
}> {
  const { data } = await apiClient.get('/webhooks/universal');
  return data;
}

export async function getUniversalWebhookApi(id: string): Promise<UniversalWebhookItem> {
  const { data } = await apiClient.get(`/webhooks/universal/${encodeURIComponent(id)}`);
  return data?.webhook || data;
}

export async function createUniversalWebhookApi(payload: {
  name: string;
  allowedMethod: WebhookMethod;
  targetAction: WebhookTargetAction;
  duplicateStrategy?: DuplicateStrategy;
  triggerWhatsappOnNew?: boolean;
  triggerWhatsappOnRepeat?: boolean;
  whatsappTemplateId?: string;
  defaultAssigneeId?: string;
  optionalHeaderSecret?: string;
  fieldMappings?: WebhookFieldMapping[];
}): Promise<UniversalWebhookItem> {
  const { data } = await apiClient.post('/webhooks/universal', payload);
  return data?.webhook || data;
}

export async function updateUniversalWebhookApi(
  id: string,
  payload: Partial<{
    name: string;
    allowedMethod: WebhookMethod;
    targetAction: WebhookTargetAction;
    status: WebhookStatus;
    duplicateStrategy: DuplicateStrategy;
    triggerWhatsappOnNew: boolean;
    triggerWhatsappOnRepeat: boolean;
    whatsappTemplateId: string;
    defaultAssigneeId: string;
    optionalHeaderSecret: string;
    fieldMappings: WebhookFieldMapping[];
  }>,
): Promise<UniversalWebhookItem> {
  const { data } = await apiClient.patch(
    `/webhooks/universal/${encodeURIComponent(id)}`,
    payload,
  );
  return data?.webhook || data;
}

export async function startUniversalWebhookListenApi(
  id: string,
): Promise<UniversalWebhookItem> {
  const { data } = await apiClient.post(
    `/webhooks/universal/${encodeURIComponent(id)}/listen`,
  );
  return data?.webhook || data;
}

export async function fetchUniversalWebhookSampleApi(id: string): Promise<{
  hasSample: boolean;
  webhookId: string;
  method?: string;
  rawPayload?: Record<string, any>;
  flattenedPayload: Record<string, string>;
  suggestedMappings: WebhookFieldMapping[];
  capturedAt?: string;
}> {
  const { data } = await apiClient.get(
    `/webhooks/universal/${encodeURIComponent(id)}/sample`,
  );
  return data;
}

export async function rotateUniversalWebhookSecretApi(
  id: string,
): Promise<UniversalWebhookItem> {
  const { data } = await apiClient.post(
    `/webhooks/universal/${encodeURIComponent(id)}/rotate-secret`,
  );
  return data?.webhook || data;
}

export async function fetchUniversalWebhookLogsApi(id: string): Promise<{
  webhookId: string;
  logs: WebhookDeliveryLogItem[];
}> {
  const { data } = await apiClient.get(
    `/webhooks/universal/${encodeURIComponent(id)}/logs`,
  );
  return data;
}

export async function replayUniversalWebhookLogApi(
  id: string,
  logId: string,
): Promise<{
  replayed: boolean;
  logId: string;
  outcome: 'created' | 'updated' | 'failed';
  matchedRecordId?: string;
  matchedEntityType?: string;
  normalizedPhone?: string;
  errorReason?: string;
}> {
  const { data } = await apiClient.post(
    `/webhooks/universal/${encodeURIComponent(id)}/logs/${encodeURIComponent(logId)}/replay`,
  );
  return data;
}

/**
 * Helper to trigger a live test hit against the public receiver endpoint from the browser
 * (used for 1-click sample capture or end-to-end upsert verification).
 */
export async function sendBrowserTestWebhookHitApi(
  endpointPath: string,
  method: WebhookMethod,
  payload: Record<string, any>,
  optionalHeaderSecret?: string,
): Promise<any> {
  const cleanPath = endpointPath.replace(/^\/v1/, '');
  const headers: Record<string, string> = {
    'x-forwarded-proto': 'https',
  };
  if (optionalHeaderSecret) {
    headers['x-webhook-secret'] = optionalHeaderSecret;
  }

  if (method === 'GET') {
    const flatParams: Record<string, string> = {};
    const flatten = (obj: Record<string, any>, prefix = '') => {
      Object.entries(obj || {}).forEach(([k, v]) => {
        const key = prefix ? `${prefix}.${k}` : k;
        if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
          flatten(v, key);
        } else if (v !== undefined && v !== null) {
          flatParams[key] = String(v);
        }
      });
    };
    flatten(payload);
    const { data } = await apiClient.get(cleanPath, { params: flatParams, headers });
    return data;
  } else {
    const { data } = await apiClient.post(cleanPath, payload, { headers });
    return data;
  }
}
