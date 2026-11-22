'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FlaskConical,
  Loader2,
  MessageSquare,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
  Store,
  Zap,
} from 'lucide-react';
import {
  fetchMarketplaceSyncOverviewApi,
  pullIndiaMartNowApi,
  rescueSlaLeadApi,
  updateIndiaMartConfigApi,
  type MarketplaceSyncOverviewResponse,
} from '@/lib/marketplace-sync-api';
import { getErrorMessage } from '@/lib/api-client';

export default function IndiaMartPullPanel() {
  const [data, setData] = useState<MarketplaceSyncOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pullingMode, setPullingMode] = useState<'live' | 'sandbox' | null>(null);
  const [rescuingId, setRescuingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Config state
  const [enabled, setEnabled] = useState(false);
  const [crmKey, setCrmKey] = useState('');
  const [registeredMobile, setRegisteredMobile] = useState('');
  const [pollIntervalMinutes, setPollIntervalMinutes] = useState(5);
  const [autoWhatsAppSpeedToLead, setAutoWhatsAppSpeedToLead] = useState(true);
  const [greetingTemplate, setGreetingTemplate] = useState('');
  const [slaThresholdMinutes, setSlaThresholdMinutes] = useState(10);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMarketplaceSyncOverviewApi();
      setData(res);
      setEnabled(res.config.enabled);
      setRegisteredMobile(res.config.registeredMobile);
      setPollIntervalMinutes(res.config.pollIntervalMinutes);
      setAutoWhatsAppSpeedToLead(res.config.autoWhatsAppSpeedToLead);
      setGreetingTemplate(res.config.greetingTemplate);
      setSlaThresholdMinutes(res.config.slaThresholdMinutes);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const res = await updateIndiaMartConfigApi({
        enabled,
        ...(crmKey.trim() ? { glusrCrmKey: crmKey.trim() } : {}),
        registeredMobile: registeredMobile.trim(),
        pollIntervalMinutes: Number(pollIntervalMinutes) || 5,
        autoWhatsAppSpeedToLead,
        greetingTemplate: greetingTemplate.trim(),
        slaThresholdMinutes: Number(slaThresholdMinutes) || 10,
      });
      setData(res);
      setCrmKey('');
      setNotice(
        res.config.enabled
          ? `IndiaMART Pull API v2 background sync enabled every ${res.config.pollIntervalMinutes} min with <10s Auto-WhatsApp.`
          : 'IndiaMART Pull & <10s Speed-to-Lead template settings saved.',
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handlePullNow = async (sandbox: boolean) => {
    setPullingMode(sandbox ? 'sandbox' : 'live');
    setError(null);
    setNotice(null);
    try {
      const res = await pullIndiaMartNowApi({
        simulateIfNoKey: sandbox,
        sampleCount: 2,
      });
      setNotice(
        `${res.summaryText} (completed in ${res.durationMs}ms). Inspect captured leads in Leads & WhatsApp Inbox.`,
      );
      await loadOverview();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPullingMode(null);
    }
  };

  const handleRescueLead = async (leadId: string) => {
    setRescuingId(leadId);
    setError(null);
    setNotice(null);
    try {
      const res = await rescueSlaLeadApi(leadId);
      setNotice(
        `Sent instant WhatsApp rescue greeting to ${res.name} (Speed-to-Lead updated).`,
      );
      await loadOverview();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRescuingId(null);
    }
  };

  const cfg = data?.config;
  const sla = data?.slaMetrics;

  return (
    <section
      id="indiamart-pull"
      className="bg-white dark:bg-[#0D1628] rounded-3xl border border-slate-200 dark:border-white/10 p-6 sm:p-7 shadow-sm space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 text-[11px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300">
            <Store className="w-3.5 h-3.5" />
            <span>IndiaMART Pull API (CRM Key v2) + &lt;10s Speed-to-Lead Engine</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-brand-navy dark:text-white">
            Never Lose a B2B Buyer to Slow Follow-Up: Auto-Pull, Dedupe &amp; Reply in &lt;10 Seconds
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
            Polls your IndiaMART Seller <code className="font-mono text-[11px]">glusr_crm_key</code> every 5 minutes, deduplicates repeat buyers by <code className="font-mono text-[11px]">UNIQUE_QUERY_ID</code> &amp; phone, routes by territory/round-robin, and fires an instant Hinglish/English WhatsApp greeting in under 10 seconds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={pullingMode !== null}
            onClick={() => void handlePullNow(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/15 text-xs font-extrabold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 disabled:opacity-50"
          >
            {pullingMode === 'sandbox' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FlaskConical className="w-3.5 h-3.5" />
            )}
            <span>Simulate IndiaMART Pull Batch</span>
          </button>

          <button
            type="button"
            disabled={pullingMode !== null}
            onClick={() => void handlePullNow(false)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-navy hover:bg-slate-800 text-white text-xs font-extrabold disabled:opacity-50"
          >
            {pullingMode === 'live' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>{cfg?.hasCrmKey ? 'Sync Live API Now' : 'Run Sync Now'}</span>
          </button>
        </div>
      </div>

      {/* Notices */}
      {notice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            {notice}
          </span>
          <Link href="/leads" className="underline font-bold inline-flex items-center gap-1 shrink-0">
            View Leads <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-xs font-semibold text-rose-700 dark:text-rose-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Speed-to-Lead KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111D33] border border-slate-200/80 dark:border-white/10">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Marketplace Leads
          </div>
          <div className="text-xl font-extrabold text-brand-navy dark:text-white mt-1">
            {sla?.totalMarketplaceLeads ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {sla?.autoWelcomedCount ?? 0} auto-welcomed on WhatsApp
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111D33] border border-slate-200/80 dark:border-white/10">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            &lt;10s Speed-to-Lead
          </div>
          <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
            <Zap className="w-4 h-4" />
            <span>{sla?.under10sPct ?? 0}%</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {sla?.contactedUnder10sCount ?? 0} answered under 10 sec
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111D33] border border-slate-200/80 dark:border-white/10">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Avg Response Time
          </div>
          <div className="text-xl font-extrabold text-brand-blue dark:text-sky-400 mt-1 flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{sla?.avgSpeedToLeadSeconds ?? 0}s</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Target SLA: &le; {cfg?.slaThresholdMinutes ?? 10} min
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111D33] border border-slate-200/80 dark:border-white/10">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Unattended SLA Breaches
          </div>
          <div
            className={`text-xl font-extrabold mt-1 ${
              (sla?.slaBreachedCount ?? 0) > 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {sla?.slaBreachedCount ?? 0} Pending
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {cfg?.lastSyncedAt
              ? `Last sync: ${new Date(cfg.lastSyncedAt).toLocaleTimeString('en-IN')}`
              : 'Ready to sync'}
          </div>
        </div>
      </div>

      {/* Config + SLA Rescue Split */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <form
          onSubmit={handleSaveConfig}
          className="xl:col-span-7 p-5 rounded-2xl bg-slate-50/70 dark:bg-[#111D33] border border-slate-200/80 dark:border-white/10 space-y-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-blue" />
              <h3 className="text-sm font-extrabold text-brand-navy dark:text-white">
                IndiaMART Seller Pull Credentials &amp; Speed-to-Lead Template
              </h3>
            </div>
            <label className="inline-flex items-center gap-2 text-xs font-bold text-brand-navy dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="rounded border-slate-300 text-brand-blue"
              />
              <span>Auto-Poll Live API</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  IndiaMART CRM Key v2 (Encrypted)
                </label>
                {cfg?.hasCrmKey && (
                  <span className="text-[10px] font-mono text-emerald-600">
                    Saved: {cfg.glusrCrmKeyMask}
                  </span>
                )}
              </div>
              <input
                type="password"
                value={crmKey}
                onChange={(e) => setCrmKey(e.target.value)}
                placeholder={
                  cfg?.hasCrmKey
                    ? 'Leave blank to keep saved key, or paste new key'
                    : 'Paste glusr_crm_key from seller.indiamart.com'
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628] text-xs font-mono text-brand-navy dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Poll Every (Min)
                </label>
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={pollIntervalMinutes}
                  onChange={(e) => setPollIntervalMinutes(Number(e.target.value) || 5)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628] text-xs text-brand-navy dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  SLA Alert (Min)
                </label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={slaThresholdMinutes}
                  onChange={(e) => setSlaThresholdMinutes(Number(e.target.value) || 10)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628] text-xs text-brand-navy dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-xs font-bold text-brand-navy dark:text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoWhatsAppSpeedToLead}
                  onChange={(e) => setAutoWhatsAppSpeedToLead(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600"
                />
                <span>Send Instant &lt;10s Auto-WhatsApp Reply on New Inquiry</span>
              </label>
              <span className="text-[10px] font-mono text-slate-400">
                {'{{buyer_name}} {{product}} {{rep_name}} {{company}}'}
              </span>
            </div>
            <textarea
              rows={2}
              value={greetingTemplate}
              onChange={(e) => setGreetingTemplate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628] text-xs text-brand-navy dark:text-white resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[340px]">
              {cfg?.lastSyncSummary || 'Works via live IndiaMART v2 key or 1-click sandbox simulation.'}
            </span>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-blue hover:bg-blue-600 text-white text-xs font-extrabold disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Save Pull &amp; SLA Settings</span>
            </button>
          </div>
        </form>

        {/* Right: Unattended SLA Breach Queue */}
        <div className="xl:col-span-5 p-5 rounded-2xl bg-slate-50/70 dark:bg-[#111D33] border border-slate-200/80 dark:border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-brand-navy dark:text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-rose-500" />
              <span>Unattended SLA Watchlist (&gt;{cfg?.slaThresholdMinutes ?? 10}m)</span>
            </h3>
            <span className="text-[11px] font-bold text-slate-500">
              {sla?.slaBreachedCount ?? 0} waiting
            </span>
          </div>

          {(sla?.slaBreachedLeads || []).length === 0 ? (
            <div className="p-6 rounded-xl border border-dashed border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/10 text-center text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              Zero SLA breaches! Every IndiaMART / marketplace inquiry has been contacted within target time.
            </div>
          ) : (
            <div className="space-y-2 max-h-[230px] overflow-y-auto pr-1">
              {(sla?.slaBreachedLeads || []).map((lead) => (
                <div
                  key={lead.id}
                  className="p-3 rounded-xl bg-white dark:bg-[#0D1628] border border-rose-200/70 dark:border-rose-500/30 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-brand-navy dark:text-white truncate">
                      {lead.name}{' '}
                      <span className="text-[10px] font-mono text-rose-600">
                        ({lead.ageMinutes}m untouched)
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {lead.source.toUpperCase()} · {lead.city} · Rep: {lead.ownerName}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={rescuingId === lead.id}
                    onClick={() => void handleRescueLead(lead.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shrink-0 disabled:opacity-50"
                  >
                    {rescuingId === lead.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Send className="w-3 h-3" />
                    )}
                    <span>Rescue WA</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sync Run Audit Logs */}
      {(data?.recentLogs || []).length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-brand-navy dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-blue" />
              <span>Recent Pull Sync &amp; Speed-to-Lead Runs</span>
            </h3>
            <span className="text-[11px] text-slate-500">
              Automatic deduplication + territory routing + WhatsApp dispatch telemetry
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-white/10">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#111D33] text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-white/10">
                <tr>
                  <th className="py-2.5 px-4">Synced At</th>
                  <th className="py-2.5 px-4">Channel &amp; Mode</th>
                  <th className="py-2.5 px-4">Fetched</th>
                  <th className="py-2.5 px-4">Created / Merged</th>
                  <th className="py-2.5 px-4">&lt;10s WhatsApp</th>
                  <th className="py-2.5 px-4 text-right">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/10 bg-white dark:bg-[#0D1628]">
                {(data?.recentLogs || []).slice(0, 8).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-[#111D33]/50">
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      {new Date(log.syncedAt).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-bold text-brand-navy dark:text-white">
                        {log.channel.replace('_', ' ').toUpperCase()}
                      </span>{' '}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          log.mode === 'live_api'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-indigo-50 text-indigo-700'
                        }`}
                      >
                        {log.mode === 'live_api' ? 'Live' : 'Sandbox'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-bold">{log.fetchedCount}</td>
                    <td className="py-2.5 px-4">
                      <span className="font-bold text-emerald-600">{log.createdCount} new</span>
                      {' · '}
                      <span className="text-slate-500">{log.deduplicatedCount} merged</span>
                    </td>
                    <td className="py-2.5 px-4 font-bold text-brand-blue">
                      {log.whatsAppDispatchedCount} sent
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-[11px] text-slate-500">
                      {log.durationMs}ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
