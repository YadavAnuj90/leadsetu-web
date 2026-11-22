import type {
  TenantInfo,
  UserFeatureKey,
  WorkspaceBusinessMode,
} from '@/types/contracts';

export interface BusinessModeOption {
  id: WorkspaceBusinessMode;
  label: string;
  shortBadge: string;
  tagline: string;
  highlights: string[];
}

export const BUSINESS_MODE_OPTIONS: BusinessModeOption[] = [
  {
    id: 'b2b',
    label: 'B2B / Wholesale / Manufacturing',
    shortBadge: 'B2B & Dealers',
    tagline: 'GSTIN directory, dealer credit limits, quotations, magic buyer portal & tax invoices.',
    highlights: ['Contacts (B2B)', 'Deals Pipeline', 'Quotations', 'GST Invoices'],
  },
  {
    id: 'msme',
    label: 'Small MSME / Trader',
    shortBadge: 'MSME Fast',
    tagline: 'Clean lightweight CRM focused on WhatsApp inbox, quick quotes & GST bills without bloat.',
    highlights: ['Parties & Buyers', 'Orders & Deals', 'GST Bills'],
  },
  {
    id: 'b2c',
    label: 'B2C / D2C / Retail Store',
    shortBadge: 'B2C / D2C',
    tagline: 'Consumer-first customer list, orders & bookings, WhatsApp concierge & bills/receipts.',
    highlights: ['Customers', 'Orders & Bookings', 'Product Catalog', 'Bills & Receipts'],
  },
  {
    id: 'hybrid',
    label: 'Hybrid (B2B + B2C Store)',
    shortBadge: 'B2B + B2C',
    tagline: 'Serve both GST dealer accounts and retail consumer buyers in one unified workspace.',
    highlights: ['Accounts & Customers', 'Deals & Orders', 'B2B / B2C Toggle'],
  },
  {
    id: 'bpo',
    label: 'BPO / Call Center',
    shortBadge: 'Call Center',
    tagline: 'High-speed calling, missed-call queues, telecaller broadcasts & clean simplified view.',
    highlights: ['Dialer Queue', 'Callers & Lists', 'Power Dialer', 'Callback Pipeline'],
  },
  {
    id: 'education',
    label: 'Education / Coaching / EdTech',
    shortBadge: 'Education',
    tagline: 'Student & parent inquiries, course batches, admissions pipeline & fee receipts.',
    highlights: ['Inquiries', 'Students & Parents', 'Admissions Pipeline', 'Fee Ledger'],
  },
];

export const DEFAULT_HIDDEN_MODULES_BY_MODE: Record<WorkspaceBusinessMode, string[]> = {
  b2b: [],
  msme: ['slaTickets', 'aiWorkflows', 'documentVault'],
  b2c: ['slaTickets', 'aiWorkflows', 'documentVault'],
  hybrid: [],
  bpo: ['products', 'gstBilling', 'documentVault', 'deals'],
  education: ['slaTickets', 'aiWorkflows', 'documentVault'],
};

const MODULE_LABELS_BY_MODE: Record<WorkspaceBusinessMode, Record<string, string>> = {
  b2b: {},
  msme: {
    '/contacts': 'Parties & Buyers',
    '/deals': 'Orders & Deals',
    '/invoices': 'GST Bills',
  },
  b2c: {
    '/contacts': 'Customers',
    '/deals': 'Orders & Bookings',
    '/products': 'Product Catalog',
    '/quotations': 'Estimates',
    '/invoices': 'Bills & Receipts',
  },
  hybrid: {
    '/contacts': 'Accounts & Customers',
    '/deals': 'Deals & Orders',
    '/products': 'Catalog & HSN',
  },
  bpo: {
    '/leads': 'Dialer Queue',
    '/contacts': 'Callers & Lists',
    '/deals': 'Callback Pipeline',
    '/calls': 'Power Dialer',
  },
  education: {
    '/leads': 'Inquiries',
    '/contacts': 'Students & Parents',
    '/deals': 'Admissions Pipeline',
    '/products': 'Courses & Batches',
    '/quotations': 'Fee Quotes',
    '/invoices': 'Fee Ledger',
  },
};

