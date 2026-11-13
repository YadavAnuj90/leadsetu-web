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
  type: 'created' | 'stage_change' | 'note' | 'quote';
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
  type: 'customer' | 'prospect' | 'partner' | 'vendor';
  lifetimeValue: number;
  tags: string[];
  notes: string;
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
  role: 'owner' | 'admin' | 'manager' | 'agent';
  maskPhones?: boolean;
}

export interface TenantInfo {
  id: string;
  /** Unique 5-digit workspace / admin account ID */
  accountId?: string;
  name: string;
  slug: string;
  plan: 'starter' | 'growth' | 'enterprise';
  status: 'trial' | 'active' | 'suspended';
  city?: string;
  maskPhoneForAgents?: boolean;
  blockAgentExport?: boolean;
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
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type InvoiceTaxType = 'cgst_sgst' | 'igst';
export type InvoicePaymentMethod = 'razorpay' | 'upi' | 'neft_rtgs' | 'unpaid';

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
  status: InvoiceStatus;
  paymentMethod: InvoicePaymentMethod;
  paymentLink: string;
  dueDate: string;
  notes: string;
  linkedDealId?: string;
  linkedLeadId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceStats {
  totalCount: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  totalInvoiced: number;
  paidRevenue: number;
  pendingAmount: number;
  totalGstCollected: number;
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
  invitedBy: string | null;
  lastLoginAt: string | null;
  createdAt: string | null;
  performance: TeamMemberPerformance;
}

export interface TeamAccountInfo {
  /** Unique 5-digit workspace account ID */
  accountId: string;
  name: string;
  plan: string;
  status: string;
  city: string;
  maskPhoneForAgents?: boolean;
  blockAgentExport?: boolean;
  ownerName: string;
  ownerEmail: string;
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
  userCode: string;
  loginEmail: string;
  /** Only present when the server generated it — shown once, never retrievable again */
  temporaryPassword: string | null;
}

export interface AddTeamMemberPayload {
  name: string;
  email: string;
  phone: string;
  role?: AssignableTeamRole;
  territory?: string;
  monthlyTarget?: number;
  password?: string;
}

export interface UpdateTeamMemberPayload {
  name?: string;
  phone?: string;
  role?: AssignableTeamRole;
  territory?: string;
  monthlyTarget?: number;
  maskPhones?: boolean;
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
  | 'general';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus =
  | 'open'
  | 'in_progress'
  | 'waiting_client'
  | 'resolved'
  | 'closed';

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
  slaDueAt: string;
  isSlaBreached: boolean;
  notes: string;
  linkedInvoiceNumber: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketsListResponse {
  data: Ticket[];
  stats: {
    total: number;
    openCount: number;
    urgentCount: number;
    resolvedCount: number;
    slaBreachedCount: number;
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
  slaDueAt?: string;
  notes?: string;
  linkedInvoiceNumber?: string;
}

// ─── Global Ctrl+K Command Search & Notifications ─────
export type GlobalSearchEntityType =
  | 'lead'
  | 'contact'
  | 'deal'
  | 'invoice'
  | 'task'
  | 'ticket';

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
