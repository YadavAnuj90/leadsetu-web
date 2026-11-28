'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  GitBranch,
  MapPin,
  Scale,
  RefreshCw,
  Play,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import {
  fetchLeadRoutingApi,
  simulateLeadRoutingApi,
  updateLeadRoutingApi,
} from '@/lib/lead-routing-api';
import { getErrorMessage } from '@/lib/api-client';
import type {
  LeadRoutingConfigResponse,
  RepRoutingCandidate,
  RoutingMode,
  SimulateLeadRoutingResponse,
  TerritoryRoutingRule,
} from '@/types/contracts';

const STRATEGIES: Array<{
  id: RoutingMode;
  title: string;
  desc: string;
  icon: typeof RefreshCw;
}> = [
  {
    id: 'round_robin',
    title: 'Round-Robin Rotation',
    desc: 'Equally rotates incoming leads one by one across eligible sales reps.',
    icon: RefreshCw,
  },
  {
    id: 'territory_first',
    title: 'Territory-First + Fallback',
    desc: 'Matches buyer City/State against rep Territory tags & custom rules before Round-Robin.',
    icon: MapPin,
  },
  {
    id: 'load_balanced',
    title: 'Load-Balanced + Daily Cap',
    desc: 'Assigns every lead to the eligible rep carrying the fewest open leads within daily cap.',
    icon: Scale,
  },
];

const SOURCE_CHOICES = [
  'indiamart',
  'justdial',
  'meta_ads',
  'google_ads',
  'website',
  'whatsapp',
];

