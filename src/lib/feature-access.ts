import type {
  AuthUser,
  PlatformFeatureKey,
  TenantInfo,
  UserFeatureKey,
} from '@/types/contracts';

export const FEATURE_META: Record<
  PlatformFeatureKey,
  { label: string; category: string }
> = {
  aiScoring: { label: 'Gemini AI Lead Scoring', category: 'AI & Automation' },
  aiWorkflows: { label: 'Zero-Code AI Workflows', category: 'AI & Automation' },
  whatsappCloud: { label: 'Unified WhatsApp Cloud Inbox', category: 'Omnichannel' },
  whatsappBroadcasts: { label: 'WhatsApp Broadcast Campaigns', category: 'Omnichannel' },
  gstBilling: { label: '18% GST Tax Invoices & CPQ', category: 'Revenue & GST' },
  slaTickets: { label: 'SLA Field Service Desk', category: 'Revenue & GST' },
  documentVault: { label: 'Document Center Vault', category: 'Revenue & GST' },
  apiWebhooks: { label: 'Inbound Webhooks & REST API', category: 'AI & Automation' },
  customRbac: { label: 'Granular Team RBAC Presets', category: 'Security & RBAC' },
  auditShield: { label: 'DPDP Anti-Leak Audit Shield', category: 'Security & RBAC' },
  aiCreditRisk: { label: 'Pillar 1 · Credit & Udhaar AI', category: 'AI & Automation' },
  aiVoiceCrm: { label: 'Pillar 2 · Voice-to-CRM & Call Audit', category: 'AI & Automation' },
  aiDealerDesk: { label: 'Pillar 3 · Dealer RFQ & Beat Planner', category: 'AI & Automation' },
  aiCopilot: { label: 'Ask AI · Tenant RAG Copilot', category: 'AI & Automation' },
};

export interface AssignableFeatureMeta {
  key: UserFeatureKey;
  label: string;
  category: 'Core CRM' | 'Omnichannel & AI' | 'Revenue & Operations';
  href: string;
  description: string;
}

export const USER_FEATURE_CATALOG: AssignableFeatureMeta[] = [
  {
    key: 'leads',
    label: 'Leads Pipeline',
    category: 'Core CRM',
    href: '/leads',
    description: 'View, capture, and update buyer leads',
  },
  {
    key: 'aiScoring',
    label: 'Gemini AI Scoring & Drafts',
    category: 'Omnichannel & AI',
    href: '/leads',
    description: 'AI 1-100 lead scoring & Hinglish smart replies',
  },
  {
    key: 'contacts',
    label: 'Contacts (B2B)',
    category: 'Core CRM',
    href: '/contacts',
    description: 'Company accounts, buyer contacts & credit status',
  },
  {
    key: 'deals',
    label: 'Deals Pipeline',
    category: 'Core CRM',
    href: '/deals',
    description: 'Kanban deal stages, values & won revenue tracking',
  },
  {
    key: 'tasks',
    label: 'Tasks & Follow-ups',
    category: 'Core CRM',
    href: '/tasks',
    description: 'Daily call/visit schedule & reminders',
  },
  {
    key: 'whatsappCloud',
    label: 'WhatsApp Cloud Inbox',
    category: 'Omnichannel & AI',
    href: '/inbox',
    description: 'Live 2-way buyer chats & quick templates',
  },
  {
    key: 'whatsappBroadcasts',
    label: 'WhatsApp Campaigns',
    category: 'Omnichannel & AI',
    href: '/campaigns',
    description: 'Broadcast drip blasts & template outreach',
  },
  {
    key: 'aiWorkflows',
    label: 'AI Workflows',
    category: 'Omnichannel & AI',
    href: '/workflows',
    description: 'Automated routing & rule triggers',
  },
  {
    key: 'analytics',
    label: 'Revenue Analytics',
    category: 'Revenue & Operations',
    href: '/analytics',
    description: 'Funnel conversion, forecast & rep charts',
  },
  {
    key: 'products',
    label: 'Products & HSN Catalog',
    category: 'Revenue & Operations',
    href: '/products',
    description: 'SKU pricing, MOQ & HSN/SAC catalog',
  },
  {
    key: 'gstBilling',
    label: 'Quotations & GST Invoices',
    category: 'Revenue & Operations',
    href: '/invoices',
    description: 'Proforma PDF quotes, 18% GST invoices & collections',
  },
  {
    key: 'slaTickets',
    label: 'SLA Service Tickets',
    category: 'Revenue & Operations',
    href: '/tickets',
    description: 'Post-sales support & SLA escalation tickets',
  },
  {
    key: 'documentVault',
    label: 'Document Center',
    category: 'Revenue & Operations',
    href: '/documents',
    description: 'Brochures, GST/KYC certificates & buyer MSAs',
  },
  {
    key: 'aiCreditRisk',
    label: 'AI Credit & Udhaar (Pillar 1)',
    category: 'Omnichannel & AI',
    href: '/invoices',
    description: 'Credit risk score, Hinglish vaada extraction & Udhaar chasers',
  },
  {
    key: 'aiVoiceCrm',
    label: 'AI Voice-to-CRM & Audit (Pillar 2)',
    category: 'Omnichannel & AI',
    href: '/leads',
    description: 'Hinglish call notes extraction & 5-point Call QA compliance audit',
  },
  {
    key: 'aiDealerDesk',
    label: 'AI Dealer RFQ & Beat Plan (Pillar 3)',
    category: 'Omnichannel & AI',
    href: '/inbox',
    description: 'WhatsApp multi-SKU RFQ parser & field beat route planner',
  },
  {
    key: 'aiCopilot',
    label: 'Ask AI Copilot (RAG Q&A)',
    category: 'Omnichannel & AI',
    href: '/dashboard',
    description: 'Grounded Q&A over live workspace leads, deals, invoices & tasks',
  },
];

