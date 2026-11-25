import { apiClient } from '@/lib/api-client';
import type {
  WorkflowRule,
  WorkflowStats,
  CreateWorkflowPayload,
  WorkflowTriggerType,
  WorkflowActionType,
  WorkflowStepNode,
  WorkflowEnrollmentItem,
} from '@/types/contracts';

export interface WorkflowsListResponse {
  data: WorkflowRule[];
  stats: WorkflowStats;
}

export interface WorkflowAiDraftResponse {
  prompt: string;
  name: string;
  description: string;
  triggerType: WorkflowTriggerType;
  sourceFilter: string;
  staleStage: string;
  staleHours: number;
  staleMinutes?: number;
  conditionSummary: string;
  actionType: WorkflowActionType;
  actionSummary: string;
  whatsappTemplateBody: string;
  nodes?: WorkflowStepNode[];
  provider: string;
  model: string;
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

export async function updateWorkflowApi(
  id: string,
  payload: Partial<CreateWorkflowPayload>,
): Promise<WorkflowRule> {
  const { data } = await apiClient.patch<WorkflowRule>(`/workflows/${id}`, payload);
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

export async function fetchWorkflowEnrollmentsApi(id: string): Promise<{
  enrollments: WorkflowEnrollmentItem[];
}> {
  const { data } = await apiClient.get<{ enrollments: WorkflowEnrollmentItem[] }>(
    `/workflows/${id}/enrollments`,
  );
  return data;
}

export async function simulateWorkflowLeadApi(
  id: string,
  payload?: { forceAdvance?: boolean },
): Promise<{
  workflow: WorkflowRule;
  enrollment: {
    id: string;
    leadName: string;
    leadPhone: string;
    status: string;
    stepLogs: WorkflowEnrollmentItem['stepLogs'];
  };
}> {
  const { data } = await apiClient.post(`/workflows/${id}/simulate-lead`, payload || {});
  return data;
}

export async function processDueDripsApi(payload?: {
  workflowId?: string;
  forceAdvance?: boolean;
}): Promise<{
  processed: number;
  completed: number;
  stoppedOnReply: number;
}> {
  const { data } = await apiClient.post('/workflows/process-due-drips', payload || {});
  return data;
}

export async function runStaleLeadFollowUpsApi(payload?: {
  workflowId?: string;
  forceImmediate?: boolean;
}): Promise<{
  workflowsProcessed: number;
  followUpsSent: number;
  details: Array<{ workflowId: string; name: string; sentCount: number }>;
}> {
  const { data } = await apiClient.post<{
    workflowsProcessed: number;
    followUpsSent: number;
    details: Array<{ workflowId: string; name: string; sentCount: number }>;
  }>('/workflows/run-stale-followups', payload || {});
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

export async function draftWorkflowWithAiApi(payload: {
  prompt: string;
  language?: string;
}): Promise<WorkflowAiDraftResponse> {
  const { data } = await apiClient.post<WorkflowAiDraftResponse>(
    '/workflows/ai-draft',
    payload,
  );
  return data;
}
