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
    role?: 'owner' | 'admin' | 'manager' | 'agent' | 'support';
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

export interface SuperAdminRefundRequestItem {
  id: string;
  tenantId: string;
  tenantName: string;
  accountId?: string;
  plan?: string;
  tenantStatus?: string;
  city?: string;
  invoiceId: string;
  invoiceNumber: string;
  amountInr: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedByEmail?: string;
  requestedByName?: string;
  createdAt: string;
  resolvedByEmail?: string;
  resolvedAt?: string;
  resolutionNote?: string;
}

export interface SuperAdminRefundRequestsResponse {
  data: SuperAdminRefundRequestItem[];
  stats: {
    pending: number;
    approved: number;
    rejected: number;
  };
}

export async function fetchSuperAdminRefundRequestsApi(
  status?: 'pending' | 'approved' | 'rejected'
): Promise<SuperAdminRefundRequestsResponse> {
  const { data } = await apiClient.get<SuperAdminRefundRequestsResponse>(
    '/super-admin/billing/refund-requests',
    { params: status ? { status } : undefined }
  );
  return data;
}

export async function resolveSuperAdminRefundRequestApi(
  tenantId: string,
  requestId: string,
  payload: {
    action: 'approve' | 'reject';
    note?: string;
  }
): Promise<SuperAdminRefundRequestsResponse> {
  const { data } = await apiClient.post<SuperAdminRefundRequestsResponse>(
    `/super-admin/billing/refund-requests/${tenantId}/${requestId}/resolve`,
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

export interface PlatformRazorpayGatewayConfig {
  enabled: boolean;
  hasKeyId: boolean;
  vaultHasKeyId: boolean;
  keyIdMask: string;
  hasKeySecret: boolean;
  vaultHasKeySecret: boolean;
  keySecretMask: string;
  hasWebhookSecret: boolean;
  vaultHasWebhook: boolean;
  webhookSecretMask: string;
  mode: 'test' | 'live' | 'unconfigured';
  source: 'super_admin' | 'env' | 'none';
  gatewayReady: boolean;
  invoiceWebhookPath: string;
  billingWebhookPath: string;
  lastTestedAt: string;
  lastTestStatus: 'untested' | 'connected' | 'error';
  lastError: string;
  updatedAt: string;
}

export interface PlatformRazorpayGatewayTestResponse {
  ok: boolean;
  mode: 'test' | 'live' | 'unconfigured';
  source: string;
  paymentLinksSampled: number;
  error: string;
  config: PlatformRazorpayGatewayConfig;
}

export async function fetchRazorpayGatewayApi(): Promise<PlatformRazorpayGatewayConfig> {
  const { data } = await apiClient.get<PlatformRazorpayGatewayConfig>(
    '/super-admin/razorpay-gateway',
  );
  return data;
}

export async function updateRazorpayGatewayApi(payload: {
  enabled?: boolean;
  keyId?: string;
  keySecret?: string;
  webhookSecret?: string;
  clearKeyId?: boolean;
  clearKeySecret?: boolean;
  clearWebhookSecret?: boolean;
}): Promise<PlatformRazorpayGatewayConfig> {
  const { data } = await apiClient.patch<PlatformRazorpayGatewayConfig>(
    '/super-admin/razorpay-gateway',
    payload,
  );
  return data;
}

export async function testRazorpayGatewayApi(payload?: {
  keyId?: string;
  keySecret?: string;
}): Promise<PlatformRazorpayGatewayTestResponse> {
  const { data } = await apiClient.post<PlatformRazorpayGatewayTestResponse>(
    '/super-admin/razorpay-gateway/test',
    payload || {},
  );
  return data;
}

export interface ProvisionWorkspacePayload {
  companyName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPassword?: string;
  ownerPhone?: string;
  businessMode?: 'b2b' | 'msme' | 'b2c' | 'hybrid' | 'bpo' | 'education';
  plan?: 'starter' | 'growth' | 'enterprise';
  status?: 'trial' | 'active';
  trialDays?: number;
  city?: string;
  gstin?: string;
  seatLimitOverride?: number | null;
  seedDemoData?: boolean;
  assignedManagerNote?: string;
}

export interface ProvisionWorkspaceResponse {
  tenantId: string;
  accountId: string;
  companyName: string;
  slug: string;
  businessMode: string;
  plan: string;
  status: string;
  trialEndsAt: string;
  city: string;
  gstin: string;
  owner: {
    id: string;
    name: string;
    email: string;
    tempPassword: string;
  };
  seededCounts: {
    pipelines: number;
    leads: number;
    deals: number;
    invoices: number;
  };
  onboardingChecklist: string[];
}

export interface OnboardingFunnelTenantRow {
  tenantId: string;
  accountId: string;
  companyName: string;
  businessMode: string;
  plan: string;
  status: string;
  city: string;
  trialEndsAt: string;
  daysRemaining: number | null;
  isExpired: boolean;
  daysInactive: number;
  usersCount: number;
  leadsCount: number;
  dealsCount: number;
  onboardingScore: number;
  mrrInr: number;
  assignedManagerNote: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  lastActivityAt: string;
  createdAt: string;
}

export interface SuperAdminOnboardingFunnelResponse {
  summary: {
    totalWorkspaces: number;
    trialCount: number;
    expiringSoonCount: number;
    expiredTrialsCount: number;
    activePaidCount: number;
    dormantActiveCount: number;
    totalAtRiskMrrInr: number;
  };
  expiringTrials: OnboardingFunnelTenantRow[];
  dormantWorkspaces: OnboardingFunnelTenantRow[];
  recentProvisioned: OnboardingFunnelTenantRow[];
}

export async function provisionWorkspaceApi(
  payload: ProvisionWorkspacePayload,
): Promise<ProvisionWorkspaceResponse> {
  const { data } = await apiClient.post<ProvisionWorkspaceResponse>(
    '/super-admin/workspaces/provision',
    payload,
  );
  return data;
}

export async function fetchOnboardingFunnelApi(params?: {
  expiringWithinDays?: number;
  dormantDays?: number;
}): Promise<SuperAdminOnboardingFunnelResponse> {
  const { data } = await apiClient.get<SuperAdminOnboardingFunnelResponse>(
    '/super-admin/onboarding/funnel',
    { params },
  );
  return data;
}

export async function executeChurnRescueApi(
  tenantId: string,
  payload: {
    action:
      | 'extend_trial_7d'
      | 'extend_trial_14d'
      | 'activate_promo_growth'
      | 'mark_outreach_sent';
    note?: string;
  },
): Promise<{
  ok: boolean;
  tenantId: string;
  status: string;
  plan: string;
  trialEndsAt: string;
  assignedManagerNote: string;
  summary: string;
}> {
  const { data } = await apiClient.post(
    `/super-admin/onboarding/rescue/${tenantId}`,
    payload,
  );
  return data;
}

export type WatchdogHealthState = 'error' | 'warning' | 'healthy' | 'unconfigured';

export interface WatchdogTenantRow {
  tenantId: string;
  accountId: string;
  companyName: string;
  plan: string;
  city: string;
  overallHealth: 'critical' | 'warning' | 'healthy' | 'idle';
  whatsappCloud: {
    status: WatchdogHealthState;
    enabled: boolean;
    mode: string;
    totalOutbound: number;
    failedOutbound: number;
    failureRatePct: number;
    lastTestedAt: string;
    lastError: string;
  };
  metaCapi: {
    status: WatchdogHealthState;
    enabled: boolean;
    pixelId: string;
    totalEvents: number;
    sentEvents: number;
    simulatedEvents: number;
    failedEvents: number;
    failureRatePct: number;
    lastFiredAt: string;
    lastError: string;
  };
  indiamartPull: {
    status: WatchdogHealthState;
    enabled: boolean;
    hasKey: boolean;
    totalRuns: number;
    successRuns: number;
    errorRuns: number;
    failureRatePct: number;
    lastSyncedAt: string;
    lastError: string;
  };
}

export interface WatchdogFailureItem {
  id: string;
  tenantId: string;
  companyName: string;
  accountId: string;
  connector: 'meta_capi' | 'indiamart_pull' | 'whatsapp_cloud';
  summary: string;
  errorMessage: string;
  occurredAt: string;
}

export interface SuperAdminIntegrationWatchdogResponse {
  summary: {
    totalWorkspaces: number;
    criticalTenants: number;
    warningTenants: number;
    healthyTenants: number;
    totalCapiFailures: number;
    totalIndiaMartErrors: number;
    totalWhatsappFailures: number;
  };
  tenants: WatchdogTenantRow[];
  recentFailures: WatchdogFailureItem[];
}

export interface TenantIntegrationProbeResponse {
  tenantId: string;
  accountId: string;
  companyName: string;
  probes: Array<{
    connector: 'whatsapp_cloud' | 'meta_capi' | 'indiamart_pull';
    status: WatchdogHealthState;
    detail: string;
    checkedAt: string;
  }>;
}

export async function fetchIntegrationsWatchdogApi(): Promise<SuperAdminIntegrationWatchdogResponse> {
  const { data } = await apiClient.get<SuperAdminIntegrationWatchdogResponse>(
    '/super-admin/integrations/watchdog',
  );
  return data;
}

export async function probeTenantIntegrationsApi(
  tenantId: string,
  payload?: {
    connector?: 'whatsapp_cloud' | 'meta_capi' | 'indiamart_pull' | 'all';
    reason?: string;
  },
): Promise<TenantIntegrationProbeResponse> {
  const { data } = await apiClient.post<TenantIntegrationProbeResponse>(
    `/super-admin/integrations/probe/${tenantId}`,
    payload || { connector: 'all' },
  );
  return data;
}

// ─── GSTIN Trust Verification Provider Vault + Telemetry ────────────────────

export interface PlatformGstinProviderConfig {
  enabled: boolean;
  providerName: string;
  apiUrlTemplate: string;
  hasApiKey: boolean;
  apiKeyMask: string;
  source: 'super_admin' | 'env' | 'none';
  isLiveConfigured: boolean;
  lastTestedAt: string;
  lastTestStatus: 'untested' | 'connected' | 'error';
  lastError: string;
  updatedAt: string;
}

export interface GstinCrossTenantTelemetry {
  totalVerified: number;
  avgTrustScore: number;
  safeCreditCount: number;
  advance50Count: number;
  advance100Count: number;
  invalidChecksumCount: number;
  topStates: Array<{ stateName: string; count: number }>;
  recentVerifications: Array<{
    leadId: string;
    leadName: string;
    company: string;
    tenantName: string;
    tenantAccountId: string;
    gstin: string;
    stateName: string;
    entityType: string;
    trustScore: number;
    recommendedTerms: string;
    checksumValid: boolean;
    source: string;
    verifiedAt: string;
  }>;
}

export interface PlatformGstinProviderResponse {
  config: PlatformGstinProviderConfig;
  telemetry: GstinCrossTenantTelemetry;
}

export interface PlatformGstinProviderTestResponse {
  ok: boolean;
  mode: 'live_gstn' | 'offline_checksum_guard';
  checksumValid: boolean;
  sampleGstin: string;
  httpStatus?: number;
  error: string;
  note?: string;
  config: PlatformGstinProviderConfig;
}

export async function fetchGstinProviderApi(): Promise<PlatformGstinProviderResponse> {
  const { data } = await apiClient.get<PlatformGstinProviderResponse>(
    '/super-admin/gstin-provider',
  );
  return data;
}

export async function updateGstinProviderApi(payload: {
  enabled?: boolean;
  providerName?: string;
  apiUrlTemplate?: string;
  apiKey?: string;
  clearApiKey?: boolean;
}): Promise<PlatformGstinProviderResponse> {
  const { data } = await apiClient.patch<PlatformGstinProviderResponse>(
    '/super-admin/gstin-provider',
    payload,
  );
  return data;
}

export async function testGstinProviderApi(payload?: {
  apiUrlTemplate?: string;
  apiKey?: string;
  sampleGstin?: string;
}): Promise<PlatformGstinProviderTestResponse> {
  const { data } = await apiClient.post<PlatformGstinProviderTestResponse>(
    '/super-admin/gstin-provider/test',
    payload || {},
  );
  return data;
}

// ─── Central OpenAI Whisper STT & AI Provider Vault ─────────────────────────

export interface PlatformAiProviderConfig {
  enabled: boolean;
  hasOpenaiKey: boolean;
  openaiKeyMask: string;
  openaiSource: 'super_admin' | 'env' | 'none';
  hasGeminiKey: boolean;
  geminiKeyMask: string;
  geminiSource: 'super_admin' | 'env' | 'none';
  hasClaudeKey: boolean;
  claudeKeyMask: string;
  claudeSource: 'super_admin' | 'env' | 'none';
  whisperReady: boolean;
  anyLiveLlm: boolean;
  source: 'super_admin' | 'env' | 'none';
  aiServiceUrl: string;
  aiServiceReachable: boolean;
  lastTestedAt: string;
  lastTestStatus: 'untested' | 'connected' | 'error';
  lastError: string;
  updatedAt: string;
}

export interface PlatformAiProviderTestResponse {
  ok: boolean;
  results: {
    openai?: { ok: boolean; whisperAvailable?: boolean; detail: string };
    gemini?: { ok: boolean; detail: string };
    claude?: { ok: boolean; detail: string };
  };
  error: string;
  config: PlatformAiProviderConfig;
}

export async function fetchAiProviderApi(): Promise<PlatformAiProviderConfig> {
  const { data } = await apiClient.get<PlatformAiProviderConfig>(
    '/super-admin/ai-provider',
  );
  return data;
}

export async function updateAiProviderApi(payload: {
  enabled?: boolean;
  openaiApiKey?: string;
  geminiApiKey?: string;
  claudeApiKey?: string;
  clearOpenaiKey?: boolean;
  clearGeminiKey?: boolean;
  clearClaudeKey?: boolean;
}): Promise<PlatformAiProviderConfig> {
  const { data } = await apiClient.patch<PlatformAiProviderConfig>(
    '/super-admin/ai-provider',
    payload,
  );
  return data;
}

export async function testAiProviderApi(payload?: {
  openaiApiKey?: string;
  geminiApiKey?: string;
  claudeApiKey?: string;
}): Promise<PlatformAiProviderTestResponse> {
  const { data } = await apiClient.post<PlatformAiProviderTestResponse>(
    '/super-admin/ai-provider/test',
    payload || {},
  );
  return data;
}