export const DEFAULT_USER_FEATURE_MAP: Record<UserFeatureKey, boolean> = {
  leads: true,
  aiScoring: true,
  contacts: true,
  deals: true,
  whatsappCloud: true,
  whatsappBroadcasts: true,
  tasks: true,
  slaTickets: true,
  aiWorkflows: true,
  analytics: true,
  products: true,
  gstBilling: true,
  documentVault: true,
  aiCreditRisk: true,
  aiVoiceCrm: true,
  aiDealerDesk: true,
  aiCopilot: true,
};

export function getRoleDefaultFeatures(role: 'manager' | 'agent' | 'admin'): Record<UserFeatureKey, boolean> {
  if (role === 'manager' || role === 'admin') {
    return { ...DEFAULT_USER_FEATURE_MAP };
  }
  return {
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
    gstBilling: false,
    documentVault: true,
    aiCreditRisk: false,
    aiVoiceCrm: true,
    aiDealerDesk: true,
    aiCopilot: true,
  };
}

export function isWorkspaceAdminRole(user?: AuthUser | null): boolean {
  return !user || user.role === 'owner' || user.role === 'admin' || user.role === 'super_admin';
}

export const ROUTE_FEATURE_RULES: Array<{
  prefix: string;
  feature: UserFeatureKey | PlatformFeatureKey;
  label: string;
}> = [
  { prefix: '/leads', feature: 'leads', label: 'Leads Pipeline' },
  { prefix: '/contacts', feature: 'contacts', label: 'Contacts (B2B)' },
  { prefix: '/deals', feature: 'deals', label: 'Deals Pipeline' },
  { prefix: '/tasks', feature: 'tasks', label: 'Tasks & Follow-ups' },
  { prefix: '/analytics', feature: 'analytics', label: 'Revenue Analytics' },
  { prefix: '/products', feature: 'products', label: 'Products & HSN Catalog' },
  { prefix: '/inbox', feature: 'whatsappCloud', label: 'Unified WhatsApp Cloud Inbox' },
  { prefix: '/campaigns', feature: 'whatsappBroadcasts', label: 'WhatsApp Broadcast Campaigns' },
  { prefix: '/invoices', feature: 'gstBilling', label: '18% GST Tax Invoices & CPQ' },
  { prefix: '/quotations', feature: 'gstBilling', label: 'Quotations & CPQ' },
  { prefix: '/tickets', feature: 'slaTickets', label: 'SLA Field Service Desk' },
  { prefix: '/documents', feature: 'documentVault', label: 'Document Center Vault' },
  { prefix: '/workflows', feature: 'aiWorkflows', label: 'Zero-Code AI Workflows' },
  { prefix: '/settings/integrations', feature: 'apiWebhooks', label: 'Inbound Webhooks & REST API' },
  { prefix: '/settings/audit', feature: 'auditShield', label: 'DPDP Anti-Leak Audit Shield' },
];

