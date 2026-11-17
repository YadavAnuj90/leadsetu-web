'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  MapPin,
  HeartPulse,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import {
  fetchTerritoryAnalyticsApi,
  type TerritoryAnalyticsResponse,
} from '@/lib/super-admin-api';
import { getErrorMessage } from '@/lib/api-client';

function formatInr(n: number) {
  return `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;
}

export default function TerritoryAnalyticsSection({
  onInspectTenant,
}: {
  onInspectTenant?: (tenantId: string) => void;
}) {
  const [data, setData] = useState<TerritoryAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchTerritoryAnalyticsApi();
      setData(res);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="p-12 rounded-2xl bg-white dark:bg-[#0D1628] border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin text-[#0057FF]" />
        <span>Computing territory clusters &amp; company health scores...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs font-bold text-rose-600 dark:text-rose-300">
        {error || 'Failed to load territory analytics.'}
      </div>
    );
  }

  const maxMrr = Math.max(1, ...data.territories.map((t) => t.mrrInr));

  return (
    <div className="space-y-5">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          {
            label: 'Industrial Clusters',
            val: data.summary.totalTerritories,
            tone: 'text-[#0057FF] dark:text-sky-400',
          },
          {
            label: 'Total Companies',
            val: data.summary.totalTenants,
            tone: 'text-slate-900 dark:text-white',
          },
          {
            label: 'Healthy (70+)',
            val: data.summary.healthy,
            tone: 'text-emerald-600 dark:text-emerald-400',
          },
          {
            label: 'Watchlist (40-69)',
            val: data.summary.watch,
            tone: 'text-amber-600 dark:text-amber-300',
          },
          {
            label: 'At-Risk (<40)',
            val: data.summary.atRisk,
            tone: 'text-rose-600 dark:text-rose-400',
          },
        ].map((k) => (
          <div
            key={k.label}
            className="p-4 rounded-2xl bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm"
          >
            <div className="text-[10px] font-bold uppercase text-slate-400">
              {k.label}
            </div>
            <div className={`text-2xl font-black mt-1 ${k.tone}`}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Territory Cluster Cards */}
      <div className="rounded-2xl p-5 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#0057FF]" />
              <span>Regional &amp; Industrial Cluster Heatmap</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              MRR, AI utilization, active seats, and customer health across industrial territories.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#0057FF]"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-extrabold uppercase text-slate-400">
                <th className="py-2.5 px-3">Territory / Cluster</th>
                <th className="py-2.5 px-3">Companies</th>
                <th className="py-2.5 px-3">Active MRR</th>
                <th className="py-2.5 px-3">Seats</th>
                <th className="py-2.5 px-3">AI Usage</th>
                <th className="py-2.5 px-3">Leads &amp; Won GMV</th>
                <th className="py-2.5 px-3 text-right">Avg Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {data.territories.map((row) => {
                const mrrWidth = Math.max(6, Math.round((row.mrrInr / maxMrr) * 100));
                return (
                  <tr key={row.city}>
                    <td className="py-3 px-3 font-extrabold text-slate-900 dark:text-white">
                      {row.city}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {row.tenants}
                      </span>{' '}
                      <span className="text-[11px] text-slate-400">
                        ({row.active} active · {row.trial} trial)
                      </span>
                    </td>
                    <td className="py-3 px-3 min-w-[140px]">
                      <div className="font-extrabold text-emerald-600 dark:text-emerald-400">
                        {formatInr(row.mrrInr)}
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 mt-1 overflow-hidden">
                        <div
                          className="h-full bg-[#0057FF]"
                          style={{ width: `${mrrWidth}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-700 dark:text-slate-300">
                      {row.seatsUsed}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      {row.aiCallsUsed.toLocaleString('en-IN')} /{' '}
                      {row.aiCap.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {row.leadsCount} leads
                      </div>
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                        {formatInr(row.wonRevenueInr)}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-black ${
                          row.avgHealthScore >= 70
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                            : row.avgHealthScore >= 40
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                        }`}
                      >
                        {row.avgHealthScore}/100
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Company Health Watchlist */}
      <div className="rounded-2xl p-5 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
          <HeartPulse className="w-4 h-4 text-rose-500" />
          <span>Company Account Health Scores (Lowest First)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.tenantsHealth.map((th) => (
            <div
              key={th.id}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                    {th.name}
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    #{th.accountId} · {th.city}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {th.reasons.length > 0 ? (
                    th.reasons.map((r, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300"
                      >
                        <AlertTriangle className="w-2.5 h-2.5" /> {r}
                      </span>
                    ))
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Strong adoption &amp; healthy quota
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                    th.healthBand === 'healthy'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                      : th.healthBand === 'watch'
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                        : 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                  }`}
                >
                  {th.healthScore}/100
                </span>
                {onInspectTenant && (
                  <button
                    type="button"
                    onClick={() => onInspectTenant(th.id)}
                    className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#0057FF] dark:text-sky-400 hover:underline"
                  >
                    <SlidersHorizontal className="w-3 h-3" /> Govern
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
