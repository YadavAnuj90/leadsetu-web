import { apiClient } from '@/lib/api-client';
import type {
  AddTicketCommentPayload,
  CreateTicketPayload,
  Ticket,
  TicketAssignee,
  TicketsListResponse,
} from '@/types/contracts';

export async function fetchTicketsApi(params?: {
  status?: string;
  priority?: string;
  category?: string;
  slaBreached?: string;
  assignedOnly?: string;
  search?: string;
}): Promise<TicketsListResponse> {
  const { data } = await apiClient.get<TicketsListResponse>('/tickets', {
    params,
  });
  return data;
}

export async function fetchTicketAssigneesApi(): Promise<TicketAssignee[]> {
  const { data } = await apiClient.get<{ data: TicketAssignee[] }>(
    '/tickets/assignees',
  );
  return data.data || [];
}

export async function fetchTicketByIdApi(id: string): Promise<Ticket> {
  const { data } = await apiClient.get<Ticket>(`/tickets/${id}`);
  return data;
}

export async function createTicketApi(
  payload: CreateTicketPayload,
): Promise<Ticket> {
  const { data } = await apiClient.post<Ticket>('/tickets', payload);
  return data;
}

export async function updateTicketApi(
  id: string,
  payload: Partial<CreateTicketPayload>,
): Promise<Ticket> {
  const { data } = await apiClient.patch<Ticket>(`/tickets/${id}`, payload);
  return data;
}

export async function addTicketCommentApi(
  id: string,
  payload: AddTicketCommentPayload,
): Promise<Ticket> {
  const { data } = await apiClient.post<Ticket>(
    `/tickets/${id}/comments`,
    payload,
  );
  return data;
}

export async function deleteTicketApi(
  id: string,
): Promise<{ success: boolean }> {
  const { data } = await apiClient.delete<{ success: boolean }>(
    `/tickets/${id}`,
  );
  return data;
}
