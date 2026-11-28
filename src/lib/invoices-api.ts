import { apiClient } from '@/lib/api-client';
import type {
  BankStatementPreviewMatch,
  CreditRecoveryConfig,
  CreditRecoveryOverviewResponse,
  Gstr1ComplianceOverviewResponse,
  Gstr1ExportResponse,
  Invoice,
  InvoicePaymentMode,
  InvoiceStats,
  CreateInvoicePayload,
  InvoicePaymentMethod,
  PublicQuoteView,
  RecordInvoicePaymentPayload,
  TallyXmlExportResponse,
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

export async function exportGstr1CsvApi(params?: {
  month?: string;
  section?: 'all' | 'b2b' | 'b2c' | 'hsn';
}): Promise<Gstr1ExportResponse> {
  const { data } = await apiClient.get<Gstr1ExportResponse>(
    '/invoices/export/gstr1',
    { params },
  );
  return data;
}

export async function convertQuoteToInvoiceApi(
  id: string,
  override?: { overrideCreditHold?: boolean; overrideReason?: string },
): Promise<{
  alreadyConverted: boolean;
  quote: Invoice;
  invoice: Invoice;
}> {
  const { data } = await apiClient.post<{
    alreadyConverted: boolean;
    quote: Invoice;
    invoice: Invoice;
  }>(`/invoices/${id}/convert-to-invoice`, override || {});
  return data;
}

export async function exportTallyXmlApi(params?: {
  month?: string;
  includeMasters?: boolean;
}): Promise<TallyXmlExportResponse> {
  const { data } = await apiClient.get<TallyXmlExportResponse>(
    '/invoices/export/tally-xml',
    {
      params: params
        ? {
            ...(params.month ? { month: params.month } : {}),
            ...(params.includeMasters !== undefined
              ? { includeMasters: String(params.includeMasters) }
              : {}),
          }
        : undefined,
    },
  );
  return data;
}

export async function fetchGstr1ComplianceApi(
  month?: string,
): Promise<Gstr1ComplianceOverviewResponse> {
  const { data } = await apiClient.get<Gstr1ComplianceOverviewResponse>(
    '/invoices/compliance/gstr1',
    { params: month && month !== 'all' ? { month } : undefined },
  );
  return data;
}

export async function updateSellerGstProfileApi(payload: {
  companyName?: string;
  gstin?: string;
  state?: string;
  city?: string;
  address?: string;
}): Promise<Gstr1ComplianceOverviewResponse> {
  const { data } = await apiClient.patch<Gstr1ComplianceOverviewResponse>(
    '/invoices/compliance/seller-profile',
    payload,
  );
  return data;
}

export async function createWhatsappCartCheckoutApi(payload: {
  conversationId?: string;
  clientName: string;
  phone: string;
  email?: string;
  placeOfSupply?: string;
  gstRate?: number;
  discount?: number;
  docType?: 'tax_invoice' | 'proforma_quote';
  items: Array<{
    productId?: string;
    sku?: string;
    description: string;
    hsnSac?: string;
    quantity: number;
    unitPrice: number;
  }>;
  sendWhatsappNow?: boolean;
  customMessage?: string;
}): Promise<{
  invoice: Invoice;
  upiId?: string;
  upiConfigured?: boolean;
  upiPaymentUri: string;
  upiQrDataUrl: string;
  paymentLink: string;
  whatsappDispatched: boolean;
  conversationId: string;
}> {
  const { data } = await apiClient.post('/invoices/whatsapp-cart', payload);
  return data;
}

export async function fetchInvoiceUpiQrApi(invoiceId: string): Promise<{
  invoiceId: string;
  invoiceNumber: string;
  clientName: string;
  grandTotal: number;
  balanceDue: number;
  upiId: string;
  merchantName?: string;
  upiConfigured: boolean;
  upiPaymentUri: string;
  upiQrDataUrl: string;
  paymentLink: string;
  status: string;
}> {
  const { data } = await apiClient.get(`/invoices/${invoiceId}/upi-qr`);
  return data;
}

export async function updateInvoiceDispatchApi(
  invoiceId: string,
  payload: {
    courier: 'Shiprocket' | 'Delhivery' | 'BlueDart' | 'DTDC' | 'Self-Dispatch';
    awbNumber: string;
    trackingUrl?: string;
    dispatchStatus?: 'pending' | 'packed' | 'in_transit' | 'out_for_delivery' | 'delivered';
    notes?: string;
    sendWhatsAppAlert?: boolean;
  },
): Promise<{
  invoice: Invoice;
  whatsappNotified: boolean;
  trackingUrl: string;
}> {
  const { data } = await apiClient.patch(`/invoices/${invoiceId}/dispatch`, payload);
  return data;
}

export async function simulateInvoiceWebhookPaidApi(invoiceId: string): Promise<{
  received: boolean;
  invoiceId: string;
  invoiceNumber: string;
  paymentId: string;
  amountSettledInr: number;
  balanceDue: number;
  status: string;
  creditHoldRemoved: boolean;
  whatsappReceiptSent: boolean;
  metaCapiPurchaseFired?: boolean;
  metaCapiEventId?: string;
  metaCapiStatus?: string;
}> {
  const { data } = await apiClient.post(`/invoices/${invoiceId}/simulate-webhook-paid`);
  return data;
}

export async function fetchRecoveryOverviewApi(): Promise<CreditRecoveryOverviewResponse> {
  const { data } = await apiClient.get<CreditRecoveryOverviewResponse>(
    '/invoices/recovery/overview',
  );
  return data;
}

export async function updateRecoveryConfigApi(
  payload: Partial<CreditRecoveryConfig>,
): Promise<CreditRecoveryConfig> {
  const { data } = await apiClient.patch<CreditRecoveryConfig>(
    '/invoices/recovery/config',
    payload,
  );
  return data;
}

export async function recordInvoicePtpApi(
  id: string,
  payload: {
    promisedPaymentDate: string;
    promisedAmount?: number;
    ptpNote?: string;
  },
): Promise<Invoice> {
  const { data } = await apiClient.post<Invoice>(`/invoices/${id}/ptp`, payload);
  return data;
}

export async function sendRecoveryChaserApi(
  id: string,
  payload?: {
    tone?: 'polite' | 'firm' | 'urgent' | 'final_hold';
    language?: 'hinglish' | 'hindi' | 'english';
    customMessage?: string;
  },
): Promise<{
  invoice: Invoice;
  chaserMessage: string;
  upiLink: string;
}> {
  const { data } = await apiClient.post<{
    invoice: Invoice;
    chaserMessage: string;
    upiLink: string;
  }>(`/invoices/${id}/send-chaser`, payload || {});
  return data;
}

export async function runBatchChasersApi(): Promise<{
  sentCount: number;
  autoHoldCount: number;
  processedInvoices: string[];
}> {
  const { data } = await apiClient.post<{
    sentCount: number;
    autoHoldCount: number;
    processedInvoices: string[];
  }>('/invoices/recovery/run-chasers');
  return data;
}

export async function previewBankReconApi(
  entries: {
    id?: string;
    date: string;
    narration: string;
    utrOrRef: string;
    creditAmount: number;
  }[],
): Promise<{
  totalEntries: number;
  matchedCount: number;
  results: BankStatementPreviewMatch[];
}> {
  const { data } = await apiClient.post<{
    totalEntries: number;
    matchedCount: number;
    results: BankStatementPreviewMatch[];
  }>('/invoices/reconcile-bank', { entries });
  return data;
}

export async function applyBankReconMatchesApi(
  matches: {
    invoiceId: string;
    amountPaid: number;
    tdsDeducted?: number;
    utrOrChequeNo: string;
    paymentDate: string;
    paymentMode?: InvoicePaymentMode;
    note?: string;
  }[],
): Promise<{ settledCount: number; invoices: Invoice[] }> {
  const { data } = await apiClient.post<{
    settledCount: number;
    invoices: Invoice[];
  }>('/invoices/reconcile-bank/apply', { matches });
  return data;
}

export async function verifyContactGstinApi(
  contactId: string,
  gstin?: string,
) {
  const { data } = await apiClient.post(`/contacts/${contactId}/verify-gstin`, {
    gstin,
  });
  return data;
}

export async function updateContactCreditApi(
  contactId: string,
  payload: {
    creditLimitInr?: number;
    creditTermDays?: number;
    creditHold?: boolean;
    creditHoldReason?: string;
  },
) {
  const { data } = await apiClient.patch(`/contacts/${contactId}`, payload);
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

export async function sendDocumentWhatsAppApi(
  id: string,
  payload?: {
    phone?: string;
    customMessage?: string;
    publicBaseUrl?: string;
  },
): Promise<{
  invoice: Invoice;
  sent: boolean;
  deliveryProvider: 'meta_cloud' | 'crm_local';
  status: string;
  externalMessageId: string;
  conversationId: string;
  filename: string;
  paymentLink: string;
  publicUrl: string;
  linkedDealId: string;
  linkedLeadId: string;
  message: string;
  error: string;
}> {
  const { data } = await apiClient.post(
    `/invoices/${id}/send-whatsapp`,
    payload || {},
  );
  return data;
}
