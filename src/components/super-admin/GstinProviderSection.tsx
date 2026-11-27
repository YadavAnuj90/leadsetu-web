'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  Lock,
  RefreshCw,
  Save,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Wifi,
} from 'lucide-react';
import {
  fetchGstinProviderApi,
  testGstinProviderApi,
  updateGstinProviderApi,
  type GstinCrossTenantTelemetry,
  type PlatformGstinProviderConfig,
  type PlatformGstinProviderTestResponse,
} from '@/lib/super-admin-api';
import { getErrorMessage } from '@/lib/api-client';

export default function GstinProviderSection() {
  const [config, setConfig] = useState<PlatformGstinProviderConfig | null>(null);
  const [telemetry, setTelemetry] = useState<GstinCrossTenantTelemetry | null>(
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
  const [testResult, setTestResult] =
    useState<PlatformGstinProviderTestResponse | null>(null);

  const [enabled, setEnabled] = useState(true);
  const [providerName, setProviderName] = useState('External GSTN API');
  const [apiUrlTemplate, setApiUrlTemplate] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [clearApiKey, setClearApiKey] = useState(false);
  const [sampleGstin, setSampleGstin] = useState('09AABCR1234F1Z5');

  const hydrate = useCallback(
    (
      nextCfg: PlatformGstinProviderConfig,
      nextTel?: GstinCrossTenantTelemetry,
    ) => {
      setConfig(nextCfg);
      if (nextTel) setTelemetry(nextTel);
      setEnabled(nextCfg.enabled !== false);
      setProviderName(nextCfg.providerName || 'External GSTN API');
      setApiUrlTemplate(nextCfg.apiUrlTemplate || '');
      setApiKey('');
      setClearApiKey(false);
    },
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchGstinProviderApi();
      hydrate(res.config, res.telemetry);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [hydrate]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setBanner(null);
    try {
      const res = await updateGstinProviderApi({
        enabled,
        providerName: providerName.trim(),
        apiUrlTemplate: apiUrlTemplate.trim(),
        apiKey: apiKey.trim() || undefined,
        clearApiKey,
      });
      hydrate(res.config, res.telemetry);
      setBanner({
        type: 'success',
        message:
          'GSTIN Trust Verification Vault updated cleanly. Leads & Deal Credit Guard will use these settings immediately.',
      });
    } catch (err) {
      setBanner({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setBanner(null);
    setTestResult(null);
    try {
      const res = await testGstinProviderApi({
        apiUrlTemplate: apiUrlTemplate.trim() || undefined,
        apiKey: apiKey.trim() || undefined,
        sampleGstin: sampleGstin.trim() || undefined,
      });
      setTestResult(res);
      if (res.config) setConfig(res.config);
      setBanner({
        type: res.ok ? 'success' : 'error',
        message: res.ok
          ? res.mode === 'live_gstn'
            ? `Live GSTN endpoint verified cleanly for ${res.sampleGstin}!`
            : res.note || `Offline Mod-36 checksum verified for ${res.sampleGstin}.`
          : `GSTN verification test failed: ${res.error}`,
      });
    } catch (err) {
      setBanner({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 rounded-3xl bg-white dark:bg-[#0D1628] border border-slate-200 dark:border-white/10 text-center text-xs text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
        Loading GSTIN Provider Vault &amp; cross-tenant trust telemetry...
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-xs text-rose-700 dark:text-rose-200 flex items-center justify-between gap-3">
        <span>{error || 'Failed to load GSTIN Provider configuration.'}</span>
        <button
          type="button"
          onClick={() => void load()}
          className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {banner && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            banner.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-500/15 border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-200'
          }`}
        >
          {banner.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 shrink-0" />
          )}
          <span>{banner.message}</span>
        </div>
      )}

      {/* Vault Status Card */}
      <div className="rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-white dark:bg-[#0D1628] border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-blue dark:text-sky-400">
              <ShieldCheck className="w-3.5 h-3.5" /> Encrypted Credential Vault · Overrides .env
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-brand-navy dark:text-white">
              GSTIN Trust Verification Provider Vault
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
              Connect an external GSTN lookup provider (Sandbox / ClearTax / MasterGST / AppyFlow) without server restarts. When unconfigured, Leadsetu automatically falls back to built-in Mod-36 check-digit + workspace invoice ledger risk scoring.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-extrabold border ${
                config.isLiveConfigured
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                  : 'bg-blue-500/15 text-brand-blue dark:text-sky-300 border-brand-blue/30'
              }`}
            >
              {config.isLiveConfigured
                ? `LIVE GSTN (${config.source === 'super_admin' ? 'Vault' : '.env'})`
                : 'OFFLINE MOD-36 GUARD'}
            </span>
            <button
              type="button"
              onClick={() => void load()}
              className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:text-brand-blue"
              title="Refresh vault & telemetry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Provider Display Name
              </label>
              <input
                type="text"
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                placeholder="e.g. Sandbox GSTN / MasterGST"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#081020] border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-brand-navy dark:text-white focus:outline-none focus:border-brand-blue"
              />
            </div>

            <div className="flex items-end">
              <label className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#081020] border border-slate-200 dark:border-white/10 cursor-pointer">
                <div>
                  <div className="text-xs font-extrabold text-brand-navy dark:text-white">
                    Enable Vault Lookup
                  </div>
                  <div className="text-[11px] text-slate-400">
                    When disabled, skips external API &amp; uses Mod-36 guard
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="h-4 w-4 rounded accent-brand-blue"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                GSTN Lookup URL Template (use {'{gstin}'} placeholder)
              </label>
              <input
                type="url"
                value={apiUrlTemplate}
                onChange={(e) => setApiUrlTemplate(e.target.value)}
                placeholder="https://api.sandbox.co.in/gsp/public/gstin/{gstin}"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#081020] border border-slate-200 dark:border-white/10 text-xs font-mono text-brand-navy dark:text-white focus:outline-none focus:border-brand-blue"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  API Key / Bearer Secret
                </label>
                {config.hasApiKey && (
                  <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-300 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> {config.apiKeyMask || 'Saved'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={
                    config.hasApiKey
                      ? 'Leave blank to keep stored key'
                      : 'Enter GSTN API Key'
                  }
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#081020] border border-slate-200 dark:border-white/10 text-xs font-mono text-brand-navy dark:text-white focus:outline-none focus:border-brand-blue"
                />
                {config.hasApiKey && (
                  <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-500 cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={clearApiKey}
                      onChange={(e) => setClearApiKey(e.target.checked)}
                    />
                    <span>Clear</span>
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-white/[0.06]">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                maxLength={15}
                value={sampleGstin}
                onChange={(e) => setSampleGstin(e.target.value.toUpperCase())}
                placeholder="09AABCR1234F1Z5"
                className="w-40 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#081020] border border-slate-200 dark:border-white/10 text-xs font-mono uppercase text-brand-navy dark:text-white"
              />
              <button
                type="button"
                disabled={testing}
                onClick={() => void handleTest()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#081020] text-xs font-bold text-brand-navy dark:text-white hover:border-brand-blue disabled:opacity-50"
              >
                {testing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                )}
                <span>Test GSTIN Probe</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn-primary-brand inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save GSTIN Vault</span>
            </button>
          </div>
        </form>

        {testResult && (
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#081020] border border-slate-200 dark:border-white/10 text-xs flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono font-bold text-brand-navy dark:text-white">
              Sample {testResult.sampleGstin} · Mod-36 Checksum:{' '}
              {testResult.checksumValid ? 'VALID ✓' : 'INVALID ✕'}
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              Mode: {testResult.mode}
              {testResult.httpStatus ? ` (HTTP ${testResult.httpStatus})` : ''}
            </span>
          </div>
        )}
      </div>

      {/* Cross-Tenant GSTIN Trust Telemetry */}
      {telemetry && (
        <div className="rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-white dark:bg-[#0D1628] border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-brand-navy dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-blue" />
                Cross-Tenant GSTIN Trust Telemetry
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Real-time buyer underwriting &amp; risky GSTIN checks across customer workspaces
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300">
              Avg Trust Score: {telemetry.avgTrustScore}/100
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ['Total Verified', telemetry.totalVerified, 'text-brand-navy dark:text-white'],
              ['Safe Credit', telemetry.safeCreditCount, 'text-emerald-600 dark:text-emerald-400'],
              ['50% Advance', telemetry.advance50Count, 'text-brand-blue dark:text-sky-400'],
              ['100% Adv / Alert', telemetry.advance100Count + telemetry.invalidChecksumCount, 'text-rose-600 dark:text-rose-400'],
            ].map(([label, val, cls]) => (
              <div
                key={String(label)}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#081020] border border-slate-200/70 dark:border-white/[0.07]"
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {label}
                </div>
                <div className={`text-xl font-extrabold tabular-nums mt-1 ${cls}`}>
                  {val}
                </div>
              </div>
            ))}
          </div>

          {telemetry.recentVerifications.length === 0 ? (
            <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 text-center text-xs text-slate-400">
              No leads verified with GSTIN across workspaces yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-white/[0.08]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#081020] text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-2.5">Workspace</th>
                    <th className="px-4 py-2.5">Buyer / Company</th>
                    <th className="px-4 py-2.5">GSTIN</th>
                    <th className="px-4 py-2.5">State &amp; Entity</th>
                    <th className="px-4 py-2.5 text-right">Trust</th>
                    <th className="px-4 py-2.5">Guidance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                  {telemetry.recentVerifications.map((row) => (
                    <tr key={row.leadId} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 font-bold text-brand-navy dark:text-white whitespace-nowrap">
                        {row.tenantName}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">
                        <div className="font-semibold text-brand-navy dark:text-white">
                          {row.leadName}
                        </div>
                        {row.company && (
                          <div className="text-[10px] text-slate-400">{row.company}</div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-mono font-bold text-brand-blue dark:text-sky-300 whitespace-nowrap">
                        {row.gstin}
                      </td>
                      <td className="px-4 py-2.5 text-[11px] text-slate-500 dark:text-slate-400">
                        {row.stateName} · {row.entityType}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-extrabold text-brand-navy dark:text-white">
                        {row.trustScore}/100
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase whitespace-nowrap ${
                            row.recommendedTerms === 'safe_credit'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                              : row.recommendedTerms === 'advance_100' || !row.checksumValid
                                ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                                : 'bg-blue-500/15 text-brand-blue dark:text-sky-300'
                          }`}
                        >
                          {row.recommendedTerms.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
