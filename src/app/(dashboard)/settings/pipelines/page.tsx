'use client';

import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Kanban,
  Plus,
  Save,
  Trash2,
  Star,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  X,
} from 'lucide-react';
import { usePipelines } from '@/hooks/usePipelines';
import { getErrorMessage } from '@/lib/api-client';
import type {
  CreatePipelinePayload,
  Pipeline,
  PipelineStage,
  PipelineStageCategory,
} from '@/types/contracts';

const STAGE_COLOR_PALETTE = [
  '#3978EA',
  '#0EA5E9',
  '#8B5CF6',
  '#F59E0B',
  '#EC4899',
  '#10B981',
  '#EF4444',
  '#64748B',
];

const TEMPLATE_PRESETS: Array<{
  id: NonNullable<CreatePipelinePayload['template']>;
  title: string;
  desc: string;
}> = [
  {
    id: 'b2b_sales',
    title: 'Standard B2B Sales',
    desc: 'Qualified -> Discovery -> GST Proposal -> Negotiation -> Closed Won',
  },
  {
    id: 'b2c_orders',
    title: 'B2C / D2C Retail Orders',
    desc: 'New Inquiry -> Order Confirmed -> Packed -> Dispatched -> Delivered / COD Settled',
  },
  {
    id: 'education_admissions',
    title: 'Education & Coaching Admissions',
    desc: 'Inquiry -> Counseling Done -> Demo Attended -> Fee Pending -> Enrolled',
  },
  {
    id: 'bpo_callbacks',
    title: 'BPO / Call Center Queue',
    desc: 'Fresh Queue -> Contacted -> Callback Scheduled -> Hot Transfer -> Closed',
  },
  {
    id: 'msme_sales',
    title: 'Small MSME Quick Orders',
    desc: 'New Inquiry -> Estimate / Quote Sent -> Order Confirmed -> Closed Won / Paid',
  },
  {
    id: 'dealer_onboarding',
    title: 'Dealer / Distributor Onboarding',
    desc: 'Inquiry -> GSTIN KYC -> Sample & Rate Card -> Margin PO -> Onboarded',
  },
  {
    id: 'amc_renewals',
    title: 'AMC & Service Renewals',
    desc: 'Renewal Due (30d) -> Service Quote -> PO Approval -> Renewed',
  },
  {
    id: 'blank',
    title: 'Minimal Starter Pipeline',
    desc: 'New Opportunity -> In Progress -> Closed Won / Lost',
  },
];

