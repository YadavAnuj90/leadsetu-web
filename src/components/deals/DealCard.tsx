'use client';

import Link from 'next/link';
import {
  Building2,
  Calendar,
  ArrowUpRight,
  Trash2,
  Sparkles,
  GripVertical,
  User,
} from 'lucide-react';
import CallMobileButton from '@/components/calling/CallMobileButton';
import WhatsAppActionButton from '@/components/inbox/WhatsAppActionButton';
import { FALLBACK_PIPELINE_STAGES } from '@/hooks/usePipelines';
import type { Deal, DealStage, PipelineStage } from '@/types/contracts';

interface DealCardProps {
  deal: Deal;
  stages?: PipelineStage[];
  stageAccent?: string;
  onMoveStage: (id: string, stage: DealStage) => void;
  onDelete: (id: string) => void;
}

export default function DealCard({
  deal,
  stages = FALLBACK_PIPELINE_STAGES,
  stageAccent = '#3978EA',
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
    aiScore !== null && aiScore >= 85
      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
      : aiScore !== null && aiScore >= 65
        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
        : 'bg-sky-500/10 text-brand-blue dark:text-sky-300 border-sky-500/25';

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', deal.id);
      }}
      className="group relative bg-white dark:bg-[#0F1B33] rounded-2xl p-3.5 border border-slate-200/85 dark:border-white/[0.08] shadow-xs hover:shadow-xl hover:border-brand-blue/50 dark:hover:border-sky-400/40 transition-all duration-150 cursor-grab active:cursor-grabbing space-y-2.5"
    >
      {/* Top Row: Subtle Drag Grip + Title + Unified AI Score */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-1.5 min-w-0">
          <GripVertical className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 opacity-50 group-hover:opacity-100 flex-shrink-0 mt-0.5 transition-opacity" />
          <Link
            href={`/deals/${deal.id}`}
            className="font-bold text-[13.5px] text-brand-navy dark:text-white hover:text-brand-blue dark:hover:text-sky-300 transition-colors inline-flex items-start gap-1 leading-snug min-w-0"
          >
            <span className="line-clamp-2">{deal.title}</span>
            <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-80 transition-opacity" />
          </Link>
        </div>

        {aiScore !== null ? (
          <span
            title={`SetuAI Win Confidence: ${aiScore}/100 · Stage Prob ${deal.probability}%`}
            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 shrink-0 ${aiChipClass}`}
          >
            <Sparkles className="w-2.5 h-2.5" />
            <span>AI {aiScore}</span>
          </span>
        ) : (
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 shrink-0">
            {deal.probability}%
          </span>
        )}
      </div>

      {/* Account, City & Buyer Contact */}
      <div className="space-y-1 pl-5">
        <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5 min-w-0">
          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate font-medium">
            {deal.company || deal.contactName || 'B2B Client'}
            {deal.city ? ` · ${deal.city}` : ''}
          </span>
        </div>
        {deal.company && deal.contactName && (
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 min-w-0">
            <User className="w-3 h-3 shrink-0" />
            <span className="truncate">{deal.contactName}</span>
          </div>
        )}
      </div>

      {/* Commercial Value Surface */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50/90 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.07]">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Deal Value
          </div>
          <div className="font-black text-sm sm:text-[15px] text-brand-navy dark:text-white tracking-tight tabular-nums">
            ₹{(deal.value || 0).toLocaleString('en-IN')}
          </div>
        </div>

        <div className="text-right shrink-0">
          {deal.expectedCloseDate ? (
            <div className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-slate-500 dark:text-slate-300 bg-white dark:bg-white/5 px-2 py-1 rounded-lg border border-slate-200/70 dark:border-white/10">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{deal.expectedCloseDate}</span>
            </div>
          ) : (
            <span
              className="text-[10.5px] font-bold px-2 py-0.5 rounded-md"
              style={{
                backgroundColor: `${stageAccent}18`,
                color: stageAccent,
              }}
            >
              {deal.probability}% Prob
            </span>
          )}
        </div>
      </div>

      {/* Focused AI Next Action */}
      {(deal.aiNextAction || deal.aiInsight) && (
        <div
          className="text-[11px] text-slate-600 dark:text-slate-300 pl-2.5 border-l-2 border-brand-blue/65 dark:border-sky-400/60 leading-snug line-clamp-2"
          title={deal.aiNextAction || deal.aiInsight}
        >
          {deal.aiNextAction || deal.aiInsight}
        </div>
      )}

      {/* Compact Tags */}
      {deal.tags?.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {deal.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-white/10 truncate max-w-[130px]"
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

      {/* Clean Footer: Compact Stage Switcher + Quick Actions */}
      <div className="pt-2.5 border-t border-slate-100 dark:border-white/[0.07] flex items-center justify-between gap-2">
        <select
          value={deal.stage}
          onChange={(e) => onMoveStage(deal.id, e.target.value as DealStage)}
          aria-label="Move deal stage"
          className="flex-1 min-w-0 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 bg-slate-50/80 dark:bg-white/[0.05] hover:border-brand-blue focus:outline-none focus:border-brand-blue truncate cursor-pointer"
        >
          {effectiveStages.map((s) => (
            <option key={s.id} value={s.id} className="text-slate-900">
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
