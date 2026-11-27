'use client';

import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Building2,
  Cpu,
  FileText,
  IndianRupee,
  Kanban,
  LifeBuoy,
  Lock,
  MapPin,
  MessageSquare,
  PhoneCall,
  Receipt,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import type { SuperAdminOverviewResponse } from '@/types/contracts';

function formatINR(n: number) {
  return `₹${Math.round(n || 0).toLocaleString('en-IN')}`;
}

export type OverviewNavTarget =
  | 'tenants'
  | 'onboarding'
  | 'watchdog'
  | 'topups'
  | 'territories'
  | 'calling'
  | 'whatsapp'
  | 'gstin'
  | 'ai_vault'
  | 'policies'
  | 'billing'
  | 'audit'
  | 'operators';

export default function OverviewSection({
  overview,
  onInspectTenant,
  onNavigateTab,
}: {
  overview: SuperAdminOverviewResponse;
  onInspectTenant: (tenantId: string) => void;
  onNavigateTab: (tab: OverviewNavTarget) => void;
}) {
  const {
    kpis,
    costTelemetry,
    planBreakdown,
    topCities,
    quotaWatchlist,
    recentTenants,
    recentAudits,
    platformStatus,
  } = overview;

  const totalPlanCount = Math.max(
    1,
    planBreakdown.starter + planBreakdown.growth + planBreakdown.enterprise,
  );
  const totalInfraCost = costTelemetry?.totalInfraCostInr ?? 0;
  const grossMarginInr = Math.max(0, (kpis.monthlyRecurringInr || 0) - totalInfraCost);
  const grossMarginPct =
    kpis.monthlyRecurringInr > 0
      ? Math.round((grossMarginInr / kpis.monthlyRecurringInr) * 100)
      : 100;

  const killSwitches = Object.entries(platformStatus.globalKillSwitches || {});
  const breakerOffCount = killSwitches.filter(([, v]) => !v).length;

  const starterPct = Math.round((planBreakdown.starter / totalPlanCount) * 100);
  const growthPct = Math.round((planBreakdown.growth / totalPlanCount) * 100);
  const enterprisePct = Math.max(0, 100 - starterPct - growthPct);

  return (
    <div className="space-y-6">
      {/* TIER 1: Executive HQ Command Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-[#0B1730] via-[#0F2347] to-[#081226] p-6 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-48 w-48 rounded-full bg-blue-600/20 blur-3xl" />

        <div className="relative flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold border ${
                  platformStatus.maintenanceMode
                    ? 'border-rose-400/40 bg-rose-500/20 text-rose-200'
                    : breakerOffCount > 0
                      ? 'border-amber-400/40 bg-amber-500/20 text-amber-200'
                      : 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    platformStatus.maintenanceMode
                      ? 'bg-rose-400'
                      : breakerOffCount > 0
                        ? 'bg-amber-400'
                        : 'bg-emerald-400 animate-pulse'
                  }`}
                />
                {platformStatus.maintenanceMode
                  ? 'Maintenance Lock Active'
                  : breakerOffCount > 0
                    ? `${breakerOffCount} Subsystem Breaker(s) Paused`
                    : 'All Platform Subsystems Nominal'}
              </span>

              {(kpis.pendingTopupRequests || 0) > 0 && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('topups')}
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-500/20 px-3 py-1 text-[11px] font-extrabold text-amber-200 hover:bg-amber-500/30 transition"
                >
                  <Sparkles className="h-3 w-3" />
                  {kpis.pendingTopupRequests} Pending Quota Top-Up Request
                  {(kpis.pendingTopupRequests || 0) > 1 ? 's' : ''} →
                </button>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Leadsetu Multi-Tenant Revenue, Infrastructure &amp; Governance Pulse
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Governing <strong className="text-white">{kpis.totalTenants}</strong> workspaces and{' '}
              <strong className="text-white">{kpis.totalUsers}</strong> CRM operators with{' '}
              <strong className="text-emerald-300">{grossMarginPct}%</strong> gross SaaS margin after SetuAI &amp; Meta WhatsApp infra burn.
            </p>
          </div>

          {/* Right Financial Anchor + Quick Action Dock */}
          <div className="flex flex-col sm:flex-row xl:flex-col items-stretch sm:items-center xl:items-end gap-4 shrink-0">
            <div className="grid grid-cols-3 gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-sky-300">
                  Active MRR
                </div>
                <div className="text-lg sm:text-xl font-black text-white mt-0.5">
                  {formatINR(kpis.monthlyRecurringInr)}
                </div>
              </div>
              <div className="border-l border-white/10 pl-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-sky-300">
                  ARR Run-Rate
                </div>
                <div className="text-lg sm:text-xl font-black text-sky-200 mt-0.5">
                  {formatINR(kpis.annualRunRateInr)}
                </div>
              </div>
              <div className="border-l border-white/10 pl-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  Gross Margin
                </div>
                <div className="text-lg sm:text-xl font-black text-emerald-300 mt-0.5">
                  {grossMarginPct}%
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'onboarding' as const, label: 'Provision / Rescue', icon: Sparkles },
                { id: 'watchdog' as const, label: 'Watchdog', icon: Activity },
                { id: 'tenants' as const, label: 'Tenants', icon: Building2 },
                { id: 'topups' as const, label: 'Top-Ups', icon: Zap },
                { id: 'policies' as const, label: 'Kill-Switches', icon: ShieldAlert },
              ].map((qa) => {
                const Icon = qa.icon;
                return (
                  <button
                    key={qa.id}
                    type="button"
                    onClick={() => onNavigateTab(qa.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-white/20 transition"
                  >
                    <Icon className="h-3.5 w-3.5 text-cyan-300" />
                    <span>{qa.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* TIER 2: 6 Structured Bento Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div
          onClick={() => onNavigateTab('tenants')}
          className="group cursor-pointer rounded-2xl p-4 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 hover:border-[#0057FF]/60 shadow-sm transition"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Workspaces
            </span>
            <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-[#0057FF] flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {kpis.totalTenants}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1 text-[10px] font-bold">
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              {kpis.activeTenants} Active
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300">
              {kpis.trialTenants} Trial
            </span>
            {kpis.suspendedTenants > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400">
                {kpis.suspendedTenants} Locked
              </span>
            )}
          </div>
        </div>

        <div className="rounded-2xl p-4 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Platform Seats
            </span>
            <div className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {kpis.totalUsers}
          </div>
          <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-2">
            {kpis.activeUsers} active licensed seats
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('billing')}
          className="cursor-pointer rounded-2xl p-4 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 hover:border-emerald-500/50 shadow-sm transition"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              SaaS Billed
            </span>
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {formatINR(kpis.totalSubscriptionBilledInr)}
          </div>
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-2">
            18% GST Tax: {formatINR(kpis.totalGstCollectedInr)}
          </div>
        </div>

        <div className="rounded-2xl p-4 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              CRM Pipeline Data
            </span>
            <div className="h-7 w-7 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
              <Kanban className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {(kpis.totalLeads + kpis.totalDeals).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-2">
            {kpis.totalLeads} Leads · {kpis.totalDeals} Deals
          </div>
        </div>

        <div className="rounded-2xl p-4 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Infra Burn (Est.)
            </span>
            <div className="h-7 w-7 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center">
              <Cpu className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {formatINR(totalInfraCost)}
          </div>
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-2">
            AI ₹{costTelemetry?.totalMonthlyAiCostInr ?? 0} · WA ₹
            {costTelemetry?.totalMonthlyWaCostInr ?? 0}
          </div>
        </div>

        <div className="rounded-2xl p-4 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Billing &amp; SLA Ops
            </span>
            <div className="h-7 w-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <LifeBuoy className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {(kpis.totalInvoices + kpis.totalTickets).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-2">
            {kpis.totalInvoices} Invoices · {kpis.totalTickets} Tickets
          </div>
        </div>
      </div>

      {/* TIER 3: Subsystems + Plan Mix (Left 5 cols) vs Unit Economics & Quota Watchlist (Right 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-6">
          {/* Plan Mix & Revenue Stack */}
          <div className="rounded-2xl p-5 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#0057FF]" />
                Subscription Plan Mix
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab('billing')}
                className="text-xs font-bold text-[#0057FF] dark:text-sky-400 hover:underline"
              >
                SaaS Ledger →
              </button>
            </div>

            {/* Proportional Stacked Bar */}
            <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
              <div
                className="h-full bg-violet-500 transition-all"
                style={{ width: `${enterprisePct}%` }}
                title={`Enterprise: ${planBreakdown.enterprise}`}
              />
              <div
                className="h-full bg-[#0057FF] transition-all"
                style={{ width: `${growthPct}%` }}
                title={`Growth: ${planBreakdown.growth}`}
              />
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${starterPct}%` }}
                title={`Starter: ${planBreakdown.starter}`}
              />
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-xs">
              {[
                {
                  key: 'enterprise',
                  label: 'Enterprise',
                  price: '₹5,499/mo',
                  count: planBreakdown.enterprise,
                  pct: enterprisePct,
                  dot: 'bg-violet-500',
                },
                {
                  key: 'growth',
                  label: 'Growth',
                  price: '₹2,399/mo',
                  count: planBreakdown.growth,
                  pct: growthPct,
                  dot: 'bg-[#0057FF]',
                },
                {
                  key: 'starter',
                  label: 'Starter',
                  price: '₹999/mo',
                  count: planBreakdown.starter,
                  pct: starterPct,
                  dot: 'bg-emerald-500',
                },
              ].map((tier) => (
                <div
                  key={tier.key}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800"
                >
                  <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
                    <span className={`h-2 w-2 rounded-full ${tier.dot}`} />
                    <span>{tier.label}</span>
                  </div>
                  <div className="text-base font-black text-slate-900 dark:text-white mt-1">
                    {tier.count}{' '}
                    <span className="text-[11px] font-semibold text-slate-400">
                      ({tier.pct}%)
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">{tier.price}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Global Subsystem Kill-Switch Matrix */}
          <div className="rounded-2xl p-5 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Global Subsystem Matrix
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab('policies')}
                className="text-xs font-bold text-[#0057FF] dark:text-sky-400 hover:underline"
              >
                Kill-Switches →
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {killSwitches.map(([key, enabled]) => (
                <div
                  key={key}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-bold ${
                    enabled
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-800 dark:text-slate-100'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  <span className="truncate capitalize">
                    {key.replace('Enabled', '').replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-black uppercase ${
                      enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        enabled ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                    {enabled ? 'ON' : 'OFF'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Regional Tenant Hubs */}
          <div className="rounded-2xl p-5 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-500" />
                Regional Cluster Density
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab('territories')}
                className="text-xs font-bold text-[#0057FF] dark:text-sky-400 hover:underline"
              >
                Cluster Map →
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {topCities.map((c) => (
                <div
                  key={c.city}
                  className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between"
                >
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                    {c.city}
                  </span>
                  <span className="text-xs font-black text-[#0057FF] dark:text-sky-400">
                    {c.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Unit Economics & Quota Watchlist */}
        <div className="lg:col-span-7 rounded-2xl p-5 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Quota Metering &amp; Tenant Unit Economics
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time SetuAI &amp; Meta WhatsApp consumption vs. workspace MRR.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('tenants')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#0057FF] hover:text-white text-xs font-bold text-slate-700 dark:text-slate-200 transition"
              >
                All Workspaces →
              </button>
            </div>

            {costTelemetry && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800">
                  <div className="text-[10px] font-bold uppercase text-slate-400">AI Infra</div>
                  <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                    {formatINR(costTelemetry.totalMonthlyAiCostInr)}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800">
                  <div className="text-[10px] font-bold uppercase text-slate-400">WhatsApp Infra</div>
                  <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                    {formatINR(costTelemetry.totalMonthlyWaCostInr)}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
                  <div className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-300">
                    80% / 100% Caps
                  </div>
                  <div className="text-sm font-black text-amber-700 dark:text-amber-300 mt-0.5">
                    {costTelemetry.warning80Count} / {costTelemetry.exceeded100Count}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25">
                  <div className="text-[10px] font-bold uppercase text-rose-500">
                    Negative Margin
                  </div>
                  <div className="text-sm font-black text-rose-600 dark:text-rose-300 mt-0.5">
                    {costTelemetry.unprofitableTenantsCount} tenant
                    {costTelemetry.unprofitableTenantsCount === 1 ? '' : 's'}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {quotaWatchlist.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  All workspaces are well below quota thresholds.
                </div>
              ) : (
                quotaWatchlist.map((w) => (
                  <div
                    key={w.id}
                    className={`p-3.5 rounded-2xl border flex flex-col gap-3 ${
                      w.unprofitable || w.alertLevel === 'exceeded_100'
                        ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-300/80 dark:border-rose-800/70'
                        : w.alertLevel === 'warning_80'
                          ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300/80 dark:border-amber-800/70'
                          : 'bg-slate-50/80 dark:bg-slate-900/75 border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        <span className="font-mono text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                          #{w.accountId || '00000'}
                        </span>
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {w.name}
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/70 text-[#0057FF] dark:text-sky-400">
                          {w.plan}
                        </span>
                        {w.unprofitable && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-600 text-white">
                            Negative Margin
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {typeof w.totalInfraCostInr === 'number' && (
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            Burn/MRR:{' '}
                            <strong
                              className={
                                w.unprofitable
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }
                            >
                              ₹{w.totalInfraCostInr} / ₹{w.mrrInr ?? 0}
                            </strong>
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => onInspectTenant(w.id)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#0057FF] text-xs font-bold text-slate-800 dark:text-white transition"
                        >
                          <span>Govern</span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-[#0057FF]" />
                        </button>
                      </div>
                    </div>

                    {/* Visual Utilization Meters */}
                    <div className="grid grid-cols-3 gap-3 text-[11px]">
                      {[
                        { label: 'Seats', pct: w.seatPct, detail: `${w.seatsUsed}/${w.seatLimit}` },
                        { label: 'SetuAI', pct: w.aiPct, detail: `${w.aiPct}%` },
                        { label: 'WhatsApp', pct: w.waPct ?? 0, detail: `${w.waPct ?? 0}%` },
                      ].map((m) => (
                        <div key={m.label} className="space-y-1">
                          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                            <span>{m.label}</span>
                            <strong className="text-slate-800 dark:text-slate-200">
                              {m.detail}
                            </strong>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                m.pct >= 100
                                  ? 'bg-rose-500'
                                  : m.pct >= 80
                                    ? 'bg-amber-500'
                                    : 'bg-[#0057FF]'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(3, m.pct))}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bottom Quick Insights Links inside Watchlist Card */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Need live WebRTC / Calling health telemetry?
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('calling')}
              className="inline-flex items-center gap-1.5 font-bold text-[#0057FF] dark:text-sky-400 hover:underline"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Open Calling &amp; TURN Telemetry →</span>
            </button>
          </div>
        </div>
      </div>

      {/* TIER 4: Operations & Security Trail Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 rounded-2xl p-5 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-500" />
              Newest Tenant Workspaces
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('tenants')}
              className="text-xs font-bold text-[#0057FF] dark:text-sky-400 hover:underline"
            >
              Directory →
            </button>
          </div>
          <div className="space-y-2.5">
            {recentTenants.map((t) => (
              <div
                key={t.id}
                onClick={() => onInspectTenant(t.id)}
                className="p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:border-[#0057FF]/60 hover:bg-slate-50/70 dark:hover:bg-slate-900/50 cursor-pointer flex items-center justify-between gap-2 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 text-white text-xs font-black flex items-center justify-center shrink-0">
                    {t.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                      {t.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      #{t.accountId} · {t.city} · {t.seatsUsed}/{t.seatLimit} seats
                    </div>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full shrink-0 ${
                    t.status === 'active'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : t.status === 'suspended'
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                  }`}
                >
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 rounded-2xl p-5 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Recent HQ Security &amp; Governance Trail
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('audit')}
              className="text-xs font-bold text-[#0057FF] dark:text-sky-400 hover:underline"
            >
              Full Audit Feed →
            </button>
          </div>
          {recentAudits.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No governance interventions recorded yet. All changes made inside Super Admin are immutably logged here.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentAudits.map((a) => (
                <div
                  key={a.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          a.severity === 'critical'
                            ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
                            : a.severity === 'warning'
                              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                              : 'bg-blue-500/20 text-blue-600 dark:text-sky-300'
                        }`}
                      >
                        {a.severity}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {a.action}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                      {a.summary}
                    </div>
                    {a.reason && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Reason: {a.reason}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap font-mono">
                    {new Date(a.createdAt).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
