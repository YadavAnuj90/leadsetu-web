import { apiClient } from '@/lib/api-client';
import type {
  BulkImportLeadsResponse,
  CreateLeadPayload,
  WebhookCaptureResponse,
  WebhookConfigResponse,
} from '@/types/contracts';

export async function bulkImportLeadsApi(
  rows: CreateLeadPayload[],
): Promise<BulkImportLeadsResponse> {
  const { data } = await apiClient.post<BulkImportLeadsResponse>(
    '/leads/bulk-import',
    { rows },
  );
  return data;
}

export async function fetchWebhookConfigApi(): Promise<WebhookConfigResponse> {
  const { data } = await apiClient.get<WebhookConfigResponse>(
    '/leads/webhook/config',
  );
  return data;
}

export async function rotateWebhookKeyApi(): Promise<{
  webhookKey: string;
  webhookPath: string;
}> {
  const { data } = await apiClient.post<{
    webhookKey: string;
    webhookPath: string;
  }>('/leads/webhook/rotate-key');
  return data;
}

export async function sendTestWebhookApi(
  webhookKey: string,
  payload: Record<string, unknown>,
): Promise<WebhookCaptureResponse> {
  const { data } = await apiClient.post<WebhookCaptureResponse>(
    `/leads/webhook/${webhookKey}`,
    payload,
  );
  return data;
}
