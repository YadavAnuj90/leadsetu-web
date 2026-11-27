'use client';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import DealCard from './DealCard';
import { FALLBACK_PIPELINE_STAGES } from '@/hooks/usePipelines';
import type { Deal, DealStage, PipelineStage } from '@/types/contracts';

interface KanbanBoardProps {
  deals: Deal[];
  stages?: PipelineStage[];
  showLostColumn?: boolean;
  onMoveStage: (id: string, stage: DealStage) => void;
  onDelete: (id: string) => void;
  onQuickAdd?: (stageId: DealStage) => void;
}

export default function KanbanBoard({
  deals,
  stages = FALLBACK_PIPELINE_STAGES,
  showLostColumn = false,
  onMoveStage,
  onDelete,
  onQuickAdd,
}: KanbanBoardProps) {
  const [dragOverStage, setDragOverStage] = useState<DealStage | null>(null);

  const visibleColumns = useMemo(() => {
    const filtered = stages.filter((st) =>
      showLostColumn ? true : st.category !== 'lost',
    );
    return filtered.length > 0 ? filtered : FALLBACK_PIPELINE_STAGES;
  }, [stages, showLostColumn]);

  const totalBoardValue = useMemo(
    () => deals.reduce((sum, d) => sum + (Number(d.value) || 0), 0),
    [deals],
  );

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 items-stretch snap-x snap-mandatory">
      {visibleColumns.map((col, idx) => {
        const colDeals = deals.filter((d) => {
          if (d.stage === col.id) return true;
          const stageKnown = stages.some((s) => s.id === d.stage);
          return !stageKnown && idx === 0;
        });
        const colTotal = colDeals.reduce(
          (s, d) => s + (Number(d.value) || 0),
          0,
        );
        const sharePct =
          totalBoardValue > 0
            ? Math.min(100, Math.round((colTotal / totalBoardValue) * 100))
            : 0;
        const isOver = dragOverStage === col.id;
        const accent = col.color || '#3978EA';

        return (
          <div
            key={col.id}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStage(col.id);
            }}
            onDragLeave={() => setDragOverStage(null)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverStage(null);
              const dealId = e.dataTransfer.getData('text/plain');
              if (dealId) {
                onMoveStage(dealId, col.id);
              }
            }}
            className={`snap-start w-[295px] sm:w-[310px] min-w-[295px] flex-shrink-0 rounded-2xl border transition-all min-h-[540px] flex flex-col overflow-hidden ${
              isOver
                ? 'bg-brand-light/70 dark:bg-sky-950/40 border-brand-blue ring-2 ring-brand-blue/25'
                : 'bg-slate-100/80 dark:bg-[#0A1324] border-slate-200/80 dark:border-white/[0.08]'
            }`}
          >
            {/* Top Colored Stage Accent Line */}
            <div className="h-1 w-full" style={{ background: accent }} />

            {/* Crisp Executive Stage Header */}
            <div className="px-4 pt-3.5 pb-3 border-b border-slate-200/70 dark:border-white/[0.07] space-y-2 bg-white/60 dark:bg-white/[0.02]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-white/20"
                    style={{ background: accent }}
                  />
                  <h3
                    className="font-extrabold text-[13.5px] text-brand-navy dark:text-white leading-tight truncate"
                    title={col.name}
                  >
                    {col.name}
                  </h3>
                </div>
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-white dark:bg-white/10 text-slate-700 dark:text-slate-100 border border-slate-200/80 dark:border-white/10 flex-shrink-0 tabular-nums">
                  {colDeals.length}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 pl-4">
                <span className="text-xs font-extrabold text-brand-navy dark:text-slate-200 tabular-nums">
                  ₹{colTotal.toLocaleString('en-IN')}
                </span>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                    col.category === 'won'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25'
                      : col.category === 'lost'
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/20'
                        : 'bg-slate-200/70 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {col.category === 'won'
                    ? 'WON · 100%'
                    : col.category === 'lost'
                      ? 'LOST'
                      : `${col.probability}% WIN`}
                </span>
              </div>

              {/* Stage Share Progress Bar */}
              <div className="h-1 w-full rounded-full bg-slate-200/80 dark:bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${sharePct}%`,
                    backgroundColor: accent,
                  }}
                />
              </div>
            </div>

            {/* Cards Stack */}
            <div className="p-3 space-y-3 flex-1">
              {colDeals.length === 0 ? (
                <button
                  type="button"
                  onClick={() => onQuickAdd?.(col.id)}
                  className="w-full h-36 rounded-2xl border border-dashed border-slate-300 dark:border-white/15 hover:border-brand-blue/50 hover:bg-white/50 dark:hover:bg-white/[0.03] flex flex-col items-center justify-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-brand-blue dark:hover:text-sky-300 transition-colors px-4"
                >
                  <Plus className="w-4 h-4 opacity-70" />
                  <span>Drop a deal here or click to add</span>
                </button>
              ) : (
                colDeals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    stages={stages}
                    stageAccent={accent}
                    onMoveStage={onMoveStage}
                    onDelete={onDelete}
                  />
                ))
              )}
            </div>

            {/* Column Footer Quick Add */}
            {onQuickAdd && colDeals.length > 0 && (
              <div className="px-3 pb-3 pt-1">
                <button
                  type="button"
                  onClick={() => onQuickAdd(col.id)}
                  className="w-full py-2 px-3 rounded-xl border border-dashed border-slate-300/90 dark:border-white/15 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-brand-blue dark:hover:text-sky-300 hover:border-brand-blue/50 hover:bg-white/70 dark:hover:bg-white/[0.04] transition-all inline-flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add deal here</span>
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
