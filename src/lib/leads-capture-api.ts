import { apiClient } from '@/lib/api-client';
import type {
  BulkImportLeadsOptions,
  BulkImportLeadsResponse,
  CreateLeadPayload,
  DuplicatesResponse,
  MergeLeadsPayload,
  MergeLeadsResponse,
  WebhookCaptureResponse,
  WebhookConfigResponse,
} from '@/types/contracts';

export async function bulkImportLeadsApi(
  rows: CreateLeadPayload[],
  options?: BulkImportLeadsOptions,
): Promise<BulkImportLeadsResponse> {
  const { data } = await apiClient.post<BulkImportLeadsResponse>(
    '/leads/bulk-import',
    {
      rows,
      ...(options?.duplicateMode ? { duplicateMode: options.duplicateMode } : {}),
      ...(options?.autoRoute !== undefined ? { autoRoute: options.autoRoute } : {}),
    },
  );
  return data;
}

export async function fetchDuplicateLeadsApi(): Promise<DuplicatesResponse> {
  const { data } = await apiClient.get<DuplicatesResponse>('/leads/duplicates');
  return data;
}

export async function mergeDuplicateLeadsApi(
  payload: MergeLeadsPayload,
): Promise<MergeLeadsResponse> {
  const { data } = await apiClient.post<MergeLeadsResponse>(
    '/leads/merge',
    payload,
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
