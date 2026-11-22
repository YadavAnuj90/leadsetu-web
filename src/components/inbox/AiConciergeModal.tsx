'use client';

import { useCallback, useEffect, useState, FormEvent } from 'react';
import {
  AlertCircle,
  BookOpen,
  Bot,
  CheckCircle2,
  Database,
  Loader2,
  Play,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  createAiKnowledgeApi,
  deleteAiKnowledgeApi,
  fetchAiAgentConfigApi,
  fetchAiKnowledgeApi,
  seedStarterKnowledgeApi,
  syncCatalogKnowledgeApi,
  updateAiAgentConfigApi,
  updateAiKnowledgeApi,
  type AiKnowledgeCategory,
  type AiKnowledgeEntryDto,
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

const DEMO_PROMPTS: Array<{ label: string; prompt: string }> = [
  {
    label: 'Hinglish Price + GSTIN',
    prompt:
      'Namaste, 500 pcs ka rate kya hai Gurugram delivery ke liye? GSTIN 06AABCU9603R1ZM',
  },
  {
    label: 'KB Warranty & Dispatch',
    prompt: 'Warranty kitne saal ki hai aur dispatch kab tak hoga?',
  },
  {
    label: 'Discount Cap Escalation',
    prompt: 'Bhaiya 25% discount chahiye urgent order hai aaj hi!',
  },
  {
    label: 'Frustration Guardrail',
    prompt: 'Kya bakwas service hai 2 din se koi reply nahi kar raha!',
  },
  {
    label: 'Book Demo Call',
    prompt: 'Kal ke liye video demo call book karni hai',
  },
];

const KB_CATEGORIES: Array<{ id: AiKnowledgeCategory; label: string }> = [
  { id: 'pricing_terms', label: 'Pricing & GST Terms' },
  { id: 'warranty_returns', label: 'Warranty & Returns' },
  { id: 'shipping_dispatch', label: 'Dispatch & Delivery' },
  { id: 'product_spec', label: 'Product Specs / SKU' },
  { id: 'company_faq', label: 'Company FAQ' },
  { id: 'custom_sop', label: 'Sales SOP' },
];

export function AiConciergeModal({
  open,
  onClose,
  activeThreadId,
  activeThreadName,
  onPolicyUpdated,
  onSimulateInbound,
}: AiConciergeModalProps) {
  const [activeTab, setActiveTab] = useState<'agent' | 'kb'>('agent');
  const [policy, setPolicy] = useState<AiSalesAgentPolicy | null>(null);
  const [keywordsInput, setKeywordsInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [simMessage, setSimMessage] = useState(DEMO_PROMPTS[0].prompt);
  const [simBusy, setSimBusy] = useState(false);
  const [notice, setNotice] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // KB state
  const [kbItems, setKbItems] = useState<AiKnowledgeEntryDto[]>([]);
  const [kbStats, setKbStats] = useState({ total: 0, active: 0, totalHits: 0 });
  const [kbLoading, setKbLoading] = useState(false);
  const [kbSearch, setKbSearch] = useState('');
  const [kbTitle, setKbTitle] = useState('');
  const [kbCategory, setKbCategory] = useState<AiKnowledgeCategory>('company_faq');
  const [kbContent, setKbContent] = useState('');
  const [kbTags, setKbTags] = useState('');
  const [kbActionBusy, setKbActionBusy] = useState(false);

  const loadKnowledge = useCallback(async (search?: string) => {
    setKbLoading(true);
    try {
      const res = await fetchAiKnowledgeApi(search ? { search } : undefined);
      setKbItems(res.items);
      setKbStats(res.stats);
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setKbLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setNotice(null);
    Promise.all([fetchAiAgentConfigApi(), fetchAiKnowledgeApi()])
      .then(([cfg, kb]) => {
        setPolicy(cfg);
        setKeywordsInput((cfg.escalationKeywords || []).join(', '));
        setKbItems(kb.items);
        setKbStats(kb.stats);
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

  const handleRunSim = async (overrideMsg?: string) => {
    const msgToSend = (overrideMsg ?? simMessage).trim();
    if (!onSimulateInbound || !msgToSend) return;
    if (overrideMsg) setSimMessage(overrideMsg);
    setSimBusy(true);
    setNotice(null);
    try {
      await onSimulateInbound(msgToSend);
      setNotice({
        type: 'success',
        text: 'Executed Autonomous AI Concierge on buyer message! Check chat thread, KB citations & qualification chips.',
      });
      void loadKnowledge(kbSearch);
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setSimBusy(false);
    }
  };

  const handleSeedStarter = async () => {
    setKbActionBusy(true);
    setNotice(null);
    try {
      const res = await seedStarterKnowledgeApi();
      setKbItems(res.items);
      setKbStats(res.stats);
      setNotice({
        type: 'success',
        text: `Loaded Indian B2B/D2C Knowledge Base pack (${res.newlyAdded ?? 0} new entries added).`,
      });
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setKbActionBusy(false);
    }
  };

  const handleSyncCatalog = async () => {
    setKbActionBusy(true);
    setNotice(null);
    try {
      const res = await syncCatalogKnowledgeApi();
      setKbItems(res.items);
      setKbStats(res.stats);
      setNotice({
        type: 'success',
        text: `Synced ${res.syncedProducts ?? 0} active /products SKUs into AI Knowledge Base.`,
      });
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setKbActionBusy(false);
    }
  };

  const handleCreateKb = async (e: FormEvent) => {
    e.preventDefault();
    if (!kbTitle.trim() || !kbContent.trim()) return;
    setKbActionBusy(true);
    setNotice(null);
    try {
      await createAiKnowledgeApi({
        title: kbTitle.trim(),
        category: kbCategory,
        content: kbContent.trim(),
        tags: kbTags
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
      });
      setKbTitle('');
      setKbContent('');
      setKbTags('');
      await loadKnowledge(kbSearch);
      setNotice({ type: 'success', text: 'Knowledge Base entry added.' });
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setKbActionBusy(false);
    }
  };

  const handleToggleKbActive = async (entry: AiKnowledgeEntryDto) => {
    try {
      await updateAiKnowledgeApi(entry.id, { isActive: !entry.isActive });
      await loadKnowledge(kbSearch);
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) });
    }
  };

  const handleDeleteKb = async (id: string) => {
    try {
      await deleteAiKnowledgeApi(id);
      await loadKnowledge(kbSearch);
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0D172B] rounded-3xl max-w-3xl w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-brand-navy dark:text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-emerald-500" />
              <span>Autonomous Hinglish AI Agent &amp; Knowledge Base</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Grounded answers from your Knowledge Base &amp; /products catalog, Hinglish frustration guardrails, discount caps &amp; instant Booking links.
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

        {/* Studio Sub-tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('agent')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-extrabold border transition ${
              activeTab === 'agent'
                ? 'bg-brand-navy text-white border-brand-navy'
                : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Agent Guardrails &amp; Live Demo</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('kb')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-extrabold border transition ${
              activeTab === 'kb'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Knowledge Base (RAG · {kbStats.active} active · {kbStats.totalHits} hits)</span>
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

        {activeTab === 'agent' ? (
          <>
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
                        ['autopilot', 'Auto-Pilot (24×7 Reply)', 'Replies autonomously in Hinglish/EN with KB + Pricing'],
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
                    <span>Auto-share Product HSN, MOQ &amp; Price</span>
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
                    <span>Auto-sync City, Est. Value &amp; AI Score</span>
                  </label>

                  <label className="inline-flex items-center gap-2 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={policy.autoShareBookingLink !== false}
                      onChange={(e) =>
                        setPolicy({ ...policy, autoShareBookingLink: e.target.checked })
                      }
                      className="rounded border-slate-300"
                    />
                    <span>Auto-share /book/ link on Demo requests</span>
                  </label>

                  <label className="inline-flex items-center gap-2 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(policy.businessHoursOnly)}
                      onChange={(e) =>
                        setPolicy({ ...policy, businessHoursOnly: e.target.checked })
                      }
                      className="rounded border-slate-300"
                    />
                    <span>Only auto-send during IST Business Hours (9AM–8PM)</span>
                  </label>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                    <span>Human Escalation Keywords (plus built-in Hinglish Frustration Detector)</span>
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

            {/* Instant Demo Scenarios Simulator */}
            {activeThreadId && onSimulateInbound && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                <p className="font-extrabold text-brand-navy dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>1-Click Live Demo Scenarios on &quot;{activeThreadName}&quot;</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {DEMO_PROMPTS.map((demo) => (
                    <button
                      key={demo.label}
                      type="button"
                      disabled={simBusy}
                      onClick={() => void handleRunSim(demo.prompt)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-brand-navy dark:text-slate-200"
                    >
                      ▶ {demo.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={simMessage}
                    onChange={(e) => setSimMessage(e.target.value)}
                    placeholder="Simulate any Hinglish or English buyer WhatsApp message..."
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  />
                  <button
                    type="button"
                    disabled={simBusy || !simMessage.trim()}
                    onClick={() => void handleRunSim()}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shrink-0 disabled:opacity-60"
                  >
                    {simBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    <span>Run Buyer Msg</span>
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* KNOWLEDGE BASE TAB */
          <div className="space-y-4 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={kbActionBusy}
                  onClick={() => void handleSeedStarter()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>1-Click Load Starter B2B/D2C FAQs</span>
                </button>
                <button
                  type="button"
                  disabled={kbActionBusy}
                  onClick={() => void handleSyncCatalog()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-navy hover:bg-slate-800 text-white font-extrabold disabled:opacity-50"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Sync /products Catalog</span>
                </button>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={kbSearch}
                  onChange={(e) => {
                    setKbSearch(e.target.value);
                    void loadKnowledge(e.target.value);
                  }}
                  placeholder="Search KB facts..."
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>
            </div>

            {/* Add KB Entry Form */}
            <form
              onSubmit={handleCreateKb}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5 bg-white dark:bg-slate-950/60"
            >
              <div className="font-extrabold text-brand-navy dark:text-white flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>Add Custom FAQ, Warranty, Dispatch or Pricing Policy</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  required
                  value={kbTitle}
                  onChange={(e) => setKbTitle(e.target.value)}
                  placeholder="Title (e.g. Bulk Distributor Return Policy)"
                  className="sm:col-span-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
                <select
                  value={kbCategory}
                  onChange={(e) => setKbCategory(e.target.value as AiKnowledgeCategory)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                >
                  {KB_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                rows={2}
                required
                value={kbContent}
                onChange={(e) => setKbContent(e.target.value)}
                placeholder="Exact policy or fact the AI Agent should cite when buyers ask..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <input
                  type="text"
                  value={kbTags}
                  onChange={(e) => setKbTags(e.target.value)}
                  placeholder="Hinglish/EN keywords (comma separated: warranty, garanti, dispatch)"
                  className="flex-1 min-w-[200px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
                <button
                  type="submit"
                  disabled={kbActionBusy}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" /> Add to Knowledge Base
                </button>
              </div>
            </form>

            {/* KB Entries List */}
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {kbLoading ? (
                <div className="py-6 text-center text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-1.5" />
                  Loading Knowledge Base...
                </div>
              ) : kbItems.length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400">
                  No Knowledge Base articles yet — click <strong>1-Click Load Starter B2B/D2C FAQs</strong> above for an instant demo!
                </div>
              ) : (
                kbItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border transition ${
                      item.isActive
                        ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                        : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-extrabold text-brand-navy dark:text-white flex flex-wrap items-center gap-1.5">
                          <span>{item.title}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                            {item.category}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                            {item.hitCount} AI hits
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                          {item.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => void handleToggleKbActive(item)}
                          className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-bold"
                        >
                          {item.isActive ? 'Pause' : 'Enable'}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteKb(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
