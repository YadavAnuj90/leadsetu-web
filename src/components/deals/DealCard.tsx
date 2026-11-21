'use client';

import Link from 'next/link';
import {
  Building2,
  Calendar,
  ArrowUpRight,
  Trash2,
  Sparkles,
  GripVertical,
} from 'lucide-react';
import CallMobileButton from '@/components/calling/CallMobileButton';
import WhatsAppActionButton from '@/components/inbox/WhatsAppActionButton';
import { FALLBACK_PIPELINE_STAGES } from '@/hooks/usePipelines';
import type { Deal, DealStage, PipelineStage } from '@/types/contracts';

interface DealCardProps {
  deal: Deal;
  stages?: PipelineStage[];
  onMoveStage: (id: string, stage: DealStage) => void;
  onDelete: (id: string) => void;
}

export default function DealCard({
  deal,
  stages = FALLBACK_PIPELINE_STAGES,
  onMoveStage,
  onDelete,
}: DealCardProps) {
  const effectiveStages = stages.some((s) => s.id === deal.stage)
    ? stages
    : [
        ...stages,
        {
          id: deal.stage,
          name: deal.stage,
          probability: deal.probability || 50,
          color: '#64748B',
          category: deal.stageCategory || 'open',
        },
      ];

  const aiScore = typeof deal.aiScore === 'number' ? deal.aiScore : null;
  const aiChipClass =
    aiScore !== null && aiScore >= 80
      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/25'
      : aiScore !== null && aiScore >= 60
        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/25'
        : 'bg-sky-500/10 text-brand-blue dark:text-sky-300 border-sky-500/20';

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', deal.id);
      }}
      className="group bg-white dark:bg-[#0D172B] rounded-2xl p-4 border border-slate-200/90 dark:border-slate-700/70 shadow-sm hover:shadow-lg hover:border-brand-blue/60 dark:hover:border-sky-500/50 transition-all duration-150 cursor-grab active:cursor-grabbing space-y-3"
    >
      {/* Top Row: Drag handle + Title + Probability */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-1.5 min-w-0">
          <GripVertical className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 flex-shrink-0 mt-1" />
          <Link
            href={`/deals/${deal.id}`}
            className="font-bold text-[13.5px] text-brand-navy dark:text-white hover:text-brand-blue dark:hover:text-sky-400 transition-colors inline-flex items-start gap-1 leading-snug min-w-0"
          >
            <span className="line-clamp-2">{deal.title}</span>
            <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 opacity-60 group-hover:opacity-100" />
          </Link>
        </div>

        <span
          className={`text-[10.5px] font-extrabold px-2 py-0.5 rounded-full flex-shrink-0 ${
            deal.probability >= 80
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/25'
              : deal.probability >= 45
                ? 'bg-brand-blue/10 text-brand-blue dark:bg-sky-500/15 dark:text-sky-300'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          {deal.probability}%
        </span>
      </div>

      {/* Company & City */}
      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pl-5 min-w-0">
        <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <span className="truncate">
          {deal.company || deal.contactName || 'B2B Client'}
          {deal.city ? ` · ${deal.city}` : ''}
        </span>
      </div>

      {/* Amount & Intelligence Row (Clean single-surface row) */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
        <span className="font-black text-sm text-brand-navy dark:text-white tracking-tight">
          ₹{(deal.value || 0).toLocaleString('en-IN')}
        </span>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {aiScore !== null && (
            <span
              className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${aiChipClass}`}
            >
              <Sparkles className="w-2.5 h-2.5" /> AI {aiScore}
            </span>
          )}
          {deal.expectedCloseDate && aiScore === null && (
            <span className="text-[10.5px] text-slate-400 inline-flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {deal.expectedCloseDate}
            </span>
          )}
        </div>
      </div>

      {/* Compact 1-Line Next Action Hint */}
      {(deal.aiNextAction || deal.aiInsight) && (
        <div
          className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5 px-1"
          title={deal.aiNextAction || deal.aiInsight}
        >
          <Sparkles className="w-3 h-3 text-brand-blue dark:text-sky-400 flex-shrink-0" />
          <span className="truncate leading-snug">
            {deal.aiNextAction || deal.aiInsight}
          </span>
        </div>
      )}

      {/* Tags (Max 2 compact chips) */}
      {deal.tags?.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pl-0.5">
          {deal.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-brand-light/80 dark:bg-sky-500/15 text-brand-blue dark:text-sky-300 border border-brand-blue/10 dark:border-sky-500/20 truncate max-w-[130px]"
            >
              {tag}
            </span>
          ))}
          {deal.tags.length > 2 && (
            <span className="text-[10px] font-semibold text-slate-400">
              +{deal.tags.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Clean Footer: Stage Selector + Quick Actions */}
      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <select
          value={deal.stage}
          onChange={(e) => onMoveStage(deal.id, e.target.value as DealStage)}
          aria-label="Move deal stage"
          className="flex-1 min-w-0 text-[11px] font-bold px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-brand-navy dark:text-slate-100 bg-slate-50/70 dark:bg-slate-800/80 focus:outline-none focus:border-brand-blue truncate cursor-pointer"
        >
          {effectiveStages.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1 flex-shrink-0">
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
                  deal.company ? `${deal.title} (${deal.company})` : deal.title
                }
                variant="icon"
                className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/25 transition-colors"
              />
              <CallMobileButton
                phone={deal.contactPhone}
                contactName={deal.contactName || deal.title}
                company={deal.company}
                entityType="deal"
                entityId={deal.id}
                entityLabel={
                  deal.company ? `${deal.title} (${deal.company})` : deal.title
                }
                variant="icon"
                className="p-1.5 rounded-lg bg-brand-blue/10 text-brand-blue dark:bg-sky-500/15 dark:text-sky-300 hover:bg-brand-blue/20 transition-colors"
              />
            </>
          )}
          <button
            type="button"
            onClick={() => onDelete(deal.id)}
            title="Delete Deal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
