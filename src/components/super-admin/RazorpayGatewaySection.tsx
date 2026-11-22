'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  KeyRound,
  Loader2,
  Lock,
  RefreshCw,
  Save,
  ShieldCheck,
  Webhook,
  Wifi,
} from 'lucide-react';
import {
  fetchRazorpayGatewayApi,
  testRazorpayGatewayApi,
  updateRazorpayGatewayApi,
  type PlatformRazorpayGatewayConfig,
  type PlatformRazorpayGatewayTestResponse,
} from '@/lib/super-admin-api';
import { getErrorMessage } from '@/lib/api-client';

function resolveBackendBaseUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/v1';
  return configured.replace(/\/v1\/?$/, '');
}

export default function RazorpayGatewaySection() {
  const [config, setConfig] = useState<PlatformRazorpayGatewayConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [testResult, setTestResult] =
    useState<PlatformRazorpayGatewayTestResponse | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState<string | null>(null);

  const [enabled, setEnabled] = useState(true);
  const [keyId, setKeyId] = useState('');
  const [keySecret, setKeySecret] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [clearKeyId, setClearKeyId] = useState(false);
  const [clearKeySecret, setClearKeySecret] = useState(false);
  const [clearWebhookSecret, setClearWebhookSecret] = useState(false);

  const hydrate = useCallback((next: PlatformRazorpayGatewayConfig) => {
    setConfig(next);
    setEnabled(next.enabled !== false);
    setKeyId('');
    setKeySecret('');
    setWebhookSecret('');
    setClearKeyId(false);
    setClearKeySecret(false);
    setClearWebhookSecret(false);
  }, []);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchRazorpayGatewayApi();
      hydrate(next);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [hydrate]);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setBanner(null);
    try {
      const next = await updateRazorpayGatewayApi({
        enabled,
        keyId: keyId.trim() || undefined,
        keySecret: keySecret.trim() || undefined,
        webhookSecret: webhookSecret.trim() || undefined,
        clearKeyId,
        clearKeySecret,
        clearWebhookSecret,
      });
      hydrate(next);
      setBanner({
        type: 'success',
        message:
          'Razorpay Gateway encrypted vault updated. Invoices, WhatsApp Cart links & SaaS Billing will now use these effective keys.',
      });
    } catch (err) {
      setBanner({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyKeys = async () => {
    setTesting(true);
    setBanner(null);
    setTestResult(null);
    try {
      const res = await testRazorpayGatewayApi({
        keyId: keyId.trim() || undefined,
        keySecret: keySecret.trim() || undefined,
      });
      setTestResult(res);
      if (res.config) setConfig(res.config);
      setBanner({
        type: res.ok ? 'success' : 'error',
        message: res.ok
          ? `Verified Razorpay ${res.mode.toUpperCase()} keys cleanly via api.razorpay.com/v1/payment_links!`
          : `Razorpay verification failed: ${res.error || 'Check Key ID / Key Secret'}`,
      });
    } catch (err) {
      setBanner({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setTesting(false);
    }
  };

  const copyWebhookUrl = (id: string, path: string) => {
    const full = `${resolveBackendBaseUrl()}${path}`;
    navigator.clipboard?.writeText(full).catch(() => {});
    setCopiedWebhook(id);
    setTimeout(() => setCopiedWebhook((prev) => (prev === id ? null : prev)), 1800);
  };

  if (loading) {
    return (
      <div className="p-10 rounded-3xl bg-white dark:bg-[#0D1628] border border-slate-200 dark:border-white/10 text-center text-xs text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
        Loading Central Razorpay Gateway config...
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-xs text-rose-700 dark:text-rose-200 flex items-center justify-between gap-3">
        <span>{error || 'Failed to load Razorpay Gateway configuration.'}</span>
        <button
          type="button"
          onClick={() => void loadConfig()}
          className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold"
        >
          Retry
        </button>
      </div>
    );
  }

  const backendBase = resolveBackendBaseUrl();
  const modeBadge =
    config.mode === 'live'
      ? {
          label: 'LIVE MODE (rzp_live_)',
          cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
        }
      : config.mode === 'test'
        ? {
            label: 'TEST MODE (rzp_test_)',
            cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
          }
        : {
            label: 'SANDBOX / UNCONFIGURED',
            cls: 'bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-300 border-slate-300/60 dark:border-white/15',
          };

  const sourceLabel =
    config.source === 'super_admin'
      ? 'Super Admin Encrypted Vault (overriding .env)'
      : config.source === 'env'
        ? 'Loaded from leadsetu-api/.env fallback'
        : 'No keys saved yet';

  return (
    <div className="space-y-6">
      {banner && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
            banner.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-200'
          }`}
        >
          {banner.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{banner.message}</span>
        </div>
      )}

      {/* Header Status Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#0D1628] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-extrabold text-brand-navy dark:text-white">
                  Central Razorpay Payment Links &amp; Billing Gateway
                </h2>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${modeBadge.cls}`}
                >
                  {modeBadge.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Powers real Razorpay Payment Links (`POST /v1/payment_links`) on Invoices &amp; WhatsApp Cart checkouts, auto-reconciliation webhooks, and Workspace SaaS Billing.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadConfig()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 text-xs font-bold text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <button
              type="button"
              disabled={testing}
              onClick={() => void handleVerifyKeys()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold disabled:opacity-50"
            >
              {testing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Wifi className="w-3.5 h-3.5" />
              )}
              <span>Verify Keys</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-2">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#111D33] border border-slate-200/70 dark:border-white/10">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Active Source
            </div>
            <div className="font-extrabold text-brand-navy dark:text-white mt-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-500" />
              <span>{sourceLabel}</span>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#111D33] border border-slate-200/70 dark:border-white/10">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Last API Verification
            </div>
            <div className="font-extrabold mt-1 flex items-center gap-1.5">
              {config.lastTestStatus === 'connected' ? (
                <span className="text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Connected
                </span>
              ) : config.lastTestStatus === 'error' ? (
                <span className="text-rose-600 dark:text-rose-400 inline-flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Error
                </span>
              ) : (
                <span className="text-slate-500">Not verified yet</span>
              )}
              {config.lastTestedAt ? (
                <span className="text-[11px] font-normal text-slate-400">
                  · {new Date(config.lastTestedAt).toLocaleString()}
                </span>
              ) : null}
            </div>
            {config.lastError ? (
              <p className="text-[11px] text-rose-500 mt-1 truncate" title={config.lastError}>
                {config.lastError}
              </p>
            ) : null}
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#111D33] border border-slate-200/70 dark:border-white/10">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Gateway Readiness
            </div>
            <div className="font-extrabold mt-1 text-brand-navy dark:text-white">
              {config.gatewayReady
                ? 'Ready — Generating Real Razorpay Links'
                : 'Needs Key ID + Key Secret'}
            </div>
          </div>
        </div>
      </div>

      {/* Encrypted Vault Form */}
      <form
        onSubmit={(e) => void handleSave(e)}
        className="p-6 rounded-3xl bg-white dark:bg-[#0D1628] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-5 text-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-brand-blue" />
            <h3 className="text-sm font-extrabold text-brand-navy dark:text-white">
              Encrypted Razorpay Credentials (AES-256-GCM Vault Override)
            </h3>
          </div>
          <label className="inline-flex items-center gap-2 cursor-pointer font-bold text-brand-navy dark:text-slate-200">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="rounded border-slate-300"
            />
            <span>Enable Razorpay Gateway Integration</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Key ID */}
          <div className="space-y-1.5">
            <label className="block font-bold text-brand-navy dark:text-slate-200">
              Razorpay Key ID
            </label>
            <input
              type="text"
              value={keyId}
              onChange={(e) => setKeyId(e.target.value)}
              placeholder={
                config.hasKeyId
                  ? `Stored: ${config.keyIdMask} (leave blank to keep)`
                  : 'rzp_test_xxxxxxxxxxxxx'
              }
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#111D33] font-mono text-xs text-brand-navy dark:text-white"
            />
            {config.vaultHasKeyId && (
              <label className="inline-flex items-center gap-1.5 text-[11px] text-rose-600 dark:text-rose-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clearKeyId}
                  onChange={(e) => setClearKeyId(e.target.checked)}
                />
                <span>Clear vault Key ID (fall back to .env)</span>
              </label>
            )}
          </div>

          {/* Key Secret */}
          <div className="space-y-1.5">
            <label className="block font-bold text-brand-navy dark:text-slate-200">
              Razorpay Key Secret
            </label>
            <input
              type="password"
              value={keySecret}
              onChange={(e) => setKeySecret(e.target.value)}
              placeholder={
                config.hasKeySecret
                  ? `Stored: ${config.keySecretMask} (leave blank to keep)`
                  : 'Enter Key Secret'
              }
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#111D33] font-mono text-xs text-brand-navy dark:text-white"
            />
            {config.vaultHasKeySecret && (
              <label className="inline-flex items-center gap-1.5 text-[11px] text-rose-600 dark:text-rose-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clearKeySecret}
                  onChange={(e) => setClearKeySecret(e.target.checked)}
                />
                <span>Clear vault Key Secret (fall back to .env)</span>
              </label>
            )}
          </div>

          {/* Webhook Secret */}
          <div className="space-y-1.5">
            <label className="block font-bold text-brand-navy dark:text-slate-200">
              Webhook Secret (Optional)
            </label>
            <input
              type="password"
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              placeholder={
                config.hasWebhookSecret
                  ? `Stored: ${config.webhookSecretMask}`
                  : 'Defaults to Key Secret if omitted'
              }
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#111D33] font-mono text-xs text-brand-navy dark:text-white"
            />
            {config.vaultHasWebhook && (
              <label className="inline-flex items-center gap-1.5 text-[11px] text-rose-600 dark:text-rose-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clearWebhookSecret}
                  onChange={(e) => setClearWebhookSecret(e.target.checked)}
                />
                <span>Clear vault Webhook Secret</span>
              </label>
            )}
          </div>
        </div>

        {/* Webhook Endpoints Reference */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111D33] border border-slate-200/80 dark:border-white/10 space-y-2.5">
          <div className="flex items-center gap-1.5 font-extrabold text-brand-navy dark:text-white">
            <Webhook className="w-4 h-4 text-emerald-500" />
            <span>Configure These Webhook URLs in Razorpay Dashboard (Events: `payment_link.paid`, `payment.captured`, `order.paid`)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {[
              {
                id: 'invoice',
                label: 'Customer Invoices & WhatsApp Cart Webhook',
                path: config.invoiceWebhookPath,
              },
              {
                id: 'billing',
                label: 'Workspace SaaS Subscriptions Webhook',
                path: config.billingWebhookPath,
              },
            ].map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-[#0D1628] border border-slate-200 dark:border-white/10"
              >
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    {item.label}
                  </div>
                  <div className="font-mono text-[11px] text-brand-navy dark:text-slate-200 truncate">
                    {backendBase}
                    {item.path}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyWebhookUrl(item.id, item.path)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/10 font-bold shrink-0"
                >
                  {copiedWebhook === item.id ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>Copy</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Keys saved here are encrypted with AES-256-GCM in `platform_configs` and take priority over `.env`. Leave fields blank to keep existing keys or continue using `.env`.
          </p>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-navy hover:bg-slate-800 text-white font-extrabold disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save Razorpay Vault</span>
          </button>
        </div>

        {testResult && (
          <div
            className={`p-3.5 rounded-2xl border text-xs ${
              testResult.ok
                ? 'bg-emerald-50/70 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50/70 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-200'
            }`}
          >
            <strong>Probe Result:</strong>{' '}
            {testResult.ok
              ? `Authenticated in ${testResult.mode.toUpperCase()} mode (${testResult.source}). Sampled ${testResult.paymentLinksSampled} existing payment links.`
              : testResult.error}
          </div>
        )}
      </form>
    </div>
  );
}
