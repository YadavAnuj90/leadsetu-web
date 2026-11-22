import { apiClient } from '@/lib/api-client';
import type {
  SubscriptionInvoice,
  SubscriptionPlanSpec,
  TenantInfo,
  WorkspaceBusinessMode,
} from '@/types/contracts';

export interface TenantWorkspaceResponse {
  tenant: TenantInfo;
  usage: {
    activeSeats: number;
    totalSeats: number;
    seatLimit: number;
  };
}

export interface SubscriptionLifecycleInfo {
  autoRenew: boolean;
  cancelAtPeriodEnd: boolean;
  cancellationReason: string;
  cancelledAt: string;
  scheduledDowngradePlan: '' | 'starter' | 'growth' | 'enterprise';
  scheduledDowngradeCycle: '' | 'monthly' | 'annual';
  scheduledForDate: string;
}

export interface SubscriptionRefundRequestItem {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  amountInr: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedByUserId: string;
  requestedByName: string;
  requestedByEmail: string;
  createdAt: string;
  resolvedAt: string;
  resolvedByEmail: string;
  resolutionNote: string;
}

export interface PlanProrationPreview {
  isUpgrade: boolean;
  currentPlan: 'starter' | 'growth' | 'enterprise';
  targetPlan: 'starter' | 'growth' | 'enterprise';
  targetCycle: 'monthly' | 'annual';
  daysRemaining: number;
  cycleTotalDays: number;
  targetListBaseAmount: number;
  proratedCreditInr: number;
  netBaseAfterProration: number;
  couponCode?: string;
  couponDiscountInr?: number;
  finalNetBaseAmount?: number;
  gstTotal: number;
  totalPayableWithGst: number;
}

export interface BillingSummaryResponse extends TenantWorkspaceResponse {
  seller: {
    sellerCompany: string;
    sellerGstin: string;
    sellerAddress: string;
    sellerEmail: string;
  };
  plans: SubscriptionPlanSpec[];
  invoices: SubscriptionInvoice[];
  latestInvoice?: SubscriptionInvoice;
  lifecycle?: SubscriptionLifecycleInfo;
  refundRequests?: SubscriptionRefundRequestItem[];
  proration?: Record<'starter' | 'growth' | 'enterprise', PlanProrationPreview>;
}

export interface UpdateTenantProfilePayload {
  name?: string;
  companyName?: string;
  logoUrl?: string;
  city?: string;
  gstin?: string;
  state?: string;
  phone?: string;
  email?: string;
  address?: string;
  businessMode?: WorkspaceBusinessMode;
  hiddenNavModules?: string[];
}

export interface SubscribePlanPayload {
  plan: 'starter' | 'growth' | 'enterprise';
  billingCycle?: 'monthly' | 'annual';
  paymentMode?: string;
  paymentReference?: string;
  greetingNote?: string;
  couponCode?: string;
}

export interface BillingCouponValidationResponse {
  valid: boolean;
  coupon: {
    code: string;
    discountType: 'percent' | 'flat_inr';
    discountValue: number;
    description: string;
  };
  pricing: {
    plan: 'starter' | 'growth' | 'enterprise';
    planName: string;
    billingCycle: 'monthly' | 'annual';
    listBaseAmount: number;
    discountAmount: number;
    netBaseAmount: number;
    gstRate: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    gstTotal: number;
    totalAmount: number;
  };
}

export interface BillingCheckoutOrderResponse {
  orderId: string;
  orderType?: 'subscription' | 'topup_pack';
  topupPackId?: string;
  keyId: string;
  mode: 'razorpay_live' | 'razorpay_sandbox';
  currency: string;
  amountPaise: number;
  plan: 'starter' | 'growth' | 'enterprise';
  planName: string;
  billingCycle: 'monthly' | 'annual';
  couponCode: string;
  pricing: {
    listBaseAmount: number;
    proratedCreditAmount?: number;
    discountAmount: number;
    netBaseAmount: number;
    gstRate: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    gstTotal: number;
    totalAmount: number;
  };
  prefill: {
    name: string;
    email: string;
    contact: string;
    companyName: string;
    gstin: string;
  };
  seller: {
    sellerCompany: string;
    sellerGstin: string;
    sellerAddress: string;
    sellerEmail: string;
  };
}

