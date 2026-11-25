// ─────────────────────────────────────────────────────
//  LEADSETU SHARED CONTRACTS  (types/contracts.ts)
// ─────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; cursor?: string };
}

export interface LeadActivity {
  id: string;
  type: 'created' | 'status_change' | 'note' | 'call' | 'whatsapp' | 'ai_score';
  description: string;
  authorName: string;
  createdAt: string;
}

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'converted'
  | 'lost';

export type LeadSource =
  | 'whatsapp'
  | 'indiamart'
  | 'justdial'
  | 'tradeindia'
  | 'meta_ads'
  | 'meta_lead_ads'
  | 'google_ads'
  | 'website'
  | 'referral'
  | 'manual';

export interface MetaLeadData {
  leadgenId: string;
  pageId?: string;
  pageName?: string;
  formId?: string;
  formName?: string;
  adId?: string;
  createdTime?: string;
  rawFields?: Record<string, string>;
}

export interface Lead {
  id: string;
  tenantId: string;
  ownerId: string;
  name: string;
  accountKind?: 'business' | 'consumer';
  company?: string;
  phone?: string;
  email?: string;
  city?: string;
  source: LeadSource;
  status: LeadStatus;
  estimatedValue: number;
  aiScore: number;
  aiLabel: 'Hot' | 'Warm' | 'Cold';
  aiInsight?: string;
  aiSummary?: string;
  aiNextAction?: string;
  aiReasons?: string[];
  aiScoredAt?: string;
  tags: string[];
  notes?: string;
  adPlatform?: string;
  ctwaClid?: string;
  adId?: string;
  adHeadline?: string;
  adSourceUrl?: string;
  externalQueryId?: string;
  firstContactedAt?: string;
  speedToLeadSeconds?: number;
  autoWhatsAppWelcomeSent?: boolean;
  metaLeadData?: MetaLeadData;
  customFields?: Record<string, unknown>;
  activities: LeadActivity[];
  createdAt: string;
  updatedAt: string;
}

export interface LeadsStats {
  total: number;
  businessCount?: number;
  consumerCount?: number;
  hotCount: number;
  qualifiedCount: number;
  convertedCount: number;
  metaCtwaCount?: number;
  totalPipelineValue: number;
  avgAiScore: number;
}

export interface LeadsListResponse {
  data: Lead[];
  stats: LeadsStats;
}

export interface CreateLeadPayload {
  name: string;
  accountKind?: 'business' | 'consumer';
  company?: string;
  phone?: string;
  email?: string;
  city?: string;
  source?: LeadSource;
  status?: LeadStatus;
  estimatedValue?: number;
  tags?: string[];
  notes?: string;
  customFields?: Record<string, unknown>;
}

// ─── Deals & Multi-Pipeline ───────────────────────────
export type DealStage = string;

export type PipelineStageCategory = 'open' | 'won' | 'lost';

export interface PipelineStage {
  id: string;
  name: string;
  probability: number;
  color: string;
  category: PipelineStageCategory;
  rottenAfterDays?: number;
  requireNoteOnEnter?: boolean;
}

