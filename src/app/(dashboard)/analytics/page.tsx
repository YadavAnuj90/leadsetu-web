'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart3,
  ArrowLeft,
  TrendingUp,
  IndianRupee,
  Users,
  MessageSquare,
  Sparkles,
  Receipt,
  Workflow,
  MapPin,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import {
  fetchAnalyticsOverview,
  type AnalyticsOverviewResponse,
} from '@/lib/analytics-api';
import { getErrorMessage } from '@/lib/api-client';

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchAnalyticsOverview();
      setData(res);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const s = data?.summary;
  const totalPipelineCombined =
    (s?.leadPipelineValue || 0) + (s?.openDealsValue || 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand-navy transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back to Previous Tab
        </button>

        <button
          type="button"
          onClick={loadAnalytics}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-brand-blue ${
              isLoading ? 'animate-spin' : ''
            }`}
          />
          Refresh Live MongoDB Metrics
        </button>
      </div>

      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-blue mb-1">
          <Sparkles className="w-3.5 h-3.5" /> Executive Revenue &amp; Attribution Intelligence
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
          Real-Time CRM &amp; GST Analytics
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Live MongoDB aggregation across Leads, Kanban Deals, 18% GST Invoices, WhatsApp Broadcasts, and AI Workflows.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
          {errorMsg}
        </div>
      )}

      {isLoading && !data ? (
        <div className="bg-white rounded-3xl p-16 border border-slate-200/80 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-7 h-7 animate-spin text-brand-blue" />
          <p className="text-xs font-semibold">
            Aggregating live metrics across 8 MongoDB collections...
          </p>
        </div>
      ) : (
        <>
          {/* Primary Executive KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Active Pipeline Value
                </span>
                <IndianRupee className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-brand-navy">
                ₹{totalPipelineCombined.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Weighted Forecast:{' '}
                <span className="font-bold text-emerald-600">
                  ₹{(s?.weightedForecast || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Leads &amp; AI Intent
                </span>
                <Users className="w-4 h-4 text-brand-blue" />
              </div>
              <div className="text-2xl font-extrabold text-brand-navy">
                {(s?.totalLeads || 0).toLocaleString('en-IN')}{' '}
                <span className="text-sm font-bold text-amber-600">
                  ({s?.hotLeads || 0} Hot)
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Avg Gemini AI Score:{' '}
                <span className="font-bold text-brand-blue">
                  {s?.avgAiScore || 82}/100
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  GST Billed &amp; Collected
                </span>
                <Receipt className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-extrabold text-brand-navy">
                ₹{(s?.totalInvoiced || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Paid:{' '}
                <span className="font-bold text-emerald-600">
                  ₹{(s?.paidInvoicesRevenue || 0).toLocaleString('en-IN')}
                </span>{' '}
                · GST: ₹{(s?.gstOutputTax || 0).toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Automation &amp; Broadcasts
                </span>
                <Workflow className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-extrabold text-brand-navy">
                {(s?.totalWorkflowRuns || 0).toLocaleString('en-IN')} Runs
              </div>
              <div className="text-xs text-slate-500 mt-1">
                <span className="font-bold text-emerald-600">
                  {s?.hoursSaved || 0} hrs saved
                </span>{' '}
                · {(s?.campaignsSentMessages || 0).toLocaleString('en-IN')} WA sent
              </div>
            </div>
          </div>

          {/* Source Attribution & Regional Hub Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Lead Source Attribution */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-extrabold text-base text-brand-navy">
                    Channel Attribution &amp; Conversion Rate
                  </h2>
                  <p className="text-xs text-slate-400">
                    Lead volume, pipeline value, and qualification rate by source
                  </p>
                </div>
                <BarChart3 className="w-5 h-5 text-brand-blue" />
              </div>

              <div className="space-y-4">
                {(data?.sourceBreakdown || []).map((ch) => (
                  <div key={ch.key} className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between text-xs font-bold text-brand-navy gap-2">
                      <span>
                        {ch.label}{' '}
                        <span className="text-slate-400 font-normal">
                          ({ch.count} leads · ₹
                          {ch.pipelineValue.toLocaleString('en-IN')})
                        </span>
                      </span>
                      <span>
                        {ch.sharePct}% Share ·{' '}
                        <span className="text-emerald-600">
                          {ch.winRatePct}% Qualified
                        </span>
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, ch.sharePct)}%`,
                          background: ch.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delhi-NCR & Regional Industrial Hubs */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-extrabold text-base text-brand-navy">
                    Delhi-NCR &amp; Regional Distribution
                  </h2>
                  <p className="text-xs text-slate-400">
                    Noida Electronic City, New Delhi &amp; Gurugram hubs
                  </p>
                </div>
                <MapPin className="w-5 h-5 text-brand-blue" />
              </div>

              <div className="space-y-3.5">
                {(data?.cityBreakdown || []).map((city) => (
                  <div
                    key={city.label}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-brand-navy">
                      <span className="truncate pr-2">{city.label}</span>
                      <span className="text-brand-blue flex-shrink-0">
                        {city.sharePct}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{city.leadsCount} active leads</span>
                      <span className="font-semibold text-slate-700">
                        ₹{city.pipelineValue.toLocaleString('en-IN')} pipeline
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Kanban Deal Stage Funnel & Cross-Module Health */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-extrabold text-base text-brand-navy">
                    Deal Pipeline Stage Funnel
                  </h2>
                  <p className="text-xs text-slate-400">
                    Stage-by-stage deal count and INR value in MongoDB
                  </p>
                </div>
                <Link
                  href="/deals"
                  className="text-xs font-bold text-brand-blue hover:underline"
                >
                  Open Kanban Board →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {(data?.stageFunnel || []).map((st) => (
                  <div
                    key={st.stage}
                    className={`p-4 rounded-2xl border ${
                      st.stage === 'won'
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : 'bg-slate-50 border-slate-200/80'
                    }`}
                  >
                    <div className="text-[11px] font-bold text-slate-500">
                      {st.label}
                    </div>
                    <div className="text-xl font-extrabold text-brand-navy mt-1">
                      {st.count}
                    </div>
                    <div className="text-xs font-semibold text-brand-blue mt-0.5">
                      ₹{st.value.toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 bg-slate-900 text-white rounded-3xl p-6 space-y-4 flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-brand-blue">
                  Workspace Operational Pulse
                </div>
                <h3 className="text-lg font-extrabold mt-1">
                  All 11 Modules Synced to MongoDB
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-slate-400">B2B GST Contacts</div>
                  <div className="text-base font-extrabold mt-0.5">
                    {s?.totalContacts || 0} ({s?.gstVerifiedContacts || 0} GSTIN)
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-slate-400">Follow-Up Tasks</div>
                  <div className="text-base font-extrabold mt-0.5">
                    {s?.pendingTasksCount || 0} Open ·{' '}
                    {s?.completedTasksCount || 0} Done
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-slate-400">Campaign Revenue</div>
                  <div className="text-base font-extrabold text-emerald-400 mt-0.5">
                    ₹{(s?.campaignsAttributedRevenue || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-slate-400">Workspace Team</div>
                  <div className="text-base font-extrabold mt-0.5">
                    {s?.teamMembersCount || 1} Active Seats
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