export interface NavToggleModuleMeta {
  feature: UserFeatureKey;
  label: string;
  description: string;
}

export const WORKSPACE_NAV_MODULES: NavToggleModuleMeta[] = [
  { feature: 'leads', label: 'Leads / Inquiries / Queue', description: 'Top-of-funnel capture & AI scoring' },
  { feature: 'contacts', label: 'Contacts / Customers', description: 'B2B GST directory & B2C consumer profiles' },
  { feature: 'deals', label: 'Deals / Orders / Admissions', description: 'Kanban revenue or booking stage board' },
  { feature: 'whatsappCloud', label: 'WhatsApp Inbox & AI Agent', description: '24x7 Cloud API chat & AI Concierge' },
  { feature: 'whatsappBroadcasts', label: 'Campaigns & Broadcasts', description: 'Bulk WhatsApp & SMS outreach' },
  { feature: 'tasks', label: 'Tasks & Follow-ups', description: 'Daily callback reminders' },
  { feature: 'slaTickets', label: 'SLA Tickets / Support Desk', description: 'Warranty & issue resolution tracking' },
  { feature: 'aiWorkflows', label: 'AI Workflows', description: 'Automated rules & drip triggers' },
  { feature: 'analytics', label: 'Analytics & Leaderboard', description: 'Sales quotas, commission slabs & ROI' },
  { feature: 'products', label: 'Products / Courses / Catalog', description: 'Items, HSN codes, stock & pricing' },
  { feature: 'gstBilling', label: 'Quotes, Bills & Fee Ledger', description: 'PDF estimates & GST invoices' },
  { feature: 'documentVault', label: 'Document Center Vault', description: 'Contracts, KYC docs & price lists' },
];

export interface TeamDepartmentPreset {
  id: string;
  label: string;
  departmentName: string;
  description: string;
  featureAccess: Record<UserFeatureKey, boolean>;
}

export const TEAM_DEPARTMENT_PRESETS: TeamDepartmentPreset[] = [
  {
    id: 'b2b_dealer',
    label: 'B2B Dealer Rep',
    departmentName: 'B2B Sales & Dealers',
    description: 'Full B2B quotes, GSTIN directory, AI scoring, deals & WhatsApp.',
    featureAccess: {
      leads: true,
      aiScoring: true,
      contacts: true,
      deals: true,
      whatsappCloud: true,
      whatsappBroadcasts: false,
      tasks: true,
      slaTickets: true,
      aiWorkflows: false,
      analytics: false,
      products: true,
      gstBilling: true,
      documentVault: true,
      aiCreditRisk: true,
      aiVoiceCrm: true,
      aiDealerDesk: true,
      aiCopilot: true,
    },
  },
  {
    id: 'b2c_desk',
    label: 'B2C / D2C Desk',
    departmentName: 'B2C Retail Desk',
    description: 'Fast WhatsApp replies, orders, catalog & bills without SLA/vault bloat.',
    featureAccess: {
      leads: true,
      aiScoring: true,
      contacts: true,
      deals: true,
      whatsappCloud: true,
      whatsappBroadcasts: true,
      tasks: true,
      slaTickets: false,
      aiWorkflows: false,
      analytics: false,
      products: true,
      gstBilling: true,
      documentVault: false,
      aiCreditRisk: false,
      aiVoiceCrm: true,
      aiDealerDesk: false,
      aiCopilot: true,
    },
  },
  {
    id: 'bpo_caller',
    label: 'BPO Telecaller',
    departmentName: 'Inside Calling / BPO',
    description: 'Call queue, follow-up tasks & Voice AI—no billing, exports or credit modules.',
    featureAccess: {
      leads: true,
      aiScoring: true,
      contacts: true,
      deals: false,
      whatsappCloud: true,
      whatsappBroadcasts: false,
      tasks: true,
      slaTickets: true,
      aiWorkflows: false,
      analytics: false,
      products: false,
      gstBilling: false,
      documentVault: false,
      aiCreditRisk: false,
      aiVoiceCrm: true,
      aiDealerDesk: false,
      aiCopilot: true,
    },
  },
  {
    id: 'edu_counselor',
    label: 'Education Counselor',
    departmentName: 'Admissions Counseling',
    description: 'Student inquiries, admissions pipeline, WhatsApp follow-ups & fee receipts.',
    featureAccess: {
      leads: true,
      aiScoring: true,
      contacts: true,
      deals: true,
      whatsappCloud: true,
      whatsappBroadcasts: false,
      tasks: true,
      slaTickets: false,
      aiWorkflows: false,
      analytics: false,
      products: true,
      gstBilling: true,
      documentVault: true,
      aiCreditRisk: false,
      aiVoiceCrm: true,
      aiDealerDesk: false,
      aiCopilot: true,
    },
  },
];

