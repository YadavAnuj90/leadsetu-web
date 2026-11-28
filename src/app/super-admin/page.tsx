'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  Briefcase,
  Building2,
  Cpu,
  CreditCard,
  ExternalLink,
  FileClock,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  Loader2,
  LogOut,
  Mail,
  Menu,
  MapPin,
  MessageSquare,
  PhoneCall,
  Receipt,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import OverviewSection from '@/components/super-admin/OverviewSection';
import TenantsGovernanceSection from '@/components/super-admin/TenantsGovernanceSection';
import PoliciesMatrixSection from '@/components/super-admin/PoliciesMatrixSection';
import TopupRequestsSection from '@/components/super-admin/TopupRequestsSection';
import TerritoryAnalyticsSection from '@/components/super-admin/TerritoryAnalyticsSection';
import CallingAnalyticsSection from '@/components/super-admin/CallingAnalyticsSection';
import WhatsAppProviderSection from '@/components/super-admin/WhatsAppProviderSection';
import RazorpayGatewaySection from '@/components/super-admin/RazorpayGatewaySection';
import GstinProviderSection from '@/components/super-admin/GstinProviderSection';
import AiProviderVaultSection from '@/components/super-admin/AiProviderVaultSection';
import OnboardingFunnelSection from '@/components/super-admin/OnboardingFunnelSection';
import IntegrationsWatchdogSection from '@/components/super-admin/IntegrationsWatchdogSection';
import PlatformSupportSection from '@/components/super-admin/PlatformSupportSection';
import CareersManagementSection from '@/components/super-admin/CareersManagementSection';
import ContactInquiriesSection from '@/components/super-admin/ContactInquiriesSection';
import {
  AuditLogsView,
  BillingLedgerView,
  OperatorsView,
} from '@/components/super-admin/BillingAuditOperatorsSection';
import ThemeToggle from '@/components/shared/ThemeToggle';
import { getErrorMessage } from '@/lib/api-client';
import { logoutApi } from '@/lib/auth';
import { fetchHqPlatformTicketsApi } from '@/lib/platform-tickets-api';
import { useAuthUxStore } from '@/store/auth-ux.store';
import {
  fetchPlatformAuditLogsApi,
  fetchPlatformPoliciesApi,
  fetchSuperAdminBillingApi,
  fetchSuperAdminOperatorsApi,
  fetchSuperAdminOverviewApi,
  fetchSuperAdminTenantsApi,
} from '@/lib/super-admin-api';
import { useAuthStore } from '@/store/auth.store';
import type {
  PlatformAuditLogItem,
  PlatformConfigData,
  PlatformFeatureSpec,
  SuperAdminBillingResponse,
  SuperAdminOperatorItem,
  SuperAdminOverviewResponse,
  SuperAdminTenantItem,
} from '@/types/contracts';

type SuperAdminTab =
  | 'overview'
  | 'tenants'
  | 'support_desk'
  | 'inquiries'
  | 'careers'
  | 'onboarding'
  | 'topups'
  | 'territories'
  | 'calling'
  | 'whatsapp'
  | 'razorpay'
  | 'gstin'
  | 'ai_vault'
  | 'watchdog'
  | 'policies'
  | 'billing'
  | 'audit'
  | 'operators';

type SuperAdminNavGroup =
  | 'Command & Telemetry'
  | 'Tenants & Revenue'
  | 'Infrastructure & Trust'
  | 'Security & Authority';

const NAV_GROUPS: SuperAdminNavGroup[] = [
  'Command & Telemetry',
  'Tenants & Revenue',
  'Infrastructure & Trust',
  'Security & Authority',
];

