'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Loader2,
  Megaphone,
  MessageSquare,
  RefreshCw,
  Search,
  Stethoscope,
  Store,
} from 'lucide-react';
import {
  fetchIntegrationsWatchdogApi,
  probeTenantIntegrationsApi,
  type SuperAdminIntegrationWatchdogResponse,
  type TenantIntegrationProbeResponse,
  type WatchdogHealthState,
} from '@/lib/super-admin-api';
import { getErrorMessage } from '@/lib/api-client';

function StatusBadge({
  status,
  label,
  sub,
}: {
  status: WatchdogHealthState;
  label: string;
  sub?: string;
}) {
  const cls =
    status === 'error'
      ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
      : status === 'warning'
        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
        : status === 'healthy'
          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
          : 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';
  return (
    <div className={`inline-flex flex-col px-2.5 py-1.5 rounded-xl border text-[11px] ${cls}`}>
      <span className="font-extrabold uppercase tracking-tight">{label}</span>
      {sub && <span className="text-[10px] opacity-85 truncate max-w-[170px]">{sub}</span>}
    </div>
  );
}

export default function IntegrationsWatchdogSection({
  onInspectTenant,
}: {
  onInspectTenant: (tenantId: string) => void;
}) {
  const [data, setData] = useState<SuperAdminIntegrationWatchdogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'configured' | 'errors' | 'all'>(
    'configured',
  );
  const [search, setSearch] = useState('');
  const [probingTenantId, setProbingTenantId] = useState<string | null>(null);
  const [probeResult, setProbeResult] =
    useState<TenantIntegrationProbeResponse | null>(null);

  const loadWatchdog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchIntegrationsWatchdogApi();
      setData(res);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWatchdog();
  }, [loadWatchdog]);

  const handleRunProbe = async (tenantId: string) => {
    setProbingTenantId(tenantId);
    setError(null);
    try {
      const res = await probeTenantIntegrationsApi(tenantId, {
        connector: 'all',
        reason: 'HQ Watchdog 1-Click Probe',
      });
      setProbeResult(res);
      await loadWatchdog();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setProbingTenantId(null);
    }
  };

  const filteredTenants = useMemo(() => {
    const rows = data?.tenants || [];
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filterMode === 'errors' && r.overallHealth !== 'critical' && r.overallHealth !== 'warning') {
        return false;
      }
      if (filterMode === 'configured' && r.overallHealth === 'idle') {
        return false;
      }
      if (!q) return true;
      return (
        r.companyName.toLowerCase().includes(q) ||
        r.accountId.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q)
      );
    });
  }, [data, filterMode, search]);

  const s = data?.summary;

  return (
    <div className="space-y-6">
      {/* 4 Watchdog Telemetry KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl p-4 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Critical / Broken Tenants</span>
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1.5">
            {s?.criticalTenants ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {s?.warningTenants ?? 0} warnings · {s?.healthyTenants ?? 0} healthy
          </div>
        </div>

        <div className="rounded-2xl p-4 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Meta CAPI Failures</span>
            <Megaphone className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">
            {s?.totalCapiFailures ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Failed Graph v21.0 conversion calls
          </div>
        </div>

        <div className="rounded-2xl p-4 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>IndiaMART Pull Errors</span>
            <Store className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">
            {s?.totalIndiaMartErrors ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Failed CRM Key v2 sync cycles
          </div>
        </div>

        <div className="rounded-2xl p-4 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>WhatsApp Cloud Failures</span>
            <MessageSquare className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">
            {s?.totalWhatsappFailures ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Undelivered outbound Cloud messages
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Live 1-Click Probe Result Card */}
      {probeResult && (
        <div className="rounded-3xl p-5 bg-slate-900 text-white border border-slate-800 shadow-lg space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-black">
                Diagnostic Probe: {probeResult.companyName} (#{probeResult.accountId})
              </span>
            </div>
            <button
              type="button"
              onClick={() => onInspectTenant(probeResult.tenantId)}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-[#0057FF] text-xs font-bold"
            >
              <span>Open Governance</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {probeResult.probes.map((p) => (
              <div
                key={p.connector}
                className={`p-3.5 rounded-2xl border text-xs ${
                  p.status === 'error'
                    ? 'bg-rose-500/15 border-rose-400/40'
                    : p.status === 'warning'
                      ? 'bg-amber-500/15 border-amber-400/40'
                      : p.status === 'healthy'
                        ? 'bg-emerald-500/15 border-emerald-400/40'
                        : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-center justify-between font-extrabold uppercase text-[11px]">
                  <span>{p.connector.replace('_', ' ')}</span>
                  <span>{p.status}</span>
                </div>
                <p className="text-[11px] text-slate-200 mt-1.5 leading-relaxed">
                  {p.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-Tenant Integration Health Matrix */}
      <div className="rounded-3xl p-6 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#0057FF]" />
              <span>Workspace Integration &amp; Webhook Matrix</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Detect expired Meta tokens, failing IndiaMART pull keys, and blocked WhatsApp delivery proactively.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter tenant or #UID..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
              />
            </div>

            {(
              [
                ['configured', 'Active Integrations'],
                ['errors', 'Errors & Warnings'],
                ['all', 'All Workspaces'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilterMode(id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  filterMode === id
                    ? 'bg-slate-900 dark:bg-[#0057FF] text-white'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => void loadWatchdog()}
              disabled={loading}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-[#0057FF]"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {filteredTenants.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
            No workspaces match this integration filter. Switch to &ldquo;All Workspaces&rdquo; to inspect unconfigured accounts too.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Workspace</th>
                  <th className="py-2.5 px-4">WhatsApp Cloud</th>
                  <th className="py-2.5 px-4">Meta CAPI</th>
                  <th className="py-2.5 px-4">IndiaMART Pull v2</th>
                  <th className="py-2.5 px-4 text-right">Diagnostics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredTenants.map((row) => (
                  <tr
                    key={row.tenantId}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-[#0057FF] shrink-0" />
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          {row.companyName}
                        </span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          #{row.accountId}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 uppercase">
                        {row.plan} · {row.city}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge
                        status={row.whatsappCloud.status}
                        label={
                          row.whatsappCloud.status === 'unconfigured'
                            ? 'Not Set'
                            : `${row.whatsappCloud.status} (${row.whatsappCloud.failureRatePct}% fail)`
                        }
                        sub={
                          row.whatsappCloud.lastError ||
                          `${row.whatsappCloud.totalOutbound} sent / ${row.whatsappCloud.failedOutbound} failed`
                        }
                      />
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge
                        status={row.metaCapi.status}
                        label={
                          row.metaCapi.status === 'unconfigured'
                            ? 'Not Set'
                            : `${row.metaCapi.status} (${row.metaCapi.failureRatePct}% fail)`
                        }
                        sub={
                          row.metaCapi.lastError ||
                          `${row.metaCapi.sentEvents + row.metaCapi.simulatedEvents} ok / ${row.metaCapi.failedEvents} failed`
                        }
                      />
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge
                        status={row.indiamartPull.status}
                        label={
                          row.indiamartPull.status === 'unconfigured'
                            ? 'Not Set'
                            : `${row.indiamartPull.status} (${row.indiamartPull.failureRatePct}% fail)`
                        }
                        sub={
                          row.indiamartPull.lastError ||
                          `${row.indiamartPull.successRuns} ok / ${row.indiamartPull.errorRuns} errors`
                        }
                      />
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                      <button
                        type="button"
                        disabled={probingTenantId === row.tenantId}
                        onClick={() => void handleRunProbe(row.tenantId)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-cyan-400/50 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 text-[11px] font-bold hover:bg-cyan-500/20 disabled:opacity-50"
                      >
                        {probingTenantId === row.tenantId ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Stethoscope className="w-3.5 h-3.5" />
                        )}
                        <span>Run Probe</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onInspectTenant(row.tenantId)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#0057FF] text-white text-[11px] font-bold hover:bg-blue-700"
                      >
                        <span>Govern</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cross-Tenant Recent Failure Stream */}
      <div className="rounded-3xl p-6 bg-white dark:bg-[#0D1628] border border-slate-200/85 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span>Live Cross-Tenant Integration Error Feed ({data?.recentFailures.length ?? 0})</span>
          </h3>
          <span className="text-[11px] text-slate-400">
            Newest failures across Meta CAPI, IndiaMART Pull v2 &amp; WhatsApp Cloud
          </span>
        </div>

        {(data?.recentFailures || []).length === 0 ? (
          <div className="p-6 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-500/10 text-center text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Zero integration failures recorded across platform tenants.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {(data?.recentFailures || []).slice(0, 12).map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black uppercase">
                      {item.connector.replace('_', ' ')}
                    </span>
                    <button
                      type="button"
                      onClick={() => onInspectTenant(item.tenantId)}
                      className="font-extrabold text-slate-900 dark:text-white hover:text-[#0057FF]"
                    >
                      {item.companyName} (#{item.accountId})
                    </button>
                    <span className="text-slate-500 dark:text-slate-400">
                      · {item.summary}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-rose-700 dark:text-rose-300 truncate">
                    {item.errorMessage}
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap shrink-0">
                  {new Date(item.occurredAt).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
