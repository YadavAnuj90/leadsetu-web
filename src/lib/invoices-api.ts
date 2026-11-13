import { apiClient } from '@/lib/api-client';
import type {
  Invoice,
  InvoiceStats,
  CreateInvoicePayload,
  InvoicePaymentMethod,
} from '@/types/contracts';

export interface InvoicesListResponse {
  data: Invoice[];
  stats: InvoiceStats;
}

export async function fetchInvoices(params?: {
  search?: string;
  status?: string;
  docType?: string;
}): Promise<InvoicesListResponse> {
  const { data } = await apiClient.get<InvoicesListResponse>('/invoices', {
    params,
  });
  return data;
}

export async function fetchInvoiceById(id: string): Promise<Invoice> {
  const { data } = await apiClient.get<Invoice>(`/invoices/${id}`);
  return data;
}

export async function createInvoice(
  payload: CreateInvoicePayload,
): Promise<Invoice> {
  const { data } = await apiClient.post<Invoice>('/invoices', payload);
  return data;
}

export async function updateInvoice(
  id: string,
  payload: Partial<CreateInvoicePayload>,
): Promise<Invoice> {
  const { data } = await apiClient.patch<Invoice>(`/invoices/${id}`, payload);
  return data;
}

export async function markInvoicePaid(
  id: string,
  paymentMethod: Exclude<InvoicePaymentMethod, 'unpaid'> = 'razorpay',
): Promise<Invoice> {
  const { data } = await apiClient.post<Invoice>(`/invoices/${id}/mark-paid`, {
    paymentMethod,
  });
  return data;
}

export async function deleteInvoice(id: string): Promise<{ success: boolean }> {
  const { data } = await apiClient.delete<{ success: boolean }>(
    `/invoices/${id}`,
  );
  return data;
}

export async function seedInvoices(): Promise<{
  count: number;
  data: Invoice[];
}> {
  const { data } = await apiClient.post<{ count: number; data: Invoice[] }>(
    '/invoices/seed',
  );
  return data;
}
