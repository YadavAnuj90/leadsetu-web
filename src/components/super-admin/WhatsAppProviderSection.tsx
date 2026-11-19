'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  KeyRound,
  Loader2,
  MessageSquare,
  PhoneCall,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Wifi,
} from 'lucide-react';
import type {
  PlatformWhatsAppProviderConfig,
  PlatformWhatsAppProviderTestResponse,
} from '@/types/contracts';
import {
  fetchWhatsAppProviderApi,
  testWhatsAppProviderApi,
  updateWhatsAppProviderApi,
} from '@/lib/super-admin-api';
import { getErrorMessage } from '@/lib/api-client';

function resolveBackendBaseUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/v1';
  return configured.replace(/\/v1\/?$/, '');
}

export default function WhatsAppProviderSection() {
  const [config, setConfig] = useState<PlatformWhatsAppProviderConfig | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [testResult, setTestResult] =
    useState<PlatformWhatsAppProviderTestResponse | null>(null);

  // Meta Tech Provider App fields (for customer 1-click Embedded Signup)
  const [metaAppId, setMetaAppId] = useState('');
  const [embeddedSignupConfigId, setEmbeddedSignupConfigId] = useState('');
  const [metaAppSecret, setMetaAppSecret] = useState('');
  const [webhookVerifyToken, setWebhookVerifyToken] = useState('');
  const [clearMetaAppSecret, setClearMetaAppSecret] = useState(false);

  // Leadsetu Managed Shared Gateway fields (instant out-of-the-box sending)
  const [managedSenderEnabled, setManagedSenderEnabled] = useState(false);
  const [managedPhoneNumberId, setManagedPhoneNumberId] = useState('');
  const [managedWabaId, setManagedWabaId] = useState('');
  const [managedAccessToken, setManagedAccessToken] = useState('');
  const [clearManagedAccessToken, setClearManagedAccessToken] = useState(false);

  const hydrateForm = useCallback((next: PlatformWhatsAppProviderConfig) => {
    setConfig(next);
    setMetaAppId(next.metaAppId || '');
    setEmbeddedSignupConfigId(next.embeddedSignupConfigId || '');
    setWebhookVerifyToken(next.webhookVerifyToken || '');
    setMetaAppSecret('');
    setClearMetaAppSecret(false);

    setManagedSenderEnabled(Boolean(next.managedSenderEnabled));
    setManagedPhoneNumberId(next.managedPhoneNumberId || '');
    setManagedWabaId(next.managedWabaId || '');
    setManagedAccessToken('');
    setClearManagedAccessToken(false);
  }, []);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchWhatsAppProviderApi();
      hydrateForm(next);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [hydrateForm]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const webhookCallbackUrl = `${resolveBackendBaseUrl()}${
    config?.webhookPath || '/v1/webhooks/whatsapp'
  }`;

  const handleCopyWebhook = async () => {
    try {
      await navigator.clipboard.writeText(webhookCallbackUrl);
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 1800);
    } catch {
      // Clipboard blocked in non-HTTPS contexts
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setBanner(null);
    try {
      const updated = await updateWhatsAppProviderApi({
        metaAppId: metaAppId.trim(),
        embeddedSignupConfigId: embeddedSignupConfigId.trim(),
        webhookVerifyToken: webhookVerifyToken.trim(),
        ...(metaAppSecret.trim() ? { metaAppSecret: metaAppSecret.trim() } : {}),
        ...(clearMetaAppSecret ? { clearMetaAppSecret: true } : {}),
        managedSenderEnabled,
        managedPhoneNumberId: managedPhoneNumberId.trim(),
        managedWabaId: managedWabaId.trim(),
        ...(managedAccessToken.trim()
          ? { managedAccessToken: managedAccessToken.trim() }
          : {}),
        ...(clearManagedAccessToken ? { clearManagedAccessToken: true } : {}),
      });
      hydrateForm(updated);
      setBanner({
        type: 'success',
        message:
          'Leadsetu platform WhatsApp provider configuration saved securely.',
      });
    } catch (err) {
      setBanner({
        type: 'error',
        message: getErrorMessage(err),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestManaged = async () => {
    setTesting(true);
    setBanner(null);
    setTestResult(null);
    try {
      const res = await testWhatsAppProviderApi({
        ...(managedPhoneNumberId.trim()
          ? { phoneNumberId: managedPhoneNumberId.trim() }
          : {}),
        ...(managedAccessToken.trim()
          ? { accessToken: managedAccessToken.trim() }
          : {}),
      });
      setTestResult(res);
      if (res.config) {
        setConfig(res.config);
      }
      setBanner({
        type: res.ok ? 'success' : 'error',
        message: res.ok
          ? `Managed Gateway verified: ${res.businessDisplayName || 'Meta Business'} (${res.verifiedPhoneNumber || managedPhoneNumberId})`
          : res.error || 'Meta verification failed.',
      });
    } catch (err) {
      setBanner({
        type: 'error',
        message: getErrorMessage(err),
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading && !config) {
    return (
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1628] p-12 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-brand-blue" />
        <span className="text-xs font-bold text-slate-500">
          Loading Leadsetu Central WhatsApp Provider...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-semibold text-rose-600 dark:text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {banner && (
        <div
          className={`rounded-2xl border px-4 py-3 text-xs font-semibold flex items-center gap-2 ${
            banner.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300'
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

      {/* Status Overview Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1628] p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              1-Click Embedded Signup
            </span>
            <Sparkles className="w-4 h-4 text-brand-blue" />
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                config?.embeddedSignupReady
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/20'
              }`}
            >
              {config?.embeddedSignupReady ? 'Ready for Tenants' : 'Setup Incomplete'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Customers connect their own WhatsApp Business number in 1 click without Meta Developer setup.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1628] p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Leadsetu Managed Gateway
            </span>
            <PhoneCall className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                config?.managedGatewayReady
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20'
                  : 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20'
              }`}
            >
              {config?.managedGatewayReady
                ? config.managedDisplayNumber || 'Active Gateway'
                : config?.managedSenderEnabled
                  ? 'Missing Token / Number ID'
                  : 'Disabled'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Optional shared Leadsetu WABA line so new workspaces can send official WhatsApp immediately.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1628] p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Platform Webhook Endpoint
            </span>
            <ShieldCheck className="w-4 h-4 text-sky-500" />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <code className="flex-1 truncate text-[11px] font-mono bg-slate-100 dark:bg-slate-900 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-200">
              {webhookCallbackUrl}
            </code>
            <button
              type="button"
              onClick={handleCopyWebhook}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1"
            >
              {copiedWebhook ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copiedWebhook ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Configure once in your Leadsetu Meta App Dashboard. Never shown to customers.
          </p>
        </div>
      </div>

      {/* Main Config Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Meta Tech Provider App */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1628] p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center text-brand-blue">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Leadsetu Meta Tech Provider App (1-Click Embedded Signup)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Powers the guided Facebook popup inside customer workspaces (Settings &rarr; Integrations). Secrets stay encrypted with AES-256-GCM.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={loadConfig}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Meta App ID
              </label>
              <input
                type="text"
                value={metaAppId}
                onChange={(e) => setMetaAppId(e.target.value)}
                placeholder="e.g. 123456789012345"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              />
              <p className="text-[11px] text-slate-500">
                Public App ID from developers.facebook.com (also read from META_APP_ID env if blank).
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Embedded Signup Config ID
              </label>
              <input
                type="text"
                value={embeddedSignupConfigId}
                onChange={(e) => setEmbeddedSignupConfigId(e.target.value)}
                placeholder="e.g. 987654321098765"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              />
              <p className="text-[11px] text-slate-500">
                Facebook Login for Business configuration_id with WhatsApp Embedded Signup permissions.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                  Meta App Secret
                </label>
                {config?.hasMetaAppSecret && (
                  <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                    Saved: {config.metaAppSecretMask}
                  </span>
                )}
              </div>
              <input
                type="password"
                value={metaAppSecret}
                onChange={(e) => {
                  setMetaAppSecret(e.target.value);
                  if (e.target.value) setClearMetaAppSecret(false);
                }}
                placeholder={
                  config?.hasMetaAppSecret
                    ? 'Leave blank to keep existing encrypted secret'
                    : 'Paste Meta App Secret'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              />
              {config?.hasMetaAppSecret && (
                <label className="inline-flex items-center gap-2 text-[11px] text-slate-500 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={clearMetaAppSecret}
                    onChange={(e) => setClearMetaAppSecret(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Clear stored App Secret on save
                </label>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Central Webhook Verify Token
              </label>
              <input
                type="text"
                value={webhookVerifyToken}
                onChange={(e) => setWebhookVerifyToken(e.target.value)}
                placeholder="leadsetu_whatsapp_webhook_verify"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              />
              <p className="text-[11px] text-slate-500">
                Matches Verify Token entered in your Meta App Webhook configuration.
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Leadsetu Managed Shared Gateway */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1628] p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Leadsetu Managed Shared Gateway (Optional Instant Mode)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  When enabled, every workspace without its own connected number can send &amp; receive WhatsApp immediately via Leadsetu&apos;s verified WABA number.
                </p>
              </div>
            </div>

            <label className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 cursor-pointer">
              <input
                type="checkbox"
                checked={managedSenderEnabled}
                onChange={(e) => setManagedSenderEnabled(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded"
              />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Enable Shared Gateway
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Managed Phone Number ID
              </label>
              <input
                type="text"
                value={managedPhoneNumberId}
                onChange={(e) => setManagedPhoneNumberId(e.target.value)}
                placeholder="e.g. 55667788990011"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Managed WABA ID
              </label>
              <input
                type="text"
                value={managedWabaId}
                onChange={(e) => setManagedWabaId(e.target.value)}
                placeholder="e.g. 99887766554433"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  System User Access Token
                </label>
                {config?.hasManagedAccessToken && (
                  <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                    {config.managedAccessTokenMask}
                  </span>
                )}
              </div>
              <input
                type="password"
                value={managedAccessToken}
                onChange={(e) => {
                  setManagedAccessToken(e.target.value);
                  if (e.target.value) setClearManagedAccessToken(false);
                }}
                placeholder={
                  config?.hasManagedAccessToken
                    ? 'Leave blank to keep existing token'
                    : 'Paste permanent System User token'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
              {config?.hasManagedAccessToken && (
                <label className="inline-flex items-center gap-2 text-[11px] text-slate-500 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={clearManagedAccessToken}
                    onChange={(e) => setClearManagedAccessToken(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Clear stored Managed Token on save
                </label>
              )}
            </div>
          </div>

          {(config?.managedDisplayName ||
            config?.managedDisplayNumber ||
            testResult) && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle2
                  className={`w-4 h-4 ${
                    (testResult?.ok ?? config?.managedLastTestStatus === 'connected')
                      ? 'text-emerald-500'
                      : 'text-amber-500'
                  }`}
                />
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {testResult?.businessDisplayName ||
                    config?.managedDisplayName ||
                    'Verified Sender'}
                </span>
                {(testResult?.verifiedPhoneNumber ||
                  config?.managedDisplayNumber) && (
                  <span className="font-mono text-slate-600 dark:text-slate-300">
                    {testResult?.verifiedPhoneNumber || config?.managedDisplayNumber}
                  </span>
                )}
                {testResult?.qualityRating && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                    Quality: {testResult.qualityRating}
                  </span>
                )}
              </div>
              {config?.managedLastTestedAt && (
                <span className="text-[11px] text-slate-500">
                  Last tested:{' '}
                  {new Date(config.managedLastTestedAt).toLocaleString()}
                </span>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleTestManaged}
              disabled={testing || saving}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-extrabold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {testing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wifi className="w-4 h-4 text-emerald-500" />
              )}
              Test Managed Connection
            </button>

            <button
              type="submit"
              disabled={saving || testing}
              className="px-5 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-extrabold shadow-lg shadow-brand-blue/20 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Platform Provider
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