export interface Pipeline {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  isDefault: boolean;
  stages: PipelineStage[];
  dealCount: number;
  totalValue: number;
  stageCounts: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePipelinePayload {
  name: string;
  description?: string;
  template?:
    | 'b2b_sales'
    | 'msme_sales'
    | 'b2c_orders'
    | 'education_admissions'
    | 'bpo_callbacks'
    | 'dealer_onboarding'
    | 'amc_renewals'
    | 'blank';
  isDefault?: boolean;
  stages?: PipelineStage[];
}

export interface UpdatePipelinePayload {
  name?: string;
  description?: string;
  isDefault?: boolean;
  stages?: PipelineStage[];
  stageMigrations?: Record<string, string>;
}

export interface DealActivity {
  id: string;
  type:
    | 'created'
    | 'stage_change'
    | 'note'
    | 'quote'
    | 'call'
    | 'whatsapp'
    | 'ai_score';
  description: string;
  authorName: string;
  createdAt: string;
}

export interface Deal {
  id: string;
  tenantId: string;
  ownerId: string;
  pipelineId?: string;
  title: string;
  company: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  city: string;
  value: number;
  stage: DealStage;
  stageCategory?: PipelineStageCategory;
  probability: number;
  expectedCloseDate: string;
  source: string;
  gstApplicable: boolean;
  notes: string;
  tags: string[];
  customFields?: Record<string, unknown>;
  aiScore?: number;
  aiLabel?: 'Hot' | 'Warm' | 'Cold';
  aiInsight?: string;
  aiSummary?: string;
  aiNextAction?: string;
  aiReasons?: string[];
  aiScoredAt?: string;
  activities: DealActivity[];
  createdAt: string;
  updatedAt: string;
}

export interface LeadAiAnalysisResponse {
  lead: Lead;
  aiScore: number;
  aiLabel: 'Hot' | 'Warm' | 'Cold';
  aiInsight: string;
  aiSummary: string;
  aiNextAction: string;
  aiReasons: string[];
  aiScoredAt: string;
  provider: string;
  model: string;
}

export interface DealAiAnalysisResponse {
  deal: Deal;
  aiScore: number;
  aiLabel: 'Hot' | 'Warm' | 'Cold';
  aiInsight: string;
  aiSummary: string;
  aiNextAction: string;
  aiReasons: string[];
  aiScoredAt: string;
  provider: string;
  model: string;
}

export interface DealsStats {
  totalDeals: number;
  openCount: number;
  wonCount: number;
  openPipelineValue: number;
  weightedForecast: number;
  wonRevenue: number;
}

export interface CreateDealPayload {
  title: string;
  pipelineId?: string;
  company?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  city?: string;
  value?: number;
  stage?: DealStage;
  probability?: number;
  expectedCloseDate?: string;
  source?: string;
  gstApplicable?: boolean;
  notes?: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
}

// ─── Contacts ─────────────────────────────────────────
export type GstinStatus =
  | 'unverified'
  | 'verified_active'
  | 'invalid_format'
  | 'checksum_failed';

export interface ContactActivity {
  id: string;
  type: 'created' | 'note' | 'call' | 'whatsapp';
  description: string;
  authorName: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  tenantId: string;
  name: string;
  company: string;
  designation: string;
  phone: string;
  email: string;
  city: string;
  gstin: string;
  gstinStatus?: GstinStatus;
  gstinStateName?: string;
  gstinVerifiedAt?: string;
  accountKind?: 'business' | 'consumer';
  type: 'customer' | 'prospect' | 'partner' | 'vendor';
  lifetimeValue: number;
  creditLimitInr?: number;
  creditTermDays?: number;
  creditHold?: boolean;
  creditHoldReason?: string;
  openReceivableInr?: number;
  overdueReceivableInr?: number;
  creditUtilizationPct?: number;
  tags: string[];
  notes: string;
  customFields?: Record<string, unknown>;
  portalToken?: string;
  portalEnabled?: boolean;
  portalLastAccessedAt?: string;
  activities?: ContactActivity[];
  createdAt: string;
  updatedAt: string;
}

// ─── Custom Fields Builder ────────────────────────────
export type CustomFieldEntity = 'lead' | 'contact' | 'deal';
export type CustomFieldType = 'text' | 'number' | 'dropdown' | 'date' | 'checkbox';

export interface CustomFieldDef {
  id: string;
  tenantId: string;
  entity: CustomFieldEntity;
  key: string;
  label: string;
  type: CustomFieldType;
  options: string[];
  required: boolean;
  placeholder: string;
  defaultValue?: string | number | boolean | null;
  showInCard: boolean;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomFieldPayload {
  entity: CustomFieldEntity;
  label: string;
  key?: string;
  type: CustomFieldType;
  options?: string[];
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | number | boolean | null;
  showInCard?: boolean;
}

export interface UpdateCustomFieldPayload {
  label?: string;
  type?: CustomFieldType;
  options?: string[];
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | number | boolean | null;
  showInCard?: boolean;
  isActive?: boolean;
  order?: number;
}

// ─── Smart Lead Routing (Round-Robin, Territory, Load-Balanced) ─
export type RoutingMode = 'round_robin' | 'territory_first' | 'load_balanced';

export interface RepRoutingConfig {
  userId: string;
  eligible: boolean;
  dailyCap: number;
  territories: string[];
}

export interface RepRoutingCandidate extends RepRoutingConfig {
  name: string;
  email: string;
  role: string;
  userCode: string;
  openLeadsCount: number;
  todayAssignedCount: number;
}

export interface TerritoryRoutingRule {
  id: string;
  name: string;
  active: boolean;
  matchCities: string[];
  matchSources: string[];
  minEstimatedValue: number;
  targetUserIds: string[];
  strategy: 'round_robin' | 'load_balanced';
}

export interface RoutingDecisionLog {
  id: string;
  leadId?: string;
  leadName: string;
  source: string;
  city: string;
  estimatedValue: number;
  assignedUserId: string;
  assignedUserName: string;
  strategyUsed: string;
  ruleName?: string;
  assignedAt: string;
}

export interface LeadRoutingConfigResponse {
  id: string;
  tenantId: string;
  enabled: boolean;
  mode: RoutingMode;
  applyToSources: string[];
  applyOnManualCreate: boolean;
  respectDailyCap: boolean;
  defaultDailyCap: number;
  rules: TerritoryRoutingRule[];
  roundRobinCursor: number;
  reps: RepRoutingCandidate[];
  recentLogs: RoutingDecisionLog[];
}

export interface SimulateLeadRoutingResponse {
  assignedUserId: string;
  assignedUserName: string;
  assignedUserEmail: string;
  strategyUsed: RoutingMode | 'fallback_owner';
  ruleName?: string;
  reason: string;
}

// ─── Tasks ────────────────────────────────────────────
export interface Task {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'done';
  category: 'call' | 'whatsapp' | 'meeting' | 'quote' | 'followup';
  dueDate: string;
  relatedName: string;
  relatedCompany: string;
  relatedPhone: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Unified Inbox & WhatsApp Templates ───────────────
export type LinkedCrmEntityType = '' | 'lead' | 'contact' | 'deal' | 'ticket';

export type WhatsAppTemplateCategory =
  | 'greeting'
  | 'quotation'
  | 'followup'
  | 'payment'
  | 'support'
  | 'custom';

export type WhatsAppTemplateLanguage = 'English' | 'Hinglish' | 'Hindi';

export interface WhatsAppVariableMeta {
  key: string;
  token: string;
  label: string;
  example: string;
}

export interface WhatsAppTemplate {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  category: WhatsAppTemplateCategory;
  language: WhatsAppTemplateLanguage;
  body: string;
  variables: string[];
  usageCount: number;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InboxLinkableEntity {
  id: string;
  type: 'lead' | 'contact' | 'deal' | 'ticket';
  label: string;
  sublabel: string;
  contactName: string;
  company: string;
  phone: string;
  city: string;
  estimatedValue: number;
}

export interface InboxCrmEntitiesResponse {
  leads: InboxLinkableEntity[];
  contacts: InboxLinkableEntity[];
  deals: InboxLinkableEntity[];
  tickets: InboxLinkableEntity[];
}

export interface ChatAttachment {
  type: 'document' | 'image';
  url: string;
  filename?: string;
  mimeType?: string;
}

export interface WhatsAppCloudConfig {
  enabled: boolean;
  configured: boolean;
  connectionMode?: 'not_connected' | 'own_embedded' | 'leadsetu_managed' | 'manual';
  embeddedSignupAvailable?: boolean;
  metaAppId?: string;
  embeddedSignupConfigId?: string;
  managedAvailable?: boolean;
  managedDisplayNumber?: string;
  managedDisplayName?: string;
  phoneNumberId: string;
  wabaId: string;
  businessDisplayName: string;
  verifiedPhoneNumber: string;
  hasAccessToken: boolean;
  accessTokenMask: string;
  hasAppSecret: boolean;
  appSecretMask: string;
  verifyToken: string;
  webhookPath: string;
  lastTestedAt: string;
  lastTestStatus: 'untested' | 'connected' | 'error';
  lastError: string;
  updatedAt: string;
}

export interface PlatformWhatsAppProviderConfig {
  metaAppId: string;
  hasMetaAppSecret: boolean;
  metaAppSecretMask: string;
  embeddedSignupConfigId: string;
  embeddedSignupReady: boolean;
  webhookPath: string;
  webhookVerifyToken: string;
  managedSenderEnabled: boolean;
  managedPhoneNumberId: string;
  managedWabaId: string;
  hasManagedAccessToken: boolean;
  managedAccessTokenMask: string;
  managedGatewayReady: boolean;
  managedDisplayNumber: string;
  managedDisplayName: string;
  managedLastTestedAt: string;
  managedLastTestStatus: 'untested' | 'connected' | 'error';
  managedLastError: string;
  updatedAt: string;
}

export interface PlatformWhatsAppProviderTestResponse {
  ok: boolean;
  verifiedPhoneNumber: string;
  businessDisplayName: string;
  qualityRating: string;
  error: string;
  config: PlatformWhatsAppProviderConfig;
}

export interface WhatsAppCloudTestResponse {
  ok: boolean;
  verifiedPhoneNumber: string;
  businessDisplayName: string;
  qualityRating: string;
  error: string;
  config: WhatsAppCloudConfig;
}

export interface MetaApprovedTemplate {
  id: string;
  name: string;
  status: string;
  category: string;
  language: string;
  bodyText: string;
  parameterCount: number;
}

export interface Message {
  id: string;
  direction: 'inbound' | 'outbound';
  content: string;
  senderName: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  isAiDrafted?: boolean;
  templateId?: string;
  templateName?: string;
  via?: 'inbox' | 'wa_me';
  externalMessageId?: string;
  deliveryProvider?: 'meta_cloud' | 'crm_local' | 'wa_me';
  deliveryError?: string;
  metaTemplateName?: string;
  attachment?: ChatAttachment;
  statusUpdatedAt?: string;
  createdAt: string;
}

export interface AiSalesAgentPolicy {
  mode: 'autopilot' | 'draft_only' | 'off';
  language: 'auto' | 'hinglish' | 'english' | 'hindi';
  maxDiscountPct: number;
  handoffScoreThreshold: number;
  autoSendCatalogPricing: boolean;
  autoUpdateLeadFields: boolean;
  autoShareBookingLink?: boolean;
  businessHoursOnly: boolean;
  escalationKeywords: string[];
}

export interface AiQualifiedData {
  productName?: string;
  sku?: string;
  hsnSac?: string;
  moq?: number;
  quotedUnitPrice?: number;
  gstRate?: number;
  quantity?: number;
  city?: string;
  gstin?: string;
  estimatedTotal?: number;
  requestedDiscountPct?: number;
  matchedKbTitles?: string[];
  bookingLinkShared?: string;
}

export interface AiActionLogItem {
  id: string;
  action: string;
  detail: string;
  replySent?: string;
  mode: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  tenantId: string;
  contactName: string;
  company: string;
  phone: string;
  city: string;
  channel: 'whatsapp' | 'indiamart' | 'email';
  status: 'open' | 'resolved';
  aiScore: number;
  estimatedValue: number;
  aiSummary: string;
  aiSuggestedReply: string;
  aiAutopilotPaused?: boolean;
  aiHandoffReason?: string;
  aiHandedOffAt?: string;
  aiQualifiedData?: AiQualifiedData;
  aiActionLogs?: AiActionLogItem[];
  linkedEntityType?: LinkedCrmEntityType;
  linkedEntityId?: string;
  linkedEntityLabel?: string;
  adPlatform?: string;
  ctwaClid?: string;
  adId?: string;
  adHeadline?: string;
  adSourceUrl?: string;
  unreadCount?: number;
  lastInboundAt?: string;
  lastMessage: string;
  lastMessageAt: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface APIError {
  error: string;
  code: string;
  message: string;
  correlationId: string;
}

export interface AuthUser {
  id: string;
  /** Unique 10-digit numeric user ID */
  userCode?: string;
  tenantId: string;
  name: string;
  email: string;
  phone?: string;
  role: 'super_admin' | 'owner' | 'admin' | 'manager' | 'agent';
  departmentPreset?: string;
  permissions?: string[];
  featureAccess?: Partial<Record<UserFeatureKey, boolean>>;
  territory?: string;
  monthlyTarget?: number;
  inviteStatus?: 'active' | 'pending' | 'accepted';
  lastLoginAt?: string | null;
  createdAt?: string | null;
  maskPhones?: boolean;
  isImpersonation?: boolean;
  impersonatorEmail?: string;
  twoFactorEnabled?: boolean;
  authProvider?: 'local' | 'google';
}

export type WorkspaceBusinessMode =
  | 'b2b'
  | 'msme'
  | 'b2c'
  | 'hybrid'
  | 'bpo'
  | 'education';

export type ContactAccountKind = 'business' | 'consumer';

export interface TenantInfo {
  id: string;
  /** Unique 5-digit workspace / admin account ID */
  accountId?: string;
  name: string;
  companyName?: string;
  logoUrl?: string;
  slug: string;
  plan: 'starter' | 'growth' | 'enterprise';
  status: 'trial' | 'active' | 'suspended';
  businessMode?: WorkspaceBusinessMode;
  hiddenNavModules?: string[];
  city?: string;
  gstin?: string;
  state?: string;
  phone?: string;
  email?: string;
  address?: string;
  maskPhoneForAgents?: boolean;
  blockAgentExport?: boolean;
  subscriptionInvoices?: SubscriptionInvoice[];
  effectiveFeatures?: Partial<Record<PlatformFeatureKey, boolean>>;
  effectiveFeatureDetails?: Partial<
    Record<
      PlatformFeatureKey,
      { enabled: boolean; source: 'plan' | 'override_on' | 'override_off' | 'kill_switch' }
    >
  >;
  globalKillSwitches?: GlobalKillSwitches;
  maintenanceMode?: boolean;
  sessionTtlHours?: number;
  quotas?: {
    maxMonthlyAiCalls: number;
    maxMonthlyWhatsapp: number;
    aiCallsUsed: number;
    whatsappUsed: number;
    maxStorageMb: number;
    aiPct: number;
    waPct: number;
    aiWarning: boolean;
    waWarning: boolean;
    aiExceeded: boolean;
    waExceeded: boolean;
  };
}

export interface SubscriptionInvoice {
  id: string;
  invoiceNumber: string;
  plan: 'starter' | 'growth' | 'enterprise';
  planName: string;
  billingCycle: 'monthly' | 'annual';
  seatsIncluded: number;
  baseAmount: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  status: 'paid' | 'trial_complimentary' | 'complimentary_grant' | 'refunded' | 'voided';
  discountAmount?: number;
  proratedCreditAmount?: number;
  couponCode?: string;
  partnerCode?: string;
  tdsDeducted?: number;
  refundReason?: string;
  refundedAt?: string;
  issuedByEmail?: string;
  paymentMode: string;
  paymentReference: string;
  issuedAt: string;
  periodStart: string;
  periodEnd: string;
  sacCode: string;
  greetingNote: string;
  buyerCompany: string;
  buyerGstin: string;
  buyerState: string;
  buyerAddress: string;
  buyerEmail: string;
  sellerCompany: string;
  sellerGstin: string;
  sellerAddress: string;
  sellerEmail: string;
}

export interface SubscriptionPlanSpec {
  id: 'starter' | 'growth' | 'enterprise';
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  seatLimit: number;
  highlights: string[];
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
  tenant: TenantInfo;
}

export interface TwoFactorChallengeResponse {
  requiresTwoFactor: true;
  challengeToken: string;
  maskedEmail: string;
  message: string;
}

export type LoginResult = AuthResponse | TwoFactorChallengeResponse;

export interface TwoFactorStatusResponse {
  enabled: boolean;
  backupCodesRemaining: number;
}

export interface TwoFactorSetupResponse {
  secret: string;
  otpauthUri: string;
  qrDataUrl: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone?: string;
  password: string;
  companyName?: string;
  logoUrl?: string;
  city?: string;
  businessMode?: WorkspaceBusinessMode;
}

// ─── GST Invoices & Quotations ────────────────────────
export interface InvoiceLineItem {
  description: string;
  hsnSac: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export type InvoiceDocType = 'tax_invoice' | 'proforma_quote';
export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'partial'
  | 'paid'
  | 'overdue'
  | 'cancelled';
export type InvoiceTaxType = 'cgst_sgst' | 'igst';
export type InvoicePaymentMethod = 'razorpay' | 'upi' | 'neft_rtgs' | 'unpaid';
export type InvoicePaymentMode =
  | 'UPI'
  | 'NEFT'
  | 'RTGS'
  | 'Cheque'
  | 'Razorpay'
  | 'Cash';

export interface InvoicePaymentRecord {
  id: string;
  amountPaid: number;
  tdsDeducted: number;
  totalSettled: number;
  paymentMode: InvoicePaymentMode;
  utrOrChequeNo: string;
  paymentDate: string;
  note: string;
  recordedAt: string;
}

export interface RecordInvoicePaymentPayload {
  amountPaid: number;
  tdsDeducted?: number;
  paymentMode: InvoicePaymentMode;
  utrOrChequeNo?: string;
  paymentDate?: string;
  note?: string;
}

export interface Invoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  docType: InvoiceDocType;
  clientName: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstin: string;
  placeOfSupply: string;
  taxType: InvoiceTaxType;
  gstRate: number;
  items: InvoiceLineItem[];
  subTotal: number;
  discount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  gstAmount: number;
  grandTotal: number;
  amountPaid?: number;
  tdsDeducted?: number;
  totalSettled?: number;
  balanceDue?: number;
  payments?: InvoicePaymentRecord[];
  status: InvoiceStatus;
  paymentMethod: InvoicePaymentMethod;
  paymentLink: string;
  dueDate: string;
  notes: string;
  linkedDealId?: string;
  linkedLeadId?: string;
  publicToken?: string;
  quoteApprovalStatus?: 'pending' | 'approved' | 'changes_requested';
  approvedByName?: string;
  approvedAt?: string;
  convertedFromQuoteId?: string;
  convertedToInvoiceId?: string;
  chaserStage?: 'none' | 'day_3_polite' | 'day_7_firm' | 'day_15_urgent' | 'day_30_hold';
  lastChaserSentAt?: string;
  chaserCount?: number;
  chaserHistory?: {
    id: string;
    stage: string;
    channel: string;
    message: string;
    upiLink: string;
    sentBy: string;
    sentAt: string;
  }[];
  promisedPaymentDate?: string;
  promisedAmount?: number;
  ptpNote?: string;
  ptpUpdatedAt?: string;
  isPtpBroken?: boolean;
  creditOverrideBy?: string;
  creditOverrideReason?: string;
  upiPaymentUri?: string;
  upiQrDataUrl?: string;
  dispatchCourier?: string;
  dispatchAwbNumber?: string;
  dispatchTrackingUrl?: string;
  dispatchStatus?: 'pending' | 'packed' | 'in_transit' | 'out_for_delivery' | 'delivered';
  dispatchedAt?: string;
  dispatchNotes?: string;
  dispatchNotifiedAt?: string;
  daysOverdue?: number;
  agingBucket?: 'paid' | 'current' | '1_15_days' | '16_30_days' | '30_plus_days';
  createdAt: string;
  updatedAt: string;
}

export interface PublicQuoteView {
  id: string;
  invoiceNumber: string;
  docType: InvoiceDocType;
  clientName: string;
  contactPerson: string;
  gstin: string;
  placeOfSupply: string;
  taxType: InvoiceTaxType;
  gstRate: number;
  items: InvoiceLineItem[];
  subTotal: number;
  discount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  gstAmount: number;
  grandTotal: number;
  amountPaid?: number;
  tdsDeducted?: number;
  totalSettled?: number;
  balanceDue?: number;
  payments?: InvoicePaymentRecord[];
  status: InvoiceStatus;
  daysOverdue?: number;
  paymentLink: string;
  dueDate: string;
  notes: string;
  publicToken: string;
  quoteApprovalStatus: 'pending' | 'approved' | 'changes_requested';
  approvedByName: string;
  approvedAt: string;
  convertedToInvoiceId: string;
  sellerName: string;
  sellerCity: string;
  createdAt: string;
}

export interface InvoiceAgingStats {
  currentAmount: number;
  bucket1to15: number;
  bucket16to30: number;
  bucket30Plus: number;
}

export interface InvoiceStats {
  totalCount: number;
  paidCount: number;
  partialCount?: number;
  pendingCount: number;
  overdueCount: number;
  totalInvoiced: number;
  totalCollected?: number;
  totalTdsDeducted?: number;
  paidRevenue: number;
  pendingAmount: number;
  totalGstCollected: number;
  aging?: InvoiceAgingStats;
}

export interface Gstr1ExportResponse {
  filename: string;
  section?: 'all' | 'b2b' | 'b2c' | 'hsn';
  month?: string;
  rowCount: number;
  csv: string;
}

export interface TallyXmlExportResponse {
  filename: string;
  month?: string;
  ledgerMasterCount?: number;
  voucherCount: number;
  salesVoucherCount?: number;
  receiptVoucherCount?: number;
  xml: string;
}

export interface Gstr1ComplianceIssue {
  severity: 'error' | 'warning' | 'info';
  code: string;
  invoiceId?: string;
  invoiceNumber?: string;
  clientName?: string;
  amount?: number;
  message: string;
  recommendation: string;
}

export interface Gstr1B2bRow {
  id: string;
  invoiceNumber: string;
  date: string;
  clientName: string;
  gstin: string;
  placeOfSupply: string;
  posStateCode: string;
  taxType: 'cgst_sgst' | 'igst';
  gstRate: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  gstAmount: number;
  grandTotal: number;
  status: string;
  ewayRequired: boolean;
}

export interface Gstr1B2cRow {
  bucket: 'B2CL' | 'B2CS';
  placeOfSupply: string;
  posStateCode: string;
  taxType: 'cgst_sgst' | 'igst';
  gstRate: number;
  invoiceCount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  grandTotal: number;
}

export interface Gstr1HsnRow {
  hsnSac: string;
  gstRate: number;
  descriptions: string[];
  totalQuantity: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalValue: number;
}

export interface Gstr1ComplianceOverviewResponse {
  period: {
    month: string;
    filingPeriodCode: string;
    label: string;
  };
  seller: {
    companyName: string;
    gstin: string;
    state: string;
    stateCode: string;
    address: string;
    isSellerGstinValid: boolean;
  };
  summary: {
    totalTaxInvoices: number;
    cancelledCount: number;
    proformaExcludedCount: number;
    b2bCount: number;
    b2bTaxable: number;
    b2bTax: number;
    b2cCount: number;
    b2cTaxable: number;
    b2cTax: number;
    hsnCount: number;
    ewayRequiredCount: number;
    issuesCount: number;
    complianceScorePct: number;
  };
  b2bInvoices: Gstr1B2bRow[];
  b2cSummary: Gstr1B2cRow[];
  hsnSummary: Gstr1HsnRow[];
  complianceIssues: Gstr1ComplianceIssue[];
  portalJson: Record<string, unknown>;
}

export interface CreditRecoveryConfig {
  upiId: string;
  merchantName: string;
  autoChasersEnabled: boolean;
  autoHoldAfterDays: number;
  bankAccountNote: string;
}

export interface CreditRiskLedgerRow {
  contactId: string;
  buyerName: string;
  contactPerson: string;
  phone: string;
  gstin: string;
  gstinStatus: string;
  creditLimitInr: number;
  creditTermDays: number;
  creditHold: boolean;
  creditHoldReason: string;
  openBalanceInr: number;
  overdueBalanceInr: number;
  maxOverdueDays: number;
  openInvoicesCount: number;
  utilizationPct: number;
  riskLevel: 'hold' | 'critical' | 'warning' | 'healthy';
}

export interface CreditRecoveryOverviewResponse {
  kpis: {
    totalOpenUdhaar: number;
    overdueUdhaar: number;
    overdueCount: number;
    brokenPromisesCount: number;
    activePromisesCount: number;
    blockedAccountsCount: number;
    recoveryRatePct: number;
  };
  recoveryConfig: CreditRecoveryConfig;
  creditRiskLedger: CreditRiskLedgerRow[];
  overdueQueue: (Invoice & { upiLink?: string })[];
  promisesQueue: Invoice[];
}

export interface BankStatementPreviewMatch {
  entryId: string;
  date: string;
  narration: string;
  utrOrRef: string;
  creditAmount: number;
  paymentMode: 'UPI' | 'RTGS' | 'NEFT';
  confidence: 'high' | 'medium' | 'unmatched';
  matchedInvoiceId: string;
  matchedInvoiceNumber: string;
  matchedClientName: string;
  openBalanceDue: number;
  suggestedTds: number;
  matchReasons: string[];
}

export interface CreateInvoicePayload {
  invoiceNumber?: string;
  docType?: InvoiceDocType;
  clientName: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  placeOfSupply?: string;
  taxType?: InvoiceTaxType;
  gstRate?: number;
  items: {
    description: string;
    hsnSac?: string;
    quantity: number;
    unitPrice: number;
  }[];
  discount?: number;
  status?: InvoiceStatus;
  paymentMethod?: InvoicePaymentMethod;
  dueDate?: string;
  notes?: string;
  linkedDealId?: string;
  linkedLeadId?: string;
  overrideCreditHold?: boolean;
  overrideReason?: string;
}

// ─── WhatsApp Broadcast Campaigns ─────────────────────
export type CampaignSegment =
  | 'all_leads'
  | 'hot_leads'
  | 'noida_delhi_ncr'
  | 'indiamart_buyers'
  | 'gst_customers'
  | 'b2b_accounts'
  | 'b2c_consumers'
  | 'delivered_customers';

export type CampaignStatus = 'completed' | 'running' | 'scheduled' | 'draft';

export interface CampaignSegmentFilters {
  accountKind?: 'all' | 'business' | 'consumer';
  city?: string;
  leadStatus?: string;
  minAiScore?: number;
  excludeDnd?: boolean;
}

export interface CampaignRecipientEntry {
  recipientId: string;
  entityType: 'lead' | 'contact';
  contactName: string;
  company: string;
  phone: string;
  status: 'sent' | 'delivered' | 'read' | 'replied' | 'failed' | 'opted_out';
  deliveryProvider: 'meta_cloud' | 'crm_local' | 'skipped_dnd';
  externalMessageId: string;
  conversationId: string;
  messageId: string;
  renderedMessage: string;
  error: string;
  replyPreview: string;
  sentAt: string;
  deliveredAt: string;
  readAt: string;
  repliedAt: string;
}

export interface Campaign {
  id: string;
  tenantId: string;
  name: string;
  templateName: string;
  sendMode?: 'text' | 'meta_template';
  language: 'hinglish' | 'english' | 'hindi';
  channel: 'whatsapp_cloud' | 'whatsapp_ai_drip';
  targetSegment: CampaignSegment;
  segmentFilters?: CampaignSegmentFilters;
  parentCampaignId?: string;
  messageBody: string;
  ctaLabel: string;
  audienceCount: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  repliedCount: number;
  failedCount?: number;
  skippedDndCount?: number;
  qualifiedLeadsCount?: number;
  closedDealsCount?: number;
  recipients?: CampaignRecipientEntry[];
  deliveryRate: number;
  readRate: number;
  replyRate: number;
  attributedRevenue: number;
  status: CampaignStatus;
  scheduledFor: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignStats {
  totalCampaigns: number;
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  totalReplies: number;
  totalQualifiedLeads?: number;
  totalClosedDeals?: number;
  avgDeliveryRate: number;
  avgReadRate: number;
  totalAttributedRevenue: number;
  segmentCounts?: Record<string, unknown>;
}

export interface CreateCampaignPayload {
  name: string;
  templateName?: string;
  sendMode?: 'text' | 'meta_template';
  language?: 'hinglish' | 'english' | 'hindi';
  channel?: 'whatsapp_cloud' | 'whatsapp_ai_drip';
  targetSegment?: CampaignSegment;
  segmentFilters?: CampaignSegmentFilters;
  parentCampaignId?: string;
  messageBody: string;
  ctaLabel?: string;
  audienceCount?: number;
  status?: CampaignStatus;
  scheduledFor?: string;
  attributedRevenue?: number;
}

// ─── AI Workflows & Automation ────────────────────────
export type WorkflowTriggerType =
  | 'lead.created'
  | 'lead.hot_scored'
  | 'lead.stale_followup'
  | 'deal.stage_changed'
  | 'invoice.overdue'
  | 'whatsapp.inbound';

export type WorkflowActionType =
  | 'send_whatsapp_create_task'
  | 'assign_senior_closer'
  | 'generate_gst_invoice'
  | 'send_payment_reminder'
  | 'reassign_rep_sla_alert'
  | 'multi_step_whatsapp_drip';

export type WorkflowNodeKind = 'trigger' | 'condition' | 'delay' | 'action';
export type WorkflowDelayUnit = 'minutes' | 'hours' | 'days';
export type WorkflowConditionGuard =
  | 'always'
  | 'if_uncontacted'
  | 'if_no_whatsapp_reply'
  | 'if_ai_score_gte'
  | 'if_deal_value_gte'
  | 'if_source_matches'
  | 'if_city_matches';

export type WorkflowNodeActionKind =
  | 'send_whatsapp'
  | 'reassign_rep'
  | 'create_sla_alert'
  | 'create_task'
  | 'generate_gst_invoice'
  | 'send_payment_reminder';

export interface WorkflowStepNode {
  id: string;
  kind: WorkflowNodeKind;
  title: string;
  subtitle?: string;
  delayValue?: number;
  delayUnit?: WorkflowDelayUnit;
  conditionGuard?: WorkflowConditionGuard;
  conditionValue?: string;
  actionKind?: WorkflowNodeActionKind;
  whatsappTemplateBody?: string;
  language?: 'hinglish' | 'english' | 'hindi';
  reassignStrategy?: 'round_robin_backup' | 'senior_closer' | 'territory_owner';
  slaPriority?: 'high' | 'urgent';
  taskOrAlertTitle?: string;
  stopOnBuyerReply?: boolean;
}

export interface WorkflowLogEntry {
  id: string;
  summary: string;
  status: 'success' | 'skipped';
  executedAt: string;
}

export interface WorkflowEnrollmentStepLog {
  nodeId: string;
  kind: WorkflowNodeKind;
  title: string;
  status: 'success' | 'skipped' | 'stopped' | 'scheduled';
  detail: string;
  executedAt: string;
}

export interface WorkflowEnrollmentItem {
  id: string;
  workflowId: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  leadSource: string;
  currentStepIndex: number;
  status: 'active' | 'completed' | 'stopped_on_reply' | 'skipped';
  nextRunAt: string;
  stopReason: string;
  stepLogs: WorkflowEnrollmentStepLog[];
}

export interface WorkflowRule {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  triggerType: WorkflowTriggerType;
  sourceFilter?: string;
  staleStage?: string;
  staleHours?: number;
  staleMinutes?: number;
  whatsappTemplateBody?: string;
  conditionSummary: string;
  actionType: WorkflowActionType;
  actionSummary: string;
  nodes?: WorkflowStepNode[];
  stopOnReply?: boolean;
  active: boolean;
  runsCount: number;
  hoursSaved: number;
  activeEnrollmentsCount?: number;
  completedEnrollmentsCount?: number;
  stoppedOnReplyCount?: number;
  lastRunAt: string;
  executionLogs: WorkflowLogEntry[];
  createdAt: string;
}

export interface WorkflowStats {
  totalWorkflows: number;
  activeWorkflows: number;
  pausedWorkflows: number;
  totalRuns: number;
  totalHoursSaved: number;
  activeEnrollments?: number;
}

export interface CreateWorkflowPayload {
  name: string;
  description?: string;
  triggerType?: WorkflowTriggerType;
  sourceFilter?: string;
  staleStage?: string;
  staleHours?: number;
  staleMinutes?: number;
  whatsappTemplateBody?: string;
  conditionSummary: string;
  actionType?: WorkflowActionType;
  actionSummary: string;
  nodes?: WorkflowStepNode[];
  stopOnReply?: boolean;
  active?: boolean;
}




export type UserFeatureKey =
  | 'leads'
  | 'aiScoring'
  | 'contacts'
  | 'deals'
  | 'whatsappCloud'
  | 'whatsappBroadcasts'
  | 'tasks'
  | 'slaTickets'
  | 'aiWorkflows'
  | 'analytics'
  | 'products'
  | 'gstBilling'
  | 'documentVault'
  | 'aiCreditRisk'
  | 'aiVoiceCrm'
  | 'aiDealerDesk'
  | 'aiCopilot';

export interface InviteInfoResponse {
  valid: boolean;
  name: string;
  email: string;
  phone: string;
  userCode: string;
  role: string;
  territory: string;
  inviteStatus: 'active' | 'pending' | 'accepted';
  workspaceName: string;
  companyName?: string;
  logoUrl?: string;
  invitedByDisplay?: string;
  accountId: string;
  featureAccess: Record<UserFeatureKey, boolean>;
}

// ─── Team & Role-Based Access ─────────────────────────
export type TeamRole = 'owner' | 'admin' | 'manager' | 'agent';
export type AssignableTeamRole = Exclude<TeamRole, 'owner'>;

export interface TeamMemberPerformance {
  leadsCount: number;
  hotLeads: number;
  convertedLeads: number;
  openPipeline: number;
  wonDeals: number;
  wonRevenue: number;
  targetAchievedPct: number;
}

export interface TeamMember {
  id: string;
  /** Unique 10-digit numeric user ID */
  userCode: string;
  name: string;
  email: string;
  phone: string;
  role: TeamRole;
  isActive: boolean;
  territory: string;
  monthlyTarget: number;
  maskPhones?: boolean;
  aiDailyCallLimit?: number;
  aiCallsToday?: number;
  featureAccess?: Record<UserFeatureKey, boolean>;
  inviteStatus?: 'active' | 'pending' | 'accepted';
  inviteSentAt?: string | null;
  invitedBy: string | null;
  lastLoginAt: string | null;
  createdAt: string | null;
  performance: TeamMemberPerformance;
}

export interface TeamAccountInfo {
  /** Unique 5-digit workspace account ID */
  accountId: string;
  name: string;
  companyName?: string;
  logoUrl?: string;
  plan: string;
  status: string;
  city: string;
  maskPhoneForAgents?: boolean;
  blockAgentExport?: boolean;
  ownerName: string;
  ownerEmail: string;
  workspaceFeatures?: Record<string, boolean>;
}

export interface TeamViewer {
  id: string;
  role: TeamRole;
  canManageTeam: boolean;
  canManageAdmins: boolean;
}

export interface TeamStats {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  owners: number;
  admins: number;
  managers: number;
  agents: number;
  totalMonthlyTarget: number;
  totalWonRevenue: number;
}

export interface TeamListResponse {
  account: TeamAccountInfo;
  viewer: TeamViewer;
  data: TeamMember[];
  stats: TeamStats;
}

export interface MemberCredentials {
  accountId: string;
  companyName?: string;
  organizationName?: string;
  userCode: string;
  loginEmail: string;
  /** Only present when the server generated it — shown once, never retrievable again */
  temporaryPassword: string | null;
  inviteUrl?: string;
  emailSent?: boolean;
  emailProvider?: string;
  emailSubject?: string;
  emailPreview?: string;
}

export interface AddTeamMemberPayload {
  name: string;
  email: string;
  phone: string;
  role?: AssignableTeamRole;
  territory?: string;
  monthlyTarget?: number;
  password?: string;
  featureAccess?: Record<string, boolean>;
  sendInviteEmail?: boolean;
  aiDailyCallLimit?: number;
}

export interface UpdateTeamMemberPayload {
  name?: string;
  phone?: string;
  role?: AssignableTeamRole;
  territory?: string;
  monthlyTarget?: number;
  maskPhones?: boolean;
  featureAccess?: Record<string, boolean>;
  aiDailyCallLimit?: number;
}

// ─── Security, Phone Masking & Audit Trail ───────────
export type AuditEntityType =
  | 'security'
  | 'team'
  | 'lead'
  | 'deal'
  | 'contact'
  | 'invoice'
  | 'ticket';

export interface SecuritySettings {
  accountId: string;
  workspaceName: string;
  maskPhoneForAgents: boolean;
  blockAgentExport: boolean;
  viewerMasked: boolean;
  canEditSecurity: boolean;
}

export interface AuditLogEntry {
  id: string;
  tenantId: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  actorUserCode: string;
  actorRole: string;
  action: string;
  entityType: AuditEntityType;
  entityId: string;
  entityLabel: string;
  resourceType?: string;
  resourceId?: string;
  summary: string;
  severity?: 'info' | 'warning' | 'critical';
  visibility?: 'tenant' | 'platform';
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AuditListResponse {
  security: SecuritySettings;
  data: AuditLogEntry[];
  stats: {
    total: number;
    securityEvents: number;
    teamEvents: number;
    revenueEvents: number;
  };
}

// ─── Support & SLA Tickets ───────────────────────────
export type TicketCategory =
  | 'dispatch_delay'
  | 'warranty'
  | 'gst_correction'
  | 'installation'
  | 'amc_service'
  | 'general';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus =
  | 'open'
  | 'in_progress'
  | 'waiting_client'
  | 'resolved'
  | 'closed';

export interface TicketComment {
  id: string;
  authorName: string;
  authorRole: 'agent' | 'engineer' | 'customer' | 'system';
  message: string;
  isInternal: boolean;
  createdAt: string;
}

export interface Ticket {
  id: string;
  tenantId: string;
  ownerId: string;
  ticketNumber: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  customerName: string;
  company: string;
  phone: string;
  email?: string;
  siteAddress?: string;
  linkedContactId?: string;
  linkedInvoiceNumber: string;
  productSerialOrSku?: string;
  assignedToName?: string;
  assignedToPhone?: string;
  slaDueAt: string;
  isSlaBreached: boolean;
  slaRemainingHours?: number;
  resolvedAt?: string;
  resolutionSummary?: string;
  csatRating?: number;
  notes: string;
  comments?: TicketComment[];
  createdAt: string;
  updatedAt: string;
}

export interface TicketsListResponse {
  data: Ticket[];
  stats: {
    total: number;
    openCount: number;
    inProgressCount?: number;
    waitingClientCount?: number;
    urgentCount: number;
    resolvedCount: number;
    slaBreachedCount: number;
    avgCsat?: number;
  };
}

export interface CreateTicketPayload {
  subject: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  status?: TicketStatus;
  customerName?: string;
  company?: string;
  phone?: string;
  email?: string;
  siteAddress?: string;
  linkedContactId?: string;
  linkedInvoiceNumber?: string;
  productSerialOrSku?: string;
  assignedToName?: string;
  assignedToPhone?: string;
  slaDueAt?: string;
  resolutionSummary?: string;
  csatRating?: number;
  notes?: string;
}

export interface AddTicketCommentPayload {
  message: string;
  isInternal?: boolean;
  authorRole?: 'agent' | 'engineer' | 'customer' | 'system';
  authorName?: string;
  nextStatus?: TicketStatus;
  resolutionSummary?: string;
}

// ─── Global Ctrl+K Command Search & Notifications ─────
export type GlobalSearchEntityType =
  | 'lead'
  | 'contact'
  | 'deal'
  | 'invoice'
  | 'task'
  | 'ticket'
  | 'document';

export interface GlobalSearchItem {
  id: string;
  entityId: string;
  type: GlobalSearchEntityType;
  title: string;
  subtitle: string;
  badge: string;
  href: string;
}

export interface GlobalSearchResponse {
  query: string;
  total: number;
  items: GlobalSearchItem[];
}

export interface NotificationItem {
  id: string;
  category: 'lead' | 'invoice' | 'task' | 'inbox' | 'ticket';
  severity: 'urgent' | 'high' | 'medium' | 'info';
  title: string;
  subtitle: string;
  href: string;
  createdAt: string;
}

export interface NotificationsResponse {
  totalCount: number;
  items: NotificationItem[];
}

// ─── Product & HSN/SAC Catalog ────────────────────────
export type ProductUnit =
  | 'pcs'
  | 'box'
  | 'set'
  | 'kg'
  | 'mtr'
  | 'service'
  | 'license';

export interface Product {
  id: string;
  tenantId: string;
  sku: string;
  name: string;
  category: string;
  hsnSac: string;
  unit: ProductUnit;
  unitPrice: number;
  gstRate: number;
  moq: number;
  description: string;
  brochureUrl: string;
  inStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductStats {
  totalSkus: number;
  inStockCount: number;
  categoriesCount: number;
  avgUnitValue: number;
}

export interface ProductsListResponse {
  data: Product[];
  categories: string[];
  stats: ProductStats;
}

export interface CreateProductPayload {
  sku?: string;
  name: string;
  category?: string;
  hsnSac?: string;
  unit?: ProductUnit;
  unitPrice: number;
  gstRate?: number;
  moq?: number;
  description?: string;
  brochureUrl?: string;
  inStock?: boolean;
}

// ─── CSV Bulk Import & Webhook Capture ────────────────
export interface BulkImportLeadsResponse {
  importedCount: number;
  duplicateUpdatedCount: number;
  skippedCount: number;
  totalProcessed: number;
  data: Lead[];
}

export interface WebhookConfigResponse {
  webhookKey: string;
  webhookPath: string;
  roundRobinIndex: number;
  recentWebhookLeads: Lead[];
}

export interface WebhookCaptureResponse {
  status: 'created' | 'deduplicated';
  assignedRepName: string;
  lead: Lead;
}

// ─── Document Center & Compliance Vault ───────────────
export type DocumentCategory =
  | 'gst_certificate'
  | 'company_profile'
  | 'brochure'
  | 'contract'
  | 'customer_document';

export interface CrmDocument {
  id: string;
  tenantId: string;
  docCode: string;
  title: string;
  category: DocumentCategory;
  description: string;
  documentNumber: string;
  linkedCustomerName: string;
  linkedContactId: string;
  issueDate: string;
  expiryDate: string;
  tags: string[];
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  hasFileData: boolean;
  fileDataUrl?: string;
  externalUrl: string;
  shareToken: string;
  isVerified: boolean;
  uploadedByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentStats {
  totalCount: number;
  gstCount: number;
  profileCount: number;
  brochureCount: number;
  contractCount: number;
  customerCount: number;
  expiringSoonCount: number;
  totalStorageBytes: number;
}

export interface DocumentsListResponse {
  data: CrmDocument[];
  stats: DocumentStats;
}

export interface CreateCrmDocumentPayload {
  title: string;
  category: DocumentCategory;
  description?: string;
  documentNumber?: string;
  linkedCustomerName?: string;
  linkedContactId?: string;
  issueDate?: string;
  expiryDate?: string;
  tags?: string[];
  fileName?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  fileDataUrl?: string;
  externalUrl?: string;
  isVerified?: boolean;
}

// ─── Super Admin Platform Authority & Governance ────────────────────────────
export type PlatformFeatureKey =
  | 'aiScoring'
  | 'whatsappCloud'
  | 'whatsappBroadcasts'
  | 'gstBilling'
  | 'aiWorkflows'
  | 'slaTickets'
  | 'documentVault'
  | 'apiWebhooks'
  | 'customRbac'
  | 'auditShield'
  | 'aiCreditRisk'
  | 'aiVoiceCrm'
  | 'aiDealerDesk'
  | 'aiCopilot';

export interface PlatformFeatureSpec {
  key: PlatformFeatureKey;
  label: string;
  category: 'AI & Automation' | 'Omnichannel' | 'Revenue & GST' | 'Security & RBAC';
  description: string;
}

export interface PlanEntitlementSpec {
  plan: 'starter' | 'growth' | 'enterprise';
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  seatLimit: number;
  maxMonthlyAiCalls: number;
  maxMonthlyWhatsapp: number;
  maxStorageMb: number;
  features: Record<PlatformFeatureKey, boolean>;
}

export interface GlobalKillSwitches {
  geminiAiEnabled: boolean;
  whatsappCloudEnabled: boolean;
  webhooksEnabled: boolean;
  bulkExportsEnabled: boolean;
  impersonationEnabled: boolean;
}

export interface GlobalSecurityPolicies {
  minPasswordLength: number;
  enforceMfaNotice: boolean;
  impersonationMaxMinutes: number;
  lockTenantOnSuspiciousActivity: boolean;
  dpdpRetentionDays: number;
  requireReasonForGovernance: boolean;
}

export interface PlatformConfigData {
  maintenanceMode: boolean;
  maintenanceBanner: string;
  allowNewSignups: boolean;
  defaultTrialDays: number;
  planMatrix: Record<'starter' | 'growth' | 'enterprise', PlanEntitlementSpec>;
  globalKillSwitches: GlobalKillSwitches;
  securityPolicies: GlobalSecurityPolicies;
  updatedByEmail: string;
}

export interface PlatformAuditLogItem {
  id: string;
  actorName: string;
  actorEmail: string;
  action: string;
  severity: 'info' | 'warning' | 'critical';
  targetTenantId?: string;
  targetTenantName?: string;
  targetAccountId?: string;
  summary: string;
  reason?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface SuperAdminOverviewResponse {
  kpis: {
    totalTenants: number;
    activeTenants: number;
    trialTenants: number;
    suspendedTenants: number;
    totalUsers: number;
    activeUsers: number;
    totalLeads: number;
    totalDeals: number;
    totalInvoices: number;
    totalTickets: number;
    monthlyRecurringInr: number;
    annualRunRateInr: number;
    totalSubscriptionBilledInr: number;
    totalGstCollectedInr: number;
    pendingTopupRequests?: number;
  };
  costTelemetry?: {
    totalMonthlyAiCostInr: number;
    totalMonthlyWaCostInr: number;
    totalInfraCostInr: number;
    unprofitableTenantsCount: number;
    warning80Count: number;
    exceeded100Count: number;
  };
  planBreakdown: { starter: number; growth: number; enterprise: number };
  topCities: Array<{ city: string; count: number }>;
  quotaWatchlist: Array<{
    id: string;
    accountId: string;
    name: string;
    plan: 'starter' | 'growth' | 'enterprise';
    status: 'trial' | 'active' | 'suspended';
    seatsUsed: number;
    seatLimit: number;
    seatPct: number;
    aiPct: number;
    aiUsed?: number;
    aiLimit?: number;
    waPct?: number;
    waUsed?: number;
    waLimit?: number;
    mrrInr?: number;
    estimatedAiCostInr?: number;
    estimatedWaCostInr?: number;
    totalInfraCostInr?: number;
    grossMarginInr?: number;
    marginPct?: number;
    unprofitable?: boolean;
    alertLevel?: 'ok' | 'warning_80' | 'exceeded_100';
    overrideCount: number;
  }>;
  recentTenants: Array<{
    id: string;
    accountId: string;
    name: string;
    plan: 'starter' | 'growth' | 'enterprise';
    status: 'trial' | 'active' | 'suspended';
    city: string;
    seatsUsed: number;
    seatLimit: number;
    createdAt: string | null;
  }>;
  recentAudits: PlatformAuditLogItem[];
  platformStatus: {
    maintenanceMode: boolean;
    allowNewSignups: boolean;
    globalKillSwitches: GlobalKillSwitches;
  };
}

export interface SuperAdminTenantItem {
  id: string;
  accountId: string;
  name: string;
  slug: string;
  plan: 'starter' | 'growth' | 'enterprise';
  status: 'trial' | 'active' | 'suspended';
  city: string;
  gstin: string;
  email: string;
  phone: string;
  seatsUsed: number;
  activeUsers: number;
  seatLimit: number;
  seatLimitOverride: number | null;
  leadsCount: number;
  dealsCount: number;
  wonRevenueInr: number;
  overrideCount: number;
  maskPhoneForAgents: boolean;
  blockAgentExport: boolean;
  aiEnabled?: boolean;
  aiWorkflowsEnabled?: boolean;
  aiSource?: 'plan' | 'override_on' | 'override_off' | 'kill_switch';
  aiPillars?: {
    aiCreditRisk: boolean;
    aiVoiceCrm: boolean;
    aiDealerDesk: boolean;
    aiCopilot: boolean;
  };
  maxMonthlyAiCalls?: number;
  aiCallsUsed?: number;
  aiBalanceRemaining?: number;
  trialEndsAt: string;
  suspensionReason: string;
  createdAt: string | null;
}

export interface SuperAdminTenantMember {
  id: string;
  userCode: string;
  name: string;
  email: string;
  phone: string;
  role: 'owner' | 'admin' | 'manager' | 'agent';
  departmentPreset: string;
  permissions: string[];
  isActive: boolean;
  territory: string;
  monthlyTarget: number;
  maskPhones: boolean;
  lastLoginAt: string | null;
  createdAt: string | null;
}

export interface SuperAdminTenantDetailResponse {
  tenant: {
    id: string;
    accountId: string;
    name: string;
    slug: string;
    plan: 'starter' | 'growth' | 'enterprise';
    status: 'trial' | 'active' | 'suspended';
    city: string;
    gstin: string;
    state: string;
    email: string;
    phone: string;
    address: string;
    seatLimit: number;
    seatLimitOverride: number | null;
    trialEndsAt: string;
    assignedManagerNote: string;
    maskPhoneForAgents: boolean;
    blockAgentExport: boolean;
    featureOverrides: Record<string, boolean>;
    effectiveFeatures: Record<
      PlatformFeatureKey,
      { enabled: boolean; source: 'plan' | 'override_on' | 'override_off' | 'kill_switch' }
    >;
    quotas: {
      maxMonthlyAiCalls: number;
      maxMonthlyWhatsapp: number;
      aiCallsUsed: number;
      whatsappUsed: number;
      maxStorageMb: number;
      aiCostInr?: number;
      whatsappCostInr?: number;
      addonAiCalls?: number;
      addonWhatsapp?: number;
      lastMeterResetAt?: string;
    };
    costTelemetry?: {
      mrrInr: number;
      aiUsed: number;
      aiLimit: number;
      aiPct: number;
      estimatedAiCostInr: number;
      waUsed: number;
      waLimit: number;
      waPct: number;
      estimatedWaCostInr: number;
      totalInfraCostInr: number;
      grossMarginInr: number;
      marginPct: number;
      unprofitable: boolean;
      alertLevel: 'ok' | 'warning_80' | 'exceeded_100';
    };
    sessionVersion?: number;
    dpdpRetention?: {
      softDeletedAt?: string;
      purgeScheduledAt?: string;
      purgedAt?: string;
      deletionReason?: string;
      requestedByEmail?: string;
    };
    securityPolicy: {
      enforcePhoneMasking: boolean;
      lockAgentExport: boolean;
      requireStrongPassword: boolean;
      sessionTtlHours: number;
      allowImpersonation: boolean;
      ipAllowlist: string[];
      suspensionReason: string;
      suspendedAt: string;
    };
    subscriptionInvoices: SubscriptionInvoice[];
    createdAt: string | null;
  };
  usage: {
    seatsUsed: number;
    activeUsers: number;
    leadsCount: number;
    dealsCount: number;
    invoicesCount: number;
    ticketsCount: number;
  };
  members: SuperAdminTenantMember[];
  featureCatalog: PlatformFeatureSpec[];
}

export interface SaasCouponItem {
  id: string;
  code: string;
  discountType: 'percent' | 'flat_inr';
  discountValue: number;
  applicablePlans: Array<'starter' | 'growth' | 'enterprise'>;
  billingCycle: 'all' | 'monthly' | 'annual';
  maxRedemptions: number;
  redemptionsCount: number;
  totalDiscountGivenInr: number;
  expiresAt: string;
  isActive: boolean;
  description: string;
}

export interface SaasPartnerItem {
  id: string;
  partnerCode: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  commissionRatePct: number;
  totalAttributedRevenueInr: number;
  totalCommissionEarnedInr: number;
  totalCommissionPaidInr: number;
  pendingPayoutInr: number;
  referredTenantsCount: number;
  isActive: boolean;
}

export interface DunningPolicyConfig {
  autoRemindersEnabled: boolean;
  reminderDaysBeforeExpiry: number[];
  gracePeriodDays: number;
  autoActionOnExpiry: 'downgrade_starter' | 'pause_writes' | 'suspend' | 'notify_only';
  whatsappTemplateEnabled: boolean;
  emailReminderEnabled: boolean;
  reminderMessageTemplate: string;
  lastRunAt?: string;
  lastRunSummary?: string;
}

export interface TrialWatchlistItem {
  tenantId: string;
  accountId: string;
  tenantName: string;
  plan: 'starter' | 'growth' | 'enterprise';
  email: string;
  phone: string;
  trialEndsAt: string;
  daysRemaining: number;
  health: 'healthy' | 'expiring_soon' | 'in_grace' | 'overdue';
  autoAction: 'downgrade_starter' | 'pause_writes' | 'suspend' | 'notify_only';
}

export interface SuperAdminBillingResponse {
  monthFilter?: string;
  summary: {
    paidRevenueInr: number;
    totalGstInr: number;
    cgstTotalInr?: number;
    sgstTotalInr?: number;
    igstTotalInr?: number;
    tdsTotalInr?: number;
    refundedInr?: number;
    paidCount: number;
    trialCount: number;
    complimentaryCount?: number;
    totalInvoices: number;
    pendingPartnerPayoutInr?: number;
    b2bRegisteredCount?: number;
    b2cCount?: number;
  };
  data: Array<
    SubscriptionInvoice & {
      tenantId: string;
      accountId: string;
      tenantName: string;
    }
  >;
  coupons?: SaasCouponItem[];
  partners?: SaasPartnerItem[];
  dunningPolicy?: DunningPolicyConfig;
  trialWatchlist?: TrialWatchlistItem[];
}

export interface SuperAdminOperatorItem {
  id: string;
  userCode: string;
  name: string;
  email: string;
  phone: string;
  territory: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string | null;
}

// ---------------------------------------------------------------------------
// 2-Way Email CRM (SMTP/IMAP + Templates + Tracking)
// ---------------------------------------------------------------------------

export type EmailProviderPreset = 'gmail' | 'zoho' | 'outlook' | 'custom';
export type EmailTemplateCategory =
  | 'proforma'
  | 'quotation'
  | 'followup'
  | 'udhaar'
  | 'welcome'
  | 'custom';

export interface EmailAccountInfo {
  id: string;
  providerPreset: EmailProviderPreset;
  emailAddress: string;
  displayName: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  username: string;
  hasPassword: boolean;
  appPasswordMasked: string;
  signatureHtml: string;
  isActive: boolean;
  lastSyncedAt: string | null;
  lastSyncError: string;
}

export interface EmailTemplateItem {
  id: string;
  name: string;
  category: EmailTemplateCategory;
  subject: string;
  bodyHtml: string;
}

export interface EmailMessageItem {
  id: string;
  direction: 'outbound' | 'inbound';
  fromEmail: string;
  toEmail: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  entityType: 'lead' | 'contact' | 'deal' | '';
  entityId: string;
  entityLabel: string;
  openCount: number;
  firstOpenedAt: string | null;
  lastOpenedAt: string | null;
  status: string;
  sentAt: string;
}

export interface EmailCrmConfigResponse {
  account: EmailAccountInfo | null;
  templates: EmailTemplateItem[];
  recentMessages: EmailMessageItem[];
}

// ---------------------------------------------------------------------------
// B2B Buyer / Dealer Self-Service Magic Portal
// ---------------------------------------------------------------------------

export interface PortalLineItem {
  description: string;
  hsnSac: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface PortalQuotationItem {
  id: string;
  invoiceNumber: string;
  clientName: string;
  contactPerson: string;
  gstin: string;
  placeOfSupply: string;
  taxType: 'cgst_sgst' | 'igst';
  gstRate: number;
  items: PortalLineItem[];
  subTotal: number;
  discount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  gstAmount: number;
  grandTotal: number;
  dueDate: string;
  notes: string;
  publicToken: string;
  quoteApprovalStatus: 'pending' | 'approved' | 'changes_requested';
  approvedByName: string;
  approvedAt: string;
  convertedToInvoiceId: string;
  createdAt: string;
}

export interface PortalInvoiceItem {
  id: string;
  invoiceNumber: string;
  clientName: string;
  gstin: string;
  placeOfSupply: string;
  taxType: 'cgst_sgst' | 'igst';
  gstRate: number;
  items: PortalLineItem[];
  subTotal: number;
  discount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  gstAmount: number;
  grandTotal: number;
  amountPaid: number;
  tdsDeducted: number;
  balanceDue: number;
  status: InvoiceStatus;
  daysOverdue: number;
  dueDate: string;
  paymentLink: string;
  upiDeepLink: string;
  promisedPaymentDate: string;
  payments: Array<{
    id: string;
    amountPaid: number;
    tdsDeducted: number;
    totalSettled: number;
    paymentMode: string;
    utrOrChequeNo: string;
    paymentDate: string;
  }>;
  notes: string;
  createdAt: string;
}

export interface PortalTicketItem {
  id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  linkedInvoiceNumber: string;
  slaDueAt: string;
  resolvedAt: string;
  resolutionSummary: string;
  comments: Array<{
    id: string;
    authorName: string;
    authorRole: string;
    message: string;
    createdAt: string;
  }>;
  createdAt: string;
}

export interface BuyerPortalData {
  portalToken: string;
  focusDocId: string;
  seller: {
    companyName: string;
    logoUrl: string;
    city: string;
    gstin: string;
    state: string;
    phone: string;
    email: string;
    address: string;
    upiId: string;
    bankAccountNote: string;
  };
  buyer: {
    id: string;
    name: string;
    company: string;
    designation: string;
    phone: string;
    email: string;
    city: string;
    gstin: string;
    gstinStatus: string;
    creditLimitInr: number;
    creditTermDays: number;
    creditHold: boolean;
    creditHoldReason: string;
    openBalanceInr: number;
    overdueBalanceInr: number;
    availableCreditInr: number;
    totalInvoicedInr: number;
    totalPaidInr: number;
  };
  quotations: PortalQuotationItem[];
  invoices: PortalInvoiceItem[];
  tickets: PortalTicketItem[];
}

export interface PortalPaymentIntentResponse {
  upiDeepLink: string;
  upiQrDataUrl: string;
  upiId: string;
  bankAccountNote: string;
  paymentLink: string;
  message: string;
  portal: BuyerPortalData;
}
