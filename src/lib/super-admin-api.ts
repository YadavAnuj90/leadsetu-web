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
  PlatformWhatsAppProviderConfig,
  PlatformWhatsAppProviderTestResponse,
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
      aiCallsUsed?: number;
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
    confirmPassword?: string;
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
  confirmPassword?: string;
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
  isActive: boolean,
  confirmPassword?: string
): Promise<{ data: SuperAdminOperatorItem[] }> {
  const { data } = await apiClient.patch(`/super-admin/operators/${operatorId}/status`, {
    isActive,
    confirmPassword,
  });
  return data;
}

export async function revokeAllTenantSessionsApi(
  tenantId: string,
  payload: { reason: string; confirmPassword: string }
): Promise<SuperAdminTenantDetailResponse> {
  const { data } = await apiClient.post<SuperAdminTenantDetailResponse>(
    `/super-admin/tenants/${tenantId}/security/revoke-all-sessions`,
    payload
  );
  return data;
}

export async function exportTenantDpdpDataApi(
  tenantId: string
): Promise<{ blob: Blob; filename: string }> {
  const response = await apiClient.get(`/super-admin/tenants/${tenantId}/dpdp/export`, {
    responseType: 'blob',
  });
  const disposition = String(response.headers['content-disposition'] || '');
  const match = disposition.match(/filename="([^"]+)"/);
  return {
    blob: response.data as Blob,
    filename: match?.[1] || `Leadsetu-DPDP-Backup-${tenantId}.json`,
  };
}

export async function dpdpEraseTenantApi(
  tenantId: string,
  payload: {
    mode: 'soft_delete' | 'restore' | 'permanent_purge';
    reason: string;
    confirmPassword?: string;
    forceBypassRetention?: boolean;
  }
): Promise<SuperAdminTenantDetailResponse> {
  const { data } = await apiClient.post<SuperAdminTenantDetailResponse>(
    `/super-admin/tenants/${tenantId}/dpdp/erase`,
    payload
  );
  return data;
}

export async function grantTenantQuotaAddonApi(
  tenantId: string,
  payload: {
    addonAiCalls?: number;
    addonWhatsapp?: number;
    addonStorageMb?: number;
    issueGstInvoice?: boolean;
    addonPriceInr?: number;
    paymentReference?: string;
    reason?: string;
  }
): Promise<SuperAdminTenantDetailResponse> {
  const { data } = await apiClient.post<SuperAdminTenantDetailResponse>(
    `/super-admin/tenants/${tenantId}/quotas/addon`,
    payload
  );
  return data;
}

export interface ManageAiAuthorityPayload {
  mode: 'assign_balance' | 'remove_balance' | 'set_balance' | 'reset_used' | 'update_features';
  aiCallsDelta?: number;
  maxMonthlyAiCalls?: number;
  aiCallsUsed?: number;
  aiScoring?: boolean | null;
  aiWorkflows?: boolean | null;
  aiCreditRisk?: boolean | null;
  aiVoiceCrm?: boolean | null;
  aiDealerDesk?: boolean | null;
  aiCopilot?: boolean | null;
  reason?: string;
}

export async function manageTenantAiAuthorityApi(
  tenantId: string,
  payload: ManageAiAuthorityPayload
): Promise<SuperAdminTenantDetailResponse> {
  const { data } = await apiClient.patch<SuperAdminTenantDetailResponse>(
    `/super-admin/tenants/${tenantId}/ai-authority`,
    payload
  );
  return data;
}

export async function bulkManageAiAuthorityApi(
  payload: ManageAiAuthorityPayload & { tenantIds?: string[] }
): Promise<{
  updatedCount: number;
  data: SuperAdminTenantItem[];
}> {
  const { data } = await apiClient.post<{
    updatedCount: number;
    data: SuperAdminTenantItem[];
  }>('/super-admin/tenants/ai-authority/bulk', payload);
  return data;
}

