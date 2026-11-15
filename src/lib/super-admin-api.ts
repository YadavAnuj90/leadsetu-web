import { apiClient } from './api-client';
import type {
  AuthUser,
  DunningPolicyConfig,
  GlobalKillSwitches,
  GlobalSecurityPolicies,
  PlanEntitlementSpec,
  PlatformAuditLogItem,
  PlatformConfigData,
  PlatformFeatureKey,
  PlatformFeatureSpec,
  SaasCouponItem,
  SaasPartnerItem,
  SubscriptionInvoice,
  SuperAdminBillingResponse,
  SuperAdminOperatorItem,
  SuperAdminOverviewResponse,
  SuperAdminTenantDetailResponse,
  SuperAdminTenantItem,
  TenantInfo,
} from '@/types/contracts';

export async function fetchSuperAdminBootstrapStatusApi(): Promise<{
  initialized: boolean;
  hasEnvSetupKey: boolean;
}> {
  const { data } = await apiClient.get('/super-admin/bootstrap-status');
  return data;
}

export async function bootstrapSuperAdminApi(payload: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  setupKey: string;
}) {
  const { data } = await apiClient.post('/super-admin/bootstrap', payload);
  return data;
}

export async function fetchSuperAdminOverviewApi(): Promise<SuperAdminOverviewResponse> {
  const { data } = await apiClient.get<SuperAdminOverviewResponse>('/super-admin/overview');
  return data;
}

export async function fetchSuperAdminTenantsApi(params?: {
  search?: string;
  status?: string;
  plan?: string;
}): Promise<{
  data: SuperAdminTenantItem[];
  featureCatalog: PlatformFeatureSpec[];
}> {
  const { data } = await apiClient.get('/super-admin/tenants', { params });
  return data;
}

export async function fetchSuperAdminTenantDetailApi(
  tenantId: string
): Promise<SuperAdminTenantDetailResponse> {
  const { data } = await apiClient.get<SuperAdminTenantDetailResponse>(
    `/super-admin/tenants/${tenantId}`
  );
  return data;
}

export async function updateTenantGovernanceApi(
  tenantId: string,
  payload: {
    plan?: 'starter' | 'growth' | 'enterprise';
    status?: 'trial' | 'active' | 'suspended';
    suspensionReason?: string;
    seatLimitOverride?: number | null;
    extendTrialDays?: number;
    assignedManagerNote?: string;
    featureOverrides?: Partial<Record<PlatformFeatureKey, boolean | null>>;
    quotas?: {
      maxMonthlyAiCalls?: number;
      maxMonthlyWhatsapp?: number;
      maxStorageMb?: number;
      resetUsageCounters?: boolean;
    };
    securityPolicy?: {
      enforcePhoneMasking?: boolean;
      lockAgentExport?: boolean;
      requireStrongPassword?: boolean;
      sessionTtlHours?: number;
      allowImpersonation?: boolean;
      ipAllowlist?: string[];
    };
    reason?: string;
  }
): Promise<SuperAdminTenantDetailResponse> {
  const { data } = await apiClient.patch<SuperAdminTenantDetailResponse>(
    `/super-admin/tenants/${tenantId}/governance`,
    payload
  );
  return data;
}

export async function updateTenantUserRbacApi(
  tenantId: string,
  userId: string,
  payload: {
    role?: 'owner' | 'admin' | 'manager' | 'agent';
    departmentPreset?: string;
    permissions?: string[];
    isActive?: boolean;
    maskPhones?: boolean;
    territory?: string;
    revokeSessions?: boolean;
    reason?: string;
  }
): Promise<SuperAdminTenantDetailResponse> {
  const { data } = await apiClient.patch<SuperAdminTenantDetailResponse>(
    `/super-admin/tenants/${tenantId}/users/${userId}`,
    payload
  );
  return data;
}

export async function impersonateTenantApi(
  tenantId: string,
  payload: { reason: string; targetUserId?: string }
): Promise<{
  accessToken: string;
  impersonation: {
    isImpersonation: boolean;
    actorEmail: string;
    reason: string;
    expiresInMinutes: number;
  };
  user: AuthUser;
  tenant: TenantInfo;
}> {
  const { data } = await apiClient.post(
    `/super-admin/tenants/${tenantId}/impersonate`,
    payload
  );
  return data;
}

export async function fetchPlatformPoliciesApi(): Promise<{
  config: PlatformConfigData;
  featureCatalog: PlatformFeatureSpec[];
}> {
  const { data } = await apiClient.get('/super-admin/policies');
  return data;
}

export async function updatePlatformPoliciesApi(payload: {
  maintenanceMode?: boolean;
  maintenanceBanner?: string;
  allowNewSignups?: boolean;
  defaultTrialDays?: number;
  globalKillSwitches?: Partial<GlobalKillSwitches>;
  securityPolicies?: Partial<GlobalSecurityPolicies>;
  planMatrix?: Partial<Record<'starter' | 'growth' | 'enterprise', PlanEntitlementSpec>>;
  reason?: string;
}): Promise<{
  config: PlatformConfigData;
  featureCatalog: PlatformFeatureSpec[];
}> {
  const { data } = await apiClient.patch('/super-admin/policies', payload);
  return data;
}

