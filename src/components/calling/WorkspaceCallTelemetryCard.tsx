'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  Loader2,
  PhoneCall,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  fetchCallAnalyticsApi,
  fetchCallTelemetryApi,
  type CallAnalyticsRecentRow,
  type CallAnalyticsResponse,
  type CallTelemetrySampleRecord,
} from '@/lib/calls-api';
import { formatCallDuration } from '@/store/call-ui.store';
import { getErrorMessage } from '@/lib/api-client';

function formatBytes(bytes: number): string {
  const safe = Math.max(0, Number(bytes) || 0);
  if (safe < 1024) return `${safe} B`;
  if (safe < 1024 * 1024) return `${(safe / 1024).toFixed(1)} KB`;
  return `${(safe / (1024 * 1024)).toFixed(2)} MB`;
}

function formatMs(ms: number): string {
  const safe = Math.max(0, Math.round(Number(ms) || 0));
  if (safe >= 1000) return `${(safe / 1000).toFixed(2)} s`;
  return `${safe} ms`;
}

export default function WorkspaceCallTelemetryCard() {
  const [data, setData] = useState<CallAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCall, setSelectedCall] =
    useState<CallAnalyticsRecentRow | null>(null);
  const [samples, setSamples] = useState<CallTelemetrySampleRecord[]>([]);
  const [loadingSamples, setLoadingSamples] = useState(false);

  const loadWorkspaceAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCallAnalyticsApi('workspace');
      setData(res);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWorkspaceAnalytics();
  }, [loadWorkspaceAnalytics]);

  const inspectSamples = async (row: CallAnalyticsRecentRow) => {
    setSelectedCall(row);
    setLoadingSamples(true);
    try {
      const res = await fetchCallTelemetryApi(row.id);
      setSamples(res.samples || []);
    } catch {
      setSamples([]);
    } finally {
      setLoadingSamples(false);
    }
  };

  const recentCalls = data?.recentCalls || [];

  return (
    <div className="rounded-3xl bg-white dark:bg-[#0D1628] border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-extrabold text-brand-navy dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-blue" />
            Workspace Call Logs &amp; WebRTC Telemetry
          </h2>
          <p className="text-[11px] text-slate-400">
            Full tenant-scoped call sessions (`Caller → Callee`), duration, ICE path, and per-call sample inspection
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 text-[10px] font-extrabold">
              {data.successRatePct}% Connected · Avg {formatMs(data.avgRttMs)} RTT
            </span>
          )}
          <button
            type="button"
            onClick={() => void loadWorkspaceAnalytics()}
            disabled={loading}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="p-6 text-xs font-semibold text-rose-600 dark:text-rose-300">
          {error}
        </div>
      ) : loading && !data ? (
        <div className="p-8 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-brand-blue" />
          <span>Loading workspace call telemetry...</span>
        </div>
      ) : recentCalls.length === 0 ? (
        <div className="p-10 text-center space-y-1.5">
          <PhoneCall className="w-7 h-7 text-slate-300 dark:text-slate-600 mx-auto" />
          <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
            No workspace call telemetry yet
          </div>
          <p className="text-[11px] text-slate-400">
            Placed calls will appear here with ICE connection diagnostics.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3">Caller → Callee</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Setup Time</th>
                <th className="px-4 py-3">ICE Path</th>
                <th className="px-4 py-3">RTT / Loss</th>
                <th className="px-4 py-3">Media Bytes</th>
                <th className="px-5 py-3 text-right">Samples</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentCalls.map((row) => {
                const turn = Boolean(row.connection?.turnUsed);
                const failed = row.status === 'failed';
                return (
                  <tr
                    key={row.id}
                    onClick={() => void inspectSamples(row)}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="font-extrabold text-slate-900 dark:text-white">
                        {row.callerName} → {row.calleeName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(row.startedAt).toLocaleString('en-IN')}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          row.status === 'completed' || row.status === 'connected'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : failed
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-200">
                      {formatCallDuration(row.durationSeconds)}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                      {row.setupTimeMs > 0 ? formatMs(row.setupTimeMs) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          failed || row.connection?.icePath === 'failed'
                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300'
                            : turn
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                        }`}
                      >
                        {turn
                          ? `TURN${row.connection?.relayProtocol ? ` (${row.connection.relayProtocol.toUpperCase()})` : ''}`
                          : row.connection?.icePath === 'failed'
                            ? 'Failed'
                            : 'Direct P2P'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                      {row.connection?.rttMs ? `${row.connection.rttMs} ms` : '—'}
                      {row.connection?.packetsLost
                        ? ` · ${row.connection.packetsLost} lost`
                        : ''}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                      {formatBytes(
                        (row.connection?.bytesSent || 0) +
                          (row.connection?.bytesReceived || 0),
                      )}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-brand-blue dark:text-sky-400">
                      Inspect →
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedCall && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedCall(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-3xl bg-white dark:bg-[#0D1628] border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Call Telemetry Samples · {selectedCall.callerName} →{' '}
                  {selectedCall.calleeName}
                </h4>
                <p className="text-[11px] text-slate-400">
                  Selected ICE path: {selectedCall.connection?.icePath || 'direct'} · Avg RTT:{' '}
                  {selectedCall.connection?.rttMs || 0} ms · Max RTT:{' '}
                  {selectedCall.connection?.maxRttMs || 0} ms
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCall(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-2">
              {loadingSamples ? (
                <div className="py-10 flex items-center justify-center gap-2 text-xs text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-blue" />
                  <span>Loading periodic WebRTC stats samples...</span>
                </div>
              ) : samples.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  No periodic WebRTC samples stored for this call (e.g. missed, rejected, or short call).
                </div>
              ) : (
                samples.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-mono font-bold text-slate-900 dark:text-white">
                        {new Date(s.sampledAt).toLocaleTimeString('en-IN')} ·{' '}
                        {s.icePath.toUpperCase()}
                        {s.relayProtocol ? ` (${s.relayProtocol})` : ''}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Pair: {s.localCandidateType || '—'} ↔{' '}
                        {s.remoteCandidateType || '—'} · ICE:{' '}
                        {s.iceConnectionState || '—'}
                      </div>
                    </div>
                    <div className="text-right font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      <div>
                        RTT {s.rttMs}ms · Jitter {s.jitterMs}ms · Lost {s.packetsLost}
                      </div>
                      <div className="text-slate-400">
                        ↑ {formatBytes(s.bytesSent)} · ↓ {formatBytes(s.bytesReceived)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