export default function PipelinesSettingsPage() {
  const router = useRouter();
  const {
    pipelines,
    isLoading,
    isSaving,
    error,
    createPipeline,
    updatePipeline,
    setDefaultPipeline,
    deletePipeline,
  } = usePipelines();

  const [selectedId, setSelectedId] = useState<string>('');
  const [draftName, setDraftName] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftStages, setDraftStages] = useState<PipelineStage[]>([]);
  const [stageMigrations, setStageMigrations] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // New Pipeline Modal
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTemplate, setNewTemplate] = useState<
    NonNullable<CreatePipelinePayload['template']>
  >('b2b_sales');
  const [newDefault, setNewDefault] = useState(false);

  const selectedPipeline: Pipeline | undefined =
    pipelines.find((p) => p.id === selectedId) || pipelines[0];

  useEffect(() => {
    if (selectedPipeline && selectedPipeline.id !== selectedId) {
      setSelectedId(selectedPipeline.id);
    }
  }, [selectedPipeline, selectedId]);

  useEffect(() => {
    if (!selectedPipeline) return;
    setDraftName(selectedPipeline.name);
    setDraftDescription(selectedPipeline.description || '');
    setDraftStages(selectedPipeline.stages.map((s) => ({ ...s })));
    setStageMigrations({});
    setDirty(false);
  }, [selectedPipeline]);

  const updateStageAt = (idx: number, patch: Partial<PipelineStage>) => {
    setDraftStages((prev) =>
      prev.map((st, i) => (i === idx ? { ...st, ...patch } : st)),
    );
    setDirty(true);
  };

  const moveStageOrder = (idx: number, delta: -1 | 1) => {
    const target = idx + delta;
    if (target < 0 || target >= draftStages.length) return;
    setDraftStages((prev) => {
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.splice(target, 0, item);
      return next;
    });
    setDirty(true);
  };

  const handleAddStage = () => {
    const newStage: PipelineStage = {
      id: `stage_${Date.now().toString(36)}`,
      name: `Custom Stage ${draftStages.length + 1}`,
      probability: 50,
      color: STAGE_COLOR_PALETTE[draftStages.length % STAGE_COLOR_PALETTE.length],
      category: 'open',
      rottenAfterDays: 7,
      requireNoteOnEnter: false,
    };
    const firstOutcomeIdx = draftStages.findIndex((s) => s.category !== 'open');
    if (firstOutcomeIdx >= 0) {
      const next = [...draftStages];
      next.splice(firstOutcomeIdx, 0, newStage);
      setDraftStages(next);
    } else {
      setDraftStages([...draftStages, newStage]);
    }
    setDirty(true);
  };

  const handleRemoveStage = (idx: number) => {
    if (draftStages.length <= 2) {
      setFeedback({
        type: 'error',
        text: 'A pipeline must keep at least 2 stages.',
      });
      return;
    }
    const removed = draftStages[idx];
    const remaining = draftStages.filter((_, i) => i !== idx);
    if (!remaining.some((s) => s.category === 'open')) {
      setFeedback({
        type: 'error',
        text: 'A pipeline must keep at least one active (Open) stage.',
      });
      return;
    }
    const fallbackTarget =
      remaining.find((s) => s.category === 'open')?.id || remaining[0].id;
    setStageMigrations((prev) => ({
      ...prev,
      [removed.id]: fallbackTarget,
    }));
    setDraftStages(remaining);
    setDirty(true);
  };

  const handleSave = async () => {
    if (!selectedPipeline) return;
    setFeedback(null);
    try {
      await updatePipeline(selectedPipeline.id, {
        name: draftName,
        description: draftDescription,
        stages: draftStages,
        ...(Object.keys(stageMigrations).length > 0 ? { stageMigrations } : {}),
      });
      setDirty(false);
      setFeedback({
        type: 'success',
        text: `Saved "${draftName}" and synced Kanban stages with existing deals.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: getErrorMessage(err),
      });
    }
  };

  const handleCreatePipeline = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      const created = await createPipeline({
        name: newName,
        description: newDesc,
        template: newTemplate,
        isDefault: newDefault,
      });
      setCreateOpen(false);
      setNewName('');
      setNewDesc('');
      setNewDefault(false);
      setSelectedId(created.id);
      setFeedback({
        type: 'success',
        text: `Created pipeline "${created.name}". Switch to Deals Kanban anytime to use it.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: getErrorMessage(err),
      });
    }
  };

  const handleSetDefault = async () => {
    if (!selectedPipeline || selectedPipeline.isDefault) return;
    setFeedback(null);
    try {
      await setDefaultPipeline(selectedPipeline.id);
      setFeedback({
        type: 'success',
        text: `"${selectedPipeline.name}" is now your workspace default pipeline.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: getErrorMessage(err),
      });
    }
  };

  const handleDeletePipeline = async () => {
    if (!selectedPipeline || selectedPipeline.isDefault) return;
    setFeedback(null);
    try {
      const res = await deletePipeline(selectedPipeline.id);
      setSelectedId('');
      setFeedback({
        type: 'success',
        text: `Deleted pipeline.${
          res.reassignedDealsCount > 0
            ? ` Reassigned ${res.reassignedDealsCount} deal(s) safely to the default pipeline.`
            : ''
        }`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: getErrorMessage(err),
      });
    }
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

        <Link
          href="/deals"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-light text-brand-blue text-xs font-bold hover:bg-brand-blue hover:text-white transition-colors"
        >
          <Kanban className="w-3.5 h-3.5" /> Open Deals Kanban Board
        </Link>
      </div>

      {/* Page Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-blue mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Multi-Pipeline Architecture
          </div>
          <h1 className="text-2xl font-extrabold text-brand-navy">
            Sales Pipelines &amp; Stage Builder
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Create distinct pipelines (B2B Direct, Dealer Onboarding, AMC Renewals), customize stage names, win probabilities, and deal staleness alerts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="btn-primary-brand inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> New Pipeline
        </button>
      </div>

      {(feedback || error) && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-2.5 text-xs sm:text-sm font-semibold ${
            feedback?.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          {feedback?.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{feedback?.text || error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white rounded-3xl p-16 border border-slate-200/80 flex items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-brand-blue" />
          <span className="text-sm font-semibold text-slate-600">
            Loading workspace pipelines...
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Pipelines List */}
          <div className="lg:col-span-4 space-y-3">
            <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm space-y-2.5">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 px-2">
                Workspace Pipelines ({pipelines.length})
              </h2>

              {pipelines.map((p) => {
                const active = selectedPipeline?.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedId(p.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                      active
                        ? 'bg-brand-light/70 border-brand-blue shadow-sm'
                        : 'bg-slate-50/70 border-slate-200/70 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-extrabold text-sm text-brand-navy">
                        {p.name}
                      </span>
                      {p.isDefault && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold flex-shrink-0">
                          <Star className="w-2.5 h-2.5 fill-current" /> Default
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                      <span>{p.stages.length} stages · {p.dealCount} deals</span>
                      <span className="text-brand-navy font-bold">
                        ₹{p.totalValue.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Stage Designer */}
          {selectedPipeline && (
            <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-extrabold text-brand-navy">
                    Configure Stages &amp; Probabilities
                  </h2>
                  <p className="text-xs text-slate-500">
                    Stage order and probabilities sync automatically with the Deals Kanban &amp; Weighted AI Forecast.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {!selectedPipeline.isDefault && (
                    <>
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={handleSetDefault}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs font-bold hover:bg-amber-100"
                      >
                        <Star className="w-3.5 h-3.5" /> Set Default
                      </button>
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={handleDeletePipeline}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    disabled={isSaving || !dirty}
                    onClick={handleSave}
                    className="btn-primary-brand inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>{dirty ? 'Save Pipeline' : 'Saved'}</span>
                  </button>
                </div>
              </div>

              {/* Pipeline Metadata Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    Pipeline Name
                  </label>
                  <input
                    type="text"
                    value={draftName}
                    onChange={(e) => {
                      setDraftName(e.target.value);
                      setDirty(true);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-brand-navy"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    Description / Use Case
                  </label>
                  <input
                    type="text"
                    value={draftDescription}
                    onChange={(e) => {
                      setDraftDescription(e.target.value);
                      setDirty(true);
                    }}
                    placeholder="e.g. Handles GST factory supply orders"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy"
                  />
                </div>
              </div>

              {/* Funnel Flow Preview */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  Live Stage Flow Preview
                </div>
                <div className="flex flex-wrap gap-2">
                  {draftStages.map((s, idx) => (
                    <div
                      key={s.id}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-brand-navy"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: s.color }}
                      />
                      <span>
                        {idx + 1}. {s.name}
                      </span>
                      <span className="text-slate-400">({s.probability}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stage Rows Editor */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Ordered Stages ({draftStages.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddStage}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-light text-brand-blue text-xs font-bold hover:bg-brand-blue hover:text-white transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Stage
                  </button>
                </div>

                {draftStages.map((st, idx) => {
                  const dealCountInStage = selectedPipeline.stageCounts?.[st.id] || 0;
                  return (
                    <div
                      key={st.id}
                      className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/90 space-y-3"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        <div className="md:col-span-1 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveStageOrder(idx, -1)}
                            disabled={idx === 0}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-30"
                            title="Move up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveStageOrder(idx, 1)}
                            disabled={idx === draftStages.length - 1}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-30"
                            title="Move down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">
                            Stage Name
                          </label>
                          <input
                            type="text"
                            value={st.name}
                            onChange={(e) =>
                              updateStageAt(idx, { name: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-brand-navy"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">
                            Win Prob %
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={st.probability}
                            onChange={(e) =>
                              updateStageAt(idx, {
                                probability: Math.min(
                                  100,
                                  Math.max(0, Number(e.target.value) || 0),
                                ),
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-brand-navy"
                          />
                        </div>

                        <div className="md:col-span-3">
                          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">
                            Outcome Type
                          </label>
                          <select
                            value={st.category}
                            onChange={(e) => {
                              const cat = e.target.value as PipelineStageCategory;
                              updateStageAt(idx, {
                                category: cat,
                                probability:
                                  cat === 'won' ? 100 : cat === 'lost' ? 0 : st.probability,
                              });
                            }}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-brand-navy"
                          >
                            <option value="open">Open Pipeline Stage</option>
                            <option value="won">Closed Won Outcome</option>
                            <option value="lost">Closed Lost Outcome</option>
                          </select>
                        </div>

                        <div className="md:col-span-2 flex items-end justify-end gap-2">
                          <input
                            type="color"
                            value={st.color}
                            onChange={(e) =>
                              updateStageAt(idx, { color: e.target.value })
                            }
                            className="w-9 h-9 rounded-xl border border-slate-200 cursor-pointer bg-white p-0.5"
                            title="Stage Accent Color"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveStage(idx)}
                            className="p-2 rounded-xl border border-rose-200 bg-white text-rose-600 hover:bg-rose-50"
                            title="Delete stage"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-[11px] text-slate-500">
                        <div className="flex flex-wrap items-center gap-4">
                          <label className="inline-flex items-center gap-1.5 font-semibold">
                            <span>Stale after</span>
                            <input
                              type="number"
                              min={0}
                              value={st.rottenAfterDays || 0}
                              onChange={(e) =>
                                updateStageAt(idx, {
                                  rottenAfterDays: Math.max(0, Number(e.target.value) || 0),
                                })
                              }
                              className="w-14 px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-bold text-brand-navy"
                            />
                            <span>days (0 = off)</span>
                          </label>

                          <label className="inline-flex items-center gap-1.5 font-semibold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(st.requireNoteOnEnter)}
                              onChange={(e) =>
                                updateStageAt(idx, {
                                  requireNoteOnEnter: e.target.checked,
                                })
                              }
                              className="rounded border-slate-300 text-brand-blue"
                            />
                            <span>Prompt negotiation note on entry</span>
                          </label>
                        </div>

                        <span className="font-bold text-slate-500">
                          {dealCountInStage} deal(s) currently here · key: <code>{st.id}</code>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Pipeline Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            <div
              className="px-6 py-4 text-white flex items-center justify-between"
              style={{
                background: 'linear-gradient(135deg, #17243A 0%, #233B5E 100%)',
              }}
            >
              <h3 className="font-extrabold text-base">Create Custom Sales Pipeline</h3>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePipeline} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Pipeline Name *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Dealer Onboarding Pipeline"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Tracks KYC, sample dispatch & opening stock order"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                  Starter Stage Template
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {TEMPLATE_PRESETS.map((tpl) => (
                    <label
                      key={tpl.id}
                      className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 transition-all ${
                        newTemplate === tpl.id
                          ? 'bg-brand-light/70 border-brand-blue'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="tpl"
                        checked={newTemplate === tpl.id}
                        onChange={() => setNewTemplate(tpl.id)}
                        className="mt-1"
                      />
                      <div>
                        <div className="text-xs font-extrabold text-brand-navy">
                          {tpl.title}
                        </div>
                        <div className="text-[11px] text-slate-500">{tpl.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-bold text-brand-navy cursor-pointer">
                <input
                  type="checkbox"
                  checked={newDefault}
                  onChange={(e) => setNewDefault(e.target.checked)}
                />
                <span>Make this the workspace default pipeline</span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary-brand px-5 py-2 rounded-xl text-xs font-semibold text-white"
                >
                  {isSaving ? 'Creating...' : 'Create Pipeline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
