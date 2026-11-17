'use client';

import {
  Building2,
  Users,
  IndianRupee,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Sparkles,
  FileText,
  Kanban,
  LifeBuoy,
  MapPin,
  ArrowUpRight,
  Zap,
  Lock,
} from 'lucide-react';
import type { SuperAdminOverviewResponse } from '@/types/contracts';

function formatINR(n: number) {
  return `₹${(n || 0).toLocaleString('en-IN')}`;
}

export default function OverviewSection({
  overview,
  onInspectTenant,
  onNavigateTab,
}: {
  overview: SuperAdminOverviewResponse;
  onInspectTenant: (tenantId: string) => void;
  onNavigateTab: (tab: 'tenants' | 'policies' | 'billing' | 'audit' | 'operators') => void;
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
    planBreakdown.starter + planBreakdown.growth + planBreakdown.enterprise
  );

  const killSwitches = Object.entries(platformStatus.globalKillSwitches || {});

  return (
    <div className="space-y-6">
      {/* Top 6 KPI Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="rounded-2xl p-4 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Workspaces
            </span>
            <Building2 className="w-4 h-4 text-[#0057FF]" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {kpis.totalTenants}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold">
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              {kpis.activeTenants} Active
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-300">
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
              Platform Users
            </span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {kpis.totalUsers}
          </div>
          <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1.5">
            {kpis.activeUsers} active seats online
          </div>
        </div>

        <div className="rounded-2xl p-4 bg-gradient-to-br from-[#0F244A] to-[#08152E] text-white border border-blue-500/30 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-300">
              Active MRR
            </span>
            <IndianRupee className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {formatINR(kpis.monthlyRecurringInr)}
          </div>
          <div className="text-[11px] font-semibold text-sky-200 mt-1.5">
            ARR Run-Rate: {formatINR(kpis.annualRunRateInr)}
          </div>
        </div>

        <div className="rounded-2xl p-4 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              SaaS Billed (Incl. GST)
            </span>
            <FileText className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {formatINR(kpis.totalSubscriptionBilledInr)}
          </div>
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1.5">
            18% GST Tax: {formatINR(kpis.totalGstCollectedInr)}
          </div>
        </div>

        <div className="rounded-2xl p-4 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              CRM Objects Synced
            </span>
            <Kanban className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {kpis.totalLeads + kpis.totalDeals}
          </div>
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1.5">
            {kpis.totalLeads} Leads · {kpis.totalDeals} Deals
          </div>
        </div>

        <div className="rounded-2xl p-4 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              GST &amp; SLA Volume
            </span>
            <LifeBuoy className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {kpis.totalInvoices + kpis.totalTickets}
          </div>
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1.5">
            {kpis.totalInvoices} Invoices · {kpis.totalTickets} Tickets
          </div>
        </div>
      </div>

      {/* Platform Health & Global Kill-Switch Telemetry Strip */}
      <div className="rounded-2xl p-4 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-xs font-extrabold text-slate-800 dark:text-slate-100">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span>Global Subsystems</span>
          </div>

          {killSwitches.map(([key, enabled]) => (
            <span
              key={key}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                enabled
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25'
                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/35'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  enabled ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
              {key.replace('Enabled', '')}
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('policies')}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0057FF] hover:bg-blue-700 text-white text-xs font-bold transition-colors"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Manage Kill-Switches &amp; Policies</span>
        </button>
      </div>

      {/* Middle Analytics Grid: Plan Mix + Cities + Quota Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Plan Distribution + City Hubs */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl p-5 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0057FF]" />
                Subscription Plan Distribution
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab('billing')}
                className="text-xs font-bold text-[#0057FF] dark:text-sky-400 hover:underline"
              >
                Billing Ledger →
              </button>
            </div>

            <div className="space-y-3">
              {[
                { key: 'enterprise', label: 'Enterprise (₹5,499/mo)', count: planBreakdown.enterprise, color: 'bg-violet-500' },
                { key: 'growth', label: 'Growth (₹2,399/mo)', count: planBreakdown.growth, color: 'bg-[#0057FF]' },
                { key: 'starter', label: 'Starter (₹999/mo)', count: planBreakdown.starter, color: 'bg-emerald-500' },
              ].map((item) => {
                const pct = Math.round((item.count / totalPlanCount) * 100);
                return (
                  <div key={item.key} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700 dark:text-slate-200">{item.label}</span>
                      <span className="text-slate-900 dark:text-white">
                        {item.count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{ width: `${Math.max(4, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl p-5 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-500" />
              Top Regional Tenant Hubs
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {topCities.map((c) => (
                <div
                  key={c.city}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between"
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

        {/* Quota & Seat Saturation Watchlist */}
        <div className="lg:col-span-7 rounded-2xl p-5 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Live Quota Metering, Cost Telemetry &amp; Unit Economics
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tracks Gemini AI &amp; Meta WhatsApp infra spend vs. MRR to catch unprofitable heavy tenants.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('tenants')}
                className="text-xs font-bold text-[#0057FF] dark:text-sky-400 hover:underline"
              >
                All Tenants →
              </button>
            </div>

            {costTelemetry && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800">
                  <div className="text-[10px] font-bold uppercase text-slate-400">AI Cost (Est.)</div>
                  <div className="text-sm font-black text-slate-900 dark:text-white">
                    ₹{costTelemetry.totalMonthlyAiCostInr.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800">
                  <div className="text-[10px] font-bold uppercase text-slate-400">WhatsApp Cost</div>
                  <div className="text-sm font-black text-slate-900 dark:text-white">
                    ₹{costTelemetry.totalMonthlyWaCostInr.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800">
                  <div className="text-[10px] font-bold uppercase text-slate-400">80%+ / 100% Alerts</div>
                  <div className="text-sm font-black text-amber-600 dark:text-amber-300">
                    {costTelemetry.warning80Count} / {costTelemetry.exceeded100Count}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25">
                  <div className="text-[10px] font-bold uppercase text-rose-500">Unprofitable</div>
                  <div className="text-sm font-black text-rose-600 dark:text-rose-300">
                    {costTelemetry.unprofitableTenantsCount} tenant{costTelemetry.unprofitableTenantsCount === 1 ? '' : 's'}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {quotaWatchlist.map((w) => (
                <div
                  key={w.id}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    w.unprofitable || w.alertLevel === 'exceeded_100'
                      ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-300/80 dark:border-rose-800/70'
                      : w.alertLevel === 'warning_80'
                        ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300/80 dark:border-amber-800/70'
                        : 'bg-slate-50 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
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
                      {w.alertLevel === 'exceeded_100' && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-300">
                          100% Cap Hit
                        </span>
                      )}
                      {w.alertLevel === 'warning_80' && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                          80%+ Quota
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>
                        Seats: <strong className="text-slate-800 dark:text-slate-200">{w.seatsUsed}/{w.seatLimit}</strong> ({w.seatPct}%)
                      </span>
                      <span>
                        AI: <strong className="text-slate-800 dark:text-slate-200">{w.aiPct}%</strong>
                      </span>
                      <span>
                        WA: <strong className="text-slate-800 dark:text-slate-200">{w.waPct ?? 0}%</strong>
                      </span>
                      {typeof w.totalInfraCostInr === 'number' && (
                        <span>
                          Cost/MRR:{' '}
                          <strong className={w.unprofitable ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                            ₹{w.totalInfraCostInr} / ₹{w.mrrInr ?? 0}
                          </strong>
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onInspectTenant(w.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#0057FF] text-xs font-bold text-slate-800 dark:text-white transition-colors self-start sm:self-center"
                  >
                    <span>Govern</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#0057FF]" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Workspaces & Immutable HQ Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 rounded-2xl p-5 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Newest Tenant Signups
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('tenants')}
              className="text-xs font-bold text-[#0057FF] dark:text-sky-400 hover:underline"
            >
              Manage →
            </button>
          </div>
          <div className="space-y-2.5">
            {recentTenants.map((t) => (
              <div
                key={t.id}
                onClick={() => onInspectTenant(t.id)}
                className="p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:border-[#0057FF]/60 cursor-pointer flex items-center justify-between gap-2 transition-colors"
              >
                <div className="min-w-0">
                  <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                    {t.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    #{t.accountId} · {t.city} · {t.seatsUsed}/{t.seatLimit} seats
                  </div>
                </div>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
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
            <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No governance interventions recorded yet. All changes made inside Super Admin are immutably logged here.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentAudits.map((a) => (
                <div
                  key={a.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 flex items-start justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
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
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
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
