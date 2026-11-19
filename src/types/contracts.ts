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
  | 'meta_ads'
  | 'google_ads'
  | 'website'
  | 'referral'
  | 'manual';

export interface Lead {
  id: string;
  tenantId: string;
  ownerId: string;
  name: string;
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
  tags: string[];
  notes?: string;
  activities: LeadActivity[];
  createdAt: string;
  updatedAt: string;
}

export interface LeadsStats {
  total: number;
  hotCount: number;
  qualifiedCount: number;
  convertedCount: number;
  totalPipelineValue: number;
  avgAiScore: number;
}

export interface LeadsListResponse {
  data: Lead[];
  stats: LeadsStats;
}

export interface CreateLeadPayload {
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  city?: string;
  source?: LeadSource;
  status?: LeadStatus;
  estimatedValue?: number;
  tags?: string[];
  notes?: string;
}

// ─── Deals & Pipeline ─────────────────────────────────
export type DealStage =
  | 'qualified'
  | 'discovery'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost';

export interface DealActivity {
  id: string;
  type: 'created' | 'stage_change' | 'note' | 'quote' | 'call';
  description: string;
  authorName: string;
  createdAt: string;
}

export interface Deal {
  id: string;
  tenantId: string;
  ownerId: string;
  title: string;
  company: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  city: string;
  value: number;
  stage: DealStage;
  probability: number;
  expectedCloseDate: string;
  source: string;
  gstApplicable: boolean;
  notes: string;
  tags: string[];
  activities: DealActivity[];
  createdAt: string;
  updatedAt: string;
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
  activities?: ContactActivity[];
  createdAt: string;
  updatedAt: string;
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

// ─── Unified Inbox ────────────────────────────────────
export interface Message {
  id: string;
  direction: 'inbound' | 'outbound';
  content: string;
  senderName: string;
  status: 'sent' | 'delivered' | 'read';
  isAiDrafted?: boolean;
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
}

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
  rowCount: number;
  csv: string;
}

export interface TallyXmlExportResponse {
  filename: string;
  voucherCount: number;
  xml: string;
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
  | 'gst_customers';

export type CampaignStatus = 'completed' | 'running' | 'scheduled' | 'draft';

export interface Campaign {
  id: string;
  tenantId: string;
  name: string;
  templateName: string;
  language: 'hinglish' | 'english' | 'hindi';
  channel: 'whatsapp_cloud' | 'whatsapp_ai_drip';
  targetSegment: CampaignSegment;
  messageBody: string;
  ctaLabel: string;
  audienceCount: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  repliedCount: number;
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
  avgDeliveryRate: number;
  avgReadRate: number;
  totalAttributedRevenue: number;
  segmentCounts?: Record<string, unknown>;
}

export interface CreateCampaignPayload {
  name: string;
  templateName?: string;
  language?: 'hinglish' | 'english' | 'hindi';
  channel?: 'whatsapp_cloud' | 'whatsapp_ai_drip';
  targetSegment?: CampaignSegment;
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
  | 'deal.stage_changed'
  | 'invoice.overdue'
  | 'whatsapp.inbound';

export type WorkflowActionType =
  | 'send_whatsapp_create_task'
  | 'assign_senior_closer'
  | 'generate_gst_invoice'
  | 'send_payment_reminder';

export interface WorkflowLogEntry {
  id: string;
  summary: string;
  status: 'success' | 'skipped';
  executedAt: string;
}

export interface WorkflowRule {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  triggerType: WorkflowTriggerType;
  conditionSummary: string;
  actionType: WorkflowActionType;
  actionSummary: string;
  active: boolean;
  runsCount: number;
  hoursSaved: number;
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
}

export interface CreateWorkflowPayload {
  name: string;
  description?: string;
  triggerType?: WorkflowTriggerType;
  conditionSummary: string;
  actionType?: WorkflowActionType;
  actionSummary: string;
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
  summary: string;
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