export type TopupPackId =
  | 'ai_1000'
  | 'ai_5000'
  | 'wa_2500'
  | 'wa_10000'
  | 'storage_5gb';

export interface TopupPackSpec {
  id: TopupPackId;
  resource: 'ai' | 'whatsapp' | 'storage';
  name: string;
  description: string;
  quantity: number;
  unitLabel: string;
  priceInr: number;
  addonAiCalls: number;
  addonWhatsapp: number;
  addonStorageMb: number;
  badge?: string;
}

export interface BillingUsageDashboardResponse {
  plan: {
    id: 'starter' | 'growth' | 'enterprise';
    name: string;
    status: 'trial' | 'active' | 'suspended';
    billingCycle: 'monthly' | 'annual';
  };
  renewal: {
    periodEnd: string;
    daysRemaining: number;
    gracePeriodDays: number;
    inGracePeriod: boolean;
    expiredBeyondGrace: boolean;
    dunningState:
      | 'active'
      | 'expiring_soon'
      | 'grace_period'
      | 'past_due_action_required';
    autoActionOnExpiry: string;
    reminderDaysBeforeExpiry: number[];
  };
  seats: {
    used: number;
    totalInvited: number;
    limit: number;
    pct: number;
    remaining: number;
    alertLevel: 'ok' | 'warning' | 'exceeded';
  };
  aiCalls: {
    used: number;
    limit: number;
    baseIncluded: number;
    addonBalance: number;
    remaining: number;
    pct: number;
    estimatedCostInr: number;
    lastMeterResetAt: string;
    alertLevel: 'ok' | 'warning' | 'exceeded';
  };
  whatsapp: {
    used: number;
    limit: number;
    baseIncluded: number;
    addonBalance: number;
    remaining: number;
    pct: number;
    estimatedCostInr: number;
    alertLevel: 'ok' | 'warning' | 'exceeded';
  };
  storage: {
    usedMb: number;
    limitMb: number;
    remainingMb: number;
    pct: number;
    alertLevel: 'ok' | 'warning' | 'exceeded';
    recordsBreakdown: {
      documentsCount: number;
      documentBytes: number;
      leadsCount: number;
      dealsCount: number;
      invoicesCount: number;
      conversationsCount: number;
    };
  };
  topupPacks: TopupPackSpec[];
  topupRequests: WorkspaceTopupRequestItem[];
}

export interface BillingVerifyCheckoutResponse extends BillingSummaryResponse {
  verified: boolean;
  alreadyPaid?: boolean;
  orderId: string;
  paymentId: string;
}

export async function fetchCurrentTenantApi(): Promise<TenantWorkspaceResponse> {
  const { data } = await apiClient.get<TenantWorkspaceResponse>('/tenants/me');
  return data;
}

export async function updateCurrentTenantApi(
  payload: UpdateTenantProfilePayload,
): Promise<TenantWorkspaceResponse> {
  const { data } = await apiClient.patch<TenantWorkspaceResponse>(
    '/tenants/me',
    payload,
  );
  return data;
}

export async function fetchBillingSummaryApi(): Promise<BillingSummaryResponse> {
  const { data } = await apiClient.get<BillingSummaryResponse>(
    '/tenants/me/billing',
  );
  return data;
}

export async function subscribePlanApi(
  payload: SubscribePlanPayload,
): Promise<BillingSummaryResponse> {
  const { data } = await apiClient.post<BillingSummaryResponse>(
    '/tenants/me/billing/subscribe',
    payload,
  );
  return data;
}

export async function validateBillingCouponApi(payload: {
  code: string;
  plan: 'starter' | 'growth' | 'enterprise';
  billingCycle?: 'monthly' | 'annual';
}): Promise<BillingCouponValidationResponse> {
  const { data } = await apiClient.post<BillingCouponValidationResponse>(
    '/billing/coupons/validate',
    payload,
  );
  return data;
}

