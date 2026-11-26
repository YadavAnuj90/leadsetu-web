'use client';

import { useEffect, useState, useCallback, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Loader2,
  Send,
  Trash2,
  FileText,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { apiClient, getErrorMessage } from '@/lib/api-client';
import { analyzeDealAiApi } from '@/hooks/useDeals';
import { FALLBACK_PIPELINE_STAGES, usePipelines } from '@/hooks/usePipelines';
import ShareVoiceCallLinkButton from '@/components/calling/ShareVoiceCallLinkButton';
import CallMobileButton from '@/components/calling/CallMobileButton';
import WhatsAppActionButton from '@/components/inbox/WhatsAppActionButton';
import CustomFieldsDisplayCard from '@/components/custom-fields/CustomFieldsDisplayCard';
import { EntityEmailPanel } from '@/components/email/EntityEmailPanel';
import Customer360TimelineCard from '@/components/timeline/Customer360TimelineCard';
import MentionNoteInput, { MentionText } from '@/components/shared/MentionNoteInput';
import type { Deal, DealStage } from '@/types/contracts';

export default function DealDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const dealId = params?.id;

  const { pipelines, defaultPipeline } = usePipelines();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);

  const loadDeal = useCallback(async () => {
    if (!dealId) return;
    setIsLoading(true);
    try {
      const { data } = await apiClient.get<Deal>(`/deals/${dealId}`);
      setDeal(data);
    } catch {
      setDeal(null);
    } finally {
      setIsLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    loadDeal();
  }, [loadDeal]);

  useEffect(() => {
    const onEntityActivityLogged = (ev: Event) => {
      const detail = (ev as CustomEvent<{ entityType?: string; entityId?: string }>).detail;
      if (detail?.entityType === 'deal' && detail?.entityId === dealId) {
        void loadDeal();
      }
    };
    window.addEventListener('leadsetu:sim-call-logged', onEntityActivityLogged);
    window.addEventListener('leadsetu:whatsapp-logged', onEntityActivityLogged);
    return () => {
      window.removeEventListener('leadsetu:sim-call-logged', onEntityActivityLogged);
      window.removeEventListener('leadsetu:whatsapp-logged', onEntityActivityLogged);
    };
  }, [loadDeal, dealId]);

  const handleStageChange = async (stage: DealStage) => {
    if (!deal) return;
    const { data } = await apiClient.patch<Deal>(`/deals/${deal.id}`, { stage });
    setDeal(data);
  };

  const handlePipelineChange = async (pipelineId: string) => {
    if (!deal || !pipelineId) return;
    const { data } = await apiClient.patch<Deal>(`/deals/${deal.id}`, { pipelineId });
    setDeal(data);
  };

  const handleAddNote = async (e: FormEvent) => {
    e.preventDefault();
    if (!deal || !note.trim()) return;
    const { data } = await apiClient.post<Deal>(`/deals/${deal.id}/activities`, {
      type: 'note',
      description: note.trim(),
    });
    setDeal(data);
    setNote('');
  };

  const handleAnalyzeAi = async () => {
    if (!deal || isAnalyzingAi) return;
    setIsAnalyzingAi(true);
    try {
      const res = await analyzeDealAiApi(deal.id);
      if (res?.deal) {
        setDeal(res.deal);
      }
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="max-w-lg mx-auto my-12 bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm text-center space-y-4">
        <p className="text-lg font-extrabold text-brand-navy">Deal not found</p>
        <p className="text-xs sm:text-sm text-slate-500">
          This deal record may have been removed or moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-primary-brand px-5 py-2.5 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back to Previous Tab
          </button>
          <Link
            href="/deals"
            className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 text-brand-navy hover:bg-slate-50"
          >
            All Deals
          </Link>
        </div>
      </div>
    );
  }

  const gstAmount = Math.round((deal.value || 0) * 0.18);
  const totalWithGst = (deal.value || 0) + gstAmount;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/deals"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand-navy"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Kanban Pipeline
        </Link>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={`/quotations?dealId=${encodeURIComponent(deal.id)}&client=${encodeURIComponent(deal.company || deal.contactName || deal.title)}&contact=${encodeURIComponent(deal.contactName || '')}&phone=${encodeURIComponent(deal.contactPhone || '')}&email=${encodeURIComponent(deal.contactEmail || '')}&city=${encodeURIComponent(deal.city || '')}&amount=${deal.value || 0}&title=${encodeURIComponent(deal.title)}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-brand-blue/30 bg-brand-light text-brand-blue hover:bg-brand-blue hover:text-white transition-colors"
          >
            <FileText className="w-3.5 h-3.5" /> Create Proforma Quote
          </Link>

          <Link
            href={`/invoices?docType=tax_invoice&dealId=${encodeURIComponent(deal.id)}&client=${encodeURIComponent(deal.company || deal.contactName || deal.title)}&contact=${encodeURIComponent(deal.contactName || '')}&phone=${encodeURIComponent(deal.contactPhone || '')}&email=${encodeURIComponent(deal.contactEmail || '')}&city=${encodeURIComponent(deal.city || '')}&amount=${deal.value || 0}&title=${encodeURIComponent(deal.title)}`}
            className="btn-primary-brand inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white"
          >
            <FileText className="w-3.5 h-3.5" /> Generate GST Invoice
          </Link>

          <WhatsAppActionButton
            phone={deal.contactPhone}
            contactName={deal.contactName || deal.title}
            company={deal.company}
            city={deal.city}
            estimatedValue={deal.value}
            entityType="deal"
            entityId={deal.id}
            entityLabel={deal.company ? `${deal.title} (${deal.company})` : deal.title}
            label="WhatsApp"
          />

          <CallMobileButton
            phone={deal.contactPhone}
            contactName={deal.contactName || deal.title}
            company={deal.company}
            entityType="deal"
            entityId={deal.id}
            entityLabel={deal.company ? `${deal.title} (${deal.company})` : deal.title}
          />

          <ShareVoiceCallLinkButton
            entityType="deal"
            entityId={deal.id}
            recipientName={deal.contactName || deal.title}
            recipientPhone={deal.contactPhone}
          />

          <button
            type="button"
            onClick={async () => {
              await apiClient.delete(`/deals/${deal.id}`);
              router.push('/deals');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-rose-200 text-rose-600 hover:bg-rose-50"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete Deal
          </button>
        </div>
      </div>

      {/* Connected Pipeline Stepper */}
      {(() => {
        const dealPipeline =
          pipelines.find((p) => p.id === deal.pipelineId) || defaultPipeline;
        const dynamicStages = dealPipeline?.stages?.length
          ? dealPipeline.stages
          : FALLBACK_PIPELINE_STAGES;
        const activeIdx = dynamicStages.findIndex((s) => s.id === deal.stage);
        return (
          <div className="bg-white dark:bg-[#0D172B] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs">
                <span className="font-bold uppercase tracking-wider text-slate-400">
                  Pipeline
                </span>
                {pipelines.length > 1 ? (
                  <select
                    value={dealPipeline?.id || ''}
                    onChange={(e) => handlePipelineChange(e.target.value)}
                    className="px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-brand-navy dark:text-white text-xs"
                  >
                    {pipelines.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <strong className="text-brand-navy dark:text-white text-xs">
                    {dealPipeline?.name || 'B2B Sales Pipeline'}
                  </strong>
                )}
              </div>
              <Link
                href="/settings/pipelines"
                className="text-xs font-bold text-brand-blue dark:text-sky-400 hover:underline"
              >
                Configure Stages
              </Link>
            </div>

            <div className="flex flex-wrap lg:flex-nowrap items-stretch gap-1.5 bg-slate-100/80 dark:bg-slate-900/80 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              {dynamicStages.map((st, idx) => {
                const active = deal.stage === st.id;
                const passed = activeIdx > idx && st.category === 'open';
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleStageChange(st.id)}
                    className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl text-left transition-all flex items-center gap-2 ${
                      active
                        ? 'text-white shadow-md'
                        : passed
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80'
                    }`}
                    style={
                      active
                        ? { background: st.color || '#0057FF' }
                        : undefined
                    }
                  >
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        active ? 'bg-white' : ''
                      }`}
                      style={!active ? { background: st.color || '#3978EA' } : undefined}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-extrabold truncate">
                        {st.name}
                      </div>
                      <div
                        className={`text-[10px] font-semibold ${
                          active ? 'text-white/85' : 'text-slate-400'
                        }`}
                      >
                        {st.probability}% probability
                      </div>
                    </div>
                    {active && <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h1 className="text-xl font-extrabold text-brand-navy">{deal.title}</h1>
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-blue" />
              <span>{deal.company || 'B2B Client'}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Base Deal Value</span>
                <span className="font-bold text-brand-navy">
                  ₹{deal.value.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">GST (18% IGST/CGST+SGST)</span>
                <span className="font-bold text-slate-600">
                  ₹{gstAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm">
                <span className="font-bold text-brand-navy">Total Invoice Value</span>
                <span className="font-extrabold text-emerald-600">
                  ₹{totalWithGst.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 pt-2">
              {deal.contactName && <div>Contact: <strong>{deal.contactName}</strong></div>}
              {deal.contactPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-brand-blue" /> {deal.contactPhone}
                </div>
              )}
              {deal.contactEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-brand-blue" /> {deal.contactEmail}
                </div>
              )}
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-brand-blue" /> {deal.city}
              </div>
            </div>
          </div>

          <CustomFieldsDisplayCard
            entity="deal"
            values={deal.customFields}
            onSave={async (nextValues) => {
              const { data } = await apiClient.patch<Deal>(`/deals/${deal.id}`, {
                customFields: nextValues,
              });
              setDeal(data);
            }}
          />

          {/* SetuAI Deal Intelligence & Next-Best-Action Card */}
          <div
            className="rounded-3xl p-6 text-white space-y-4 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #17243A 0%, #1E3358 100%)',
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-sky">
                <Sparkles className="w-4 h-4" /> SetuAI 360° Deal Intelligence
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  Score {deal.aiScore ?? 75} · {deal.aiLabel ?? 'Warm'}
                </span>
                <button
                  type="button"
                  disabled={isAnalyzingAi}
                  onClick={() => void handleAnalyzeAi()}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold text-white disabled:opacity-60 transition-colors"
                >
                  {isAnalyzingAi ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  Rescore AI
                </button>
              </div>
            </div>

            {deal.aiSummary && (
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  AI Deal Summary
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {deal.aiSummary}
                </p>
              </div>
            )}

            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-sky">
                Recommended Next Best Action
              </div>
              <p className="text-sm font-semibold text-white leading-relaxed">
                {deal.aiNextAction ||
                  deal.aiInsight ||
                  'Share 18% GST Proforma Quotation on WhatsApp and confirm delivery timeline.'}
              </p>
            </div>

            {deal.aiReasons && deal.aiReasons.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {deal.aiReasons.map((reason, idx) => (
                  <span
                    key={`${reason}-${idx}`}
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-white/10 text-slate-200"
                  >
                    {reason}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <Customer360TimelineCard
            entityType="deal"
            entityId={deal.id}
            onActivityAdded={() => void loadDeal()}
          />
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
            <h3 className="font-extrabold text-base text-brand-navy">
              Deal Activity &amp; Negotiation Log
            </h3>

            <form onSubmit={handleAddNote} className="flex gap-2">
              <MentionNoteInput
                value={note}
                onChange={setNote}
                placeholder="Log negotiation update, discount approval, or type @Name to alert a teammate..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
              />
              <button
                type="submit"
                className="btn-primary-brand px-5 py-2.5 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Add Note
              </button>
            </form>

            <div className="relative pl-6 space-y-5 before:content-[''] before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-px before:bg-slate-200 dark:before:bg-slate-700/80">
              {(deal.activities || []).map((act) => (
                <div key={act.id} className="relative pb-4 border-b border-slate-100 dark:border-slate-800/70 last:border-b-0 last:pb-0">
                  <span
                    className={`absolute -left-6 top-1 w-[18px] h-[18px] rounded-full border-2 border-white dark:border-[#0D172B] flex items-center justify-center ${
                      act.type === 'stage_change'
                        ? 'bg-brand-blue'
                        : act.type === 'quote'
                          ? 'bg-emerald-500'
                          : act.type === 'whatsapp'
                            ? 'bg-emerald-600'
                            : act.type === 'call'
                              ? 'bg-violet-500'
                              : 'bg-slate-400'
                    }`}
                  />
                  <div className="text-xs sm:text-sm font-medium text-brand-navy dark:text-slate-100 leading-relaxed">
                    <MentionText text={act.description} />
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    @{act.authorName} ·{' '}
                    {new Date(act.createdAt).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <EntityEmailPanel
            entityType="deal"
            entityId={deal.id}
            entityLabel={deal.title}
            defaultToEmail={deal.contactEmail || ''}
            contactName={deal.contactName || ''}
            companyName={deal.company || ''}
            dealValueLabel={
              deal.value
                ? `₹${Number(deal.value).toLocaleString('en-IN')}`
                : ''
            }
            onEmailActivity={() => void loadDeal()}
          />
        </div>
      </div>
    </div>
  );
}
