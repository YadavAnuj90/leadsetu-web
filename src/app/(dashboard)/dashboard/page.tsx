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
} from 'lucide-react';

export default function DashboardPage() {
  const { user, tenant } = useAuth();
  const isAdmin = isWorkspaceAdminRole(user);
  const leadsEnabled = isFeatureEnabled(tenant, 'leads', user);
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

  const kpis = isAdmin
    ? [
        {
          label: 'Total Active Leads',
          value: stats.total.toLocaleString('en-IN'),
          change: `${stats.qualifiedCount} qualified in pipeline`,
          icon: Users,
          color: '#3978EA',
        },
        {
          label: 'Pipeline Value (INR)',
          value: `₹${(
            stats.totalPipelineValue + (ov?.openDealsValue || 0)
          ).toLocaleString('en-IN')}`,
          change: `₹${(ov?.weightedForecast || 0).toLocaleString('en-IN')} weighted forecast`,
          icon: IndianRupee,
          color: '#10B981',
        },
        {
          label: 'Hot AI Leads (80+)',
          value: stats.hotCount.toLocaleString('en-IN'),
          change: `Avg AI Score: ${stats.avgAiScore}/100`,
          icon: Flame,
          color: '#F59E0B',
        },
        {
          label: 'GST Invoiced Revenue',
          value: `₹${(ov?.totalInvoiced || 0).toLocaleString('en-IN')}`,
          change: `₹${(ov?.paidInvoicesRevenue || 0).toLocaleString('en-IN')} realized`,
          icon: TrendingUp,
          color: '#8B5CF6',
        },
      ]
    : [
        ...(leadsEnabled
          ? [
              {
                label: 'Active Leads',
                value: stats.total.toLocaleString('en-IN'),
                change: `${stats.qualifiedCount} qualified in pipeline`,
                icon: Users,
                color: '#3978EA',
              },
              {
                label: 'Pipeline Value (INR)',
                value: `₹${(
                  stats.totalPipelineValue + (ov?.openDealsValue || 0)
                ).toLocaleString('en-IN')}`,
                change: `₹${(ov?.weightedForecast || 0).toLocaleString('en-IN')} weighted forecast`,
                icon: IndianRupee,
                color: '#10B981',
              },
            ]
          : []),
        {
          label: 'Monthly Sales Target',
          value: `₹${Number(user?.monthlyTarget || 0).toLocaleString('en-IN')}`,
          change: user?.territory
            ? `Territory: ${user.territory}`
            : 'Personal Quota',
          icon: Target,
          color: '#6366F1',
        },
        {
          label: 'Assigned CRM Tools',
          value: `${assignedModules.length} / ${USER_FEATURE_CATALOG.length}`,
          change:
            user?.role === 'manager'
              ? 'Sales Manager Workspace'
              : 'Sales User Workspace',
          icon: ShieldCheck,
          color: '#059669',
        },
      ];

  const userDisplayId = user?.userCode;
  const roleLabel =
    user?.role === 'manager'
      ? 'Sales Manager'
      : user?.role === 'agent'
        ? 'Sales User'
        : user?.role === 'owner'
          ? 'Company Owner'
          : 'Company Admin';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <div
        className="rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-lg"
        style={{
          background: isAdmin
            ? 'linear-gradient(135deg, #17243A 0%, #1E3358 60%, #3978EA 100%)'
            : 'linear-gradient(135deg, #0F2744 0%, #1E40AF 55%, #0D9488 100%)',
        }}
      >
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-sky-100">
              <Sparkles className="w-3.5 h-3.5" /> {roleLabel} Workspace
            </span>
            {tenant?.accountId && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-extrabold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                Account ID: #{tenant.accountId}
              </span>
            )}
            {!isAdmin && userDisplayId && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-bold bg-white/10 text-slate-100">
                User ID: #{userDisplayId}
              </span>
            )}
            {user?.territory && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-slate-100">
                <MapPin className="w-3 h-3" /> {user.territory}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Namaste, {user?.name || 'Team Member'}!
          </h1>
          <p className="text-slate-200 text-sm mt-1">
            Workspace:{' '}
            <span className="font-bold text-white">
              {tenant?.companyName?.trim() || 'Leadsetu CRM'}
            </span>{' '}
            ({tenant?.city || 'Noida / Delhi-NCR'})
            {isAdmin && (
              <>
                {' '}
                ·{' '}
                <span className="text-emerald-300 font-semibold capitalize">
                  {tenant?.plan || 'Growth'} Plan
                </span>
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!isAdmin && (
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold text-white transition-colors"
            >
              <UserCircle2 className="w-4 h-4" />
              <span>My Profile &amp; Security</span>
            </Link>
          )}
          {leadsEnabled && (
            <Link
              href="/leads"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-brand-navy text-xs font-extrabold shadow hover:bg-brand-light transition-colors"
            >
              <Plus className="w-4 h-4 text-brand-blue" />
              <span>{isAdmin ? 'Manage Leads' : 'Open Leads'}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Live KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="card-surface p-5 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {s.label}
                </span>
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `${s.color}18`, color: s.color }}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-brand-navy">
                {s.value}
              </div>
              <div className="text-xs font-semibold mt-1" style={{ color: s.color }}>
                {s.change}
              </div>
            </div>
          );
        })}
      </div>

      {/* Non-Admin Assigned Modules Workspace Hub */}
      {!isAdmin && (
        <div className="card-surface p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-extrabold text-base text-brand-navy">
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
              <div className="text-sm font-bold text-brand-navy">
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
                  className="group p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/70 bg-slate-50/70 dark:bg-slate-900/40 hover:border-brand-blue transition-all flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="text-sm font-extrabold text-brand-navy group-hover:text-brand-blue transition-colors">
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

      {/* Admin Cross-Module Live Status Strip */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {invoicesEnabled && (
            <Link
              href="/invoices"
              className="card-surface p-4 hover:border-brand-blue transition-all flex items-center justify-between"
            >
              <div>
                <div className="text-[11px] font-bold uppercase text-slate-400">
                  18% GST Invoices
                </div>
                <div className="text-base font-extrabold text-brand-navy mt-0.5">
                  ₹{(ov?.totalInvoiced || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  GST Tax: ₹{(ov?.gstOutputTax || 0).toLocaleString('en-IN')}
                </div>
              </div>
              <Receipt className="w-5 h-5 text-brand-blue" />
            </Link>
          )}

          {campaignsEnabled && (
            <Link
              href="/campaigns"
              className="card-surface p-4 hover:border-brand-blue transition-all flex items-center justify-between"
            >
              <div>
                <div className="text-[11px] font-bold uppercase text-slate-400">
                  WhatsApp Broadcasts
                </div>
                <div className="text-base font-extrabold text-brand-navy mt-0.5">
                  {(ov?.campaignsSentMessages || 0).toLocaleString('en-IN')} Sent
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  ₹{(ov?.campaignsAttributedRevenue || 0).toLocaleString('en-IN')} attributed
                </div>
              </div>
              <MessageSquare className="w-5 h-5 text-emerald-600" />
            </Link>
          )}

          {workflowsEnabled && (
            <Link
              href="/workflows"
              className="card-surface p-4 hover:border-brand-blue transition-all flex items-center justify-between"
            >
              <div>
                <div className="text-[11px] font-bold uppercase text-slate-400">
                  AI Automations
                </div>
                <div className="text-base font-extrabold text-brand-navy mt-0.5">
                  {ov?.activeWorkflowsCount || 0} Active Rules
                </div>
                <div className="text-[11px] text-brand-blue font-semibold">
                  {ov?.totalWorkflowRuns || 0} runs · {ov?.hoursSaved || 0} hrs saved
                </div>
              </div>
              <Workflow className="w-5 h-5 text-amber-500" />
            </Link>
          )}

          <Link
            href="/settings/team"
            className="card-surface p-4 hover:border-brand-blue transition-all flex items-center justify-between"
          >
            <div>
              <div className="text-[11px] font-bold uppercase text-slate-400">
                Team &amp; Account ID
              </div>
              <div className="text-base font-extrabold text-brand-navy mt-0.5">
                {ov?.teamMembersCount || 1} Active Members
              </div>
              <div className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                Acct #{tenant?.accountId || '-----'}
              </div>
            </div>
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </Link>
        </div>
      )}

      {/* Priority AI Scored Leads Table (shown when Leads module is enabled) */}
      {leadsEnabled && (
        <div className="card-surface overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-base text-brand-navy">
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
              className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-brand-light text-brand-blue hover:bg-brand-blue hover:text-white transition-colors inline-flex items-center gap-1"
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
              <p className="text-sm font-semibold text-brand-navy">
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
                      className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white"
                      style={{ background: '#3978EA' }}
                    >
                      {lead.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-brand-navy flex items-center gap-2">
                        <span>{lead.name}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                          {lead.source}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {lead.company || 'Direct Buyer'} · {lead.city || 'Delhi-NCR'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm font-extrabold text-brand-navy">
                      ₹{(lead.estimatedValue || 0).toLocaleString('en-IN')}
                    </span>
                    {aiScoringEnabled && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                        AI {lead.aiScore}/100
                      </span>
                    )}
                    <span className="text-xs font-semibold text-brand-blue flex items-center gap-1 capitalize">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {lead.status}
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
