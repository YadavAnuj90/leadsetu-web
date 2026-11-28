'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Code2,
  FlaskConical,
  IndianRupee,
  Loader2,
  Megaphone,
  Play,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import {
  fetchMetaCapiOverviewApi,
  retryMetaCapiEventApi,
  simulateCtwaClickApi,
  updateMetaCapiConfigApi,
  type MetaCapiEventLogItem,
  type MetaCapiOverviewResponse,
} from '@/lib/meta-capi-api';
import { getErrorMessage } from '@/lib/api-client';

export default function MetaCapiPanel() {
  const [data, setData] = useState<MetaCapiOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [expandedPayloadId, setExpandedPayloadId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Config form fields
  const [enabled, setEnabled] = useState(false);
  const [pixelId, setPixelId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [testEventCode, setTestEventCode] = useState('');
  const [autoFireOnCtwaInbound, setAutoFireOnCtwaInbound] = useState(true);
  const [autoFireOnLeadQualified, setAutoFireOnLeadQualified] = useState(true);
  const [autoFireOnDealWon, setAutoFireOnDealWon] = useState(true);
  const [autoFireOnInvoicePaid, setAutoFireOnInvoicePaid] = useState(true);
  const [monthlyAdSpendInr, setMonthlyAdSpendInr] = useState('0');

  // CTWA Ad Click Simulator fields
  const [simName, setSimName] = useState('Vikramaditya Rao');
  const [simPhone, setSimPhone] = useState('+91 98114 77210');
  const [simAdHeadline, setSimAdHeadline] = useState(
    'Industrial Voltage Stabilizer Factory Rate - NCR',
  );
  const [simAdId, setSimAdId] = useState('12021489201948102');
  const [simValue, setSimValue] = useState('180000');
  const [simMessage, setSimMessage] = useState(
    'Saw your Meta Ad for bulk factory supply in Noida — please send 18% GST proforma quote.',
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMetaCapiOverviewApi();
      setData(res);
      setEnabled(res.config.enabled);
      setPixelId(res.config.pixelId);
      setTestEventCode(res.config.testEventCode);
      setAutoFireOnCtwaInbound(res.config.autoFireOnCtwaInbound);
      setAutoFireOnLeadQualified(res.config.autoFireOnLeadQualified);
      setAutoFireOnDealWon(res.config.autoFireOnDealWon);
      setAutoFireOnInvoicePaid(res.config.autoFireOnInvoicePaid);
      setMonthlyAdSpendInr(String(res.config.monthlyAdSpendInr ?? 0));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const res = await updateMetaCapiConfigApi({
        enabled,
        pixelId: pixelId.trim(),
        ...(accessToken.trim() ? { accessToken: accessToken.trim() } : {}),
        testEventCode: testEventCode.trim(),
        autoFireOnCtwaInbound,
        autoFireOnLeadQualified,
        autoFireOnDealWon,
        autoFireOnInvoicePaid,
        monthlyAdSpendInr: Math.max(0, Number(monthlyAdSpendInr) || 0),
      });
      setData(res);
      setAccessToken('');
      setNotice(
        res.config.enabled
          ? 'Meta Conversions API (v21.0) enabled and saved with AES-256 encrypted token.'
          : 'Meta CAPI configuration & auto-trigger rules saved (sandbox simulation mode active until enabled live).',
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSimulateCtwa = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulating(true);
    setError(null);
    setNotice(null);
    try {
      const res = await simulateCtwaClickApi({
        contactName: simName.trim(),
        phone: simPhone.trim(),
        adHeadline: simAdHeadline.trim(),
        adId: simAdId.trim(),
        estimatedValue: Number(simValue) || 125000,
        message: simMessage.trim(),
      });
      setNotice(
        `Simulated CTWA Ad click "${res.adHeadline}" (clid: ${res.ctwaClid.slice(0, 18)}...) → Attributed Lead + Inbox thread created & LeadSubmitted CAPI event logged.`,
      );
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSimulating(false);
    }
  };

  const handleRetryEvent = async (ev: MetaCapiEventLogItem) => {
    setRetryingId(ev.id);
    setError(null);
    setNotice(null);
    try {
      const updated = await retryMetaCapiEventApi(ev.id);
      setNotice(
        `Retried ${updated.eventName} (${updated.eventId}): status is now ${updated.status.toUpperCase()}.`,
      );
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRetryingId(null);
    }
  };

  const stats = data?.stats;
  const config = data?.config;

  return (
    <section
      id="meta-capi"
      className="bg-white dark:bg-[#0D1628] rounded-3xl border border-slate-200 dark:border-white/10 p-6 sm:p-7 shadow-sm space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30 text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
            <Megaphone className="w-3.5 h-3.5" />
            <span>Meta Click-to-WhatsApp Attribution + Conversions API (CAPI)</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-brand-navy dark:text-white">
            Close the Loop Between Meta Ads, WhatsApp Chats &amp; Closed ₹ Revenue
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
            Captures <code className="font-mono text-[11px]">ctwa_clid</code> &amp; ad creative metadata on every inbound Click-to-WhatsApp message, and automatically fires SHA-256 hashed <code className="font-mono text-[11px]">LeadSubmitted</code>, <code className="font-mono text-[11px]">QualifiedLead</code>, and <code className="font-mono text-[11px]">Purchase</code> (INR) events back to Meta Events Manager v21.0.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/analytics?tab=team"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#111D33] text-xs font-bold text-brand-navy dark:text-white hover:border-brand-blue"
          >
            <TrendingUp className="w-3.5 h-3.5 text-brand-blue" /> Ad ROAS Report
          </Link>
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#111D33] text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-brand-blue disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Status Alerts */}
      {notice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          <span>{notice}</span>
        </div>
      )}
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-xs font-semibold text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111D33] border border-slate-200/80 dark:border-white/10">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            CTWA Ad Leads
          </div>
          <div className="text-xl font-extrabold text-brand-navy dark:text-white mt-1">
            {stats?.ctwaLeadsCount ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Attributed with Ad ID / Click ID
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111D33] border border-slate-200/80 dark:border-white/10">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            CAPI Signals Logged
          </div>
          <div className="text-xl font-extrabold text-brand-blue dark:text-sky-400 mt-1">
            {stats?.totalEvents ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {stats?.sentEvents ?? 0} live · {stats?.simulatedEvents ?? 0} sandbox ·{' '}
            {stats?.failedEvents ?? 0} failed
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111D33] border border-slate-200/80 dark:border-white/10">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            INR Purchase Signals
          </div>
          <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
            <IndianRupee className="w-4 h-4" />
            <span>{(stats?.attributedRevenueInr ?? 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Across {stats?.purchaseEventsCount ?? 0} won deals / paid bills
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111D33] border border-slate-200/80 dark:border-white/10">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Dispatch Mode
          </div>
          <div className="text-sm font-extrabold text-brand-navy dark:text-white mt-1.5 flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                config?.enabled ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <span>{config?.enabled ? 'Live Meta Graph v21.0' : 'Sandbox Simulator'}</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
            {config?.pixelId ? `Pixel: ${config.pixelId}` : 'No Pixel ID saved yet'}
          </div>
        </div>
      </div>

      {/* Live Meta Ad ROAS & Cost-Per-Lead Funnel Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/35 border border-indigo-200/80 dark:border-indigo-500/25">
          <div className="text-[10.5px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
            ROAS Multiple
          </div>
          <div className="text-lg font-black text-indigo-900 dark:text-white mt-0.5">
            {stats?.roasMultiplier ? `${stats.roasMultiplier}x` : '—'}
          </div>
          <div className="text-[10.5px] text-indigo-600/80 dark:text-indigo-300/80">
            Spend ₹{(stats?.monthlyAdSpendInr ?? 0).toLocaleString('en-IN')}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#111D33] border border-slate-200/80 dark:border-white/10">
          <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Cost Per Lead (CPL)
          </div>
          <div className="text-lg font-black text-brand-navy dark:text-white mt-0.5">
            {stats?.cplInr ? `₹${stats.cplInr.toLocaleString('en-IN')}` : '—'}
          </div>
          <div className="text-[10.5px] text-slate-500 dark:text-slate-400">
            CPQL: {stats?.cpqlInr ? `₹${stats.cpqlInr.toLocaleString('en-IN')}` : 'Set Ad Spend'}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#111D33] border border-slate-200/80 dark:border-white/10">
          <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Qualified → Won Funnel
          </div>
          <div className="text-lg font-black text-brand-blue dark:text-sky-400 mt-0.5">
            {stats?.qualifiedLeadsCount ?? 0} → {stats?.wonDealsCount ?? 0} Won
          </div>
          <div className="text-[10.5px] text-slate-500 dark:text-slate-400">
            Win conversion: {stats?.leadToWonPct ?? 0}%
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-500/25">
          <div className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
            Open Meta Pipeline
          </div>
          <div className="text-lg font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
            ₹{(stats?.pipelineValueInr ?? 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[10.5px] text-emerald-600/80 dark:text-emerald-300/80">
            Won Revenue: ₹{(stats?.wonRevenueInr ?? 0).toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Main Grid: Credentials + CTWA Simulator */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: Meta Dataset / Pixel Credentials & Triggers */}
        <form
          onSubmit={handleSaveConfig}
          className="xl:col-span-7 p-5 rounded-2xl bg-slate-50/70 dark:bg-[#111D33] border border-slate-200/80 dark:border-white/10 space-y-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-blue" />
              <h3 className="text-sm font-extrabold text-brand-navy dark:text-white">
                Meta Events Manager Dataset &amp; Auto-Fire Rules
              </h3>
            </div>
            <label className="inline-flex items-center gap-2 text-xs font-bold text-brand-navy dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
              />
              <span>Enable Live Graph API Dispatch</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Meta Dataset / Pixel ID
              </label>
              <input
                type="text"
                value={pixelId}
                onChange={(e) => setPixelId(e.target.value)}
                placeholder="e.g. 104928374615283"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628] text-xs font-mono text-brand-navy dark:text-white focus:outline-none focus:border-brand-blue"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Test Event Code (Optional)
              </label>
              <input
                type="text"
                value={testEventCode}
                onChange={(e) => setTestEventCode(e.target.value)}
                placeholder="e.g. TEST48291"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628] text-xs font-mono text-brand-navy dark:text-white focus:outline-none focus:border-brand-blue"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Conversions API System User Access Token (AES-256 Encrypted)
              </label>
              {config?.hasAccessToken && (
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                  Saved: {config.accessTokenMask}
                </span>
              )}
            </div>
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder={
                config?.hasAccessToken
                  ? 'Leave blank to keep existing encrypted token, or paste new EAAG... token'
                  : 'Paste Meta Business System User CAPI Access Token (EAAG...)'
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628] text-xs font-mono text-brand-navy dark:text-white focus:outline-none focus:border-brand-blue"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Monthly Meta Ad Spend (₹ INR) — For Live ROAS &amp; CPL Tracking
            </label>
            <input
              type="number"
              min={0}
              value={monthlyAdSpendInr}
              onChange={(e) => setMonthlyAdSpendInr(e.target.value)}
              placeholder="e.g. 50000"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628] text-xs font-mono text-brand-navy dark:text-white focus:outline-none focus:border-brand-blue"
            />
          </div>

          <div className="pt-2 border-t border-slate-200/70 dark:border-white/10">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
              Automatic CRM → Meta CAPI Conversion Triggers
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {[
                {
                  checked: autoFireOnCtwaInbound,
                  setter: setAutoFireOnCtwaInbound,
                  title: 'CTWA Ad Chat Inbound → LeadSubmitted',
                  sub: 'Fires immediately when buyer clicks ad & messages WhatsApp',
                },
                {
                  checked: autoFireOnLeadQualified,
                  setter: setAutoFireOnLeadQualified,
                  title: 'Lead Marked Qualified → QualifiedLead',
                  sub: 'Trains Meta Andromeda away from junk clicks',
                },
                {
                  checked: autoFireOnDealWon,
                  setter: setAutoFireOnDealWon,
                  title: 'Deal Won → Purchase (INR Value)',
                  sub: 'Reports closed deal value in ₹ to optimize ROAS',
                },
                {
                  checked: autoFireOnInvoicePaid,
                  setter: setAutoFireOnInvoicePaid,
                  title: 'Invoice Settled → Purchase (INR Grand Total)',
                  sub: 'Confirms cash collected on GST/Retail invoices',
                },
              ].map((t) => (
                <label
                  key={t.title}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white dark:bg-[#0D1628] border border-slate-200/80 dark:border-white/10 cursor-pointer hover:border-brand-blue/50"
                >
                  <input
                    type="checkbox"
                    checked={t.checked}
                    onChange={(e) => t.setter(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
                  />
                  <div>
                    <div className="font-bold text-brand-navy dark:text-white">
                      {t.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t.sub}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {config?.lastFiredAt
                ? `Last signal: ${config.lastStatus?.toUpperCase()} · ${new Date(
                    config.lastFiredAt,
                  ).toLocaleString('en-IN')}`
                : 'No conversion events dispatched yet.'}
            </span>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-blue text-white text-xs font-extrabold hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Save Meta CAPI Settings</span>
            </button>
          </div>
        </form>

        {/* Right: 1-Click CTWA Ad Click Simulator */}
        <form
          onSubmit={handleSimulateCtwa}
          className="xl:col-span-5 p-5 rounded-2xl bg-indigo-50/60 dark:bg-[#111D33] border border-indigo-200/80 dark:border-indigo-500/30 space-y-3.5"
        >
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-extrabold text-brand-navy dark:text-white">
              1-Click Meta Click-to-WhatsApp Ad Simulator
            </h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Test the full end-to-end funnel without spending live Meta Ads budget: creates an attributed Lead + WhatsApp Inbox thread with <code className="font-mono">ctwa_clid</code> and dispatches <code className="font-mono">LeadSubmitted</code>.
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                Buyer Name
              </label>
              <input
                type="text"
                value={simName}
                onChange={(e) => setSimName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628] text-xs text-brand-navy dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                WhatsApp Phone
              </label>
              <input
                type="text"
                value={simPhone}
                onChange={(e) => setSimPhone(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628] text-xs text-brand-navy dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                Meta Ad Creative Headline
              </label>
              <input
                type="text"
                value={simAdHeadline}
                onChange={(e) => setSimAdHeadline(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628] text-xs text-brand-navy dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                Est. Value (₹)
              </label>
              <input
                type="number"
                value={simValue}
                onChange={(e) => setSimValue(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628] text-xs text-brand-navy dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
              Meta Ad ID &amp; Inbound Buyer Message
            </label>
            <input
              type="text"
              value={simAdId}
              onChange={(e) => setSimAdId(e.target.value)}
              placeholder="Meta Ad ID"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628] text-xs font-mono text-brand-navy dark:text-white mb-2"
            />
            <textarea
              rows={2}
              value={simMessage}
              onChange={(e) => setSimMessage(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1628] text-xs text-brand-navy dark:text-white resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={simulating}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold disabled:opacity-50 transition-colors"
          >
            {simulating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            <span>Simulate Meta CTWA Ad Click &amp; Fire LeadSubmitted</span>
          </button>
        </form>
      </div>

      {/* Conversion Event Audit Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-brand-navy dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-blue" />
            <span>Recent CAPI Conversion Signals ({data?.events.length ?? 0})</span>
          </h3>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Click &ldquo;Inspect Payload&rdquo; to verify SHA-256 hashed ph/em &amp; ctwa_clid
          </span>
        </div>

        {(data?.events || []).length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-white/15 text-center text-xs text-slate-500 dark:text-slate-400">
            No Meta CAPI events logged yet. Click &ldquo;Simulate Meta CTWA Ad Click&rdquo; above or qualify/close a Meta Ad lead to see live CAPI signals here.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-white/10">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#111D33] text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-white/10">
                <tr>
                  <th className="py-2.5 px-3.5">Event</th>
                  <th className="py-2.5 px-3.5">Entity / Ad Creative</th>
                  <th className="py-2.5 px-3.5">INR Value</th>
                  <th className="py-2.5 px-3.5">Dispatch Status</th>
                  <th className="py-2.5 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/10 bg-white dark:bg-[#0D1628]">
                {(data?.events || []).slice(0, 15).map((ev) => (
                  <React.Fragment key={ev.id}>
                    <tr className="hover:bg-slate-50/70 dark:hover:bg-[#111D33]/60">
                      <td className="py-2.5 px-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-extrabold text-[11px] bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                          {ev.eventName}
                        </span>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          {ev.triggeredBy}
                        </div>
                      </td>
                      <td className="py-2.5 px-3.5 max-w-[260px]">
                        <div className="font-bold text-brand-navy dark:text-white truncate">
                          {ev.entityLabel || ev.entityType}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {ev.adHeadline || ev.adId || 'Direct CRM Signal'}
                          {ev.ctwaClid ? ` · clid:${ev.ctwaClid.slice(0, 10)}...` : ''}
                        </div>
                      </td>
                      <td className="py-2.5 px-3.5 font-extrabold text-brand-navy dark:text-white whitespace-nowrap">
                        ₹{(ev.valueInr || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            ev.status === 'sent'
                              ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                              : ev.status === 'failed'
                                ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
                                : 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                          }`}
                        >
                          {ev.status === 'local_simulated'
                            ? 'Simulated'
                            : ev.status.toUpperCase()}
                        </span>
                        {ev.errorMessage && (
                          <div className="text-[10px] text-rose-500 mt-0.5 max-w-[200px] truncate">
                            {ev.errorMessage}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 text-right whitespace-nowrap space-x-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedPayloadId((cur) =>
                              cur === ev.id ? null : ev.id,
                            )
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/15 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:border-brand-blue"
                        >
                          <Code2 className="w-3 h-3" />
                          <span>{expandedPayloadId === ev.id ? 'Hide' : 'Payload'}</span>
                        </button>
                        <button
                          type="button"
                          disabled={retryingId === ev.id}
                          onClick={() => void handleRetryEvent(ev)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-brand-blue/30 bg-blue-50 dark:bg-blue-500/15 text-[11px] font-bold text-brand-blue dark:text-blue-300 hover:bg-brand-blue hover:text-white disabled:opacity-50"
                        >
                          {retryingId === ev.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3 h-3" />
                          )}
                          <span>Retry</span>
                        </button>
                      </td>
                    </tr>
                    {expandedPayloadId === ev.id && (
                      <tr className="bg-slate-950 text-sky-200">
                        <td colSpan={5} className="p-3.5 font-mono text-[11px] overflow-x-auto">
                          <pre className="whitespace-pre-wrap break-all">
                            {JSON.stringify(
                              {
                                requestPayload: ev.requestPayload,
                                metaResponse: ev.metaResponse,
                              },
                              null,
                              2,
                            )}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
