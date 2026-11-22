import { apiClient } from './api-client';
import type {
  BuyerPortalData,
  PortalPaymentIntentResponse,
} from '@/types/contracts';

export async function manageContactPortalLinkApi(
  contactId: string,
  payload?: { regenerate?: boolean; enabled?: boolean },
): Promise<{
  contactId: string;
  portalToken: string;
  portalEnabled: boolean;
  portalLastAccessedAt: string;
  portalPath: string;
}> {
  const { data } = await apiClient.post<{
    contactId: string;
    portalToken: string;
    portalEnabled: boolean;
    portalLastAccessedAt: string;
    portalPath: string;
  }>(`/portal/contacts/${contactId}/link`, payload || {});
  return data;
}

export async function fetchPublicBuyerPortalApi(
  token: string,
): Promise<BuyerPortalData> {
  const { data } = await apiClient.get<BuyerPortalData>(`/portal/public/${token}`);
  return data;
}

export async function respondToPortalQuoteApi(
  token: string,
  quoteId: string,
  payload: {
    decision: 'approved' | 'changes_requested';
    buyerName?: string;
    remark?: string;
  },
): Promise<BuyerPortalData> {
  const { data } = await apiClient.post<BuyerPortalData>(
    `/portal/public/${token}/quotes/${quoteId}/respond`,
    payload,
  );
  return data;
}

export async function submitPortalPaymentIntentApi(
  token: string,
  invoiceId: string,
  payload: {
    paymentMode: 'UPI' | 'NEFT' | 'RTGS' | 'Razorpay';
    amountInr: number;
    utrOrReference?: string;
    promisedDate?: string;
    buyerName?: string;
    note?: string;
  },
): Promise<PortalPaymentIntentResponse> {
  const { data } = await apiClient.post<PortalPaymentIntentResponse>(
    `/portal/public/${token}/invoices/${invoiceId}/payment-intent`,
    payload,
  );
  return data;
}

export async function createPortalTicketApi(
  token: string,
  payload: {
    subject: string;
    category:
      | 'dispatch_delay'
      | 'warranty'
      | 'gst_correction'
      | 'installation'
      | 'amc_service'
      | 'general';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    linkedInvoiceNumber?: string;
    message: string;
    buyerName?: string;
  },
): Promise<BuyerPortalData> {
  const { data } = await apiClient.post<BuyerPortalData>(
    `/portal/public/${token}/tickets`,
    payload,
  );
  return data;
}

export async function replyPortalTicketApi(
  token: string,
  ticketId: string,
  payload: { message: string; buyerName?: string },
): Promise<BuyerPortalData> {
  const { data } = await apiClient.post<BuyerPortalData>(
    `/portal/public/${token}/tickets/${ticketId}/reply`,
    payload,
  );
  return data;
}