export interface SuperAdminTopupRequestItem {
  tenantId: string;
  tenantName: string;
  accountId: string;
  plan: 'starter' | 'growth' | 'enterprise';
  tenantStatus: string;
  city: string;
  currentAiCap: number;
  currentAiUsed: number;
  currentWaCap: number;
  currentWaUsed: number;
  id: string;
  resource: 'ai' | 'whatsapp';
  quantity: number;
  note: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedByName: string;
  requestedByEmail: string;
  createdAt: string;
  resolvedAt: string;
  resolvedByEmail: string;
  resolutionNote: string;
  grantedQuantity: number;
}

export interface SuperAdminTopupRequestsResponse {
  data: SuperAdminTopupRequestItem[];
  stats: {
    pending: number;
    approved: number;
    rejected: number;
  };
}

export async function fetchSuperAdminTopupRequestsApi(
  status?: string
): Promise<SuperAdminTopupRequestsResponse> {
  const { data } = await apiClient.get<SuperAdminTopupRequestsResponse>(
    '/super-admin/topup-requests',
    { params: status ? { status } : undefined }
  );
  return data;
}

export async function resolveTopupRequestApi(
  tenantId: string,
  requestId: string,
  payload: {
    action: 'approve' | 'reject';
    grantedQuantity?: number;
    issueGstInvoice?: boolean;
    priceInr?: number;
    note?: string;
  }
): Promise<SuperAdminTopupRequestsResponse> {
  const { data } = await apiClient.patch<SuperAdminTopupRequestsResponse>(
    `/super-admin/tenants/${tenantId}/topup-requests/${requestId}`,
    payload
  );
  return data;
}

export interface TerritoryAnalyticsItem {
  city: string;
  tenants: number;
  active: number;
  trial: number;
  suspended: number;
  mrrInr: number;
  seatsUsed: number;
  aiCallsUsed: number;
  aiCap: number;
  leadsCount: number;
  wonRevenueInr: number;
  avgHealthScore: number;
}

export interface TenantHealthItem {
  id: string;
  name: string;
  accountId: string;
  city: string;
  plan: 'starter' | 'growth' | 'enterprise';
  status: 'trial' | 'active' | 'suspended';
  seatsUsed: number;
  seatLimit: number;
  leadsCount: number;
  wonRevenueInr: number;
  mrrInr: number;
  aiUsed: number;
  aiCap: number;
  healthScore: number;
  healthBand: 'healthy' | 'watch' | 'at_risk';
  reasons: string[];
}

export interface TerritoryAnalyticsResponse {
  territories: TerritoryAnalyticsItem[];
  tenantsHealth: TenantHealthItem[];
  summary: {
    totalTerritories: number;
    totalTenants: number;
    healthy: number;
    watch: number;
    atRisk: number;
    totalMrrInr: number;
  };
}

export async function fetchTerritoryAnalyticsApi(): Promise<TerritoryAnalyticsResponse> {
  const { data } = await apiClient.get<TerritoryAnalyticsResponse>(
    '/super-admin/analytics/territories'
  );
  return data;
}

export async function fetchWhatsAppProviderApi(): Promise<PlatformWhatsAppProviderConfig> {
  const { data } = await apiClient.get<PlatformWhatsAppProviderConfig>(
    '/super-admin/whatsapp-provider',
  );
  return data;
}

export async function updateWhatsAppProviderApi(payload: {
  metaAppId?: string;
  metaAppSecret?: string;
  embeddedSignupConfigId?: string;
  webhookVerifyToken?: string;
  clearMetaAppSecret?: boolean;
  managedSenderEnabled?: boolean;
  managedPhoneNumberId?: string;
  managedWabaId?: string;
  managedAccessToken?: string;
  clearManagedAccessToken?: boolean;
}): Promise<PlatformWhatsAppProviderConfig> {
  const { data } = await apiClient.patch<PlatformWhatsAppProviderConfig>(
    '/super-admin/whatsapp-provider',
    payload,
  );
  return data;
}

export async function testWhatsAppProviderApi(payload?: {
  phoneNumberId?: string;
  accessToken?: string;
}): Promise<PlatformWhatsAppProviderTestResponse> {
  const { data } = await apiClient.post<PlatformWhatsAppProviderTestResponse>(
    '/super-admin/whatsapp-provider/test',
    payload || {},
  );
  return data;
}
