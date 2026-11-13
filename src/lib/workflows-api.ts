import { apiClient } from '@/lib/api-client';
import type {
  WorkflowRule,
  WorkflowStats,
  CreateWorkflowPayload,
} from '@/types/contracts';

export interface WorkflowsListResponse {
  data: WorkflowRule[];
  stats: WorkflowStats;
}

export async function fetchWorkflows(params?: {
  search?: string;
  triggerType?: string;
  active?: string;
}): Promise<WorkflowsListResponse> {
  const { data } = await apiClient.get<WorkflowsListResponse>('/workflows', {
    params,
  });
  return data;
}

export async function createWorkflow(
  payload: CreateWorkflowPayload,
): Promise<WorkflowRule> {
  const { data } = await apiClient.post<WorkflowRule>('/workflows', payload);
  return data;
}

export async function toggleWorkflowActive(id: string): Promise<WorkflowRule> {
  const { data } = await apiClient.patch<WorkflowRule>(
    `/workflows/${id}/toggle`,
  );
  return data;
}

export async function executeWorkflowNow(id: string): Promise<WorkflowRule> {
  const { data } = await apiClient.post<WorkflowRule>(
    `/workflows/${id}/execute`,
  );
  return data;
}

export async function deleteWorkflow(
  id: string,
): Promise<{ success: boolean }> {
  const { data } = await apiClient.delete<{ success: boolean }>(
    `/workflows/${id}`,
  );
  return data;
}

export async function seedWorkflows(): Promise<{
  count: number;
  data: WorkflowRule[];
}> {
  const { data } = await apiClient.post<{
    count: number;
    data: WorkflowRule[];
  }>('/workflows/seed');
  return data;
}
