'use client';

import { useEffect, useMemo, useState, FormEvent } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  IndianRupee,
  TrendingUp,
  Trophy,
  Kanban,
  Loader2,
  X,
  Sparkles,
  SlidersHorizontal,
  Eye,
  EyeOff,
  LayoutGrid,
  List,
  ArrowUpRight,
  Trash2,
} from 'lucide-react';
import { useDeals } from '@/hooks/useDeals';
import { FALLBACK_PIPELINE_STAGES, usePipelines } from '@/hooks/usePipelines';
import { useCustomFields } from '@/hooks/useCustomFields';
import CustomFieldsInputs from '@/components/custom-fields/CustomFieldsInputs';
import KanbanBoard from '@/components/deals/KanbanBoard';
import WhatsAppActionButton from '@/components/inbox/WhatsAppActionButton';
import CallMobileButton from '@/components/calling/CallMobileButton';
import type { DealStage } from '@/types/contracts';

export default function DealsPage() {
  const {
    pipelines,
    defaultPipeline,
    isLoading: pipelinesLoading,
  } = usePipelines();

  const {
    deals,
    stats,
    search,
    setSearch,
    pipelineId,
    setPipelineId,
    isLoading,
    isMutating,
    error,
    createDeal,
    moveStage,
    deleteDeal,
  } = useDeals();

  const [showLostColumn, setShowLostColumn] = useState(false);
  const [viewMode, setViewMode] = useState<'board' | 'table'>('board');

  useEffect(() => {
    if (defaultPipeline?.id && pipelineId === 'all' && pipelines.length > 0) {
      setPipelineId(defaultPipeline.id);
    }
  }, [defaultPipeline?.id, pipelineId, pipelines.length, setPipelineId]);

  const activePipeline = useMemo(
    () =>
      pipelines.find((p) => p.id === pipelineId) ||
      defaultPipeline ||
      null,
    [pipelines, pipelineId, defaultPipeline],
  );

  const activeStages = useMemo(
    () =>
      activePipeline?.stages?.length
        ? activePipeline.stages
        : FALLBACK_PIPELINE_STAGES,
    [activePipeline],
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [city, setCity] = useState('New Delhi');
  const [value, setValue] = useState('');
  const [modalPipelineId, setModalPipelineId] = useState('');
  const [stage, setStage] = useState<DealStage>('qualified');
  const [notes, setNotes] = useState('');
  const { fields: dealFieldDefs } = useCustomFields('deal');
  const [customFields, setCustomFields] = useState<Record<string, unknown>>({});

  const modalPipeline = useMemo(
    () =>
      pipelines.find((p) => p.id === modalPipelineId) ||
      activePipeline ||
      defaultPipeline ||
      null,
    [pipelines, modalPipelineId, activePipeline, defaultPipeline],
  );

  const modalStages = useMemo(
    () =>
      modalPipeline?.stages?.length
        ? modalPipeline.stages
        : FALLBACK_PIPELINE_STAGES,
    [modalPipeline],
  );

  const openCreateModal = (presetStage?: DealStage) => {
    const initialPid = activePipeline?.id || defaultPipeline?.id || '';
    const initialStages = activePipeline?.stages?.length
      ? activePipeline.stages
      : FALLBACK_PIPELINE_STAGES;
    const initialStage =
      presetStage ||
      initialStages.find((s) => s.category === 'open')?.id ||
      initialStages[0].id;
    setModalPipelineId(initialPid);
    setStage(initialStage);
    setModalOpen(true);
  };

  const handleModalPipelineChange = (nextPid: string) => {
    setModalPipelineId(nextPid);
    const chosen = pipelines.find((p) => p.id === nextPid);
    const nextStages = chosen?.stages?.length
      ? chosen.stages
      : FALLBACK_PIPELINE_STAGES;
    setStage(
      nextStages.find((s) => s.category === 'open')?.id || nextStages[0].id,
    );
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    await createDeal({
      title,
      pipelineId: modalPipeline?.id || undefined,
      company,
      contactName,
      contactPhone,
      city,
      value: Number(value) || 0,
      stage,
      notes,
      tags: ['GST 18%', 'B2B'],
      customFields,
    });
    setModalOpen(false);
    setTitle('');
    setCompany('');
    setContactName('');
    setContactPhone('');
    setValue('');
    setNotes('');
    setCustomFields({});
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-blue mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Visual Revenue Kanban
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
            Deals &amp; Multi-Pipeline Board
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Switch between custom pipelines, drag cards across stages, or inspect in list view.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/settings/pipelines"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 bg-white text-brand-navy hover:border-brand-blue hover:text-brand-blue transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Manage Pipelines</span>
          </Link>

          <button
            type="button"
            onClick={() => openCreateModal()}
            className="btn-primary-brand inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white"
          >
            <Plus className="w-4 h-4" />
            <span>New Deal</span>
          </button>
        </div>
      </div>

      {/* Pipeline KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Open Pipeline Value',
            value: `₹${stats.openPipelineValue.toLocaleString('en-IN')}`,
            sub: `${stats.openCount} active deals`,
            icon: Kanban,
            color: '#3978EA',
          },
          {
            label: 'Weighted AI Forecast',
            value: `₹${stats.weightedForecast.toLocaleString('en-IN')}`,
            sub: 'Probability-adjusted INR',
            icon: TrendingUp,
            color: '#8B5CF6',
          },
          {
            label: 'Closed Won Revenue',
            value: `₹${stats.wonRevenue.toLocaleString('en-IN')}`,
            sub: `${stats.wonCount} deals won`,
            icon: Trophy,
            color: '#10B981',
          },
          {
            label: 'Avg. Deal Size',
            value: `₹${
              stats.totalDeals > 0
                ? Math.round(
                    (stats.openPipelineValue + stats.wonRevenue) /
                      stats.totalDeals,
                  ).toLocaleString('en-IN')
                : '0'
            }`,
            sub: activePipeline ? activePipeline.name : 'Across all stages',
            icon: IndianRupee,
            color: '#F59E0B',
          },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">
                  {kpi.label}
                </span>
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: `${kpi.color}15`, color: kpi.color }}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-brand-navy">
                {kpi.value}
              </div>
              <div className="text-[11px] font-medium text-slate-400 mt-1 truncate">
                {kpi.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* Unified Toolbar: Pipeline Switcher + Search + View Mode + Lost Toggle */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {!pipelinesLoading &&
            pipelines.map((p) => {
              const isSelected = activePipeline?.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPipelineId(p.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-brand-blue text-white shadow-sm'
                      : 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70'
                  }`}
                >
                  <Kanban className="w-3.5 h-3.5" />
                  <span>{p.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {p.dealCount}
                  </span>
                </button>
              );
            })}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 flex-1 lg:justify-end">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search deal, company, or city..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowLostColumn((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            {showLostColumn ? (
              <>
                <EyeOff className="w-3.5 h-3.5" /> Hide Lost
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" /> Show Lost
              </>
            )}
          </button>

          <div className="inline-flex rounded-xl border border-slate-200 p-0.5 bg-slate-50 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setViewMode('board')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'board'
                  ? 'bg-white dark:bg-slate-800 text-brand-navy dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-brand-navy'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Board
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-800 text-brand-navy dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-brand-navy'
              }`}
            >
              <List className="w-3.5 h-3.5" /> Table
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="bg-white rounded-3xl p-16 border border-slate-200/80 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-brand-blue" />
          <span className="text-sm font-semibold text-slate-600">
            Loading Kanban pipeline from Leadsetu Cloud...
          </span>
        </div>
      ) : viewMode === 'board' ? (
        <KanbanBoard
          deals={deals}
          stages={activeStages}
          showLostColumn={showLostColumn}
          onMoveStage={moveStage}
          onDelete={deleteDeal}
          onQuickAdd={(stageId) => openCreateModal(stageId)}
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-50/70">
                  <th className="py-3.5 px-5">Deal &amp; Company</th>
                  <th className="py-3.5 px-4">Value (INR)</th>
                  <th className="py-3.5 px-4">Stage</th>
                  <th className="py-3.5 px-4">AI Score</th>
                  <th className="py-3.5 px-4">Close Date</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {deals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No deals match this filter. Click &ldquo;New Deal&rdquo; to add one.
                    </td>
                  </tr>
                ) : (
                  deals.map((deal) => (
                    <tr
                      key={deal.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-5">
                        <Link
                          href={`/deals/${deal.id}`}
                          className="font-bold text-brand-navy hover:text-brand-blue inline-flex items-center gap-1"
                        >
                          <span>{deal.title}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
                        </Link>
                        <div className="text-xs text-slate-500">
                          {deal.company || deal.contactName || 'B2B Client'} ·{' '}
                          {deal.city}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-brand-navy">
                        ₹{(deal.value || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={deal.stage}
                          onChange={(e) =>
                            moveStage(deal.id, e.target.value as DealStage)
                          }
                          className="text-xs font-bold px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-brand-navy"
                        >
                          {activeStages.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.probability}%)
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-light text-brand-blue text-xs font-bold">
                          <Sparkles className="w-3 h-3" /> {deal.aiScore ?? 75}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {deal.expectedCloseDate || '—'}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {deal.contactPhone && (
                            <>
                              <WhatsAppActionButton
                                phone={deal.contactPhone}
                                contactName={deal.contactName || deal.title}
                                company={deal.company}
                                city={deal.city}
                                estimatedValue={deal.value}
                                entityType="deal"
                                entityId={deal.id}
                                entityLabel={
                                  deal.company
                                    ? `${deal.title} (${deal.company})`
                                    : deal.title
                                }
                                variant="icon"
                                className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600"
                              />
                              <CallMobileButton
                                phone={deal.contactPhone}
                                contactName={deal.contactName || deal.title}
                                company={deal.company}
                                entityType="deal"
                                entityId={deal.id}
                                entityLabel={
                                  deal.company
                                    ? `${deal.title} (${deal.company})`
                                    : deal.title
                                }
                                variant="icon"
                                className="p-1.5 rounded-lg bg-brand-blue/10 text-brand-blue"
                              />
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => deleteDeal(deal.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500"
                            title="Delete Deal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Deal Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            <div
              className="px-6 py-4 text-white flex items-center justify-between"
              style={{
                background: 'linear-gradient(135deg, #17243A 0%, #233B5E 100%)',
              }}
            >
              <h3 className="font-extrabold text-base">Create Pipeline Deal</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {pipelines.length > 0 && (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Sales Pipeline *
                  </label>
                  <select
                    value={modalPipeline?.id || ''}
                    onChange={(e) => handleModalPipelineChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy bg-white font-semibold"
                  >
                    {pipelines.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.isDefault ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Deal Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 500 Switchgear Units Supply"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="RS Electricals Pvt. Ltd."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Deal Value (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="450000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Buyer Contact Name
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Rajesh Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    WhatsApp Phone (+91)
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+91 98112 45678"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Pipeline Stage
                  </label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as DealStage)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy bg-white"
                  >
                    {modalStages.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.probability}%)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    City / Territory
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Karol Bagh, New Delhi"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Proposal &amp; GST Billing Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Proforma invoice details, advance terms..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy"
                />
              </div>

              <CustomFieldsInputs
                fields={dealFieldDefs}
                values={customFields}
                onChange={setCustomFields}
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isMutating}
                  className="btn-primary-brand px-5 py-2 rounded-xl text-xs font-semibold text-white"
                >
                  Create Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
