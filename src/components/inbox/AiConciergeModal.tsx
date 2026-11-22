'use client';

import { useEffect, useState, FormEvent } from 'react';
import {
  Bot,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  ShieldCheck,
  Sparkles,
  X,
  Play,
} from 'lucide-react';
import {
  fetchAiAgentConfigApi,
  updateAiAgentConfigApi,
} from '@/lib/inbox-api';
import { getErrorMessage } from '@/lib/api-client';
import type { AiSalesAgentPolicy } from '@/types/contracts';

interface AiConciergeModalProps {
  open: boolean;
  onClose: () => void;
  activeThreadId?: string;
  activeThreadName?: string;
  onPolicyUpdated?: (policy: AiSalesAgentPolicy) => void;
  onSimulateInbound?: (message: string) => Promise<void>;
}

export function AiConciergeModal({
  open,
  onClose,
  activeThreadId,
  activeThreadName,
  onPolicyUpdated,
  onSimulateInbound,
}: AiConciergeModalProps) {
  const [policy, setPolicy] = useState<AiSalesAgentPolicy | null>(null);
  const [keywordsInput, setKeywordsInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [simMessage, setSimMessage] = useState(
    'Namaste, 500 pcs ka rate kya hai Gurugram delivery ke liye? GSTIN 06AABCU9603R1ZM',
  );
  const [simBusy, setSimBusy] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setNotice(null);
    fetchAiAgentConfigApi()
      .then((res) => {
        setPolicy(res);
        setKeywordsInput((res.escalationKeywords || []).join(', '));
      })
      .catch((err) => setNotice({ type: 'error', text: getErrorMessage(err) }))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!policy) return;
    setSaving(true);
    setNotice(null);
    try {
      const updated = await updateAiAgentConfigApi({
        ...policy,
        escalationKeywords: keywordsInput
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean),
      });
      setPolicy(updated);
      onPolicyUpdated?.(updated);
      setNotice({
        type: 'success',
        text: `24x7 AI Concierge updated (${updated.mode.toUpperCase()} mode).`,
      });
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  const handleRunSim = async () => {
    if (!onSimulateInbound || !simMessage.trim()) return;
    setSimBusy(true);
    setNotice(null);
    try {
      await onSimulateInbound(simMessage.trim());
      setNotice({
        type: 'success',
        text: 'Simulated inbound buyer message & executed AI Concierge! Check thread messages & qualification chips.',
      });
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setSimBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0D172B] rounded-3xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-brand-navy dark:text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-emerald-500" />
              <span>24×7 Autonomous AI WhatsApp Sales Concierge</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Qualifies off-hours IndiaMART/WhatsApp leads in Hinglish &amp; English using your HSN Product Catalog, enforces discount floors, and hands off HOT leads.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {notice && (
          <div
            className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              notice.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-300'
            }`}
          >
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{notice.text}</span>
          </div>
        )}

        {loading || !policy ? (
          <div className="py-8 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading AI Concierge configuration...</span>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            {/* Mode Pills */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                Workspace Operating Mode
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(
                  [
                    ['autopilot', 'Auto-Pilot (24×7 Reply)', 'Automatically sends catalog prices & qualification prompts'],
                    ['draft_only', 'Draft-Only Copilot', 'Prepares suggested AI reply + updates Lead fields safely'],
                    ['off', 'Disabled (Off)', 'Manual rep handling only'],
                  ] as const
                ).map(([m, title, desc]) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPolicy({ ...policy, mode: m })}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      policy.mode === m
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-brand-navy dark:text-white ring-1 ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <p className="font-extrabold">{title}</p>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reply Language
                </label>
                <select
                  value={policy.language}
                  onChange={(e) =>
                    setPolicy({
                      ...policy,
                      language: e.target.value as AiSalesAgentPolicy['language'],
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-semibold"
                >
                  <option value="auto">Auto-Detect (Hinglish / EN)</option>
                  <option value="hinglish">Always Hinglish</option>
                  <option value="english">Always English</option>
                  <option value="hindi">Always Hindi</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Max Discount Guardrail (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={policy.maxDiscountPct}
                  onChange={(e) =>
                    setPolicy({ ...policy, maxDiscountPct: Number(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Hot Handoff Score (≥)
                </label>
                <input
                  type="number"
                  min="50"
                  max="98"
                  value={policy.handoffScoreThreshold}
                  onChange={(e) =>
                    setPolicy({
                      ...policy,
                      handoffScoreThreshold: Number(e.target.value) || 80,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-1">
              <label className="inline-flex items-center gap-2 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={policy.autoSendCatalogPricing}
                  onChange={(e) =>
                    setPolicy({ ...policy, autoSendCatalogPricing: e.target.checked })
                  }
                  className="rounded border-slate-300"
                />
                <span>Auto-share matched Product HSN, MOQ &amp; Price</span>
              </label>

              <label className="inline-flex items-center gap-2 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={policy.autoUpdateLeadFields}
                  onChange={(e) =>
                    setPolicy({ ...policy, autoUpdateLeadFields: e.target.checked })
                  }
                  className="rounded border-slate-300"
                />
                <span>Auto-sync extracted City, Est. Value &amp; AI Score to Lead</span>
              </label>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                <span>Human Escalation Keywords (comma separated)</span>
              </label>
              <input
                type="text"
                value={keywordsInput}
                onChange={(e) => setKeywordsInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-blue hover:bg-blue-700 text-white font-extrabold disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Concierge Settings</span>
              </button>
            </div>
          </form>
        )}

        {/* Live Simulator */}
        {activeThreadId && onSimulateInbound && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
            <p className="font-extrabold text-brand-navy dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Test AI Concierge Live on &quot;{activeThreadName}&quot;</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={simMessage}
                onChange={(e) => setSimMessage(e.target.value)}
                placeholder="Simulate an inbound buyer WhatsApp inquiry..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              />
              <button
                type="button"
                disabled={simBusy || !simMessage.trim()}
                onClick={handleRunSim}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shrink-0 disabled:opacity-60"
              >
                {simBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                <span>Simulate Buyer Msg</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
