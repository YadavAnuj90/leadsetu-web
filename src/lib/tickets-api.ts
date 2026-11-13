import { apiClient } from '@/lib/api-client';
import type {
  CreateTicketPayload,
  Ticket,
  TicketsListResponse,
} from '@/types/contracts';

export async function fetchTicketsApi(params?: {
  status?: string;
  priority?: string;
  search?: string;
}): Promise<TicketsListResponse> {
  const { data } = await apiClient.get<TicketsListResponse>('/tickets', {
    params,
  });
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

export async function deleteTicketApi(id: string): Promise<{ success: boolean }> {
  const { data } = await apiClient.delete<{ success: boolean }>(`/tickets/${id}`);
  return data;
}

export async function seedTicketsApi(): Promise<{ count: number; data: Ticket[] }> {
  const { data } = await apiClient.post<{ count: number; data: Ticket[] }>(
    '/tickets/seed',
  );
  return data;
}
