'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Bot,
  Calendar,
  CheckCircle2,
  GitBranch,
  Languages,
  ListChecks,
  Loader2,
  PackageSearch,
  Play,
  Plus,
  RotateCcw,
  Save,
  Send,
  Smartphone,
  Sparkles,
  Tag,
  TicketCheck,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import {
  fetchBotFlowConfigApi,
  resetBotFlowConfigApi,
  simulateBotFlowStepApi,
  updateBotFlowConfigApi,
  type BotFlowActionType,
  type BotFlowBranch,
  type BotFlowLanguage,
  type BotFlowMenuMode,
  type BotSessionState,
  type InteractiveBotPayload,
  type WhatsAppBotFlowConfig,
} from '@/lib/inbox-api';
import { getErrorMessage } from '@/lib/api-client';

interface WhatsAppBotBuilderModalProps {
  open: boolean;
  onClose: () => void;
  defaultBuyerName?: string;
  defaultBuyerPhone?: string;
  onSaved?: (config: WhatsAppBotFlowConfig) => void;
}

interface SimBubble {
  id: string;
  sender: 'buyer' | 'bot';
  text: string;
  payload?: InteractiveBotPayload | null;
  crmActionSummary?: string;
  language?: BotFlowLanguage;
  timestamp: string;
}

const ACTION_OPTIONS: Array<{
  id: BotFlowActionType;
  label: string;
  badge: string;
  color: string;
}> = [
  {
    id: 'send_rate_card',
    label: 'Send Catalog GST Rate Card',
    badge: 'Rate Card',
    color: 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30',
  },
  {
    id: 'send_booking_link',
    label: 'Share /book Demo Slot Link',
    badge: 'Book Demo',
    color: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30',
  },
  {
    id: 'track_order',
    label: 'Track Latest Order / Invoice',
    badge: 'Track Order',
    color: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30',
  },
  {
    id: 'create_sla_ticket',
    label: 'Auto-Raise SLA Ticket (2-Step)',
    badge: 'SLA Ticket',
    color: 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30',
  },
  {
    id: 'handoff_rep',
    label: 'Route Thread to Team Rep',
    badge: 'Rep Handoff',
    color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
  },
  {
    id: 'sub_menu',
    label: 'Custom Reply + Follow-up Buttons',
    badge: 'Custom Reply',
    color: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30',
  },
];

function ActionIcon({ action }: { action: BotFlowActionType }) {
  if (action === 'send_rate_card') return <Tag className="w-3.5 h-3.5" />;
  if (action === 'send_booking_link') return <Calendar className="w-3.5 h-3.5" />;
  if (action === 'track_order') return <PackageSearch className="w-3.5 h-3.5" />;
  if (action === 'create_sla_ticket') return <TicketCheck className="w-3.5 h-3.5" />;
  if (action === 'handoff_rep') return <UserCheck className="w-3.5 h-3.5" />;
  return <GitBranch className="w-3.5 h-3.5" />;
}

