'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Award,
  IndianRupee,
  Phone,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  fetchMyPerformanceApi,
  type MyPerformanceResponse,
} from '@/lib/team-api';

interface QuotaCommissionWidgetProps {
  externalPerf?: MyPerformanceResponse | null;
  compact?: boolean;
}

function QuotaProgressRing({ pct }: { pct: number }) {
  const clamped = Math.max(0, Math.min(100, pct));
  const r = 34;
  const circ = 2 * Math.PI * r;
  const offset = circ - (clamped / 100) * circ;
  const strokeColor =
    pct >= 100 ? '#10B981' : pct >= 70 ? '#3B82F6' : '#F59E0B';

  return (
    <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 84 84">
        <circle
          cx="42"
          cy="42"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-slate-200 dark:text-slate-800"
        />
        <circle
          cx="42"
          cy="42"
          r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-base font-black text-brand-navy leading-none">
          {pct}%
        </span>
        <span className="text-[9px] font-bold uppercase text-slate-400 mt-0.5">
          Quota
        </span>
      </div>
    </div>
  );
}

export function QuotaCommissionWidget({
  externalPerf,
  compact = false,
}: QuotaCommissionWidgetProps) {
  const [perf, setPerf] = useState<MyPerformanceResponse | null>(
    externalPerf || null,
  );
  const [showSlabs, setShowSlabs] = useState(false);

  useEffect(() => {
    if (externalPerf !== undefined) {
      setPerf(externalPerf);
      return;
    }
    let active = true;
    fetchMyPerformanceApi()
      .then((res) => {
        if (active) setPerf(res);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [externalPerf]);

  if (!perf) return null;

  const pct = perf.performance?.targetAchievedPct ?? 0;
  const target = perf.monthlyTarget || 0;
  const achieved =
    perf.performance?.achievedRevenue ?? perf.performance?.wonRevenue ?? 0;
  const comm = perf.commission;
  const totalComm = comm?.totalCommissionInr ?? 0;

  return (
    <div className="card-surface p-5 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-brand-navy flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>My Target Quota &amp; Estimated Commission</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Live incentive forecast synced from Closed-Won Deals &amp; GST Collections
          </p>
        </div>

        <div className="flex items-center gap-2">
          {perf.rankInTeam && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60">
              <Award className="w-3.5 h-3.5" />
              Rank #{perf.rankInTeam} / {perf.teamTotalReps || 1}
            </span>
          )}
          <Link
            href="/analytics"
            className="text-xs font-bold text-brand-blue hover:underline"
          >
            Leaderboard →
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-slate-900/70 dark:to-sky-950/30 border border-slate-200/70 dark:border-slate-700/60">
        <QuotaProgressRing pct={pct} />

        <div className="flex-1 w-full space-y-2.5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Estimated Incentive Earned
              </p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span>₹{totalComm.toLocaleString('en-IN')}</span>
                {comm?.quotaAchieved && comm.quotaBonusInr > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    +100% Quota Bonus
                  </span>
                )}
              </p>
            </div>

            <div className="text-left sm:text-right text-xs">
              <p className="font-bold text-brand-navy">
                ₹{achieved.toLocaleString('en-IN')}{' '}
                <span className="font-normal text-slate-400">
                  / {target > 0 ? `₹${target.toLocaleString('en-IN')}` : 'No Quota Set'}
                </span>
              </p>
              {comm && (
                <p className="text-[11px] font-semibold text-brand-blue">
                  Active Slab: {comm.activeTierLabel} ({comm.activeTierRatePct}%)
                </p>
              )}
            </div>
          </div>

          {comm && comm.nextTierRemainingInr > 0 && comm.nextTierRatePct !== null && (
            <div className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                Close{' '}
                <strong className="text-brand-navy">
                  ₹{comm.nextTierRemainingInr.toLocaleString('en-IN')}
                </strong>{' '}
                more to unlock the{' '}
                <strong className="text-emerald-600">
                  {comm.nextTierRatePct}% slab
                </strong>
                !
              </span>
            </div>
          )}
        </div>
      </div>

      {!compact && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800">
            <div className="text-[10px] font-bold uppercase text-slate-400">Won Deals</div>
            <div className="font-extrabold text-brand-navy mt-0.5">
              {perf.performance?.wonDeals ?? 0}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800">
            <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center justify-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-500" /> Win Rate
            </div>
            <div className="font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {perf.performance?.winRatePct ?? 0}%
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800">
            <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center justify-center gap-1">
              <Phone className="w-3 h-3 text-brand-blue" /> CRM Calls
            </div>
            <div className="font-extrabold text-brand-navy mt-0.5">
              {perf.performance?.callsCount ?? 0}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800">
            <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center justify-center gap-1">
              <IndianRupee className="w-3 h-3 text-amber-500" /> Open Pipe
            </div>
            <div className="font-extrabold text-brand-navy mt-0.5">
              ₹{Number(perf.performance?.openPipeline || 0).toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      )}

      {comm && comm.slabBreakdown.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowSlabs((v) => !v)}
            className="text-[11px] font-bold text-slate-500 hover:text-brand-blue inline-flex items-center gap-1"
          >
            <Target className="w-3 h-3" />
            <span>
              {showSlabs ? 'Hide Slab Calculation' : 'View Progressive Slab Calculation'}
            </span>
            {showSlabs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showSlabs && (
            <div className="mt-2.5 space-y-1.5 text-xs">
              {comm.slabBreakdown.map((row, idx) => (
                <div
                  key={`${row.label}-${idx}`}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl border ${
                    row.isActive
                      ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
                      : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800'
                  }`}
                >
                  <span className="font-semibold text-brand-navy">
                    {row.label} · <strong>{row.ratePct}%</strong>
                  </span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{row.earnedInr.toLocaleString('en-IN')} (on ₹
                    {row.eligibleAmountInr.toLocaleString('en-IN')})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