export function normalizeWorkspaceBusinessMode(
  value?: string | null,
): WorkspaceBusinessMode {
  if (
    value === 'b2b' ||
    value === 'msme' ||
    value === 'b2c' ||
    value === 'hybrid' ||
    value === 'bpo' ||
    value === 'education'
  ) {
    return value;
  }
  return 'b2b';
}

export function getBusinessModeMeta(
  mode?: WorkspaceBusinessMode | string | null,
): BusinessModeOption {
  const normalized = normalizeWorkspaceBusinessMode(mode);
  return (
    BUSINESS_MODE_OPTIONS.find((item) => item.id === normalized) ||
    BUSINESS_MODE_OPTIONS[0]
  );
}

export function getSidebarModuleLabel(
  mode: WorkspaceBusinessMode | string | null | undefined,
  href: string,
  fallback: string,
): string {
  const normalized = normalizeWorkspaceBusinessMode(mode);
  return MODULE_LABELS_BY_MODE[normalized]?.[href] || fallback;
}

export function isNavModuleHiddenForTenant(
  tenant: TenantInfo | null | undefined,
  feature?: UserFeatureKey,
): boolean {
  if (!feature || !tenant) return false;
  if (Array.isArray(tenant.hiddenNavModules)) {
    return tenant.hiddenNavModules.includes(feature);
  }
  const mode = normalizeWorkspaceBusinessMode(tenant.businessMode);
  return DEFAULT_HIDDEN_MODULES_BY_MODE[mode].includes(feature);
}

export interface SegmentCopy {
  mode: WorkspaceBusinessMode;
  leadsHeading: string;
  leadsSubtitle: string;
  leadValueLabel: string;
  hideCompanyOnConsumerByDefault: boolean;
  dealsHeading: string;
  dealsEntityNoun: string;
  dealsTitlePlaceholder: string;
  dealsHideCompany: boolean;
  pipelineStageSummary: string;
  invoicePageTitle: string;
  invoicePageSubtitle: string;
  invoiceDocHeading: string;
  invoiceLegalSubLabel: string;
  invoiceCreateTitle: string;
  quotePageTitle: string;
  quoteDocHeading: string;
  quoteLegalSubLabel: string;
  defaultGstRate: number;
  hideGstinOnDocForm: boolean;
}