const NAV_ITEMS: Array<{
  id: SuperAdminTab;
  group: SuperAdminNavGroup;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'overview',
    group: 'Command & Telemetry',
    label: 'HQ Telemetry',
    subtitle: 'Platform health, MRR, pipeline & regional hubs',
    icon: LayoutDashboard,
  },
  {
    id: 'territories',
    group: 'Command & Telemetry',
    label: 'Territory Clusters',
    subtitle: 'Industrial cluster heatmaps, MRR & company health scores',
    icon: MapPin,
  },
  {
    id: 'calling',
    group: 'Command & Telemetry',
    label: 'Calling Analytics',
    subtitle: 'WebRTC connection success, setup speed, TURN relay % & RTT telemetry',
    icon: PhoneCall,
  },
  {
    id: 'tenants',
    group: 'Tenants & Revenue',
    label: 'Tenants & RBAC',
    subtitle: 'Inspect workspaces, quotas, modules, user RBAC & impersonation',
    icon: Building2,
  },
  {
    id: 'support_desk',
    group: 'Tenants & Revenue',
    label: 'Platform Support Desk',
    subtitle: 'Global cross-tenant bugs, glitches & service requests raised by Workspace Admins',
    icon: LifeBuoy,
  },
  {
    id: 'inquiries',
    group: 'Tenants & Revenue',
    label: 'Sales & Demo Inquiries',
    subtitle: 'Inbound walkthrough & enterprise demo leads submitted on /company/contact',
    icon: Mail,
  },
  {
    id: 'careers',
    group: 'Tenants & Revenue',
    label: 'Careers & Hiring',
    subtitle: 'Publish open jobs on /company/careers & review candidate PDF applications',
    icon: Briefcase,
  },
  {
    id: 'onboarding',
    group: 'Tenants & Revenue',
    label: 'Onboarding & Churn',
    subtitle: '1-click white-glove client workspace provisioning & trial churn rescue funnel',
    icon: Sparkles,
  },
  {
    id: 'topups',
    group: 'Tenants & Revenue',
    label: 'Top-Up Requests',
    subtitle: 'Approve Company Admin AI & WhatsApp balance requests with GST billing',
    icon: Sparkles,
  },
  {
    id: 'billing',
    group: 'Tenants & Revenue',
    label: 'SaaS GST Ledger',
    subtitle: 'Platform subscription invoices, 18% GST & seat utilization',
    icon: Receipt,
  },
  {
    id: 'whatsapp',
    group: 'Infrastructure & Trust',
    label: 'WhatsApp Provider',
    subtitle: 'Central Meta Tech Provider App (1-Click Embedded Signup) & Leadsetu Managed Gateway',
    icon: MessageSquare,
  },
  {
    id: 'razorpay',
    group: 'Infrastructure & Trust',
    label: 'Razorpay Gateway',
    subtitle: 'Encrypted Test/Live Key Vault (overriding .env), Payment Links & Webhooks',
    icon: CreditCard,
  },
  {
    id: 'gstin',
    group: 'Infrastructure & Trust',
    label: 'GSTIN Trust Vault',
    subtitle: 'Live GSTN lookup API vault & cross-tenant B2B underwriting telemetry',
    icon: ShieldCheck,
  },
  {
    id: 'ai_vault',
    group: 'Infrastructure & Trust',
    label: 'AI & Whisper Vault',
    subtitle: 'Central OpenAI Whisper STT, Gemini & Claude API key vault (overrides .env)',
    icon: Cpu,
  },
  {
    id: 'watchdog',
    group: 'Infrastructure & Trust',
    label: 'Integrations Watchdog',
    subtitle: 'Cross-tenant health & 1-click probes for WhatsApp Cloud, Meta CAPI & IndiaMART Pull v2',
    icon: Activity,
  },
  {
    id: 'policies',
    group: 'Infrastructure & Trust',
    label: 'Policies & Kill-Switches',
    subtitle: 'Master circuit breakers, maintenance, DPDP & plan matrix',
    icon: ShieldAlert,
  },
  {
    id: 'audit',
    group: 'Security & Authority',
    label: 'Security Audit Logs',
    subtitle: 'Immutable ledger of Super Admin governance actions',
    icon: FileClock,
  },
  {
    id: 'operators',
    group: 'Security & Authority',
    label: 'HQ Operators',
    subtitle: 'Manage authorized Super Admin platform operators',
    icon: KeyRound,
  },
];

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  const [activeTab, setActiveTab] = useState<SuperAdminTab>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Data state
  const [overview, setOverview] = useState<SuperAdminOverviewResponse | null>(null);
  const [tenants, setTenants] = useState<SuperAdminTenantItem[]>([]);
  const [featureCatalog, setFeatureCatalog] = useState<PlatformFeatureSpec[]>([]);
  const [policiesConfig, setPoliciesConfig] = useState<PlatformConfigData | null>(null);
  const [policySyncVersion, setPolicySyncVersion] = useState(0);
  const [billing, setBilling] = useState<SuperAdminBillingResponse | null>(null);
  const [auditLogs, setAuditLogs] = useState<PlatformAuditLogItem[]>([]);
  const [auditStats, setAuditStats] = useState({ total: 0, critical: 0, warning: 0 });
  const [openPlatformTicketsCount, setOpenPlatformTicketsCount] = useState(0);
  const [operators, setOperators] = useState<SuperAdminOperatorItem[]>([]);

  // Filters & selection
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [tenantSearch, setTenantSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [auditSeverity, setAuditSeverity] = useState('all');
  const [auditSearch, setAuditSearch] = useState('');

  // Loading & errors
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>('');
  const [quickJumpQuery, setQuickJumpQuery] = useState('');
  const [quickJumpOpen, setQuickJumpOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTenants = useCallback(async () => {
    const res = await fetchSuperAdminTenantsApi({
      search: tenantSearch.trim() || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      plan: planFilter !== 'all' ? planFilter : undefined,
    });
    setTenants(res.data || []);
    if (res.featureCatalog?.length) {
      setFeatureCatalog(res.featureCatalog);
    }
  }, [tenantSearch, statusFilter, planFilter]);

  const loadAudits = useCallback(async () => {
    const res = await fetchPlatformAuditLogsApi({
      severity: auditSeverity !== 'all' ? auditSeverity : undefined,
      search: auditSearch.trim() || undefined,
      limit: 100,
    });
    setAuditLogs(res.data || []);
    setAuditStats(res.stats || { total: 0, critical: 0, warning: 0 });
  }, [auditSeverity, auditSearch]);

  const loadAll = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    setError(null);
    try {
      const [ov, tn, pol, bil, aud, ops, plt] = await Promise.all([
        fetchSuperAdminOverviewApi(),
        fetchSuperAdminTenantsApi({
          search: tenantSearch.trim() || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          plan: planFilter !== 'all' ? planFilter : undefined,
        }),
        fetchPlatformPoliciesApi(),
        fetchSuperAdminBillingApi(),
        fetchPlatformAuditLogsApi({
          severity: auditSeverity !== 'all' ? auditSeverity : undefined,
          search: auditSearch.trim() || undefined,
          limit: 100,
        }),
        fetchSuperAdminOperatorsApi(),
        fetchHqPlatformTicketsApi({ status: 'active' }).catch(() => null),
      ]);
      setOverview(ov);
      setTenants(tn.data || []);
      setFeatureCatalog(
        pol.featureCatalog?.length ? pol.featureCatalog : tn.featureCatalog || []
      );
      setPoliciesConfig(pol.config);
      setBilling(bil);
      setAuditLogs(aud.data || []);
      setAuditStats(aud.stats || { total: 0, critical: 0, warning: 0 });
      setOperators(ops.data || []);
      if (plt?.stats) {
        setOpenPlatformTicketsCount(
          (plt.stats.openCount || 0) +
            (plt.stats.inProgressCount || 0) +
            (plt.stats.waitingAdminCount || 0),
        );
      }
      setLastSyncedAt(
        new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [tenantSearch, statusFilter, planFilter, auditSeverity, auditSearch]);

  useEffect(() => {
    loadAll(false);
    // Initial full hydration on mount; filter updates handled by targeted effects below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (initialLoading) return;
    const t = setTimeout(() => {
      loadTenants().catch(() => {});
    }, 200);
    return () => clearTimeout(t);
  }, [initialLoading, loadTenants]);

  useEffect(() => {
    if (initialLoading) return;
    const t = setTimeout(() => {
      loadAudits().catch(() => {});
    }, 200);
    return () => clearTimeout(t);
  }, [initialLoading, loadAudits]);

  const disabledSwitchCount = useMemo(() => {
    const switches =
      policiesConfig?.globalKillSwitches ||
      overview?.platformStatus?.globalKillSwitches;
    if (!switches) return 0;
    return Object.values(switches).filter((v) => v === false).length;
  }, [policiesConfig, overview]);

  const isMaintenanceMode =
    policiesConfig?.maintenanceMode ??
    overview?.platformStatus?.maintenanceMode ??
    false;

  const isSignupsAllowed =
    policiesConfig?.allowNewSignups ??
    overview?.platformStatus?.allowNewSignups ??
    true;

  const currentNav = NAV_ITEMS.find((n) => n.id === activeTab) || NAV_ITEMS[0];

  const quickJumpMatches = useMemo(() => {
    const q = quickJumpQuery.trim().toLowerCase();
    if (!q) return tenants.slice(0, 6);
    return tenants
      .filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.accountId || '').toLowerCase().includes(q) ||
          (t.city || '').toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [tenants, quickJumpQuery]);

  function handleSignOut() {
    useAuthUxStore.getState().requestLogoutConfirm({
      userName: user?.name,
      email: user?.email,
      scopeLabel: 'Leadsetu HQ Super Admin',
      onConfirm: async () => {
        await logoutApi();
        clearAuth();
        router.replace('/super-admin/login');
      },
    });
  }

  function renderSidebarContent(onPickTab?: () => void) {
    return (
      <div className="flex h-full flex-col justify-between p-4">
        <div>
          {/* HQ Brand */}
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <img
              src="/logo.png"
              alt="Leadsetu HQ"
              className="h-9 w-9 rounded-xl border border-cyan-500/30 object-cover"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-black tracking-tight text-slate-900 dark:text-white">
                  Leadsetu HQ
                </span>
                <span className="rounded-md bg-cyan-500/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
                  Root
                </span>
              </div>
              <p className="truncate text-[10px] font-medium text-slate-500 dark:text-slate-400">
                Super Admin Command Center
              </p>
            </div>
          </div>

          {/* Security Telemetry Pill */}
          <div className="mt-3 rounded-2xl border border-slate-200/80 bg-slate-50/90 p-3 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <Activity className="h-3.5 w-3.5 text-emerald-500" />
                Platform Posture
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                  isMaintenanceMode
                    ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
                    : disabledSwitchCount > 0
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                {isMaintenanceMode
                  ? 'Maintenance'
                  : disabledSwitchCount > 0
                    ? `${disabledSwitchCount} Breaker`
                    : 'Nominal'}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
              <span>Signups: {isSignupsAllowed ? 'Open' : 'Paused'}</span>
              <span>Tenants: {tenants.length}</span>
            </div>
          </div>

          {/* Grouped HQ Navigation */}
          <nav className="mt-5 space-y-4" aria-label="Super Admin Navigation">
            {NAV_GROUPS.map((group) => {
              const items = NAV_ITEMS.filter((it) => it.group === group);
              return (
                <div key={group} className="space-y-1">
                  <div className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {group}
                  </div>
                  {items.map((item) => {
                    const Icon = item.icon;
                    const active = activeTab === item.id;
                    let badge: string | number | null = null;
                    let badgeAlert = false;
                    if (item.id === 'tenants' && tenants.length > 0) {
                      badge = tenants.length;
                    } else if (
                      item.id === 'support_desk' &&
                      openPlatformTicketsCount > 0
                    ) {
                      badge = `${openPlatformTicketsCount} OPEN`;
                      badgeAlert = true;
                    } else if (
                      item.id === 'topups' &&
                      (overview?.kpis?.pendingTopupRequests || 0) > 0
                    ) {
                      badge = `${overview?.kpis?.pendingTopupRequests} NEW`;
                      badgeAlert = true;
                    } else if (
                      item.id === 'policies' &&
                      (isMaintenanceMode || disabledSwitchCount > 0)
                    ) {
                      badge = isMaintenanceMode
                        ? 'MAINT'
                        : `${disabledSwitchCount} OFF`;
                      badgeAlert = true;
                    } else if (item.id === 'audit' && auditStats.critical > 0) {
                      badge = `${auditStats.critical} CRIT`;
                      badgeAlert = true;
                    } else if (item.id === 'operators' && operators.length > 0) {
                      badge = operators.length;
                    }

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(item.id);
                          onPickTab?.();
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-bold transition ${
                          active
                            ? 'bg-[#0057FF] text-white shadow-md shadow-blue-600/25'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white'
                        }`}
                      >
                        <span className="flex items-center gap-2.5 truncate">
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </span>
                        {badge !== null && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-black shrink-0 ${
                              active
                                ? 'bg-white/20 text-white'
                                : badgeAlert
                                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                                  : 'bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom Operator Identity */}
        <div className="space-y-2.5 border-t border-slate-200/80 pt-4 dark:border-slate-800">
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-3 dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-black text-white">
                {(user?.name || 'SA').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                  {user?.name || 'Super Admin'}
                </p>
                <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                  {user?.email}
                </p>
              </div>
            </div>
            {user?.userCode && (
              <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
                <span>Operator UID</span>
                <span className="font-mono font-bold">#{user.userCode}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-[11px] font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              CRM App
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-2 text-[11px] font-bold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-shell flex min-h-screen bg-slate-50 text-slate-900 dark:bg-[#070D19] dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden w-68 shrink-0 border-r border-slate-200/85 bg-white/75 backdrop-blur-xl dark:border-slate-800/90 dark:bg-[#0B1222]/90 lg:block">
        <div className="sticky top-0 h-screen overflow-y-auto">
          {renderSidebarContent()}
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative z-10 h-full w-72 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0B1222]">
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
            {renderSidebarContent(() => setMobileNavOpen(false))}
          </div>
        </div>
      )}

      {/* Main Column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Security & Control Header */}
        <header className="sticky top-0 z-30 border-b border-slate-200/85 bg-white/80 px-4 py-3.5 backdrop-blur-xl dark:border-slate-800/90 dark:bg-[#0B1222]/85 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 lg:hidden"
                aria-label="Open HQ navigation"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {currentNav.group}
                  </span>
                  {lastSyncedAt && (
                    <span className="hidden text-[10px] font-mono text-slate-400 sm:inline">
                      Synced {lastSyncedAt}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <Shield className="h-4 w-4 text-cyan-500" />
                  <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white sm:text-lg">
                    {currentNav.label}
                  </h1>
                </div>
                <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
                  {currentNav.subtitle}
                </p>
              </div>
            </div>

            {/* Global HQ Quick-Jump Tenant Search + Status & Sync */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative hidden md:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={quickJumpQuery}
                  onFocus={() => setQuickJumpOpen(true)}
                  onBlur={() => setTimeout(() => setQuickJumpOpen(false), 180)}
                  onChange={(e) => {
                    setQuickJumpQuery(e.target.value);
                    setQuickJumpOpen(true);
                  }}
                  placeholder="Jump to tenant, #UID, city..."
                  className="w-56 rounded-xl border border-slate-200 bg-slate-50/80 pl-8 pr-3 py-1.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:w-64 focus:border-[#0057FF] focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 transition-all"
                />
                {quickJumpOpen && quickJumpMatches.length > 0 && (
                  <div className="absolute right-0 mt-1.5 w-72 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-[#0D1628] z-50">
                    <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Quick Inspect Workspace
                    </div>
                    {quickJumpMatches.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onMouseDown={() => {
                          setSelectedTenantId(t.id);
                          setActiveTab('tenants');
                          setQuickJumpOpen(false);
                          setQuickJumpQuery('');
                        }}
                        className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800/80"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-white truncate">
                            {t.name}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            #{t.accountId} · {t.city} · {t.plan.toUpperCase()}
                          </div>
                        </div>
                        <span
                          className={`ml-2 rounded-full px-2 py-0.5 text-[9px] font-black uppercase shrink-0 ${
                            t.status === 'active'
                              ? 'bg-emerald-500/15 text-emerald-600'
                              : t.status === 'suspended'
                                ? 'bg-rose-500/15 text-rose-600'
                                : 'bg-amber-500/15 text-amber-600'
                          }`}
                        >
                          {t.status}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {isMaintenanceMode ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('policies')}
                  className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/15 px-3 py-1 text-[11px] font-extrabold text-rose-600 dark:text-rose-300"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Maintenance Lock Active
                </button>
              ) : (
                <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 md:inline-flex">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Authority Guard Active
                </span>
              )}

              {!isSignupsAllowed && (
                <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                  Signups Paused
                </span>
              )}

              <ThemeToggle />

              <button
                type="button"
                onClick={() => loadAll(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
          {/* Desktop / Tablet Sidebar Footer Nav & Clean Canvas */}
          <div className="lg:hidden mt-3 px-1 overflow-x-auto pb-1">
            <div className="inline-flex items-center gap-1.5 min-w-max">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-colors ${
                      active
                        ? 'bg-[#0057FF] text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        {/* Main Workspace Body */}
        <main className="mx-auto w-full max-w-[1440px] flex-1 p-3 sm:p-6">
          {error && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs font-semibold text-rose-700 dark:text-rose-300">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => loadAll(true)}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-rose-700"
              >
                Retry Sync
              </button>
            </div>
          )}

          {initialLoading ? (
            <div className="flex min-h-[55vh] flex-col items-center justify-center gap-3 rounded-3xl border border-slate-200/80 bg-white/70 p-10 dark:border-slate-800 dark:bg-[#0D1628]/70">
              <Loader2 className="h-8 w-8 animate-spin text-[#0057FF] dark:text-cyan-400" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Synchronizing Leadsetu Platform Telemetry...
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Loading tenants, policy kill-switches, GST billing ledger & audit trail
              </p>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && overview && (
                <OverviewSection
                  overview={overview}
                  onInspectTenant={(id) => {
                    setSelectedTenantId(id);
                    setActiveTab('tenants');
                  }}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === 'tenants' && (
                <TenantsGovernanceSection
                  tenants={tenants}
                  selectedTenantId={selectedTenantId}
                  onSelectTenant={setSelectedTenantId}
                  onRefreshTenants={async () => {
                    await Promise.all([loadTenants(), loadAll(false)]);
                  }}
                  search={tenantSearch}
                  onSearchChange={setTenantSearch}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  planFilter={planFilter}
                  onPlanFilterChange={setPlanFilter}
                />
              )}

              {activeTab === 'support_desk' && (
                <PlatformSupportSection
                  onInspectTenant={(id) => {
                    setSelectedTenantId(id);
                    setActiveTab('tenants');
                  }}
                  onCountChange={(cnt) => setOpenPlatformTicketsCount(cnt)}
                />
              )}

              {activeTab === 'careers' && <CareersManagementSection />}

              {activeTab === 'inquiries' && <ContactInquiriesSection />}

              {activeTab === 'onboarding' && (
                <OnboardingFunnelSection
                  onInspectTenant={(id) => {
                    setSelectedTenantId(id);
                    setActiveTab('tenants');
                  }}
                  onWorkspaceMutated={async () => {
                    await Promise.all([loadTenants(), loadAll(false)]);
                  }}
                />
              )}

              {activeTab === 'topups' && (
                <TopupRequestsSection
                  onResolved={async () => {
                    await loadAll(false);
                  }}
                />
              )}

              {activeTab === 'territories' && (
                <TerritoryAnalyticsSection
                  onInspectTenant={(id) => {
                    setSelectedTenantId(id);
                    setActiveTab('tenants');
                  }}
                />
              )}

              {activeTab === 'calling' && <CallingAnalyticsSection />}

              {activeTab === 'whatsapp' && <WhatsAppProviderSection />}

              {activeTab === 'razorpay' && <RazorpayGatewaySection />}

              {activeTab === 'gstin' && <GstinProviderSection />}

              {activeTab === 'ai_vault' && <AiProviderVaultSection />}

              {activeTab === 'watchdog' && (
                <IntegrationsWatchdogSection
                  onInspectTenant={(id) => {
                    setSelectedTenantId(id);
                    setActiveTab('tenants');
                  }}
                />
              )}

              {activeTab === 'policies' && policiesConfig && (
                <PoliciesMatrixSection
                  key={`platform-policies-${policySyncVersion}`}
                  initialConfig={policiesConfig}
                  featureCatalog={featureCatalog}
                  onSaved={(next) => {
                    setPoliciesConfig(next);
                    setPolicySyncVersion((v) => v + 1);
                    loadAll(false).catch(() => {});
                  }}
                />
              )}

              {activeTab === 'billing' && billing && (
                <BillingLedgerView
                  billing={billing}
                  tenants={tenants}
                  planMatrix={policiesConfig?.planMatrix}
                  onRefreshBilling={async (month) => {
                    const next = await fetchSuperAdminBillingApi(month);
                    setBilling(next);
                    await Promise.all([loadTenants(), loadAudits()]);
                  }}
                />
              )}

              {activeTab === 'audit' && (
                <AuditLogsView
                  logs={auditLogs}
                  stats={auditStats}
                  severity={auditSeverity}
                  onSeverityChange={setAuditSeverity}
                  search={auditSearch}
                  onSearchChange={setAuditSearch}
                />
              )}

              {activeTab === 'operators' && (
                <OperatorsView
                  operators={operators}
                  onUpdated={(next) => {
                    setOperators(next);
                    loadAudits().catch(() => {});
                  }}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
