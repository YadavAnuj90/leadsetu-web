import { apiClient } from '@/lib/api-client';
import type {
  CrmDocument,
  DocumentsListResponse,
  CreateCrmDocumentPayload,
} from '@/types/contracts';

export async function fetchDocumentsApi(params?: {
  search?: string;
  category?: string;
  customer?: string;
}): Promise<DocumentsListResponse> {
  const { data } = await apiClient.get<DocumentsListResponse>('/documents', {
    params,
  });
  return data;
}

export async function fetchDocumentByIdApi(id: string): Promise<CrmDocument> {
  const { data } = await apiClient.get<CrmDocument>(`/documents/${id}`);
  return data;
}

export async function createDocumentApi(
  payload: CreateCrmDocumentPayload,
): Promise<CrmDocument> {
  const { data } = await apiClient.post<CrmDocument>('/documents', payload);
  return data;
}

export async function updateDocumentApi(
  id: string,
  payload: Partial<CreateCrmDocumentPayload>,
): Promise<CrmDocument> {
  const { data } = await apiClient.patch<CrmDocument>(
    `/documents/${id}`,
    payload,
  );
  return data;
}

export async function deleteDocumentApi(
  id: string,
): Promise<{ success: boolean; id: string }> {
  const { data } = await apiClient.delete<{ success: boolean; id: string }>(
    `/documents/${id}`,
  );
  return data;
}

export async function seedDocumentsApi(): Promise<{
  count: number;
  data: CrmDocument[];
}> {
  const { data } = await apiClient.post<{ count: number; data: CrmDocument[] }>(
    '/documents/seed',
  );
  return data;
}
