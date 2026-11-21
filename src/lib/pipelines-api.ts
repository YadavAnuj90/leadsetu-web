import { apiClient } from './api-client';
import type {
  CreatePipelinePayload,
  Pipeline,
  UpdatePipelinePayload,
} from '@/types/contracts';

export async function fetchPipelinesApi(): Promise<{
  data: Pipeline[];
  defaultPipelineId: string;
}> {
  const { data } = await apiClient.get<{
    data: Pipeline[];
    defaultPipelineId: string;
  }>('/pipelines');
  return data;
}

export async function createPipelineApi(
  payload: CreatePipelinePayload,
): Promise<Pipeline> {
  const { data } = await apiClient.post<Pipeline>('/pipelines', payload);
  return data;
}

export async function updatePipelineApi(
  id: string,
  payload: UpdatePipelinePayload,
): Promise<Pipeline> {
  const { data } = await apiClient.patch<Pipeline>(`/pipelines/${id}`, payload);
  return data;
}

export async function setDefaultPipelineApi(id: string): Promise<Pipeline> {
  const { data } = await apiClient.post<Pipeline>(`/pipelines/${id}/set-default`);
  return data;
}

export async function deletePipelineApi(
  id: string,
  reassignToPipelineId?: string,
): Promise<{
  deleted: boolean;
  id: string;
  reassignedDealsCount: number;
  reassignedToPipelineId: string;
}> {
  const { data } = await apiClient.delete<{
    deleted: boolean;
    id: string;
    reassignedDealsCount: number;
    reassignedToPipelineId: string;
  }>(`/pipelines/${id}`, {
    params: reassignToPipelineId ? { reassignToPipelineId } : undefined,
  });
  return data;
}