const SEGMENT_COPY_MAP: Record<WorkspaceBusinessMode, Omit<SegmentCopy, 'mode'>> = {
  b2b: {
    leadsHeading: 'Leads & AI Qualification',
    leadsSubtitle: 'Score B2B inquiries, IndiaMART buyers & dealer prospects with SetuAI.',
    leadValueLabel: 'Est. Deal Value (₹)',
    hideCompanyOnConsumerByDefault: false,
    dealsHeading: 'Deals & Multi-Pipeline Board',
    dealsEntityNoun: 'Deal',
    dealsTitlePlaceholder: 'e.g. 500 Switchgear Units Supply',
    dealsHideCompany: false,
    pipelineStageSummary: 'Qualified Inquiry → Discovery → GST Proposal → Negotiation → Closed Won',
    invoicePageTitle: 'GST Tax Invoices & Proforma Quotes',
    invoicePageSubtitle: 'Create HSN-compliant B2B tax invoices, track 18% GST liability, and collect via Razorpay on WhatsApp.',
    invoiceDocHeading: 'TAX INVOICE',
    invoiceLegalSubLabel: 'Tax Invoice (Rule 46 CGST Rules)',
    invoiceCreateTitle: 'Create GST Tax Invoice / Proforma Quotation',
    quotePageTitle: 'Quotations & PDF Proposals',
    quoteDocHeading: 'PROFORMA QUOTATION',
    quoteLegalSubLabel: 'Commercial Proposal & Proforma Quotation',
    defaultGstRate: 18,
    hideGstinOnDocForm: false,
  },
  msme: {
    leadsHeading: 'Trade Inquiries & Parties',
    leadsSubtitle: 'Track incoming trade inquiries, phone leads & instant AI follow-ups.',
    leadValueLabel: 'Est. Order Value (₹)',
    hideCompanyOnConsumerByDefault: false,
    dealsHeading: 'Orders & Deals Board',
    dealsEntityNoun: 'Order / Deal',
    dealsTitlePlaceholder: 'e.g. 200 Cartons Wholesale Dispatch',
    dealsHideCompany: false,
    pipelineStageSummary: 'New Inquiry → Estimate / Quote Sent → Order Confirmed → Closed Won / Paid',
    invoicePageTitle: 'GST Bills & Estimates',
    invoicePageSubtitle: 'Generate clean GST bills or estimates in seconds and collect via UPI / WhatsApp.',
    invoiceDocHeading: 'GST BILL / INVOICE',
    invoiceLegalSubLabel: 'Tax Invoice (Rule 46 CGST Rules)',
    invoiceCreateTitle: 'Create GST Bill / Estimate',
    quotePageTitle: 'Estimates & Rate Quotes',
    quoteDocHeading: 'PROFORMA ESTIMATE',
    quoteLegalSubLabel: 'MSME Commercial Estimate',
    defaultGstRate: 18,
    hideGstinOnDocForm: false,
  },
  b2c: {
    leadsHeading: 'Customer Inquiries & Orders',
    leadsSubtitle: 'Capture Instagram, WhatsApp & store consumer inquiries without B2B clutter.',
    leadValueLabel: 'Est. Order Value (₹)',
    hideCompanyOnConsumerByDefault: true,
    dealsHeading: 'Orders & Bookings Board',
    dealsEntityNoun: 'Order',
    dealsTitlePlaceholder: 'e.g. Bridal Jewellery Set / AC Installation Order',
    dealsHideCompany: true,
    pipelineStageSummary: 'New Inquiry → Order Confirmed → Packed → Dispatched → Delivered / COD Settled',
    invoicePageTitle: 'Bills, Receipts & Order Estimates',
    invoicePageSubtitle: 'Issue retail bills & customer receipts and share 1-tap UPI payment links on WhatsApp.',
    invoiceDocHeading: 'RETAIL BILL / RECEIPT',
    invoiceLegalSubLabel: 'Retail Tax Bill & Customer Receipt',
    invoiceCreateTitle: 'Create Retail Bill / Order Receipt',
    quotePageTitle: 'Order Estimates',
    quoteDocHeading: 'ORDER ESTIMATE',
    quoteLegalSubLabel: 'Customer Order Estimate',
    defaultGstRate: 0,
    hideGstinOnDocForm: true,
  },
  hybrid: {
    leadsHeading: 'Hybrid Leads (B2B & B2C)',
    leadsSubtitle: 'Manage both GST dealer inquiries and retail consumer buyers seamlessly.',
    leadValueLabel: 'Est. Value (₹)',
    hideCompanyOnConsumerByDefault: false,
    dealsHeading: 'Deals & Orders Kanban',
    dealsEntityNoun: 'Deal / Order',
    dealsTitlePlaceholder: 'e.g. Bulk Distributor PO or Retail Order',
    dealsHideCompany: false,
    pipelineStageSummary: 'Qualified Inquiry → Discovery → GST Proposal → Negotiation → Closed Won',
    invoicePageTitle: 'Bills, GST Invoices & Estimates',
    invoicePageSubtitle: 'Switch cleanly between B2B GST Tax Invoices and B2C Consumer Bills.',
    invoiceDocHeading: 'TAX INVOICE / BILL',
    invoiceLegalSubLabel: 'Tax Invoice & Retail Billing Statement',
    invoiceCreateTitle: 'Create GST Invoice / Retail Bill',
    quotePageTitle: 'Quotations & Order Estimates',
    quoteDocHeading: 'QUOTATION / ESTIMATE',
    quoteLegalSubLabel: 'Commercial Quote / Order Estimate',
    defaultGstRate: 18,
    hideGstinOnDocForm: false,
  },
  bpo: {
    leadsHeading: 'Dialer Queue & Call Lists',
    leadsSubtitle: 'High-velocity calling queue with live dispositions, callbacks & WhatsApp pings.',
    leadValueLabel: 'Est. Value (₹)',
    hideCompanyOnConsumerByDefault: true,
    dealsHeading: 'Callback & Conversion Pipeline',
    dealsEntityNoun: 'Callback Case',
    dealsTitlePlaceholder: 'e.g. Loan Callback - Sector 18 Prospect',
    dealsHideCompany: true,
    pipelineStageSummary: 'Fresh Queue → Contacted → Callback Scheduled → Hot Transfer → Closed',
    invoicePageTitle: 'Service Invoices & Receipts',
    invoicePageSubtitle: 'Track service charges, client retainers & settlement receipts.',
    invoiceDocHeading: 'SERVICE RECEIPT',
    invoiceLegalSubLabel: 'Authorized Service Receipt',
    invoiceCreateTitle: 'Create Service Receipt / Quote',
    quotePageTitle: 'Service Quotes',
    quoteDocHeading: 'SERVICE QUOTE',
    quoteLegalSubLabel: 'Service Fee Proposal',
    defaultGstRate: 18,
    hideGstinOnDocForm: true,
  },
  education: {
    leadsHeading: 'Student & Parent Inquiries',
    leadsSubtitle: 'Track counseling calls, demo class bookings & course inquiries with zero B2B clutter.',
    leadValueLabel: 'Course / Program Fee (₹)',
    hideCompanyOnConsumerByDefault: true,
    dealsHeading: 'Admissions Pipeline',
    dealsEntityNoun: 'Admission',
    dealsTitlePlaceholder: 'e.g. Full-Stack Batch Admission - Aditi Singh',
    dealsHideCompany: true,
    pipelineStageSummary: 'Inquiry → Counseling Done → Demo Attended → Fee Pending → Enrolled',
    invoicePageTitle: 'Student Fee Ledger & Receipts',
    invoicePageSubtitle: 'Issue student tuition fee receipts, track installments & send WhatsApp UPI fee links.',
    invoiceDocHeading: 'FEE RECEIPT',
    invoiceLegalSubLabel: 'Official Student Tuition / Course Fee Receipt',
    invoiceCreateTitle: 'Issue Student Fee Receipt / Fee Quote',
    quotePageTitle: 'Fee Quotes & Scholarships',
    quoteDocHeading: 'ADMISSION FEE QUOTE',
    quoteLegalSubLabel: 'Course Fee Structure & Admission Quote',
    defaultGstRate: 0,
    hideGstinOnDocForm: true,
  },
};

export function getSegmentCopy(mode?: WorkspaceBusinessMode | string | null): SegmentCopy {
  const normalized = normalizeWorkspaceBusinessMode(mode);
  return {
    mode: normalized,
    ...SEGMENT_COPY_MAP[normalized],
  };
}

