'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useLeads } from '@/hooks/useLeads';
import {
  fetchAnalyticsOverview,
  type AnalyticsOverviewResponse,
} from '@/lib/analytics-api';
import {
  Sparkles,
  TrendingUp,
  Users,
  Flame,
  IndianRupee,
  CheckCircle2,
  ArrowUpRight,
  Plus,
  Database,
  Receipt,
  MessageSquare,
  Workflow,
  ShieldCheck,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, tenant } = useAuth();
  const { leads, stats, isLoading, seedSamples, isMutating } = useLeads();
  const [overview, setOverview] = useState<AnalyticsOverviewResponse | null>(
    null,
  );

  useEffect(() => {
    fetchAnalyticsOverview()
      .then((res) => setOverview(res))
      .catch(() => {});
  }, [leads.length]);

  const ov = overview?.summary;

  const kpis = [
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
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <div
        className="rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-lg"
        style={{
          background:
            'linear-gradient(135deg, #17243A 0%, #1E3358 60%, #3978EA 100%)',
        }}
      >
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-brand-sky">
              <Sparkles className="w-3.5 h-3.5" /> Connected to MongoDB Atlas · Live Workspace
            </span>
            {tenant?.accountId && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Account ID: #{tenant.accountId}
              </span>
            )}
            {user?.userCode && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-bold bg-white/10 text-slate-200">
                User ID: #{user.userCode}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Namaste, {user?.name || 'Founder'}! 👋
          </h1>
          <p className="text-slate-200 text-sm mt-1">
            Workspace: <span className="font-bold text-white">{tenant?.name}</span> (
            {tenant?.city || 'Noida / Delhi-NCR'}) ·{' '}
            <span className="text-emerald-300 font-semibold capitalize">
              {tenant?.plan || 'Growth'} Plan
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {stats.total === 0 && (
            <button
              type="button"
              onClick={seedSamples}
              disabled={isMutating}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold text-white transition-colors"
            >
              <Database className="w-4 h-4" />
              <span>Seed 5 Sample Leads</span>
            </button>
          )}
          <Link
            href="/leads"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-brand-navy text-xs font-extrabold shadow hover:bg-brand-light transition-colors"
          >
            <Plus className="w-4 h-4 text-brand-blue" />
            <span>Manage Leads</span>
          </Link>
        </div>
      </div>

      {/* Live KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500">
                  {s.label}
                </span>
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `${s.color}15`, color: s.color }}
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

      {/* Cross-Module Live Status Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/invoices"
          className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:border-brand-blue transition-all flex items-center justify-between"
        >
          <div>
            <div className="text-[11px] font-bold uppercase text-slate-400">
              18% GST Invoices
            </div>
            <div className="text-base font-extrabold text-brand-navy mt-0.5">
              ₹{(ov?.totalInvoiced || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold">
              GST Tax: ₹{(ov?.gstOutputTax || 0).toLocaleString('en-IN')}
            </div>
          </div>
          <Receipt className="w-5 h-5 text-brand-blue" />
        </Link>

        <Link
          href="/campaigns"
          className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:border-brand-blue transition-all flex items-center justify-between"
        >
          <div>
            <div className="text-[11px] font-bold uppercase text-slate-400">
              WhatsApp Broadcasts
            </div>
            <div className="text-base font-extrabold text-brand-navy mt-0.5">
              {(ov?.campaignsSentMessages || 0).toLocaleString('en-IN')} Sent
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold">
              ₹{(ov?.campaignsAttributedRevenue || 0).toLocaleString('en-IN')} attributed
            </div>
          </div>
          <MessageSquare className="w-5 h-5 text-emerald-600" />
        </Link>

        <Link
          href="/workflows"
          className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:border-brand-blue transition-all flex items-center justify-between"
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

        <Link
          href="/settings/team"
          className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:border-brand-blue transition-all flex items-center justify-between"
        >
          <div>
            <div className="text-[11px] font-bold uppercase text-slate-400">
              Team &amp; Account ID
            </div>
            <div className="text-base font-extrabold text-brand-navy mt-0.5">
              {ov?.teamMembersCount || 1} Active Members
            </div>
            <div className="text-[11px] font-mono text-indigo-600 font-semibold">
              Acct #{tenant?.accountId || '-----'}
            </div>
          </div>
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
        </Link>
      </div>

      {/* Priority AI Scored Leads Table (Live from MongoDB) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-base text-brand-navy">
              Priority AI-Scored Leads (Live MongoDB Data)
            </h2>
            <p className="text-xs text-slate-400">
              Ranked automatically by Gemini AI Lead Scoring
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
            Loading live leads from MongoDB Atlas...
          </div>
        ) : leads.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm font-semibold text-brand-navy">
              Your workspace has 0 leads right now.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={seedSamples}
                disabled={isMutating}
                className="btn-primary-brand px-5 py-2.5 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-2"
              >
                <Database className="w-4 h-4" /> Load 5 Sample Delhi-NCR Leads
              </button>
              <Link
                href="/leads"
                className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 text-brand-navy hover:bg-slate-50"
              >
                Go to Leads Page
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {leads.slice(0, 5).map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
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
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                        {lead.source}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {lead.company || 'Direct Buyer'} · {lead.city || 'Delhi-NCR'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm font-extrabold text-brand-navy">
                    ₹{(lead.estimatedValue || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                    AI {lead.aiScore}/100
                  </span>
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
    </div>
  );
}