export async function fetchSuperAdminBillingApi(
  month?: string
): Promise<SuperAdminBillingResponse> {
  const { data } = await apiClient.get<SuperAdminBillingResponse>('/super-admin/billing', {
    params: month && month !== 'all' ? { month } : undefined,
  });
  return data;
}

export async function exportSuperAdminBillingCsvApi(
  type: 'gstr1' | 'tds',
  month?: string
): Promise<{ blob: Blob; filename: string }> {
  const response = await apiClient.get('/super-admin/billing/export', {
    params: { type, ...(month && month !== 'all' ? { month } : {}) },
    responseType: 'blob',
  });
  const disposition = String(response.headers['content-disposition'] || '');
  const match = disposition.match(/filename="([^"]+)"/);
  const filename =
    match?.[1] ||
    (type === 'tds'
      ? `Leadsetu-Platform-TDS-${month || 'all'}.csv`
      : `Leadsetu-GSTR1-${month || 'all'}.csv`);
  return { blob: response.data as Blob, filename };
}

export async function issueTenantSubscriptionApi(
  tenantId: string,
  payload: {
    plan: 'starter' | 'growth' | 'enterprise';
    billingCycle?: 'monthly' | 'annual';
    grantMode: 'paid_offline' | 'complimentary_grant';
    paymentMode?: string;
    paymentReference?: string;
    customBaseAmount?: number;
    couponCode?: string;
    partnerCode?: string;
    tdsDeducted?: number;
    greetingNote?: string;
    reason?: string;
  }
): Promise<{
  invoice: SubscriptionInvoice;
  tenantId: string;
  plan: 'starter' | 'growth' | 'enterprise';
  status: 'trial' | 'active' | 'suspended';
}> {
  const { data } = await apiClient.post(
    `/super-admin/tenants/${tenantId}/billing/grant`,
    payload
  );
  return data;
}

export async function updateSubscriptionInvoiceStatusApi(
  tenantId: string,
  invoiceId: string,
  payload: {
    action: 'refund' | 'void' | 'mark_paid';
    paymentReference?: string;
    tdsDeducted?: number;
    reason: string;
  }
): Promise<{ invoice: SubscriptionInvoice; tenantStatus: string }> {
  const { data } = await apiClient.patch(
    `/super-admin/tenants/${tenantId}/billing/invoices/${invoiceId}`,
    payload
  );
  return data;
}

export async function createSaasCouponApi(payload: {
  code: string;
  discountType: 'percent' | 'flat_inr';
  discountValue: number;
  applicablePlans?: Array<'starter' | 'growth' | 'enterprise'>;
  billingCycle?: 'all' | 'monthly' | 'annual';
  maxRedemptions?: number;
  expiresAt?: string;
  description?: string;
}): Promise<SaasCouponItem> {
  const { data } = await apiClient.post('/super-admin/billing/coupons', payload);
  return data;
}

export async function updateSaasCouponApi(
  couponId: string,
  payload: { isActive?: boolean; maxRedemptions?: number; expiresAt?: string }
): Promise<SaasCouponItem> {
  const { data } = await apiClient.patch(`/super-admin/billing/coupons/${couponId}`, payload);
  return data;
}

export async function createSaasPartnerApi(payload: {
  partnerCode: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  commissionRatePct?: number;
}): Promise<SaasPartnerItem> {
  const { data } = await apiClient.post('/super-admin/billing/partners', payload);
  return data;
}

export async function recordPartnerPayoutApi(
  partnerId: string,
  payload: { amountInr: number; reference?: string; note?: string }
): Promise<SaasPartnerItem> {
  const { data } = await apiClient.post(
    `/super-admin/billing/partners/${partnerId}/payout`,
    payload
  );
  return data;
}

export async function updateDunningPolicyApi(
  payload: Partial<DunningPolicyConfig>
): Promise<DunningPolicyConfig> {
  const { data } = await apiClient.patch('/super-admin/billing/dunning', payload);
  return data;
}

export async function runDunningSweepApi(): Promise<{
  ranAt: string;
  checkedTrials: number;
  remindersQueued: number;
  enforcedCount: number;
  summary: string;
  actions: Array<{ tenantName: string; accountId: string; outcome: string }>;
}> {
  const { data } = await apiClient.post('/super-admin/billing/dunning/run');
  return data;
}

export async function fetchPlatformAuditLogsApi(params?: {
  severity?: string;
  search?: string;
  limit?: number;
}): Promise<{
  stats: { total: number; critical: number; warning: number };
  data: PlatformAuditLogItem[];
}> {
  const { data } = await apiClient.get('/super-admin/audit-logs', { params });
  return data;
}

export async function fetchSuperAdminOperatorsApi(): Promise<{
  data: SuperAdminOperatorItem[];
}> {
  const { data } = await apiClient.get('/super-admin/operators');
  return data;
}

export async function createSuperAdminOperatorApi(payload: {
  name: string;
  email: string;
  phone?: string;
  password: string;
  territory?: string;
}): Promise<{ data: SuperAdminOperatorItem[] }> {
  const { data } = await apiClient.post('/super-admin/operators', payload);
  return data;
}

export async function toggleSuperAdminOperatorStatusApi(
  operatorId: string,
  isActive: boolean
): Promise<{ data: SuperAdminOperatorItem[] }> {
  const { data } = await apiClient.patch(`/super-admin/operators/${operatorId}/status`, {
    isActive,
  });
  return data;
}
