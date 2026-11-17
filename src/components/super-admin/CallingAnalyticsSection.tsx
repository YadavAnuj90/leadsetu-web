'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HardDrive,
  Loader2,
  PhoneCall,
  PhoneOff,
  Radio,
  RefreshCw,
  Server,
  Wifi,
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
  if (safe < 1024 * 1024 * 1024) return `${(safe / (1024 * 1024)).toFixed(2)} MB`;
  return `${(safe / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatMs(ms: number): string {
  const safe = Math.max(0, Math.round(Number(ms) || 0));
  if (safe >= 1000) return `${(safe / 1000).toFixed(2)} s`;
  return `${safe} ms`;
}

export default function CallingAnalyticsSection() {
  const [data, setData] = useState<CallAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCall, setSelectedCall] =
    useState<CallAnalyticsRecentRow | null>(null);
  const [samples, setSamples] = useState<CallTelemetrySampleRecord[]>([]);
  const [loadingSamples, setLoadingSamples] = useState(false);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCallAnalyticsApi('platform');
      setData(res);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const inspectCallSamples = async (row: CallAnalyticsRecentRow) => {
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

  if (loading && !data) {
    return (
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1628] p-12 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-brand-blue" />
        <span className="text-xs font-bold text-slate-500">
          Loading WebRTC &amp; TURN Calling Analytics...
        </span>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Total Calls',
      value: String(data?.totalCalls ?? 0),
      sub: `${data?.connectedCalls ?? 0} connected · ${data?.missedOrRejectedCalls ?? 0} missed/rejected`,
      icon: PhoneCall,
      tone: 'text-sky-600 bg-sky-500/10 border-sky-500/20 dark:text-sky-300',
    },
    {
      label: 'Connection Success %',
      value: `${data?.successRatePct ?? 0}%`,
      sub: 'Connected over media attempts',
      icon: CheckCircle2,
      tone: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-300',
    },
    {
      label: 'Avg Call Setup Time',
      value: formatMs(data?.avgSetupTimeMs ?? 0),
      sub: 'Answer → ICE media ready',
      icon: Clock,
      tone: 'text-indigo-600 bg-indigo-500/10 border-indigo-500/20 dark:text-indigo-300',
    },
    {
      label: 'TURN Relay Usage %',
      value: `${data?.turnUsagePct ?? 0}%`,
      sub: `${data?.turnRelayCalls ?? 0} TURN · ${data?.directP2pCalls ?? 0} Direct P2P`,
      icon: Server,
      tone: 'text-amber-600 bg-amber-500/10 border-amber-500/20 dark:text-amber-300',
    },
    {
      label: 'Failed Calls',
      value: String(data?.failedCalls ?? 0),
      sub: 'ICE / WebRTC setup failures',
      icon: PhoneOff,
      tone: 'text-rose-600 bg-rose-500/10 border-rose-500/20 dark:text-rose-300',
    },
    {
      label: 'Average RTT',
      value: `${data?.avgRttMs ?? 0} ms`,
      sub: 'Selected ICE pair latency',
      icon: Activity,
      tone: 'text-cyan-600 bg-cyan-500/10 border-cyan-500/20 dark:text-cyan-300',
    },
    {
      label: 'Est. Relay Bandwidth',
      value: formatBytes(data?.estimatedRelayBytes ?? 0),
      sub: 'Bytes sent + received via TURN',
      icon: HardDrive,
      tone: 'text-violet-600 bg-violet-500/10 border-violet-500/20 dark:text-violet-300',
    },
  ];

  const recentCalls = data?.recentCalls || [];
  const breakdown = data?.protocolBreakdown || {
    direct: 0,
    udp: 0,
    tcp: 0,
    tls: 0,
    otherRelay: 0,
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs font-bold text-rose-600 dark:text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Header Action Strip */}
      <div className="rounded-3xl bg-gradient-to-r from-[#091224] via-[#132548] to-[#1D4899] p-6 text-white shadow-lg border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-extrabold uppercase tracking-widest text-cyan-200">
            <Radio className="w-3 h-3 text-emerald-300" />
            WebRTC &amp; TURN Telemetry Monitor
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Platform Calling Health &amp; Relay Analytics
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Measures actual nominated ICE candidate-pair usage (`direct` vs `turn_relay`), connection success rate, call setup latency, RTT, and relay bandwidth across workspaces.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadAnalytics()}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-white text-slate-900 hover:bg-sky-50 text-xs font-extrabold inline-flex items-center gap-1.5 shadow-md disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Sync Telemetry
        </button>
      </div>

      {/* 7 Core Calling KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="rounded-2xl bg-white dark:bg-[#0D1628] border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {item.label}
                </span>
                <span
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center ${item.tone}`}
                >
                  <Icon className="w-4 h-4" />
                </span>
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {item.value}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {item.sub}
                </div>
              </div>
            </div>
          );
        })}

        {/* 8th Grid Card: ICE Transport Breakdown */}
        <div className="rounded-2xl bg-white dark:bg-[#0D1628] border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              ICE Path Mix
            </span>
            <Wifi className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold flex justify-between">
              <span>Direct</span>
              <span>{breakdown.direct}</span>
            </div>
            <div className="px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold flex justify-between">
              <span>TURN UDP</span>
              <span>{breakdown.udp}</span>
            </div>
            <div className="px-2.5 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-bold flex justify-between">
              <span>TURN TCP</span>
              <span>{breakdown.tcp}</span>
            </div>
            <div className="px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold flex justify-between">
              <span>TURN TLS</span>
              <span>{breakdown.tls + breakdown.otherRelay}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Call Logs & Per-Call Telemetry Table */}
      <div className="rounded-3xl bg-white dark:bg-[#0D1628] border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Recent Call Sessions &amp; Selected-Pair Telemetry
            </h3>
            <p className="text-[11px] text-slate-400">
              Click any call row to inspect time-series `call_telemetry_samples`
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {recentCalls.length} recent records
          </span>
        </div>

        {recentCalls.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <PhoneCall className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
              No voice calls logged across the platform yet
            </div>
            <p className="text-xs text-slate-400">
              Once agents place calls on `/calls`, connection paths (`direct` vs `turn_relay`), RTT, setup speed, and bytes appear here.
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
                      onClick={() => void inspectCallSamples(row)}
                      className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-extrabold text-slate-900 dark:text-white">
                          {row.callerName} → {row.calleeName}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(row.startedAt).toLocaleString('en-IN')}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
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
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-700 dark:text-slate-200">
                        {formatCallDuration(row.durationSeconds)}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-300">
                        {row.setupTimeMs > 0 ? formatMs(row.setupTimeMs) : '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                      <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-300">
                        {row.connection?.rttMs ? `${row.connection.rttMs} ms` : '—'}
                        {row.connection?.packetsLost
                          ? ` · ${row.connection.packetsLost} lost`
                          : ''}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-300">
                        {formatBytes(
                          (row.connection?.bytesSent || 0) +
                            (row.connection?.bytesReceived || 0),
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-brand-blue dark:text-sky-400">
                        Inspect →
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Time-Series Telemetry Sample Drawer/Modal */}
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
                  No periodic WebRTC samples stored for this call (e.g. call was missed, declined, or ended before ICE stats interval).
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