export function WhatsAppBotBuilderModal({
  open,
  onClose,
  defaultBuyerName,
  defaultBuyerPhone,
  onSaved,
}: WhatsAppBotBuilderModalProps) {
  const [config, setConfig] = useState<WhatsAppBotFlowConfig | null>(null);
  const [editLang, setEditLang] = useState<BotFlowLanguage>('hinglish');
  const [keywordsText, setKeywordsText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [notice, setNotice] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Simulator state
  const [simLang, setSimLang] = useState<BotFlowLanguage | 'auto'>('auto');
  const [simInput, setSimInput] = useState('');
  const [simBusy, setSimBusy] = useState(false);
  const [simSession, setSimSession] = useState<BotSessionState>({});
  const [simBubbles, setSimBubbles] = useState<SimBubble[]>([]);
  const [openListDrawerId, setOpenListDrawerId] = useState<string | null>(null);

  const runSimulation = useCallback(
    async (
      message: string,
      interactiveOptionId?: string,
      overrideConfig?: WhatsAppBotFlowConfig | null,
      resetFirst = false,
    ) => {
      const cfg = overrideConfig ?? config;
      if (!cfg) return;
      const activeSession = resetFirst ? {} : simSession;
      if (resetFirst) {
        setSimSession({});
      }

      const nowStr = new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const userBubble: SimBubble = {
        id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sender: 'buyer',
        text: message,
        timestamp: nowStr,
      };
      setSimBubbles((prev) => (resetFirst ? [userBubble] : [...prev, userBubble]));
      setSimBusy(true);
      setOpenListDrawerId(null);

      try {
        const res = await simulateBotFlowStepApi({
          message,
          interactiveOptionId,
          language: simLang === 'auto' ? undefined : simLang,
          session: activeSession,
          buyerName: defaultBuyerName || 'Rajesh Sharma',
          buyerPhone: defaultBuyerPhone || '+91 98112 45678',
          draftConfig: cfg,
        });
        setSimSession(res.nextSession || {});
        const botBubble: SimBubble = {
          id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          sender: 'bot',
          text: res.payload?.body || 'Menu ready.',
          payload: res.payload,
          crmActionSummary: res.crmActionSummary,
          language: res.language,
          timestamp: new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
        setSimBubbles((prev) => [...prev, botBubble]);
      } catch (err) {
        setNotice({ type: 'error', text: getErrorMessage(err) });
      } finally {
        setSimBusy(false);
      }
    },
    [config, simSession, simLang, defaultBuyerName, defaultBuyerPhone],
  );

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setNotice(null);
    try {
      const data = await fetchBotFlowConfigApi();
      setConfig(data);
      setEditLang(data.defaultLanguage || 'hinglish');
      setKeywordsText((data.triggerKeywords || []).join(', '));
      setSimBubbles([]);
      setSimSession({});
      // Seed initial interactive greeting preview automatically
      const simRes = await simulateBotFlowStepApi({
        message:
          data.defaultLanguage === 'hindi'
            ? 'नमस्ते'
            : data.defaultLanguage === 'english'
              ? 'Hi'
              : 'Namaste',
        buyerName: defaultBuyerName || 'Rajesh Sharma',
        buyerPhone: defaultBuyerPhone || '+91 98112 45678',
        draftConfig: data,
      });
      setSimSession(simRes.nextSession || {});
      setSimBubbles([
        {
          id: 'u-init',
          sender: 'buyer',
          text:
            data.defaultLanguage === 'hindi'
              ? 'नमस्ते'
              : data.defaultLanguage === 'english'
                ? 'Hi'
                : 'Namaste',
          timestamp: 'Just now',
        },
        {
          id: 'b-init',
          sender: 'bot',
          text: simRes.payload?.body || '',
          payload: simRes.payload,
          crmActionSummary: simRes.crmActionSummary,
          language: simRes.language,
          timestamp: 'Just now',
        },
      ]);
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, [defaultBuyerName, defaultBuyerPhone]);

  useEffect(() => {
    if (open) {
      void loadConfig();
    }
  }, [open, loadConfig]);

  if (!open) return null;

  const updateBranch = (
    branchId: string,
    updater: (prev: BotFlowBranch) => BotFlowBranch,
  ) => {
    setConfig((prev) =>
      prev
        ? {
            ...prev,
            branches: prev.branches.map((b) =>
              b.id === branchId ? updater(b) : b,
            ),
          }
        : prev,
    );
  };

  const handleAddBranch = () => {
    if (!config || config.branches.length >= 10) return;
    const newId = `branch_custom_${Date.now().toString(36)}`;
    const newBranch: BotFlowBranch = {
      id: newId,
      enabled: true,
      title: {
        english: 'Talk to Sales',
        hindi: 'सेल्स से बात करें',
        hinglish: 'Sales Rep Se Baat',
      },
      description: {
        english: 'Connect directly with a specialist',
        hindi: 'हमारे प्रतिनिधि से सीधे बात करें',
        hinglish: 'Direct product expert se connect karein',
      },
      keywords: ['sales', 'expert', 'talk', 'agent'],
      actionType: 'handoff_rep',
      replyBody: {
        english: 'Connecting you right away to our senior sales advisor.',
        hindi: 'हम आपको अभी हमारे वरिष्ठ सेल्स सलाहकार से जोड़ रहे हैं।',
        hinglish: 'Aapko abhi hamare senior sales expert se connect kar rahe hain.',
      },
      followUpButtons: ['Main Menu'],
      ticketPriority: 'medium',
      ticketCategory: 'general',
      routeToRole: 'sales',
      hitsCount: 0,
    };
    setConfig({ ...config, branches: [...config.branches, newBranch] });
  };

  const handleDeleteBranch = (branchId: string) => {
    if (!config || config.branches.length <= 1) return;
    setConfig({
      ...config,
      branches: config.branches.filter((b) => b.id !== branchId),
    });
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setNotice(null);
    try {
      const parsedKeywords = keywordsText
        .split(',')
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean);
      const saved = await updateBotFlowConfigApi({
        ...config,
        triggerKeywords: parsedKeywords.length > 0 ? parsedKeywords : ['hi', 'menu'],
      });
      setConfig(saved);
      setKeywordsText(saved.triggerKeywords.join(', '));
      onSaved?.(saved);
      setNotice({
        type: 'success',
        text: saved.enabled
          ? 'WhatsApp Interactive Bot Flow saved & LIVE for inbound buyers.'
          : 'Bot Flow saved (currently paused — toggle Live Active to enable).',
      });
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    setResetting(true);
    setNotice(null);
    try {
      const fresh = await resetBotFlowConfigApi();
      setConfig(fresh);
      setKeywordsText(fresh.triggerKeywords.join(', '));
      onSaved?.(fresh);
      setNotice({
        type: 'success',
        text: 'Restored starter B2B flows (Get Rate Card, Book Demo, Track Order, Raise SLA Ticket).',
      });
      void runSimulation('Namaste', undefined, fresh, true);
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setResetting(false);
    }
  };

  const activeBranchCount = config?.branches.filter((b) => b.enabled).length ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-2 sm:p-4">
      <div className="w-full max-w-6xl h-[92vh] bg-white dark:bg-[#0B1426] rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden">
        {/* Top Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-[#0F1B33] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  WhatsApp Interactive Bot Flow Builder
                </h2>
                {config && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                      config.enabled
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-200/80 dark:bg-white/10 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-white/15'
                    }`}
                  >
                    {config.enabled ? '● Live on Meta Webhook' : 'Paused Draft'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Multi-step Quick-Reply Buttons &amp; List Menu in English, Hindi &amp; Hinglish with auto-CRM routing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {config && (
              <button
                type="button"
                onClick={() =>
                  setConfig({ ...config, enabled: !config.enabled })
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${
                  config.enabled
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500'
                    : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-white/15 hover:border-emerald-500'
                }`}
              >
                {config.enabled ? 'Bot: ON' : 'Enable Bot'}
              </button>
            )}
            <button
              type="button"
              onClick={handleResetDefaults}
              disabled={resetting || loading}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/15 text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-brand-blue"
              title="Reset branches to starter EN/HI/Hinglish presets"
            >
              {resetting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5" />
              )}
              Reset Starter
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-brand-blue hover:bg-blue-700 text-white text-xs font-extrabold shadow-sm disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Save Flow
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl border border-slate-200 dark:border-white/15 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
              aria-label="Close bot builder"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notice Banner */}
        {notice && (
          <div
            className={`px-5 py-2 text-xs font-bold flex items-center justify-between gap-2 border-b ${
              notice.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                : 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30'
            }`}
          >
            <span className="flex items-center gap-2">
              {notice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              {notice.text}
            </span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="text-[11px] opacity-70 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main 2-Pane Split: Left Builder | Right Live WhatsApp Phone Simulator */}
        {loading || !config ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-brand-blue" />
          </div>
        ) : (
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12">
            {/* LEFT PANE: Flow Configuration & Step Cards */}
            <div className="lg:col-span-7 xl:col-span-8 overflow-y-auto p-4 sm:p-5 space-y-5 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-white/10">
              {/* Telemetry Strip */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { label: 'Bot Runs', val: config.stats.totalRuns },
                  { label: 'Taps', val: config.stats.buttonsTapped },
                  { label: 'Rate Cards', val: config.stats.rateCardsSent },
                  { label: 'Demos Sent', val: config.stats.demosShared },
                  { label: 'Orders Checked', val: config.stats.ordersTracked },
                  { label: 'SLA Tickets', val: config.stats.ticketsCreated },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10"
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                      {stat.label}
                    </div>
                    <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-0.5">
                      {stat.val}
                    </div>
                  </div>
                ))}
              </div>

              {/* Language & Welcome Menu Settings */}
              <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-[#101C34] p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Languages className="w-4 h-4 text-brand-blue" />
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                      Step 1 · Greeting Menu &amp; Language Localization
                    </span>
                  </div>

                  {/* Language Editor Tabs */}
                  <div className="inline-flex items-center bg-white dark:bg-[#081020] p-1 rounded-xl border border-slate-200 dark:border-white/10">
                    {(['hinglish', 'english', 'hindi'] as BotFlowLanguage[]).map(
                      (lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setEditLang(lang)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-all ${
                            editLang === lang
                              ? 'bg-brand-blue text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-300 hover:text-brand-blue'
                          }`}
                        >
                          {lang === 'hindi'
                            ? 'हिंदी (Hindi)'
                            : lang === 'hinglish'
                              ? 'Hinglish'
                              : 'English'}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Default Bot Language
                    </label>
                    <select
                      value={config.defaultLanguage}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          defaultLanguage: e.target.value as BotFlowLanguage,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0B1426] text-xs font-semibold text-slate-900 dark:text-white"
                    >
                      <option value="hinglish">Hinglish (B2B Best)</option>
                      <option value="english">English</option>
                      <option value="hindi">Hindi (हिंदी)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Interactive UI Format
                    </label>
                    <select
                      value={config.menuMode}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          menuMode: e.target.value as BotFlowMenuMode,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0B1426] text-xs font-semibold text-slate-900 dark:text-white"
                    >
                      <option value="auto">
                        Auto ({activeBranchCount <= 3 ? 'Buttons (≤3)' : 'List Menu (≥4)'})
                      </option>
                      <option value="buttons">Quick-Reply Buttons (max 3)</option>
                      <option value="list">WhatsApp List Menu (up to 10)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      List CTA Label ({editLang})
                    </label>
                    <input
                      type="text"
                      maxLength={20}
                      value={config.listButtonLabel[editLang]}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          listButtonLabel: {
                            ...config.listButtonLabel,
                            [editLang]: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0B1426] text-xs font-semibold text-slate-900 dark:text-white"
                      placeholder="Choose Option"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      Welcome Message ({editLang.toUpperCase()}) · supports{' '}
                      <code className="text-brand-blue">{'{{buyer_name}}'}</code> &amp;{' '}
                      <code className="text-brand-blue">{'{{company}}'}</code>
                    </label>
                    <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.autoDetectLanguage}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            autoDetectLanguage: e.target.checked,
                          })
                        }
                        className="rounded border-slate-300 text-brand-blue"
                      />
                      Auto-detect Hindi / Hinglish per message
                    </label>
                  </div>
                  <textarea
                    rows={2}
                    value={config.welcomeBody[editLang]}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        welcomeBody: {
                          ...config.welcomeBody,
                          [editLang]: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0B1426] text-xs text-slate-900 dark:text-white resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-6">
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Trigger Keywords (comma separated)
                    </label>
                    <input
                      type="text"
                      value={keywordsText}
                      onChange={(e) => setKeywordsText(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0B1426] text-xs text-slate-900 dark:text-white"
                      placeholder="hi, hello, namaste, menu, rate"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Menu Cooldown (min)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={1440}
                      value={config.cooldownMinutes}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          cooldownMinutes: Number(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0B1426] text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="sm:col-span-3 flex items-end pb-1">
                    <label className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.triggerOnFirstMessage}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            triggerOnFirstMessage: e.target.checked,
                          })
                        }
                        className="rounded border-slate-300 text-brand-blue"
                      />
                      Trigger on 1st Msg
                    </label>
                  </div>
                </div>
              </div>

              {/* Interactive Menu Branches Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                    Step 2 · Interactive Button / List Menu Branches ({activeBranchCount} active / {config.branches.length} total)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleAddBranch}
                  disabled={config.branches.length >= 10}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Menu Option
                </button>
              </div>

              {/* Branch Flow Cards */}
              <div className="space-y-3">
                {config.branches.map((branch, idx) => {
                  const actionMeta =
                    ACTION_OPTIONS.find((a) => a.id === branch.actionType) ||
                    ACTION_OPTIONS[0];
                  return (
                    <div
                      key={branch.id}
                      className={`rounded-2xl border p-4 space-y-3 transition-all ${
                        branch.enabled
                          ? 'bg-white dark:bg-[#101C34] border-slate-200 dark:border-white/10 shadow-xs'
                          : 'bg-slate-50/60 dark:bg-white/[0.02] border-slate-200/60 dark:border-white/5 opacity-60'
                      }`}
                    >
                      {/* Branch Top Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-white/10 text-[11px] font-black flex items-center justify-center text-slate-700 dark:text-slate-200">
                            {idx + 1}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-extrabold ${actionMeta.color}`}
                          >
                            <ActionIcon action={branch.actionType} />
                            {actionMeta.badge}
                          </span>
                          {branch.hitsCount > 0 && (
                            <span className="text-[10px] font-bold text-slate-400">
                              · {branch.hitsCount} hits
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              void runSimulation(
                                branch.title[editLang],
                                `ls_bot_${branch.id}`,
                              )
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-blue/10 hover:bg-brand-blue/20 text-brand-blue dark:text-sky-300 text-[11px] font-bold"
                            title="Test this branch inside the WhatsApp simulator"
                          >
                            <Play className="w-3 h-3" /> Test Step
                          </button>
                          <label className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={branch.enabled}
                              onChange={(e) =>
                                updateBranch(branch.id, (b) => ({
                                  ...b,
                                  enabled: e.target.checked,
                                }))
                              }
                              className="rounded border-slate-300 text-emerald-600"
                            />
                            Active
                          </label>
                          {config.branches.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteBranch(branch.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10"
                              title="Remove option"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Title, Description, Action & Routing */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                        <div className="sm:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                            Button / Row Title ({editLang}, max 24)
                          </label>
                          <input
                            type="text"
                            maxLength={24}
                            value={branch.title[editLang]}
                            onChange={(e) =>
                              updateBranch(branch.id, (b) => ({
                                ...b,
                                title: { ...b.title, [editLang]: e.target.value },
                              }))
                            }
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#0B1426] text-xs font-bold text-slate-900 dark:text-white"
                          />
                        </div>

                        <div className="sm:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                            CRM Auto-Action
                          </label>
                          <select
                            value={branch.actionType}
                            onChange={(e) =>
                              updateBranch(branch.id, (b) => ({
                                ...b,
                                actionType: e.target.value as BotFlowActionType,
                              }))
                            }
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#0B1426] text-xs font-semibold text-slate-900 dark:text-white"
                          >
                            {ACTION_OPTIONS.map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                            Route To Role
                          </label>
                          <select
                            value={branch.routeToRole}
                            onChange={(e) =>
                              updateBranch(branch.id, (b) => ({
                                ...b,
                                routeToRole: e.target
                                  .value as BotFlowBranch['routeToRole'],
                              }))
                            }
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#0B1426] text-xs font-semibold text-slate-900 dark:text-white"
                          >
                            <option value="sales">Sales Team Rep</option>
                            <option value="support">Support / SLA Desk</option>
                            <option value="manager">Manager Escalation</option>
                            <option value="owner">Workspace Owner</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                        <div className="sm:col-span-6">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                            List Menu Subtitle ({editLang}, max 72)
                          </label>
                          <input
                            type="text"
                            maxLength={72}
                            value={branch.description[editLang]}
                            onChange={(e) =>
                              updateBranch(branch.id, (b) => ({
                                ...b,
                                description: {
                                  ...b.description,
                                  [editLang]: e.target.value,
                                },
                              }))
                            }
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#0B1426] text-xs text-slate-700 dark:text-slate-200"
                          />
                        </div>
                        <div className="sm:col-span-6">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                            Follow-up Buttons (comma-sep, max 3)
                          </label>
                          <input
                            type="text"
                            value={branch.followUpButtons.join(', ')}
                            onChange={(e) =>
                              updateBranch(branch.id, (b) => ({
                                ...b,
                                followUpButtons: e.target.value
                                  .split(',')
                                  .map((s) => s.trim().slice(0, 20))
                                  .filter(Boolean)
                                  .slice(0, 3),
                              }))
                            }
                            placeholder="Book Demo, Main Menu"
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#0B1426] text-xs text-slate-700 dark:text-slate-200"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                          Bot Reply Before CRM Output ({editLang})
                        </label>
                        <textarea
                          rows={2}
                          value={branch.replyBody[editLang]}
                          onChange={(e) =>
                            updateBranch(branch.id, (b) => ({
                              ...b,
                              replyBody: {
                                ...b.replyBody,
                                [editLang]: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#0B1426] text-xs text-slate-800 dark:text-slate-200 resize-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT PANE: Interactive WhatsApp Phone Simulator */}
            <div className="lg:col-span-5 xl:col-span-4 bg-slate-100 dark:bg-[#070D19] p-4 flex flex-col min-h-[420px]">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                    Live Interactive Simulator
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <select
                    value={simLang}
                    onChange={(e) =>
                      setSimLang(e.target.value as BotFlowLanguage | 'auto')
                    }
                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0F1B33] text-[11px] font-bold text-slate-700 dark:text-slate-200"
                    title="Force simulator language or Auto-detect"
                  >
                    <option value="auto">Auto Lang</option>
                    <option value="hinglish">Hinglish</option>
                    <option value="english">English</option>
                    <option value="hindi">Hindi</option>
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      void runSimulation(
                        simLang === 'hindi'
                          ? 'नमस्ते'
                          : simLang === 'english'
                            ? 'Hi'
                            : 'Namaste',
                        undefined,
                        config,
                        true,
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-slate-200/80 dark:bg-white/10 hover:bg-slate-300/80 dark:hover:bg-white/15 text-[11px] font-bold text-slate-700 dark:text-slate-200"
                  >
                    Restart
                  </button>
                </div>
              </div>

              {/* WhatsApp Dark-Mode Phone Frame */}
              <div className="flex-1 min-h-0 rounded-3xl border-[3px] border-slate-800 bg-[#0B141A] shadow-xl flex flex-col overflow-hidden">
                {/* WhatsApp Top Bar */}
                <div className="px-4 py-2.5 bg-[#1F2C34] border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-white flex items-center gap-1">
                        Leadsetu Business Bot
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      </div>
                      <div className="text-[10px] text-emerald-300/90 font-semibold">
                        Interactive Cloud API · Step:{' '}
                        {simSession.step || 'root'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages Scroll Area */}
                <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5">
                  {simBubbles.map((bubble) =>
                    bubble.sender === 'buyer' ? (
                      <div key={bubble.id} className="flex justify-end">
                        <div className="max-w-[82%] rounded-2xl rounded-tr-sm bg-[#005C4B] px-3 py-2 text-xs text-white shadow-xs">
                          <div className="whitespace-pre-wrap">{bubble.text}</div>
                          <div className="text-[9px] text-emerald-200/75 text-right mt-1">
                            {bubble.timestamp} ✓✓
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div key={bubble.id} className="flex flex-col items-start space-y-1.5">
                        <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-[#1F2C34] border border-white/10 overflow-hidden shadow-xs">
                          {bubble.payload?.listMenu?.headerText && (
                            <div className="px-3 pt-2 text-[11px] font-extrabold text-emerald-300">
                              {bubble.payload.listMenu.headerText}
                            </div>
                          )}
                          <div className="px-3 py-2 text-xs text-slate-100 whitespace-pre-wrap leading-relaxed">
                            {bubble.text}
                          </div>
                          {bubble.payload?.footerText && (
                            <div className="px-3 pb-2 text-[10px] text-slate-400">
                              {bubble.payload.footerText}
                            </div>
                          )}

                          {/* Interactive Quick-Reply Buttons */}
                          {bubble.payload?.interactiveType === 'buttons' &&
                            bubble.payload.buttons &&
                            bubble.payload.buttons.length > 0 && (
                              <div className="border-t border-white/10 divide-y divide-white/10">
                                {bubble.payload.buttons.map((btn) => (
                                  <button
                                    key={btn.id}
                                    type="button"
                                    disabled={simBusy}
                                    onClick={() =>
                                      void runSimulation(btn.title, btn.id)
                                    }
                                    className="w-full py-2 px-3 text-center text-xs font-bold text-[#53BDEB] hover:bg-white/5 transition-colors disabled:opacity-50"
                                  >
                                    ↩ {btn.title}
                                  </button>
                                ))}
                              </div>
                            )}

                          {/* Interactive List Menu Trigger & Inline Sheet */}
                          {bubble.payload?.interactiveType === 'list' &&
                            bubble.payload.listMenu && (
                              <div className="border-t border-white/10">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenListDrawerId(
                                      openListDrawerId === bubble.id
                                        ? null
                                        : bubble.id,
                                    )
                                  }
                                  className="w-full py-2 px-3 flex items-center justify-center gap-1.5 text-xs font-extrabold text-[#53BDEB] hover:bg-white/5"
                                >
                                  <ListChecks className="w-3.5 h-3.5" />
                                  {bubble.payload.listMenu.buttonLabel}
                                </button>
                                {openListDrawerId === bubble.id && (
                                  <div className="bg-[#111B21] border-t border-white/10 p-2 space-y-1">
                                    <div className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                                      {bubble.payload.listMenu.sectionTitle}
                                    </div>
                                    {bubble.payload.listMenu.rows.map((row) => (
                                      <button
                                        key={row.id}
                                        type="button"
                                        disabled={simBusy}
                                        onClick={() =>
                                          void runSimulation(row.title, row.id)
                                        }
                                        className="w-full text-left px-2.5 py-1.5 rounded-xl bg-[#1F2C34] hover:bg-[#2A3942] border border-white/5 transition-colors"
                                      >
                                        <div className="text-xs font-bold text-white">
                                          {row.title}
                                        </div>
                                        {row.description && (
                                          <div className="text-[10px] text-slate-400 truncate">
                                            {row.description}
                                          </div>
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                        </div>

                        {/* CRM Automation Result Pill */}
                        {bubble.crmActionSummary && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-300">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>{bubble.crmActionSummary}</span>
                          </div>
                        )}
                      </div>
                    ),
                  )}
                  {simBusy && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 px-2">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Executing CRM branch...
                    </div>
                  )}
                </div>

                {/* Quick Test Prompts + Text Input */}
                <div className="p-2.5 bg-[#1F2C34] border-t border-white/10 space-y-2">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                    {['Menu', 'Get Rate Card', 'Book Demo', 'Track Order', 'Raise SLA Ticket'].map(
                      (q) => (
                        <button
                          key={q}
                          type="button"
                          disabled={simBusy}
                          onClick={() => void runSimulation(q)}
                          className="shrink-0 px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-[10px] font-bold text-slate-200 transition-colors"
                        >
                          {q}
                        </button>
                      ),
                    )}
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!simInput.trim() || simBusy) return;
                      const txt = simInput.trim();
                      setSimInput('');
                      void runSimulation(txt);
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={simInput}
                      onChange={(e) => setSimInput(e.target.value)}
                      placeholder="Type buyer reply (e.g. Dispatch delayed)..."
                      className="flex-1 px-3 py-1.5 rounded-full bg-[#2A3942] border border-white/10 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="submit"
                      disabled={simBusy || !simInput.trim()}
                      className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center disabled:opacity-50"
                      aria-label="Send simulated message"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