export type FeatureBlockSource = 'override_off' | 'kill_switch' | 'plan' | 'user_restricted' | 'admin_only';

const PLATFORM_KEY_SET = new Set<string>(Object.keys(FEATURE_META));

export function isWorkspaceFeatureEnabled(
  tenant: TenantInfo | null | undefined,
  feature: UserFeatureKey | PlatformFeatureKey,
): boolean {
  if (!tenant) return true;

  const kills = tenant.globalKillSwitches;
  if (kills) {
    if (
      (feature === 'aiScoring' ||
        feature === 'aiCreditRisk' ||
        feature === 'aiVoiceCrm' ||
        feature === 'aiDealerDesk' ||
        feature === 'aiCopilot') &&
      kills.geminiAiEnabled === false
    ) {
      return false;
    }
    if (
      (feature === 'whatsappCloud' || feature === 'whatsappBroadcasts') &&
      kills.whatsappCloudEnabled === false
    ) {
      return false;
    }
    if (feature === 'apiWebhooks' && kills.webhooksEnabled === false) return false;
  }

  if (
    PLATFORM_KEY_SET.has(feature) &&
    tenant.effectiveFeatures &&
    typeof tenant.effectiveFeatures[feature as PlatformFeatureKey] === 'boolean'
  ) {
    return Boolean(tenant.effectiveFeatures[feature as PlatformFeatureKey]);
  }

  return true;
}

export function isFeatureEnabled(
  tenant: TenantInfo | null | undefined,
  feature: UserFeatureKey | PlatformFeatureKey,
  user?: AuthUser | null,
): boolean {
  if (!isWorkspaceFeatureEnabled(tenant, feature)) {
    return false;
  }

  if (user && (user.role === 'manager' || user.role === 'agent')) {
    if (feature === 'apiWebhooks' || feature === 'customRbac' || feature === 'auditShield') {
      return false;
    }
    if (user.featureAccess && typeof user.featureAccess[feature as UserFeatureKey] === 'boolean') {
      return Boolean(user.featureAccess[feature as UserFeatureKey]);
    }
  }

  return true;
}

export function getFeatureRestriction(
  tenant: TenantInfo | null | undefined,
  feature: UserFeatureKey | PlatformFeatureKey,
  user?: AuthUser | null,
  customLabel?: string,
): {
  feature: string;
  label: string;
  source: FeatureBlockSource;
  reasonText: string;
} | null {
  if (isFeatureEnabled(tenant, feature, user)) return null;

  const label =
    customLabel ||
    (FEATURE_META[feature as PlatformFeatureKey]?.label) ||
    USER_FEATURE_CATALOG.find((item) => item.key === feature)?.label ||
    feature;

  if (isWorkspaceFeatureEnabled(tenant, feature) && user && (user.role === 'manager' || user.role === 'agent')) {
    return {
      feature,
      label,
      source: 'user_restricted',
      reasonText: `Access to ${label} is turned OFF for your account by your Workspace Admin.`,
    };
  }

  const detailSource = tenant?.effectiveFeatureDetails?.[feature as PlatformFeatureKey]?.source;
  const source: FeatureBlockSource =
    detailSource === 'kill_switch'
      ? 'kill_switch'
      : detailSource === 'plan'
        ? 'plan'
        : 'override_off';

  const reasonText =
    source === 'kill_switch'
      ? 'This feature is temporarily unavailable for your workspace.'
      : source === 'plan'
        ? `Not included in your workspace's ${tenant?.plan || 'current'} subscription tier.`
        : 'This module is currently disabled for your workspace.';

  return { feature, label, source, reasonText };
}

export function getRouteFeatureRestriction(
  pathname: string | null | undefined,
  tenant: TenantInfo | null | undefined,
  user?: AuthUser | null,
) {
  if (!pathname) return null;

  if (
    (pathname === '/settings' || pathname.startsWith('/settings/')) &&
    user &&
    (user.role === 'manager' || user.role === 'agent')
  ) {
    return {
      feature: 'admin_only',
      label: 'Admin Settings',
      source: 'admin_only' as FeatureBlockSource,
      reasonText:
        'Organization settings, billing, webhooks, and team controls are only accessible to Workspace Owners & Admins. Use My Profile for your personal account details.',
    };
  }

  if (!tenant) return null;
  const match = ROUTE_FEATURE_RULES.find(
    (rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`),
  );
  if (!match) return null;
  return getFeatureRestriction(tenant, match.feature, user, match.label);
}
