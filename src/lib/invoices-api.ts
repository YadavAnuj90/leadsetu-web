import { apiClient } from '@/lib/api-client';
import type {
  Invoice,
  InvoiceStats,
  CreateInvoicePayload,
  InvoicePaymentMethod,
  PublicQuoteView,
  RecordInvoicePaymentPayload,
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

export async function recordInvoicePaymentApi(
  id: string,
  payload: RecordInvoicePaymentPayload,
): Promise<Invoice> {
  const { data } = await apiClient.post<Invoice>(
    `/invoices/${id}/payments`,
    payload,
  );
  return data;
}

export async function deleteInvoicePaymentApi(
  id: string,
  paymentId: string,
): Promise<Invoice> {
  const { data } = await apiClient.delete<Invoice>(
    `/invoices/${id}/payments/${paymentId}`,
  );
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

export async function exportGstr1CsvApi(): Promise<{
  filename: string;
  rowCount: number;
  csv: string;
}> {
  const { data } = await apiClient.get<{
    filename: string;
    rowCount: number;
    csv: string;
  }>('/invoices/export/gstr1');
  return data;
}

export async function convertQuoteToInvoiceApi(id: string): Promise<{
  alreadyConverted: boolean;
  quote: Invoice;
  invoice: Invoice;
}> {
  const { data } = await apiClient.post<{
    alreadyConverted: boolean;
    quote: Invoice;
    invoice: Invoice;
  }>(`/invoices/${id}/convert-to-invoice`);
  return data;
}

export async function fetchPublicQuoteApi(
  token: string,
): Promise<PublicQuoteView> {
  const { data } = await apiClient.get<PublicQuoteView>(
    `/invoices/public/${token}`,
  );
  return data;
}

export async function respondToPublicQuoteApi(
  token: string,
  payload: {
    decision: 'approved' | 'changes_requested';
    buyerName?: string;
    remark?: string;
  },
): Promise<PublicQuoteView> {
  const { data } = await apiClient.post<PublicQuoteView>(
    `/invoices/public/${token}/respond`,
    payload,
  );
  return data;
}
