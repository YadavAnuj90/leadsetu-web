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
  Download,
  Award,
  Clock,
  LifeBuoy,
  Package,
  ArrowRight,
  Target,
  ShieldCheck,
} from 'lucide-react';
import {
  fetchAnalyticsOverview,
  type AnalyticsOverviewResponse,
  type AnalyticsRange,
} from '@/lib/analytics-api';
import { getErrorMessage } from '@/lib/api-client';

type ViewTab = 'overview' | 'revenue' | 'pipeline' | 'team';

const RANGE_OPTIONS: { id: AnalyticsRange; label: string }[] = [
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: '90d', label: '90 Days' },
  { id: 'all', label: 'All Time' },
];

const TAB_OPTIONS: { id: ViewTab; label: string }[] = [
  { id: 'overview', label: 'Executive Overview' },
  { id: 'revenue', label: 'Revenue & GST Udhaar' },
  { id: 'pipeline', label: 'Pipeline & AI Intent' },
  { id: 'team', label: 'Team & Campaigns' },
];

const formatCompactInr = (val: number) => {
  const n = Number(val) || 0;
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
};

const formatInr = (val: number) =>
  `₹${Math.round(Number(val) || 0).toLocaleString('en-IN')}`;

export default function AnalyticsPage() {
  const router = useRouter();
  const [range, setRange] = useState<AnalyticsRange>('all');
  const [activeTab, setActiveTab] = useState<ViewTab>('overview');
  const [data, setData] = useState<AnalyticsOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchAnalyticsOverview(range);
      setData(res);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const handleExportReport = () => {
    if (!data) return;
    const s = data.summary;
    const lines: string[] = [
      'Leadsetu CRM Executive Analytics Report',
      `Range,${range.toUpperCase()}`,
      `Generated At,${new Date().toISOString()}`,
      '',
      'KEY METRICS,VALUE',
      `Total Leads,${s.totalLeads}`,
      `Hot Leads,${s.hotLeads}`,
      `Avg AI Score,${s.avgAiScore}`,
      `Active Pipeline Value (INR),${s.leadPipelineValue + s.openDealsValue}`,
      `Weighted Forecast (INR),${s.weightedForecast}`,
      `Deal Win Rate (%),${s.dealWinRatePct}`,
      `Total GST Invoiced (INR),${s.totalInvoiced}`,
      `Paid Revenue Collected (INR),${s.paidInvoicesRevenue}`,
      `Pending Udhaar Receivables (INR),${s.pendingReceivables}`,
      `Collection Rate (%),${s.collectionRatePct}`,
      `Quote Conversion Rate (%),${s.quoteConversionRatePct}`,
      '',
      'MONTHLY VELOCITY,LEADS,PIPELINE (INR),INVOICED (INR),PAID (INR)',
      ...data.monthlyTrend.map(
        (m) =>
          `${m.label},${m.leadsCount},${m.pipelineValue},${m.invoicedAmount},${m.paidAmount}`,
      ),
      '',
      'REP LEADERBOARD,ROLE,TERRITORY,LEADS,WON DEALS,ACHIEVED (INR),TARGET (INR),PROGRESS (%)',
      ...data.repLeaderboard.map(
        (r) =>
          `"${r.name}",${r.role},"${r.territory}",${r.leadsCount},${r.wonDealsCount},${r.achievedRevenue},${r.monthlyTarget},${r.targetAchievementPct}`,
      ),
    ];
    const blob = new Blob([lines.join('\r\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Leadsetu-Executive-Analytics-${range}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const s = data?.summary;
  const totalPipelineCombined =
    (s?.leadPipelineValue || 0) + (s?.openDealsValue || 0);

  const monthly = data?.monthlyTrend || [];
  const maxTrendValue = Math.max(
    1,
    ...monthly.map((m) =>
      Math.max(m.pipelineValue, m.invoicedAmount, m.paidAmount),
    ),
  );
  const activeMonthPoint =
    hoveredMonthIdx !== null && monthly[hoveredMonthIdx]
      ? monthly[hoveredMonthIdx]
      : monthly[monthly.length - 1] || null;

  // AI Donut SVG calculations
  const aiTiers = data?.aiTierBreakdown || [];
  const totalAiLeads = Math.max(
    1,
    aiTiers.reduce((sum, t) => sum + t.count, 0),
  );
  const donutRadius = 46;
  const donutCircumference = 2 * Math.PI * donutRadius;

  const aging = data?.agingBuckets;
  const maxFunnelCount = Math.max(
    1,
    ...(data?.stageFunnel || []).map((st) => st.count),
  );

  const showRevenue = activeTab === 'overview' || activeTab === 'revenue';
  const showPipeline = activeTab === 'overview' || activeTab === 'pipeline';
  const showTeam = activeTab === 'overview' || activeTab === 'team';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand-navy transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range Filter */}
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setRange(opt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  range === opt.id
                    ? 'bg-brand-blue text-white shadow-sm'
                    : 'text-slate-600 hover:text-brand-navy'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportReport}
            disabled={!data}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-800 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
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
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Hero Executive Command Banner */}
      <div
        className="rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, #0F172A 0%, #17243A 55%, #1D4ED8 100%)',
        }}
      >
        <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-blue-500/15 blur-2xl pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold uppercase tracking-wider text-sky-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real-Time MongoDB Revenue &amp; Attribution Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Executive CRM, GST &amp; Pipeline Analytics
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Live cross-collection telemetry spanning{' '}
              <strong>{s?.totalLeads || 0} Leads</strong>,{' '}
              <strong>{s?.totalDeals || 0} Deals</strong>,{' '}
              <strong>{s?.proformaQuotesCount || 0} Quotes</strong>, GST Udhaar recovery, WhatsApp broadcasts, and team targets.
            </p>
          </div>

          {/* Radial Collection + Quote Conversion Pills */}
          <div className="grid grid-cols-3 gap-3 shrink-0">
            <div className="rounded-2xl bg-white/10 border border-white/15 px-4 py-3 text-center backdrop-blur-sm">
              <div className="text-[10px] font-bold uppercase tracking-wider text-sky-200">
                Deal Win Rate
              </div>
              <div className="text-2xl font-extrabold text-emerald-300 mt-1">
                {s?.dealWinRatePct ?? 0}%
              </div>
              <div className="text-[10px] text-slate-300 mt-0.5">
                {s?.wonDealsCount || 0} Won Deals
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 border border-white/15 px-4 py-3 text-center backdrop-blur-sm">
              <div className="text-[10px] font-bold uppercase tracking-wider text-sky-200">
                GST Collected
              </div>
              <div className="text-2xl font-extrabold text-white mt-1">
                {s?.collectionRatePct ?? 0}%
              </div>
              <div className="text-[10px] text-slate-300 mt-0.5">
                {formatCompactInr(s?.paidInvoicesRevenue || 0)}
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 border border-white/15 px-4 py-3 text-center backdrop-blur-sm">
              <div className="text-[10px] font-bold uppercase tracking-wider text-sky-200">
                Quote → Inv
              </div>
              <div className="text-2xl font-extrabold text-amber-300 mt-1">
                {s?.quoteConversionRatePct ?? 0}%
              </div>
              <div className="text-[10px] text-slate-300 mt-0.5">
                {s?.approvedQuotesCount || 0} Buyer OK
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {TAB_OPTIONS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === tab.id
                ? 'bg-brand-navy text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
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
            Aggregating live metrics across 10 MongoDB collections...
          </p>
        </div>
      ) : (
        <>
          {/* 4 Primary Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Active Pipeline
                </span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <IndianRupee className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-brand-navy">
                {formatInr(totalPipelineCombined)}
              </div>
              <div className="text-xs text-slate-500 mt-1.5 flex items-center justify-between">
                <span>Weighted Forecast</span>
                <span className="font-bold text-emerald-600">
                  {formatCompactInr(s?.weightedForecast || 0)}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  GST Realized vs Udhaar
                </span>
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-brand-navy">
                {formatInr(s?.paidInvoicesRevenue || 0)}
              </div>
              <div className="mt-2 space-y-1">
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${Math.min(100, s?.collectionRatePct || 0)}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-500 flex justify-between">
                  <span>Pending: {formatCompactInr(s?.pendingReceivables || 0)}</span>
                  <span className="font-bold text-rose-600">
                    {s?.overdueInvoicesCount || 0} overdue
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Leads &amp; AI Score
                </span>
                <div className="p-2 rounded-xl bg-brand-light text-brand-blue">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-brand-navy">
                {(s?.totalLeads || 0).toLocaleString('en-IN')}{' '}
                <span className="text-sm font-bold text-emerald-600">
                  ({s?.hotLeads || 0} Hot)
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1.5 flex items-center justify-between">
                <span>Avg Gemini Score: {s?.avgAiScore || 0}/100</span>
                <span className="font-bold text-brand-blue">
                  {s?.convertedLeads || 0} Won
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Automation &amp; WhatsApp
                </span>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Workflow className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-brand-navy">
                {(s?.totalWorkflowRuns || 0).toLocaleString('en-IN')} Runs
              </div>
              <div className="text-xs text-slate-500 mt-1.5 flex items-center justify-between">
                <span className="font-bold text-emerald-600">
                  {s?.hoursSaved || 0} hrs saved
                </span>
                <span>
                  {(s?.campaignsSentMessages || 0).toLocaleString('en-IN')} WA sent
                </span>
              </div>
            </div>
          </div>

          {/* 6-Month Velocity Chart + AI Lead Intent Donut */}
          {(showRevenue || showPipeline) && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Interactive 6-Month SVG Velocity Chart */}
              <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-extrabold text-base text-brand-navy flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-brand-blue" />
                      <span>6-Month Pipeline vs. Invoiced &amp; Collected Velocity</span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Hover any month column to inspect real MongoDB totals
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold">
                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Pipeline
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" /> Invoiced
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Collected
                    </span>
                  </div>
                </div>

                {/* Live Hover Readout Strip */}
                {activeMonthPoint && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        Period
                      </span>
                      <div className="font-extrabold text-brand-navy">
                        {activeMonthPoint.label} ({activeMonthPoint.leadsCount} leads)
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        Pipeline Generated
                      </span>
                      <div className="font-extrabold text-blue-600">
                        {formatInr(activeMonthPoint.pipelineValue)}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        GST Billed
                      </span>
                      <div className="font-extrabold text-indigo-600">
                        {formatInr(activeMonthPoint.invoicedAmount)}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        Cash Collected
                      </span>
                      <div className="font-extrabold text-emerald-600">
                        {formatInr(activeMonthPoint.paidAmount)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Grouped Column Chart */}
                <div className="grid grid-cols-6 gap-3 items-end h-52 pt-4 px-2 border-b border-slate-100">
                  {monthly.map((m, idx) => {
                    const pH = Math.max(
                      6,
                      Math.round((m.pipelineValue / maxTrendValue) * 100),
                    );
                    const iH = Math.max(
                      6,
                      Math.round((m.invoicedAmount / maxTrendValue) * 100),
                    );
                    const cH = Math.max(
                      6,
                      Math.round((m.paidAmount / maxTrendValue) * 100),
                    );
                    const isActive = hoveredMonthIdx === idx;
                    return (
                      <div
                        key={m.monthKey}
                        onMouseEnter={() => setHoveredMonthIdx(idx)}
                        onMouseLeave={() => setHoveredMonthIdx(null)}
                        className={`flex flex-col items-center gap-2 h-full justify-end rounded-xl p-1.5 transition cursor-pointer ${
                          isActive ? 'bg-slate-50 ring-1 ring-brand-blue/30' : ''
                        }`}
                      >
                        <div className="w-full flex items-end justify-center gap-1.5 flex-1">
                          <div
                            title={`Pipeline: ${formatInr(m.pipelineValue)}`}
                            className="w-3 sm:w-4 rounded-t-md bg-blue-500 transition-all duration-300"
                            style={{ height: `${pH}%` }}
                          />
                          <div
                            title={`Invoiced: ${formatInr(m.invoicedAmount)}`}
                            className="w-3 sm:w-4 rounded-t-md bg-indigo-500 transition-all duration-300"
                            style={{ height: `${iH}%` }}
                          />
                          <div
                            title={`Collected: ${formatInr(m.paidAmount)}`}
                            className="w-3 sm:w-4 rounded-t-md bg-emerald-500 transition-all duration-300"
                            style={{ height: `${cH}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-500">
                          {m.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Intent Donut Chart */}
              <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-extrabold text-base text-brand-navy">
                      AI Lead Intent Quality
                    </h2>
                    <p className="text-xs text-slate-400">
                      Hot / Warm / Cold distribution
                    </p>
                  </div>
                  <Link
                    href="/leads"
                    className="text-xs font-bold text-brand-blue hover:underline"
                  >
                    Leads →
                  </Link>
                </div>

                <div className="flex items-center justify-center py-2">
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
                      <circle
                        cx="60"
                        cy="60"
                        r={donutRadius}
                        fill="transparent"
                        stroke="#E2E8F0"
                        strokeWidth="14"
                      />
                      {(() => {
                        let offsetAcc = 0;
                        return aiTiers.map((tier) => {
                          const segLen =
                            (tier.count / totalAiLeads) * donutCircumference;
                          const dashArray = `${segLen} ${donutCircumference - segLen}`;
                          const dashOffset = -offsetAcc;
                          offsetAcc += segLen;
                          return (
                            <circle
                              key={tier.tier}
                              cx="60"
                              cy="60"
                              r={donutRadius}
                              fill="transparent"
                              stroke={tier.color}
                              strokeWidth="14"
                              strokeDasharray={dashArray}
                              strokeDashoffset={dashOffset}
                            />
                          );
                        });
                      })()}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-2xl font-extrabold text-brand-navy">
                        {s?.avgAiScore || 0}
                      </span>
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        Avg AI Score
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {aiTiers.map((t) => (
                    <div
                      key={t.tier}
                      className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <div className="flex items-center gap-2 font-bold text-brand-navy">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: t.color }}
                        />
                        <span>{t.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-brand-navy">
                          {t.count}
                        </span>{' '}
                        <span className="text-slate-400">
                          ({t.sharePct}% · {formatCompactInr(t.value)})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* GST Udhaar Credit Aging + Quote Funnel (Revenue Tab & Overview) */}
          {showRevenue && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-extrabold text-base text-brand-navy flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span>GST Receivables &amp; Udhaar Aging Health</span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Real-time split of Collected Cash vs. Overdue Invoices
                    </p>
                  </div>
                  <Link
                    href="/invoices"
                    className="text-xs font-bold text-brand-blue hover:underline"
                  >
                    Open GST Billing →
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {[
                    {
                      label: 'Collected Paid',
                      bucket: aging?.paid,
                      cls: 'bg-emerald-50 border-emerald-200 text-emerald-800',
                    },
                    {
                      label: 'Current Due',
                      bucket: aging?.current,
                      cls: 'bg-blue-50 border-blue-200 text-blue-800',
                    },
                    {
                      label: '1–15d Overdue',
                      bucket: aging?.days1to15,
                      cls: 'bg-amber-50 border-amber-200 text-amber-800',
                    },
                    {
                      label: '16–30d Overdue',
                      bucket: aging?.days16to30,
                      cls: 'bg-orange-50 border-orange-200 text-orange-800',
                    },
                    {
                      label: '30+d Critical',
                      bucket: aging?.days30Plus,
                      cls: 'bg-rose-50 border-rose-200 text-rose-800',
                    },
                  ].map((card) => (
                    <div
                      key={card.label}
                      className={`p-3 rounded-2xl border ${card.cls}`}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wide opacity-80">
                        {card.label}
                      </div>
                      <div className="text-sm sm:text-base font-extrabold mt-1">
                        {formatCompactInr(card.bucket?.amount || 0)}
                      </div>
                      <div className="text-[10px] font-semibold opacity-75 mt-0.5">
                        {card.bucket?.count || 0} docs
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-slate-500">Intra-State (CGST + SGST)</div>
                    <div className="text-sm font-extrabold text-brand-navy mt-0.5">
                      {formatInr(s?.cgstSgstTotal || 0)}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-slate-500">Inter-State (IGST)</div>
                    <div className="text-sm font-extrabold text-brand-navy mt-0.5">
                      {formatInr(s?.igstTotal || 0)}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-slate-500">Total GST Output Liability</div>
                    <div className="text-sm font-extrabold text-indigo-600 mt-0.5">
                      {formatInr(s?.gstOutputTax || 0)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quote-to-Cash Conversion Card */}
              <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <h2 className="font-extrabold text-base text-brand-navy flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Quote-to-Cash &amp; Catalog Velocity</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Proforma Quotations approved online &amp; converted to Tax Invoices
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-xs font-bold text-slate-600">
                      Total Proforma Quotes Issued
                    </span>
                    <span className="text-base font-extrabold text-brand-navy">
                      {s?.proformaQuotesCount || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                    <span className="text-xs font-bold text-emerald-800">
                      Buyer Portal Approved Quotes
                    </span>
                    <span className="text-base font-extrabold text-emerald-700">
                      {s?.approvedQuotesCount || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200">
                    <span className="text-xs font-bold text-indigo-800">
                      Converted to Tax Invoices
                    </span>
                    <span className="text-base font-extrabold text-indigo-700">
                      {s?.convertedQuotesCount || 0} ({s?.quoteConversionRatePct || 0}%)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-slate-500 font-semibold">
                    <Package className="w-3.5 h-3.5 text-brand-blue" />
                    {s?.catalogSkusCount || 0} HSN/SAC Catalog SKUs Active
                  </span>
                  <Link
                    href="/products"
                    className="font-bold text-brand-blue hover:underline inline-flex items-center gap-1"
                  >
                    <span>Catalog</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Source Attribution & Regional Industrial Hubs + Deal Stage Funnel */}
          {showPipeline && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-extrabold text-base text-brand-navy">
                        Channel Attribution &amp; Qualification Rate
                      </h2>
                      <p className="text-xs text-slate-400">
                        Lead share, INR pipeline value &amp; conversion by channel
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
                              ({ch.count} leads · {formatCompactInr(ch.pipelineValue)})
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
                            className="h-full rounded-full transition-all duration-500"
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

                <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-extrabold text-base text-brand-navy">
                        Delhi-NCR &amp; Regional Hubs
                      </h2>
                      <p className="text-xs text-slate-400">
                        Noida, New Delhi, Gurugram &amp; Pan-India share
                      </p>
                    </div>
                    <MapPin className="w-5 h-5 text-brand-blue" />
                  </div>

                  <div className="space-y-3">
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
                        <div className="w-full h-1.5 rounded-full bg-slate-200/70 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-brand-blue"
                            style={{ width: `${Math.min(100, city.sharePct)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>{city.leadsCount} active leads</span>
                          <span className="font-semibold text-slate-700">
                            {formatInr(city.pipelineValue)} pipeline
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Kanban Deal Stage Funnel */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-extrabold text-base text-brand-navy">
                      Deal Pipeline Stage Funnel
                    </h2>
                    <p className="text-xs text-slate-400">
                      Stage-by-stage progression across {s?.totalDeals || 0} deals
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
                  {(data?.stageFunnel || []).map((st) => {
                    const widthPct = Math.max(
                      12,
                      Math.round((st.count / maxFunnelCount) * 100),
                    );
                    return (
                      <div
                        key={st.stage}
                        className={`p-4 rounded-2xl border space-y-2 ${
                          st.stage === 'won'
                            ? 'bg-emerald-50/70 border-emerald-200'
                            : 'bg-slate-50 border-slate-200/80'
                        }`}
                      >
                        <div className="text-[11px] font-bold text-slate-500">
                          {st.label}
                        </div>
                        <div className="text-xl font-extrabold text-brand-navy">
                          {st.count}
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-200/80 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              st.stage === 'won'
                                ? 'bg-emerald-500'
                                : 'bg-brand-blue'
                            }`}
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                        <div className="text-xs font-semibold text-brand-blue">
                          {formatInr(st.value)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Rep Leaderboard & Campaigns + Workspace Pulse */}
          {showTeam && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Sales Rep Target Leaderboard */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-extrabold text-base text-brand-navy flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500" />
                      <span>Sales Rep Target Leaderboard</span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Achieved revenue vs. monthly target across active team seats
                    </p>
                  </div>
                  <Link
                    href="/settings/team"
                    className="text-xs font-bold text-brand-blue hover:underline"
                  >
                    Manage Targets →
                  </Link>
                </div>

                {(data?.repLeaderboard || []).length === 0 ? (
                  <p className="text-xs text-slate-500 py-8 text-center">
                    No active reps found in workspace.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {(data?.repLeaderboard || []).map((rep, idx) => (
                      <div
                        key={rep.userId}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-extrabold ${
                                idx === 0
                                  ? 'bg-amber-400 text-slate-950'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              #{idx + 1}
                            </span>
                            <div>
                              <div className="text-xs font-extrabold text-brand-navy">
                                {rep.name}{' '}
                                <span className="text-[10px] font-semibold uppercase text-slate-400">
                                  ({rep.role})
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {rep.territory} · {rep.leadsCount} leads (
                                {rep.hotLeadsCount} hot) · {rep.wonDealsCount} won
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs font-extrabold text-brand-navy">
                              {formatCompactInr(rep.achievedRevenue)}{' '}
                              <span className="text-slate-400 font-normal">
                                / {formatCompactInr(rep.monthlyTarget)}
                              </span>
                            </div>
                            <div className="text-[11px] font-bold text-emerald-600 flex items-center justify-end gap-1">
                              <Target className="w-3 h-3" />
                              {rep.targetAchievementPct}% Target
                            </div>
                          </div>
                        </div>

                        <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              rep.targetAchievementPct >= 80
                                ? 'bg-emerald-500'
                                : 'bg-brand-blue'
                            }`}
                            style={{
                              width: `${Math.min(100, rep.targetAchievementPct)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Workspace Operational Pulse & Top Campaigns */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-slate-900 text-white rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-sky-300">
                        Operational &amp; SLA Health
                      </div>
                      <h3 className="text-lg font-extrabold mt-0.5">
                        Cross-Module Pulse
                      </h3>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-slate-400">B2B GST Contacts</div>
                      <div className="text-base font-extrabold mt-0.5">
                        {s?.totalContacts || 0}{' '}
                        <span className="text-xs font-normal text-sky-300">
                          ({s?.gstVerifiedContacts || 0} GSTIN)
                        </span>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-slate-400">SLA Tickets</div>
                      <div className="text-base font-extrabold mt-0.5 flex items-center gap-1.5">
                        <LifeBuoy className="w-3.5 h-3.5 text-amber-400" />
                        <span>{s?.openTicketsCount || 0} Open</span>
                        {(s?.urgentTicketsCount || 0) > 0 && (
                          <span className="text-[10px] text-rose-400">
                            ({s?.urgentTicketsCount} urgent)
                          </span>
                        )}
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
                        {formatCompactInr(s?.campaignsAttributedRevenue || 0)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top WhatsApp Broadcast Campaigns */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm text-brand-navy flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      <span>Top WhatsApp Broadcast ROI</span>
                    </h3>
                    <Link
                      href="/campaigns"
                      className="text-xs font-bold text-brand-blue hover:underline"
                    >
                      Campaigns →
                    </Link>
                  </div>

                  {(data?.topCampaigns || []).length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      Launch a WhatsApp broadcast in Campaigns to track ROI here.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {(data?.topCampaigns || []).map((c) => (
                        <div
                          key={c.id}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs gap-2"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-brand-navy truncate">
                              {c.name}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {c.sentCount} sent · {c.readRate}% read · {c.replyRate}% reply
                            </div>
                          </div>
                          <span className="font-extrabold text-emerald-600 shrink-0">
                            {formatCompactInr(c.attributedRevenue)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
