'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Cpu,
  KeyRound,
  Loader2,
  Lock,
  Mic,
  RefreshCw,
  Save,
  ShieldAlert,
  Sparkles,
  Wifi,
} from 'lucide-react';
import {
  fetchAiProviderApi,
  testAiProviderApi,
  updateAiProviderApi,
  type PlatformAiProviderConfig,
  type PlatformAiProviderTestResponse,
} from '@/lib/super-admin-api';
import { getErrorMessage } from '@/lib/api-client';

export default function AiProviderVaultSection() {
  const [config, setConfig] = useState<PlatformAiProviderConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [testResult, setTestResult] =
    useState<PlatformAiProviderTestResponse | null>(null);

  const [enabled, setEnabled] = useState(true);
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [claudeApiKey, setClaudeApiKey] = useState('');
  const [clearOpenaiKey, setClearOpenaiKey] = useState(false);
  const [clearGeminiKey, setClearGeminiKey] = useState(false);
  const [clearClaudeKey, setClearClaudeKey] = useState(false);

  const hydrate = useCallback((next: PlatformAiProviderConfig) => {
    setConfig(next);
    setEnabled(next.enabled !== false);
    setOpenaiApiKey('');
    setGeminiApiKey('');
    setClaudeApiKey('');
    setClearOpenaiKey(false);
    setClearGeminiKey(false);
    setClearClaudeKey(false);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchAiProviderApi();
      hydrate(next);
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
      const next = await updateAiProviderApi({
        enabled,
        openaiApiKey: openaiApiKey.trim() || undefined,
        geminiApiKey: geminiApiKey.trim() || undefined,
        claudeApiKey: claudeApiKey.trim() || undefined,
        clearOpenaiKey,
        clearGeminiKey,
        clearClaudeKey,
      });
      hydrate(next);
      setBanner({
        type: 'success',
        message:
          'AI & Whisper STT Key Vault updated. Voice-Note-to-Quote, Call STT & SetuAI Copilot now resolve these encrypted keys immediately.',
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
      const res = await testAiProviderApi({
        openaiApiKey: openaiApiKey.trim() || undefined,
        geminiApiKey: geminiApiKey.trim() || undefined,
        claudeApiKey: claudeApiKey.trim() || undefined,
      });
      setTestResult(res);
      if (res.config) setConfig(res.config);
      setBanner({
        type: res.ok ? 'success' : 'error',
        message: res.ok
          ? 'All configured AI provider keys authenticated cleanly!'
          : res.error || 'No AI keys configured to verify.',
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
        Loading Central AI &amp; Whisper STT Provider Vault...
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-xs text-rose-700 dark:text-rose-200 flex items-center justify-between gap-3">
        <span>{error || 'Failed to load AI Provider Vault.'}</span>
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

  const providerCards = [
    {
      id: 'openai' as const,
      title: 'OpenAI (Whisper-1 Hinglish STT + GPT-4o-mini)',
      subtitle: 'Powers WhatsApp Voice-Note transcription, Call Whisper STT & JSON extraction',
      hasKey: config.hasOpenaiKey,
      mask: config.openaiKeyMask,
      source: config.openaiSource,
      value: openaiApiKey,
      setValue: setOpenaiApiKey,
      clear: clearOpenaiKey,
      setClear: setClearOpenaiKey,
      placeholder: 'sk-...',
      testInfo: testResult?.results?.openai,
    },
    {
      id: 'gemini' as const,
      title: 'Google Gemini (Primary Sales & Reply Engine)',
      subtitle: 'Powers Hinglish reply drafting, lead intent scoring & RAG Q&A Copilot',
      hasKey: config.hasGeminiKey,
      mask: config.geminiKeyMask,
      source: config.geminiSource,
      value: geminiApiKey,
      setValue: setGeminiApiKey,
      clear: clearGeminiKey,
      setClear: setClearGeminiKey,
      placeholder: 'AIza...',
      testInfo: testResult?.results?.gemini,
    },
    {
      id: 'claude' as const,
      title: 'Anthropic Claude (Failover Reasoning Engine)',
      subtitle: 'Automatic failover & complex contract/credit reasoning fallback',
      hasKey: config.hasClaudeKey,
      mask: config.claudeKeyMask,
      source: config.claudeSource,
      value: claudeApiKey,
      setValue: setClaudeApiKey,
      clear: clearClaudeKey,
      setClear: setClearClaudeKey,
      placeholder: 'sk-ant-...',
      testInfo: testResult?.results?.claude,
    },
  ];

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

      <div className="rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-white dark:bg-[#0D1628] border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-blue dark:text-sky-400">
              <Cpu className="w-3.5 h-3.5" /> Zero-Restart Neural Key Vault · Overrides .env
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-brand-navy dark:text-white">
              OpenAI Whisper STT &amp; AI Provider Vault
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
              Manage OpenAI Whisper STT, Gemini, and Claude API keys centrally from Leadsetu HQ. Updated keys are encrypted in MongoDB and hot-injected into <code className="font-mono">leadsetu-ai</code> per request.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold border ${
                config.whisperReady
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
              }`}
            >
              <Mic className="w-3 h-3" />
              {config.whisperReady ? 'Whisper STT Ready' : 'Whisper STT Unconfigured'}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold border ${
                config.aiServiceReachable
                  ? 'bg-blue-500/15 text-brand-blue dark:text-sky-300 border-brand-blue/30'
                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              {config.aiServiceReachable ? 'leadsetu-ai Online' : 'leadsetu-ai Offline'}
            </span>
            <button
              type="button"
              onClick={() => void load()}
              className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:text-brand-blue"
              title="Refresh vault status"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <label className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-[#081020] border border-slate-200 dark:border-white/[0.08] cursor-pointer">
            <div>
              <div className="text-xs font-extrabold text-brand-navy dark:text-white">
                Enable Super Admin AI Provider Vault Overrides
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                When enabled, stored vault keys override <code className="font-mono">.env</code> credentials on every live AI &amp; Whisper STT request
              </div>
            </div>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-4 w-4 rounded accent-brand-blue shrink-0"
            />
          </label>

          <div className="grid grid-cols-1 gap-3.5">
            {providerCards.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-2xl bg-slate-50/80 dark:bg-[#081020] border border-slate-200/80 dark:border-white/[0.08] space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-extrabold text-brand-navy dark:text-white flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-brand-blue" />
                      <span>{p.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {p.subtitle}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        p.hasKey
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {p.hasKey
                        ? `Configured (${p.source === 'super_admin' ? 'Vault' : '.env'})`
                        : 'Not Set'}
                    </span>
                    {p.hasKey && p.mask && (
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> {p.mask}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <input
                    type="password"
                    value={p.value}
                    onChange={(e) => p.setValue(e.target.value)}
                    placeholder={
                      p.hasKey
                        ? 'Enter new API key to rotate/override, or leave blank'
                        : `Paste key (${p.placeholder})`
                    }
                    className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-[#0D1628] border border-slate-200 dark:border-white/10 text-xs font-mono text-brand-navy dark:text-white focus:outline-none focus:border-brand-blue"
                  />
                  {p.hasKey && (
                    <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-500 cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={p.clear}
                        onChange={(e) => p.setClear(e.target.checked)}
                      />
                      <span>Clear Vault Key</span>
                    </label>
                  )}
                </div>

                {p.testInfo && (
                  <div
                    className={`text-[11px] font-semibold px-3 py-1.5 rounded-xl border ${
                      p.testInfo.ok
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {p.testInfo.detail}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-white/[0.06]">
            <button
              type="button"
              disabled={testing}
              onClick={() => void handleTest()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#081020] text-xs font-bold text-brand-navy dark:text-white hover:border-brand-blue disabled:opacity-50"
            >
              {testing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Wifi className="w-3.5 h-3.5 text-emerald-500" />
              )}
              <span>Verify All Keys Live</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="btn-primary-brand inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save AI &amp; Whisper Vault</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