export async function fetchBillingUsageApi(): Promise<BillingUsageDashboardResponse> {
  const { data } = await apiClient.get<BillingUsageDashboardResponse>(
    '/billing/usage',
  );
  return data;
}

export async function fetchBillingProrationApi(params: {
  plan: 'starter' | 'growth' | 'enterprise';
  billingCycle?: 'monthly' | 'annual';
  couponCode?: string;
}): Promise<PlanProrationPreview> {
  const { data } = await apiClient.get<PlanProrationPreview>(
    '/billing/proration',
    { params },
  );
  return data;
}

export async function cancelBillingSubscriptionApi(payload?: {
  reason?: string;
}): Promise<{ lifecycle: SubscriptionLifecycleInfo; summary: string }> {
  const { data } = await apiClient.post(
    '/billing/subscription/cancel',
    payload || {},
  );
  return data;
}

export async function resumeBillingAutoRenewalApi(): Promise<{
  lifecycle: SubscriptionLifecycleInfo;
  summary: string;
}> {
  const { data } = await apiClient.post('/billing/subscription/resume', {});
  return data;
}

export async function scheduleBillingDowngradeApi(payload: {
  targetPlan: 'starter' | 'growth';
  billingCycle?: 'monthly' | 'annual';
  reason?: string;
}): Promise<{ lifecycle: SubscriptionLifecycleInfo; summary: string }> {
  const { data } = await apiClient.post(
    '/billing/subscription/schedule-downgrade',
    payload,
  );
  return data;
}

export async function fetchBillingRefundRequestsApi(): Promise<{
  data: SubscriptionRefundRequestItem[];
}> {
  const { data } = await apiClient.get('/billing/refund-requests');
  return data;
}

export async function createBillingRefundRequestApi(payload: {
  invoiceId: string;
  reason: string;
}): Promise<{
  created: SubscriptionRefundRequestItem;
  data: SubscriptionRefundRequestItem[];
}> {
  const { data } = await apiClient.post('/billing/refund-requests', payload);
  return data;
}

export async function createBillingCheckoutOrderApi(payload: {
  orderType?: 'subscription' | 'topup_pack';
  plan?: 'starter' | 'growth' | 'enterprise';
  billingCycle?: 'monthly' | 'annual';
  topupPackId?: TopupPackId;
  couponCode?: string;
  greetingNote?: string;
}): Promise<BillingCheckoutOrderResponse> {
  const { data } = await apiClient.post<BillingCheckoutOrderResponse>(
    '/billing/checkout/order',
    payload,
  );
  return data;
}

export async function authorizeBillingSandboxOrderApi(payload: {
  razorpayOrderId: string;
  paymentMode?: string;
}): Promise<{
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  paymentMode: string;
}> {
  const { data } = await apiClient.post(
    '/billing/checkout/sandbox-authorize',
    payload,
  );
  return data;
}

export async function verifyBillingCheckoutPaymentApi(payload: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  paymentMode?: string;
  greetingNote?: string;
}): Promise<BillingVerifyCheckoutResponse> {
  const { data } = await apiClient.post<BillingVerifyCheckoutResponse>(
    '/billing/checkout/verify',
    payload,
  );
  return data;
}

export interface WorkspaceTopupRequestItem {
  id: string;
  resource: 'ai' | 'whatsapp';
  quantity: number;
  note: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedByUserId: string;
  requestedByName: string;
  requestedByEmail: string;
  createdAt: string;
  resolvedAt: string;
  resolvedByEmail: string;
  resolutionNote: string;
  grantedQuantity: number;
}

export async function fetchTopupRequestsApi(): Promise<{
  data: WorkspaceTopupRequestItem[];
}> {
  const { data } = await apiClient.get<{ data: WorkspaceTopupRequestItem[] }>(
    '/tenants/me/topup-requests',
  );
  return data;
}

export async function createTopupRequestApi(payload: {
  resource: 'ai' | 'whatsapp';
  quantity: number;
  note?: string;
}): Promise<{
  created: WorkspaceTopupRequestItem;
  data: WorkspaceTopupRequestItem[];
}> {
  const { data } = await apiClient.post('/tenants/me/topup-requests', payload);
  return data;
}
