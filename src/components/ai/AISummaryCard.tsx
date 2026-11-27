'use client';

import { Loader2, RefreshCw, Sparkles } from 'lucide-react';

interface AISummaryCardProps {
  summary?: string;
  estimatedValue?: number;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

export default function AISummaryCard({
  summary,
  estimatedValue,
  isRefreshing = false,
  onRefresh,
}: AISummaryCardProps) {
  if (!summary && !onRefresh) return null;

  return (
    <div
      className="px-3 sm:px-6 py-2 sm:py-2.5 text-xs text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3"
      style={{
        background: 'linear-gradient(90deg, #17243A 0%, #243B61 100%)',
      }}
    >
      <div className="flex items-start sm:items-center gap-2 min-w-0 flex-1 w-full">
        <Sparkles className="w-4 h-4 text-brand-sky shrink-0 mt-0.5 sm:mt-0" />
        <div className="min-w-0 flex-1 line-clamp-2 sm:line-clamp-none">
          <span className="font-semibold text-brand-sky mr-1.5">
            SetuAI Summary:
          </span>
          <span className="text-slate-100 leading-relaxed">
            {summary || 'No AI summary generated yet for this WhatsApp thread.'}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0">
        {estimatedValue !== undefined && (
          <span className="font-extrabold text-emerald-400 whitespace-nowrap">
            Est. ₹{Number(estimatedValue || 0).toLocaleString('en-IN')}
          </span>
        )}
        {onRefresh && (
          <button
            type="button"
            disabled={isRefreshing}
            onClick={onRefresh}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold text-slate-100 disabled:opacity-50"
            title="Refresh SetuAI Summary & Reply Draft"
          >
            {isRefreshing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            <span>{summary ? 'Refresh' : 'Summarize'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
