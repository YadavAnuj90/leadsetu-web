'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useLeads } from '@/hooks/useLeads';
import {
  fetchAnalyticsOverview,
  type AnalyticsOverviewResponse,
} from '@/lib/analytics-api';
import {
  USER_FEATURE_CATALOG,
  isFeatureEnabled,
  isWorkspaceAdminRole,
} from '@/lib/feature-access';
import { QuotaCommissionWidget } from '@/components/team/QuotaCommissionWidget';
import {
  Sparkles,
  TrendingUp,
  Users,
  Flame,
  IndianRupee,
  CheckCircle2,
  ArrowUpRight,
  Plus,
  Receipt,
  MessageSquare,
  Workflow,
  ShieldCheck,
  UserCircle2,
  Target,
  MapPin,
  Lock,
  Kanban,
  FileText,
  Clock,
  Award,
  AlertTriangle,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, tenant } = useAuth();
  const isAdmin = isWorkspaceAdminRole(user);
  const leadsEnabled = isFeatureEnabled(tenant, 'leads', user);
  const dealsEnabled = isFeatureEnabled(tenant, 'deals', user);
  const aiScoringEnabled = isFeatureEnabled(tenant, 'aiScoring', user);
  const invoicesEnabled = isFeatureEnabled(tenant, 'gstBilling', user);
  const campaignsEnabled = isFeatureEnabled(tenant, 'whatsappBroadcasts', user);
  const workflowsEnabled = isFeatureEnabled(tenant, 'aiWorkflows', user);

  const { leads, stats, isLoading } = useLeads();
  const [overview, setOverview] = useState<AnalyticsOverviewResponse | null>(
    null,
  );

  useEffect(() => {
    fetchAnalyticsOverview()
      .then((res) => setOverview(res))
      .catch(() => {});
  }, [leads.length]);

  const ov = overview?.summary;

  const assignedModules = useMemo(
    () =>
      USER_FEATURE_CATALOG.filter((item) =>
        isFeatureEnabled(tenant, item.key, user),
      ),
    [tenant, user],
  );

  const userDisplayId = user?.userCode;
  const roleLabel =
    user?.role === 'manager'
      ? 'Sales Manager'
      : user?.role === 'agent'
        ? 'Sales User'
        : user?.role === 'owner'
          ? 'Company Owner'
          : 'Company Admin';

  const totalPipelineValue =
    stats.totalPipelineValue + (ov?.openDealsValue || 0);
  const collectionRate = Math.min(
    100,
    Math.max(0, Math.round(ov?.collectionRatePct || 0)),
  );

  const stageFunnel = overview?.stageFunnel || [];
  const maxStageVal = Math.max(
    1,
    ...stageFunnel.map((s) => Number(s.value) || 0),
  );
  const sourceBreakdown = overview?.sourceBreakdown || [];
  const leaderboard = overview?.repLeaderboard || [];

  const kpis = isAdmin
    ? [
        {
          label: 'Total Active Leads',
          value: stats.total.toLocaleString('en-IN'),
          sub: `${stats.hotCount} hot AI leads · Avg ${stats.avgAiScore}/100`,
          icon: Users,
          accent: '#3978EA',
          href: '/leads',
        },
        {
          label: 'Open Sales Pipeline',
          value: `₹${totalPipelineValue.toLocaleString('en-IN')}`,
          sub: `₹${(ov?.weightedForecast || 0).toLocaleString('en-IN')} weighted · ${ov?.dealWinRatePct || 0}% win`,
          icon: IndianRupee,
          accent: '#10B981',
          href: '/deals',
        },
        {
          label: 'GST Invoiced & Realized',
          value: `₹${(ov?.totalInvoiced || 0).toLocaleString('en-IN')}`,
          sub: `₹${(ov?.paidInvoicesRevenue || 0).toLocaleString('en-IN')} collected (${collectionRate}%)`,
          icon: TrendingUp,
          accent: '#8B5CF6',
          href: '/invoices',
        },
        {
          label: 'Action Queue & Overdue',
          value: `${(ov?.pendingTasksCount || 0) + (ov?.overdueInvoicesCount || 0)}`,
          sub: `${ov?.pendingTasksCount || 0} follow-ups · ${ov?.overdueInvoicesCount || 0} overdue · ${ov?.openTicketsCount || 0} SLAs`,
          icon: Clock,
          accent: '#F59E0B',
          href: '/tasks',
        },
      ]
    : [
        ...(leadsEnabled
          ? [
              {
                label: 'Active Leads',
                value: stats.total.toLocaleString('en-IN'),
                sub: `${stats.hotCount} hot leads · Avg AI ${stats.avgAiScore}/100`,
                icon: Flame,
                accent: '#3978EA',
                href: '/leads',
              },
              {
                label: 'Pipeline Value (INR)',
                value: `₹${totalPipelineValue.toLocaleString('en-IN')}`,
                sub: `₹${(ov?.weightedForecast || 0).toLocaleString('en-IN')} weighted forecast`,
                icon: IndianRupee,
                accent: '#10B981',
                href: '/deals',
              },
            ]
          : []),
        {
          label: 'Monthly Sales Target',
          value: `₹${Number(user?.monthlyTarget || 0).toLocaleString('en-IN')}`,
          sub: user?.territory
            ? `Territory: ${user.territory}`
            : 'Personal Monthly Quota',
          icon: Target,
          accent: '#8B5CF6',
          href: '/profile',
        },
        {
          label: 'Assigned CRM Tools',
          value: `${assignedModules.length} / ${USER_FEATURE_CATALOG.length}`,
          sub: `${roleLabel} Access Scope`,
          icon: ShieldCheck,
          accent: '#059669',
          href: '/profile',
        },
      ];

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Executive Welcome Hero + Quick Command Actions */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-white/10"
        style={{
          background: isAdmin
            ? 'linear-gradient(130deg, #0D1B35 0%, #163060 52%, #1D56C9 100%)'
            : 'linear-gradient(130deg, #0D2342 0%, #193E8A 55%, #0D9488 100%)',
        }}
      >
        <div
          className="pointer-events-none absolute -right-24 -top-24 w-72 h-72 rounded-full opacity-25 blur-3xl"
          style={{ background: '#38BDF8' }}
        />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-sky-100 border border-white/15 backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 text-sky-300" /> {roleLabel}{' '}
                Command Center
              </span>
              {tenant?.accountId && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-extrabold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  Acct #{tenant.accountId}
                </span>
              )}
              {!isAdmin && userDisplayId && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-bold bg-white/10 text-slate-100">
                  User #{userDisplayId}
                </span>
              )}
              {user?.territory && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-slate-100">
                  <MapPin className="w-3 h-3" /> {user.territory}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Namaste, {user?.name || 'Team Member'}!
            </h1>

            <p className="text-slate-200 text-xs sm:text-sm">
              Workspace:{' '}
              <strong className="text-white">
                {tenant?.companyName?.trim() || 'Leadsetu CRM'}
              </strong>{' '}
              {tenant?.city ? `(${tenant.city})` : ''}
              {isAdmin && (
                <>
                  {' '}
                  ·{' '}
                  <span className="text-emerald-300 font-bold capitalize">
                    {tenant?.plan || 'Growth'} Plan Active
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Instant Action Pills */}
          <div className="flex flex-wrap items-center gap-2.5">
            {leadsEnabled && (
              <Link
                href="/leads"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F8FAFC] to-[#E0F2FE] hover:from-[#FFFFFF] hover:to-[#BAE6FD] text-[#071021] text-xs font-extrabold shadow-lg shadow-sky-950/30 border border-white/60 transition-all hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4 text-[#0057FF]" />
                <span>Manage Leads</span>
              </Link>
            )}
            {dealsEnabled && (
              <Link
                href="/deals"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-bold text-white transition-colors"
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>Deals Board</span>
              </Link>
            )}
            {invoicesEnabled && (
              <Link
                href="/quotations"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-bold text-white transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>New GST Quote</span>
              </Link>
            )}
            {!isAdmin && (
              <Link
                href="/profile"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-bold text-white transition-colors"
              >
                <UserCircle2 className="w-4 h-4" />
                <span>Profile</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Primary Elevated KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.label}
              href={s.href}
              className="group relative overflow-hidden rounded-3xl bg-white dark:bg-[#0D172B] border border-slate-200/80 dark:border-slate-700/75 p-5 shadow-sm hover:shadow-lg hover:border-brand-blue/50 dark:hover:border-sky-500/50 transition-all"
            >
              <div
                className="absolute inset-x-0 top-0 h-1"
                style={{ background: s.accent }}
              />
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {s.label}
                </span>
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${s.accent}1A`, color: s.accent }}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-[26px] font-black text-brand-navy dark:text-white tracking-tight">
                {s.value}
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <span
                  className="text-xs font-semibold truncate"
                  style={{ color: s.accent }}
                >
                  {s.sub}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-blue flex-shrink-0" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Personal Monthly Quota Ring & Estimated Commission Widget */}
      <QuotaCommissionWidget />

      {/* Non-Admin Assigned Modules Workspace Hub */}
      {!isAdmin && (
        <div className="rounded-3xl bg-white dark:bg-[#0D172B] border border-slate-200/80 dark:border-slate-700/75 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-extrabold text-base text-brand-navy dark:text-white">
                Your Assigned CRM Modules
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enabled specifically for your {roleLabel} role by your Workspace Admin
              </p>
            </div>
            <Link
              href="/profile"
              className="text-xs font-bold px-3.5 py-2 rounded-xl bg-brand-light text-brand-blue hover:bg-brand-blue hover:text-white transition-colors inline-flex items-center gap-1.5 self-start"
            >
              <UserCircle2 className="w-3.5 h-3.5" />
              View Profile &amp; Permissions
            </Link>
          </div>

          {assignedModules.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
              <Lock className="w-6 h-6 text-slate-400 mx-auto" />
              <div className="text-sm font-bold text-brand-navy dark:text-white">
                No CRM Modules Assigned Yet
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Ask your Workspace Admin to toggle modules ON for your account in Team Management.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {assignedModules.map((mod) => (
                <Link
                  key={mod.key}
                  href={mod.href}
                  className="group p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/70 bg-slate-50/70 dark:bg-slate-900/50 hover:border-brand-blue transition-all flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="text-sm font-extrabold text-brand-navy dark:text-white group-hover:text-brand-blue transition-colors">
                      {mod.label}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {mod.description}
                    </p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-brand-blue shrink-0 mt-0.5" />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Admin Visual Intelligence Strip: Stage Funnel + AR Cashflow & Ops Pulse */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left (7 cols): Deal Stage Funnel & Lead Channel Mix */}
          <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-[#0D172B] border border-slate-200/80 dark:border-slate-700/75 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-extrabold text-base text-brand-navy dark:text-white">
                  Revenue Pipeline Stage Funnel
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Live deal distribution &amp; INR value across stages
                </p>
              </div>
              <Link
                href="/deals"
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-brand-light dark:bg-sky-500/15 text-brand-blue dark:text-sky-300 hover:bg-brand-blue hover:text-white transition-colors inline-flex items-center gap-1"
              >
                <span>Open Kanban</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {stageFunnel.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Pipeline stage distribution will appear as deals are added.
              </div>
            ) : (
              <div className="space-y-3">
                {stageFunnel.map((st) => {
                  const pct = Math.max(
                    8,
                    Math.round(((Number(st.value) || 0) / maxStageVal) * 100),
                  );
                  return (
                    <div key={st.stage} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-brand-navy dark:text-slate-200 capitalize">
                          {st.label}{' '}
                          <span className="text-slate-400 font-semibold">
                            ({st.count})
                          </span>
                        </span>
                        <span className="font-extrabold text-brand-navy dark:text-white">
                          ₹{(Number(st.value) || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            background:
                              st.stage === 'won'
                                ? 'linear-gradient(90deg, #10B981, #34D399)'
                                : 'linear-gradient(90deg, #0057FF, #38BDF8)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {sourceBreakdown.length > 0 && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Lead Acquisition Mix
                </div>
                <div className="flex flex-wrap gap-2">
                  {sourceBreakdown.slice(0, 5).map((src) => (
                    <div
                      key={src.key}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 text-xs"
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: src.color || '#3978EA' }}
                      />
                      <span className="font-bold text-brand-navy dark:text-slate-200">
                        {src.label}
                      </span>
                      <span className="text-slate-400 font-semibold">
                        {src.count} ({src.sharePct}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right (5 cols): Udhaar Receivables & Cross-Module Ops */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* GST & Udhaar Collection Health Card */}
            <div className="rounded-3xl bg-white dark:bg-[#0D172B] border border-slate-200/80 dark:border-slate-700/75 p-5 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    GST Receivables &amp; Udhaar
                  </div>
                  <div className="text-xl font-black text-brand-navy dark:text-white mt-0.5">
                    ₹{(ov?.pendingReceivables || 0).toLocaleString('en-IN')}{' '}
                    <span className="text-xs font-semibold text-slate-400">
                      pending
                    </span>
                  </div>
                </div>
                <Link
                  href="/invoices"
                  className="p-2.5 rounded-xl bg-brand-blue/10 text-brand-blue dark:bg-sky-500/15 dark:text-sky-300 hover:bg-brand-blue hover:text-white transition-colors"
                  title="Open GST Invoices & Udhaar Recovery"
                >
                  <Receipt className="w-5 h-5" />
                </Link>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500 dark:text-slate-400">
                    Collection Rate
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {collectionRate}% realized
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                    style={{ width: `${collectionRate}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 text-slate-500 dark:text-slate-400">
                <span>
                  Output GST:{' '}
                  <strong className="text-brand-navy dark:text-white">
                    ₹{(ov?.gstOutputTax || 0).toLocaleString('en-IN')}
                  </strong>
                </span>
                {(ov?.overdueInvoicesCount || 0) > 0 && (
                  <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {ov?.overdueInvoicesCount} overdue
                  </span>
                )}
              </div>
            </div>

            {/* Compact 2x2 Operational Modules Grid */}
            <div className="grid grid-cols-2 gap-3.5 flex-1">
              {campaignsEnabled && (
                <Link
                  href="/campaigns"
                  className="rounded-2xl bg-white dark:bg-[#0D172B] border border-slate-200/80 dark:border-slate-700/75 p-4 hover:border-emerald-500/60 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase text-slate-400">
                      WhatsApp
                    </span>
                    <MessageSquare className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="mt-2">
                    <div className="text-lg font-black text-brand-navy dark:text-white">
                      {(ov?.campaignsSentMessages || 0).toLocaleString('en-IN')}{' '}
                      Sent
                    </div>
                    <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      ₹
                      {(ov?.campaignsAttributedRevenue || 0).toLocaleString(
                        'en-IN',
                      )}{' '}
                      attributed
                    </div>
                  </div>
                </Link>
              )}

              {workflowsEnabled && (
                <Link
                  href="/workflows"
                  className="rounded-2xl bg-white dark:bg-[#0D172B] border border-slate-200/80 dark:border-slate-700/75 p-4 hover:border-amber-500/60 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase text-slate-400">
                      AI Rules
                    </span>
                    <Workflow className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="mt-2">
                    <div className="text-lg font-black text-brand-navy dark:text-white">
                      {ov?.activeWorkflowsCount || 0} Active
                    </div>
                    <div className="text-[11px] font-semibold text-brand-blue dark:text-sky-400">
                      {ov?.totalWorkflowRuns || 0} runs · {ov?.hoursSaved || 0}h saved
                    </div>
                  </div>
                </Link>
              )}

              <Link
                href="/contacts"
                className="rounded-2xl bg-white dark:bg-[#0D172B] border border-slate-200/80 dark:border-slate-700/75 p-4 hover:border-brand-blue/60 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase text-slate-400">
                    GST Directory
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-sky-500" />
                </div>
                <div className="mt-2">
                  <div className="text-lg font-black text-brand-navy dark:text-white">
                    {ov?.totalContacts || 0} Accounts
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {ov?.gstVerifiedContacts || 0} GSTIN verified
                  </div>
                </div>
              </Link>

              <Link
                href="/settings/team"
                className="rounded-2xl bg-white dark:bg-[#0D172B] border border-slate-200/80 dark:border-slate-700/75 p-4 hover:border-indigo-500/60 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase text-slate-400">
                    Team Seats
                  </span>
                  <ShieldCheck className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="mt-2">
                  <div className="text-lg font-black text-brand-navy dark:text-white">
                    {ov?.teamMembersCount || 1} Active
                  </div>
                  <div className="text-[11px] font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                    Acct #{tenant?.accountId || '-----'}
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Split: Priority Leads Table + Team Leaderboard */}
      {leadsEnabled && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div
            className={`${
              isAdmin && leaderboard.length > 0
                ? 'lg:col-span-8'
                : 'lg:col-span-12'
            } rounded-3xl bg-white dark:bg-[#0D172B] border border-slate-200/80 dark:border-slate-700/75 shadow-sm overflow-hidden`}
          >
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="font-extrabold text-base text-brand-navy dark:text-white">
                  Priority Leads Pipeline
                </h2>
                <p className="text-xs text-slate-400">
                  {aiScoringEnabled
                    ? 'Ranked automatically by SetuAI Lead Scoring'
                    : 'Latest active buyer inquiries in your workspace'}
                </p>
              </div>
              <Link
                href="/leads"
                className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-brand-light dark:bg-sky-500/15 text-brand-blue dark:text-sky-300 hover:bg-brand-blue hover:text-white transition-colors inline-flex items-center gap-1"
              >
                <span>View All Leads</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {isLoading ? (
              <div className="p-10 text-center text-xs text-slate-400">
                Loading live leads from Leadsetu Cloud...
              </div>
            ) : leads.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <p className="text-sm font-semibold text-brand-navy dark:text-white">
                  Your workspace has 0 leads right now.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Link
                    href="/leads"
                    className="btn-primary-brand px-5 py-2.5 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add or Import Leads
                  </Link>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {leads.slice(0, 5).map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/leads/${lead.id}`}
                    className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0"
                        style={{ background: '#3978EA' }}
                      >
                        {lead.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-brand-navy dark:text-white flex items-center gap-2">
                          <span>{lead.name}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                            {lead.source}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {lead.company || 'Direct Buyer'} ·{' '}
                          {lead.city || '—'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-sm font-extrabold text-brand-navy dark:text-white">
                        ₹{(lead.estimatedValue || 0).toLocaleString('en-IN')}
                      </span>
                      {aiScoringEnabled && (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                          AI {lead.aiScore}/100
                        </span>
                      )}
                      <span className="text-xs font-semibold text-brand-blue dark:text-sky-400 flex items-center gap-1 capitalize">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {lead.status}
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right (4 cols): Team Sales Leaderboard */}
          {isAdmin && leaderboard.length > 0 && (
            <div className="lg:col-span-4 rounded-3xl bg-white dark:bg-[#0D172B] border border-slate-200/80 dark:border-slate-700/75 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <h2 className="font-extrabold text-sm text-brand-navy dark:text-white">
                    Sales Team Leaderboard
                  </h2>
                </div>
                <Link
                  href="/analytics"
                  className="text-xs font-bold text-brand-blue dark:text-sky-400 hover:underline"
                >
                  Full Report
                </Link>
              </div>

              <div className="space-y-3">
                {leaderboard.slice(0, 4).map((rep, idx) => (
                  <div
                    key={rep.userId}
                    className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-brand-navy dark:text-white truncate">
                          #{idx + 1} {rep.name}
                        </div>
                        <div className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                          {rep.leadsCount} leads · {rep.wonDealsCount} deals won
                        </div>
                      </div>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                      ₹{(rep.achievedRevenue || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  {(rep.estimatedCommissionInr ?? 0) > 0 && (
                    <div className="flex items-center justify-between text-[10.5px] font-bold text-amber-600 dark:text-amber-400">
                      <span>Est. Commission ({rep.activeTierRatePct ?? 0}% Slab)</span>
                      <span>₹{(rep.estimatedCommissionInr ?? 0).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                    {rep.monthlyTarget > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                          <span>Target Achievement</span>
                          <span>{rep.targetAchievementPct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-brand-blue"
                            style={{
                              width: `${Math.min(100, rep.targetAchievementPct)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
