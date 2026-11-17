'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  Building2,
  ExternalLink,
  FileClock,
  KeyRound,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  MapPin,
  Receipt,
  RefreshCw,
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
import {
  AuditLogsView,
  BillingLedgerView,
  OperatorsView,
} from '@/components/super-admin/BillingAuditOperatorsSection';
import ThemeToggle from '@/components/shared/ThemeToggle';
import { getErrorMessage } from '@/lib/api-client';
import { logoutApi } from '@/lib/auth';
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
  | 'topups'
  | 'territories'
  | 'policies'
  | 'billing'
  | 'audit'
  | 'operators';

const NAV_ITEMS: Array<{
  id: SuperAdminTab;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'overview',
    label: 'HQ Telemetry',
    subtitle: 'Platform health, MRR, pipeline & regional hubs',
    icon: LayoutDashboard,
  },
  {
    id: 'tenants',
    label: 'Tenants & RBAC',
    subtitle: 'Inspect workspaces, quotas, modules, user RBAC & impersonation',
    icon: Building2,
  },
  {
    id: 'topups',
    label: 'Top-Up Requests',
    subtitle: 'Approve Company Admin AI & WhatsApp balance requests with GST billing',
    icon: Sparkles,
  },
  {
    id: 'territories',
    label: 'Territory Clusters',
    subtitle: 'Industrial cluster heatmaps, MRR & company health scores',
    icon: MapPin,
  },
  {
    id: 'policies',
    label: 'Policies & Kill-Switches',
    subtitle: 'Master circuit breakers, maintenance, DPDP & plan matrix',
    icon: ShieldAlert,
  },
  {
    id: 'billing',
    label: 'SaaS GST Ledger',
    subtitle: 'Platform subscription invoices, 18% GST & seat utilization',
    icon: Receipt,
  },
  {
    id: 'audit',
    label: 'Security Audit Logs',
    subtitle: 'Immutable ledger of Super Admin governance actions',
    icon: FileClock,
  },
  {
    id: 'operators',
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
      const [ov, tn, pol, bil, aud, ops] = await Promise.all([
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

  async function handleSignOut() {
    await logoutApi();
    clearAuth();
    router.replace('/super-admin/login');
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

          {/* Nav Links */}
          <nav className="mt-5 space-y-1.5" aria-label="Super Admin Navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              let badge: string | number | null = null;
              let badgeAlert = false;
              if (item.id === 'tenants' && tenants.length > 0) {
                badge = tenants.length;
              } else if (
                item.id === 'topups' &&
                (overview?.kpis?.pendingTopupRequests || 0) > 0
              ) {
                badge = `${overview?.kpis?.pendingTopupRequests} NEW`;
                badgeAlert = true;
              } else if (item.id === 'policies' && (isMaintenanceMode || disabledSwitchCount > 0)) {
                badge = isMaintenanceMode ? 'MAINT' : `${disabledSwitchCount} OFF`;
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
                  className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-xs font-bold transition ${
                    active
                      ? 'bg-[#0057FF] text-white shadow-md shadow-blue-600/25'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </span>
                  {badge !== null && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
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

            <div className="flex flex-wrap items-center gap-2">
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
        </header>

        {/* Main Workspace Body */}
        <main className="mx-auto w-full max-w-[1440px] flex-1 p-4 sm:p-6">
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
