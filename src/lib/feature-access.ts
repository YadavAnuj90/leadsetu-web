import type { PlatformFeatureKey, TenantInfo } from '@/types/contracts';

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
};

export const ROUTE_FEATURE_RULES: Array<{
  prefix: string;
  feature: PlatformFeatureKey;
}> = [
  { prefix: '/inbox', feature: 'whatsappCloud' },
  { prefix: '/campaigns', feature: 'whatsappBroadcasts' },
  { prefix: '/invoices', feature: 'gstBilling' },
  { prefix: '/quotations', feature: 'gstBilling' },
  { prefix: '/tickets', feature: 'slaTickets' },
  { prefix: '/documents', feature: 'documentVault' },
  { prefix: '/workflows', feature: 'aiWorkflows' },
  { prefix: '/settings/integrations', feature: 'apiWebhooks' },
  { prefix: '/settings/audit', feature: 'auditShield' },
];

export type FeatureBlockSource = 'override_off' | 'kill_switch' | 'plan';

export function isFeatureEnabled(
  tenant: TenantInfo | null | undefined,
  feature: PlatformFeatureKey,
): boolean {
  if (!tenant) return true;

  const kills = tenant.globalKillSwitches;
  if (kills) {
    if (feature === 'aiScoring' && kills.geminiAiEnabled === false) return false;
    if (
      (feature === 'whatsappCloud' || feature === 'whatsappBroadcasts') &&
      kills.whatsappCloudEnabled === false
    ) {
      return false;
    }
    if (feature === 'apiWebhooks' && kills.webhooksEnabled === false) return false;
  }

  if (tenant.effectiveFeatures && typeof tenant.effectiveFeatures[feature] === 'boolean') {
    return Boolean(tenant.effectiveFeatures[feature]);
  }

  return true;
}

export function getFeatureRestriction(
  tenant: TenantInfo | null | undefined,
  feature: PlatformFeatureKey,
): {
  feature: PlatformFeatureKey;
  label: string;
  source: FeatureBlockSource;
  reasonText: string;
} | null {
  if (isFeatureEnabled(tenant, feature)) return null;

  const detailSource = tenant?.effectiveFeatureDetails?.[feature]?.source;
  const source: FeatureBlockSource =
    detailSource === 'kill_switch'
      ? 'kill_switch'
      : detailSource === 'plan'
        ? 'plan'
        : 'override_off';

  const label = FEATURE_META[feature]?.label || feature;
  const reasonText =
    source === 'kill_switch'
      ? 'Temporarily disabled platform-wide via Leadsetu HQ Master Kill-Switch.'
      : source === 'plan'
        ? `Not included in your workspace's ${tenant?.plan || 'current'} subscription tier.`
        : 'Turned OFF for this workspace by Leadsetu Super Admin Authority.';

  return { feature, label, source, reasonText };
}

export function getRouteFeatureRestriction(
  pathname: string | null | undefined,
  tenant: TenantInfo | null | undefined,
) {
  if (!pathname || !tenant) return null;
  const match = ROUTE_FEATURE_RULES.find(
    (rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`),
  );
  if (!match) return null;
  return getFeatureRestriction(tenant, match.feature);
}
