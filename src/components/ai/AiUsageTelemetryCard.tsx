'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Loader2,
  Sparkles,
  Clock,
  XCircle,
} from 'lucide-react';
import {
  checkAiCopilotHealthApi,
  fetchAiTenantUsageApi,
  type AiCopilotHealthResponse,
  type AiTenantUsageResponse,
} from '@/lib/ai-copilot-api';
import {
  createTopupRequestApi,
  fetchTopupRequestsApi,
  type WorkspaceTopupRequestItem,
} from '@/lib/tenants-api';
import { getErrorMessage } from '@/lib/api-client';

export default function AiUsageTelemetryCard() {
  const [health, setHealth] = useState<AiCopilotHealthResponse | null>(null);
  const [usage, setUsage] = useState<AiTenantUsageResponse | null>(null);
  const [topups, setTopups] = useState<WorkspaceTopupRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reqResource, setReqResource] = useState<'ai' | 'whatsapp'>('ai');
  const [reqQty, setReqQty] = useState(2500);
  const [reqNote, setReqNote] = useState('');
  const [reqBusy, setReqBusy] = useState(false);
  const [reqMsg, setReqMsg] = useState<string | null>(null);
  const [reqErr, setReqErr] = useState<string | null>(null);

  const loadTelemetry = useCallback(async () => {
    setIsLoading(true);
    try {
      const [h, u, tr] = await Promise.all([
        checkAiCopilotHealthApi(),
        fetchAiTenantUsageApi(),
        fetchTopupRequestsApi().catch(() => ({ data: [] })),
      ]);
      setHealth(h);
      setUsage(u);
      setTopups(tr.data || []);
    } catch {
      // keep existing state cleanly
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRequestTopup = async () => {
    setReqBusy(true);
    setReqMsg(null);
    setReqErr(null);
    try {
      const res = await createTopupRequestApi({
        resource: reqResource,
        quantity: reqQty,
        note: reqNote.trim() || undefined,
      });
      setTopups(res.data || []);
      setReqNote('');
      setReqMsg(
        `Submitted +${reqQty.toLocaleString('en-IN')} ${reqResource.toUpperCase()} top-up request to Leadsetu Super Admin.`,
      );
    } catch (err) {
      setReqErr(getErrorMessage(err));
    } finally {
      setReqBusy(false);
    }
  };

  useEffect(() => {
    loadTelemetry();
  }, [loadTelemetry]);

  const dailyPct = usage
    ? Math.min(
        100,
        Math.round(
          (usage.dailyTokensUsed / Math.max(1, usage.dailyTokenLimit)) * 100,
        ),
      )
    : 0;
  const monthlyPct = usage
    ? Math.min(
        100,
        Math.round(
          (usage.monthlyTokensUsed / Math.max(1, usage.monthlyTokenLimit)) * 100,
        ),
      )
    : 0;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 dark:border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-brand-blue text-white flex items-center justify-center shadow-md shadow-brand-blue/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-brand-navy">
              Leadsetu AI Gateway &amp; Token Budget Telemetry
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live connection status, active SetuAI Neural Core, and workspace token usage caps.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {health ? (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${
                health.connected
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
              }`}
            >
              {health.connected ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5" />
              )}
              {health.connected
                ? health.details?.liveLlmConfigured
                  ? 'Connected · SetuAI Neural Core'
                  : 'Connected · Heuristic Mode'
                : 'AI Gateway Offline'}
            </span>
          ) : null}

          <button
            type="button"
            disabled={isLoading}
            onClick={loadTelemetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-brand-navy dark:text-slate-200 hover:border-brand-blue transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-blue" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 text-brand-blue" />
            )}
            Refresh
          </button>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Active Pillars */}
        {health?.details?.pillars && health.details.pillars.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {health.details.pillars.map((pillar) => (
              <span
                key={pillar}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-brand-blue/10 text-brand-blue border border-brand-blue/25"
              >
                {pillar.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}

        {/* Super Admin Governed Workspace AI Balance */}
        {usage?.workspaceAiBalance && (
          <div className="p-4 rounded-2xl border border-brand-blue/25 bg-brand-blue/10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-brand-blue">
                Workspace AI Call Balance (Super Admin Allocation)
              </div>
              <div className="text-lg font-black text-brand-navy dark:text-white mt-0.5">
                {usage.workspaceAiBalance.aiBalanceRemaining.toLocaleString('en-IN')} calls remaining
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-2">
                  ({usage.workspaceAiBalance.aiCallsUsed.toLocaleString('en-IN')} used /{' '}
                  {usage.workspaceAiBalance.maxMonthlyAiCalls.toLocaleString('en-IN')} cap)
                </span>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                usage.workspaceAiBalance.aiEnabled
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
              }`}
            >
              {usage.workspaceAiBalance.aiEnabled
                ? 'AI Features Assigned (Active)'
                : 'AI Features Removed by Super Admin'}
            </span>
          </div>
        )}

        {/* Usage Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111D33] border border-slate-200/80 dark:border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500 dark:text-slate-400">
                Daily Token Budget
              </span>
              <span className="font-extrabold text-brand-navy dark:text-white">
                {dailyPct}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full bg-brand-blue transition-all"
                style={{ width: `${dailyPct}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {(usage?.dailyTokensUsed || 0).toLocaleString('en-IN')} /{' '}
              {(usage?.dailyTokenLimit || 50000).toLocaleString('en-IN')} tokens ({usage?.dailyCalls || 0} calls)
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111D33] border border-slate-200/80 dark:border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500 dark:text-slate-400">
                Monthly Token Budget
              </span>
              <span className="font-extrabold text-brand-navy dark:text-white">
                {monthlyPct}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${monthlyPct}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {(usage?.monthlyTokensUsed || 0).toLocaleString('en-IN')} /{' '}
              {(usage?.monthlyTokenLimit || 500000).toLocaleString('en-IN')} tokens ({usage?.monthlyCalls || 0} calls)
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111D33] border border-slate-200/80 dark:border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500 dark:text-slate-400">
                Est. Gateway Spend
              </span>
              <Activity className="w-4 h-4 text-brand-blue" />
            </div>
            <div className="text-2xl font-black text-brand-navy dark:text-white">
              ${Number(usage?.estimatedCostUsd || 0).toFixed(4)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Endpoint: {health?.aiUrl || 'http://localhost:3002'}
            </div>
          </div>
        </div>

        {/* Recent Executions */}
        {usage && usage.recentRecords.length > 0 ? (
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#111D33] text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-2.5 font-bold">Task</th>
                  <th className="px-4 py-2.5 font-bold">Model</th>
                  <th className="px-4 py-2.5 font-bold text-right">Tokens</th>
                  <th className="px-4 py-2.5 font-bold text-right">Est. Cost</th>
                  <th className="px-4 py-2.5 font-bold text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                {usage.recentRecords.slice(0, 6).map((rec, i) => (
                  <tr key={`${rec.createdAt}-${i}`}>
                    <td className="px-4 py-2.5 font-bold text-brand-navy dark:text-white">
                      {rec.task}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      {rec.model}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold">
                      {rec.totalTokens}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-[11px]">
                      ${rec.costEstimateUsd.toFixed(5)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-400">
                      {new Date(rec.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111D33] border border-slate-200/80 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">
            No AI tasks executed in the current gateway window yet. Use <strong>Ask AI</strong>, Credit Risk, Voice-to-CRM, or Dealer RFQ Parser to see live token telemetry here.
          </div>
        )}

        {/* Request AI / WhatsApp Top-Up from Super Admin */}
        <div className="pt-4 border-t border-slate-100 dark:border-white/10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-extrabold text-brand-navy dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand-blue" />
                <span>Request AI or WhatsApp Balance Top-Up from Super Admin</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Need extra monthly AI calls or WhatsApp capacity? Submit a 1-click request to Leadsetu HQ.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
            <div className="sm:col-span-3">
              <label className="block text-[10px] font-bold uppercase text-slate-400">
                Resource
              </label>
              <select
                value={reqResource}
                onChange={(e) => setReqResource(e.target.value as 'ai' | 'whatsapp')}
                className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#111D33] border border-slate-200 dark:border-white/15 text-xs font-bold"
              >
                <option value="ai">SetuAI Calls</option>
                <option value="whatsapp">WhatsApp Messages</option>
              </select>
            </div>
            <div className="sm:col-span-3">
              <label className="block text-[10px] font-bold uppercase text-slate-400">
                Quantity Needed
              </label>
              <input
                type="number"
                min={100}
                step={500}
                value={reqQty}
                onChange={(e) => setReqQty(Math.max(100, Number(e.target.value) || 0))}
                className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#111D33] border border-slate-200 dark:border-white/15 text-xs font-extrabold"
              />
            </div>
            <div className="sm:col-span-4">
              <label className="block text-[10px] font-bold uppercase text-slate-400">
                Reason / Note for HQ
              </label>
              <input
                type="text"
                value={reqNote}
                onChange={(e) => setReqNote(e.target.value)}
                placeholder="e.g. Festive dealer campaign burst..."
                className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#111D33] border border-slate-200 dark:border-white/15 text-xs"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="button"
                disabled={reqBusy}
                onClick={handleRequestTopup}
                className="w-full btn-primary-brand px-3.5 py-2 rounded-xl text-xs font-extrabold text-white disabled:opacity-50"
              >
                {reqBusy ? 'Sending...' : 'Request Top-Up'}
              </button>
            </div>
          </div>

          {reqMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              {reqMsg}
            </div>
          )}
          {reqErr && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-bold text-rose-600 dark:text-rose-300">
              {reqErr}
            </div>
          )}

          {topups.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {topups.slice(0, 4).map((tr) => (
                <div
                  key={tr.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border border-slate-200 dark:border-white/12 bg-slate-50 dark:bg-[#111D33]"
                >
                  {tr.status === 'approved' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : tr.status === 'rejected' ? (
                    <XCircle className="w-3.5 h-3.5 text-rose-500" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  <span>
                    +{tr.quantity.toLocaleString('en-IN')} {tr.resource.toUpperCase()} ·{' '}
                    <strong className="uppercase">{tr.status}</strong>
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