export default function SmartLeadRoutingPage() {
  const router = useRouter();
  const [config, setConfig] = useState<LeadRoutingConfigResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [enabled, setEnabled] = useState(true);
  const [mode, setMode] = useState<RoutingMode>('territory_first');
  const [applyOnManualCreate, setApplyOnManualCreate] = useState(false);
  const [respectDailyCap, setRespectDailyCap] = useState(true);
  const [defaultDailyCap, setDefaultDailyCap] = useState(25);
  const [reps, setReps] = useState<RepRoutingCandidate[]>([]);
  const [rules, setRules] = useState<TerritoryRoutingRule[]>([]);
  const [dirty, setDirty] = useState(false);

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Simulator
  const [simCity, setSimCity] = useState('Noida');
  const [simSource, setSimSource] = useState('indiamart');
  const [simValue, setSimValue] = useState('350000');
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] =
    useState<SimulateLeadRoutingResponse | null>(null);

  // New Rule Modal
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [ruleCities, setRuleCities] = useState('');
  const [ruleSources, setRuleSources] = useState<string[]>(['indiamart']);
  const [ruleMinValue, setRuleMinValue] = useState('0');
  const [ruleTargets, setRuleTargets] = useState<string[]>([]);
  const [ruleStrategy, setRuleStrategy] = useState<'round_robin' | 'load_balanced'>(
    'round_robin',
  );

  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchLeadRoutingApi();
      setConfig(data);
      setEnabled(data.enabled);
      setMode(data.mode);
      setApplyOnManualCreate(data.applyOnManualCreate);
      setRespectDailyCap(data.respectDailyCap);
      setDefaultDailyCap(data.defaultDailyCap);
      setReps(data.reps || []);
      setRules(data.rules || []);
      setDirty(false);
    } catch (err) {
      setFeedback({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  const updateRep = (
    userId: string,
    patch: Partial<RepRoutingCandidate>,
  ) => {
    setReps((prev) =>
      prev.map((r) => (r.userId === userId ? { ...r, ...patch } : r)),
    );
    setDirty(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setFeedback(null);
    try {
      const saved = await updateLeadRoutingApi({
        enabled,
        mode,
        applyOnManualCreate,
        respectDailyCap,
        defaultDailyCap,
        repConfigs: reps.map((r) => ({
          userId: r.userId,
          eligible: r.eligible,
          dailyCap: Number(r.dailyCap) || 0,
          territories: r.territories,
        })),
        rules,
      });
      setConfig(saved);
      setDirty(false);
      setFeedback({
        type: 'success',
        text: `Saved Smart Lead Routing (${saved.mode.replace('_', ' ')}) for incoming IndiaMART, Webhook & Website leads.`,
      });
    } catch (err) {
      setFeedback({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSimulate = async () => {
    setSimulating(true);
    setFeedback(null);
    try {
      const res = await simulateLeadRoutingApi({
        city: simCity,
        source: simSource,
        estimatedValue: Number(simValue) || 0,
      });
      setSimResult(res);
    } catch (err) {
      setFeedback({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setSimulating(false);
    }
  };

  const handleAddRule = () => {
    if (!ruleName.trim() || ruleTargets.length === 0) return;
    const newRule: TerritoryRoutingRule = {
      id: `rule_${Date.now().toString(36)}`,
      name: ruleName.trim(),
      active: true,
      matchCities: ruleCities
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
      matchSources: ruleSources,
      minEstimatedValue: Number(ruleMinValue) || 0,
      targetUserIds: ruleTargets,
      strategy: ruleStrategy,
    };
    setRules((prev) => [...prev, newRule]);
    setDirty(true);
    setRuleModalOpen(false);
    setRuleName('');
    setRuleCities('');
    setRuleMinValue('0');
    setRuleTargets([]);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand-navy"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>

        <div className="flex items-center gap-2">
          <Link
            href="/settings/integrations"
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-brand-navy hover:border-brand-blue"
          >
            Webhook Capture Setup
          </Link>
          <Link
            href="/leads"
            className="px-3.5 py-2 rounded-xl bg-brand-light text-brand-blue text-xs font-bold hover:bg-brand-blue hover:text-white transition-colors"
          >
            Open Leads
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-blue mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Automated Inbound Assignment
          </div>
          <h1 className="text-2xl font-extrabold text-brand-navy flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-brand-blue" />
            <span>Smart Lead Routing Studio</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Route incoming IndiaMART, Justdial, Meta Ads &amp; Website leads automatically by Round-Robin, Territory matching, or Load-Balanced daily caps.
          </p>
        </div>

        <button
          type="button"
          disabled={isSaving || !dirty}
          onClick={handleSave}
          className="btn-primary-brand inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white disabled:opacity-50 flex-shrink-0"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{dirty ? 'Save Routing Rules' : 'Saved'}</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-2.5 text-xs sm:text-sm font-semibold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white rounded-3xl p-16 border border-slate-200/80 flex items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-brand-blue" />
          <span className="text-sm font-semibold text-slate-600">
            Loading Smart Lead Routing configuration...
          </span>
        </div>
      ) : (
        <>
          {/* Strategy Cards */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-brand-navy">
                  1. Primary Routing Mode
                </h2>
                <p className="text-xs text-slate-500">
                  Evaluates any active Priority Rules first, then applies your selected workspace strategy.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-brand-navy">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => {
                      setEnabled(e.target.checked);
                      setDirty(true);
                    }}
                  />
                  <span>Auto-Route Webhooks</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyOnManualCreate}
                    onChange={(e) => {
                      setApplyOnManualCreate(e.target.checked);
                      setDirty(true);
                    }}
                  />
                  <span>Also Route Manual Leads</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={respectDailyCap}
                    onChange={(e) => {
                      setRespectDailyCap(e.target.checked);
                      setDirty(true);
                    }}
                  />
                  <span>Enforce Daily Caps</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {STRATEGIES.map((s) => {
                const Icon = s.icon;
                const selected = mode === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setMode(s.id);
                      setDirty(true);
                    }}
                    className={`text-left p-4 rounded-2xl border transition-all space-y-2 ${
                      selected
                        ? 'bg-brand-light/75 dark:bg-brand-blue/15 border-brand-blue ring-2 ring-brand-blue/20'
                        : 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 hover:border-brand-blue/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      {selected && (
                        <span className="px-2.5 py-0.5 rounded-full bg-brand-blue text-white text-[10px] font-extrabold">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-extrabold text-brand-navy">
                      {s.title}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {s.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority Rules + Simulator */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Priority Territory / Source Rules (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-extrabold text-brand-navy">
                    2. Priority Territory &amp; Value Rules
                  </h2>
                  <p className="text-xs text-slate-500">
                    Route high-value deals or specific IndiaMART cities to specialized reps first.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRuleTargets(
                      reps.filter((r) => r.eligible).slice(0, 2).map((r) => r.userId),
                    );
                    setRuleModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-light text-brand-blue text-xs font-bold hover:bg-brand-blue hover:text-white transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Rule
                </button>
              </div>

              {rules.length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                  No custom conditional rules yet. Leads currently route directly using{' '}
                  <strong>{mode.replace('_', ' ')}</strong> across eligible reps below.
                </div>
              ) : (
                <div className="space-y-3">
                  {rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-brand-navy">
                            {rule.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-brand-light text-brand-blue text-[10px] font-bold uppercase">
                            {rule.strategy.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 space-x-2">
                          {rule.matchCities.length > 0 && (
                            <span>Cities: {rule.matchCities.join(', ')}</span>
                          )}
                          {rule.matchSources.length > 0 && (
                            <span>· Sources: {rule.matchSources.join(', ')}</span>
                          )}
                          {rule.minEstimatedValue > 0 && (
                            <span>
                              · Min ₹{rule.minEstimatedValue.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-semibold text-brand-navy">
                          Target Reps:{' '}
                          {rule.targetUserIds
                            .map((id) => reps.find((r) => r.userId === id)?.name || id)
                            .join(', ')}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setRules((prev) => prev.filter((r) => r.id !== rule.id));
                          setDirty(true);
                        }}
                        className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Live Routing Dry-Run Simulator (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div>
                <h2 className="text-base font-extrabold text-brand-navy">
                  Dry-Run Routing Simulator
                </h2>
                <p className="text-xs text-slate-500">
                  Preview which rep receives a lead without touching real counters.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    Buyer City / State
                  </label>
                  <input
                    type="text"
                    value={simCity}
                    onChange={(e) => setSimCity(e.target.value)}
                    placeholder="e.g. Noida, Mumbai, Ludhiana"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-brand-navy"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                      Lead Source
                    </label>
                    <select
                      value={simSource}
                      onChange={(e) => setSimSource(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-brand-navy bg-white"
                    >
                      {SOURCE_CHOICES.map((src) => (
                        <option key={src} value={src}>
                          {src}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                      Deal Value (₹)
                    </label>
                    <input
                      type="number"
                      value={simValue}
                      onChange={(e) => setSimValue(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-brand-navy"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={simulating}
                  onClick={handleSimulate}
                  className="w-full btn-primary-brand py-2.5 rounded-xl text-xs font-bold text-white inline-flex items-center justify-center gap-1.5"
                >
                  {simulating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                  <span>Test Routing Match</span>
                </button>
              </div>

              {simResult && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                  <div className="text-[11px] font-extrabold uppercase text-emerald-700">
                    Would Assign To
                  </div>
                  <div className="text-base font-black text-emerald-950">
                    {simResult.assignedUserName}{' '}
                    <span className="text-xs font-semibold text-emerald-700">
                      ({simResult.assignedUserEmail})
                    </span>
                  </div>
                  <div className="text-xs text-emerald-800">{simResult.reason}</div>
                </div>
              )}
            </div>
          </div>

          {/* Rep Pool, Territories & Daily Cap Matrix */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-blue" />
                <div>
                  <h2 className="text-base font-extrabold text-brand-navy">
                    3. Sales Rep Pool, Territories &amp; Daily Capacities
                  </h2>
                  <p className="text-xs text-slate-500">
                    Exclude non-sales admins/owners from inbound rotation or set city/state tags &amp; daily lead caps per rep.
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500">
                    <th className="py-3 pr-4">Team Member</th>
                    <th className="py-3 px-3">In Pool</th>
                    <th className="py-3 px-3">Territory Match Cities (CSV)</th>
                    <th className="py-3 px-3">Daily Cap (0 = ∞)</th>
                    <th className="py-3 pl-3 text-right">Live Workload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reps.map((rep) => (
                    <tr key={rep.userId}>
                      <td className="py-3.5 pr-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-sm text-brand-navy">
                            {rep.name}
                          </span>
                          {rep.availabilityStatus === 'on_leave' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              On Leave (Skipped)
                            </span>
                          )}
                          {rep.availabilityStatus === 'away' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              Away (Skipped)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 capitalize">
                          {rep.role} · {rep.email}
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <input
                          type="checkbox"
                          checked={rep.eligible}
                          onChange={(e) =>
                            updateRep(rep.userId, { eligible: e.target.checked })
                          }
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="py-3.5 px-3 min-w-[220px]">
                        <input
                          type="text"
                          value={rep.territories.join(', ')}
                          onChange={(e) =>
                            updateRep(rep.userId, {
                              territories: e.target.value
                                .split(',')
                                .map((t) => t.trim())
                                .filter(Boolean),
                            })
                          }
                          placeholder="e.g. Delhi, Noida, Gurugram"
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-brand-navy"
                        />
                      </td>
                      <td className="py-3.5 px-3">
                        <input
                          type="number"
                          min={0}
                          value={rep.dailyCap}
                          onChange={(e) =>
                            updateRep(rep.userId, {
                              dailyCap: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                          className="w-20 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-brand-navy"
                        />
                      </td>
                      <td className="py-3.5 pl-3 text-right">
                        <span className="font-bold text-brand-navy">
                          {rep.openLeadsCount} open
                        </span>
                        <div className="text-[11px] text-slate-400">
                          {rep.todayAssignedCount} today
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Routing Decisions Audit Log */}
          {(config?.recentLogs || []).length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3">
              <h2 className="text-sm font-extrabold text-brand-navy">
                Recent Auto-Assignment Audit Trail
              </h2>
              <div className="divide-y divide-slate-100 text-xs">
                {config!.recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="py-2.5 flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <strong className="text-brand-navy">{log.leadName}</strong>{' '}
                      <span className="text-slate-500">
                        ({log.source} · {log.city})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-brand-light text-brand-blue font-bold uppercase text-[10px]">
                        {log.strategyUsed.replace('_', ' ')}
                      </span>
                      <span className="font-bold text-emerald-700">
                        → {log.assignedUserName}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* New Priority Rule Modal */}
      {ruleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            <div
              className="px-6 py-4 text-white flex items-center justify-between"
              style={{
                background: 'linear-gradient(135deg, #17243A 0%, #233B5E 100%)',
              }}
            >
              <h3 className="font-extrabold text-base">Add Territory / Value Rule</h3>
              <button
                type="button"
                onClick={() => setRuleModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Rule Name *
                </label>
                <input
                  type="text"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="e.g. High-Priority IndiaMART"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Match Cities / States (comma separated, blank = any)
                </label>
                <input
                  type="text"
                  value={ruleCities}
                  onChange={(e) => setRuleCities(e.target.value)}
                  placeholder="Delhi, New Delhi, Noida, Gurugram, Faridabad"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Min Deal Value (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={ruleMinValue}
                    onChange={(e) => setRuleMinValue(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-brand-navy"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Distribution Inside Rule
                  </label>
                  <select
                    value={ruleStrategy}
                    onChange={(e) =>
                      setRuleStrategy(
                        e.target.value as 'round_robin' | 'load_balanced',
                      )
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-brand-navy bg-white"
                  >
                    <option value="round_robin">Round-Robin</option>
                    <option value="load_balanced">Load-Balanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                  Match Sources (leave none selected = all sources)
                </label>
                <div className="flex flex-wrap gap-2">
                  {SOURCE_CHOICES.map((src) => {
                    const active = ruleSources.includes(src);
                    return (
                      <button
                        key={src}
                        type="button"
                        onClick={() =>
                          setRuleSources((prev) =>
                            active
                              ? prev.filter((x) => x !== src)
                              : [...prev, src],
                          )
                        }
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          active
                            ? 'bg-brand-blue text-white border-brand-blue'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {src}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                  Assign To Sales Reps *
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 rounded-xl border border-slate-200 bg-slate-50">
                  {reps.map((r) => {
                    const checked = ruleTargets.includes(r.userId);
                    return (
                      <label
                        key={r.userId}
                        className="flex items-center justify-between text-xs font-bold text-brand-navy cursor-pointer px-2 py-1 rounded hover:bg-white"
                      >
                        <span>
                          {r.name} ({r.role})
                        </span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            setRuleTargets((prev) =>
                              e.target.checked
                                ? [...prev, r.userId]
                                : prev.filter((x) => x !== r.userId),
                            )
                          }
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRuleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddRule}
                  disabled={!ruleName.trim() || ruleTargets.length === 0}
                  className="btn-primary-brand px-5 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-50"
                >
                  Add Rule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
